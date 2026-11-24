// Xuất bản dữ liệu công khai theo khuôn site tĩnh:
//   thay đổi trong D1 → đánh dấu "cần xuất bản" → cron (2 phút/lần) gom dữ liệu thành data/site.json
//   → commit vào GitHub (Contents API) → CI build sinh lại HTML tĩnh từng trang → deploy.
// Trình duyệt và Google chỉ đọc file tĩnh do build sinh ra, không đọc D1 trực tiếp.
import { now, sha256 } from './lib.js';

export async function getKv(env, key, fallback = null) {
  const r = await env.DB.prepare('SELECT value FROM kv WHERE key = ?').bind(key).first();
  return r ? JSON.parse(r.value) : fallback;
}
export async function setKv(env, key, value) {
  await env.DB.prepare('INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at')
    .bind(key, JSON.stringify(value), now()).run();
}

export const categories = async (env) => ({
  provinces: await getKv(env, 'provinces', []),
  targets: await getKv(env, 'targets', []),
  shifts: await getKv(env, 'shifts', [])
});

export const publicCompany = (c) => ({
  id: c.id, name: c.name, short: c.short, initials: c.initials, color: c.color, logo: c.logo || undefined,
  phone: c.phone || '', about: c.about || '', size: c.size || '', founded: c.founded || '',
  rating: c.rating || null, reviews: c.reviews || 0, mst: c.mst || '', license: c.license || '', verified: !!c.verified,
  ...(c.aggregated ? { aggregated: true } : {})
});

export const publicJob = (j) => ({
  id: j.id, title: j.title, company: j.company_id, province: j.province, district: j.district, address: j.address,
  target: j.target, shift: j.shift, qty: j.qty, salaryMin: j.salary_min, salaryMax: j.salary_max,
  housing: !!j.housing, meals: !!j.meals, urgent: !!j.urgent, tier: j.tier, age: j.age, height: j.height,
  desc: j.descr || '', phone: j.contact_phone || '', views: j.views, calls: j.calls,
  images: JSON.parse(j.images || '[]').map((x) => '/images/' + x),
  ...(j.source_url ? { source: { name: j.source_name || '' } } : {}), // không công khai link tin gốc (không đặt link ra trang ngoài)
  postedAt: j.posted_at, expiresAt: j.expires_at, updatedAt: j.updated_at
});

// Bài tin tức: chỉ thông tin để liệt kê (nội dung bài đi riêng, file assets/content/tin-tuc/<slug>.html)
const vnDate = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10).split('-').reverse().join('/');
export const readMinutes = (html) => Math.max(1, Math.round(String(html || '').replace(/<(svg|style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
export const publicPost = (p) => ({
  id: p.slug, img: p.cover || '/assets/img/photos/doi-bao-ve.jpg', cat: p.cat, title: p.title, excerpt: p.excerpt,
  read: readMinutes(p.content), views: p.views || 0, date: vnDate(p.published_at), updatedAt: p.updated_at
});
export const POSTS_SQL = 'SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC';

export const publicVideo = (v) => ({ slug: v.slug, yt: v.youtube_id, title: v.title, desc: v.descr, date: v.created_at, updatedAt: v.updated_at });

// Tin công khai: đang hiển thị, chưa hết hạn, công ty không bị khoá
export const LIVE_SQL = `SELECT j.* FROM jobs j JOIN companies c ON c.id = j.company_id
  WHERE j.status = 'live' AND j.expires_at > ?1 AND c.locked = 0`;

export async function buildData(env) {
  const t = now();
  const [cats, cos, jobs, videos, posts] = await Promise.all([
    categories(env),
    env.DB.prepare('SELECT * FROM companies WHERE locked = 0 ORDER BY verified DESC, name').all(),
    env.DB.prepare(LIVE_SQL + ' ORDER BY (j.tier = \'vip\') DESC, j.posted_at DESC, j.id DESC').bind(t).all(),
    env.DB.prepare('SELECT * FROM videos WHERE published = 1 ORDER BY created_at DESC').all(),
    env.DB.prepare(POSTS_SQL).all()
  ]);
  const data = { ...cats, companies: cos.results.map(publicCompany), jobs: jobs.results.map(publicJob), videos: videos.results.map(publicVideo), posts: posts.results.map(publicPost) };
  // Nội dung bài không đưa vào dữ liệu công khai (nặng); commit thành file riêng khi xuất bản
  Object.defineProperty(data, 'postContents', { value: Object.fromEntries(posts.results.map((p) => [p.slug, p.content])), enumerable: false });
  return data;
}

/**
 * Gọi sau MỌI thay đổi ảnh hưởng tới nội dung công khai:
 *  1. dựng lại ngay /data/site.js (dữ liệu trực tiếp cho tìm kiếm + trang chưa kịp build) → người dùng thấy ngay;
 *  2. đánh dấu cần xuất bản → cron / thao tác quản trị commit data/site.json → CI build lại HTML tĩnh.
 */
export async function markDirty(env) {
  await setKv(env, 'publish_dirty', now());
  await buildLive(env);
}

/* ---------- /data/site.js trực tiếp từ D1 ---------- */
export async function buildLive(env) {
  const data = await buildData(env);
  const body = `/* Dữ liệu trực tiếp lúc ${new Date().toISOString()} - không sửa tay */
(function (V, d) {
  var t = Date.now(), D = 864e5;
  d.jobs = d.jobs.map(function (j) {
    j.posted = Math.max(0, Math.floor((t - j.postedAt) / D));
    j.daysLeft = Math.floor((j.expiresAt - t) / D);
    return j;
  }).filter(function (j) { return j.expiresAt > t; });
  for (var k in d) V[k] = d[k];
})(window.VLBV = window.VLBV || {}, ${JSON.stringify(data).replace(/</g, '\\u003c')});
`;
  const snap = { body, etag: '"' + (await sha256(body)).slice(0, 16) + '"' };
  await setKv(env, 'live_site_js', snap);
  return snap;
}

export async function serveLive(env, req) {
  const snap = (await getKv(env, 'live_site_js')) || (await buildLive(env));
  if (req.headers.get('if-none-match') === snap.etag) return new Response(null, { status: 304, headers: { etag: snap.etag } });
  return new Response(snap.body, { headers: { 'content-type': 'text/javascript; charset=utf-8', etag: snap.etag, 'cache-control': 'no-cache' } });
}

/* ---------- GitHub Git Data API: 1 commit / lần xuất bản ---------- */
const DATA_PATH = 'data/site.json';
const IMG_DIR = 'html/images/';
const POST_DIR = 'assets/content/tin-tuc/';

function b64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gh(env, method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/${path}`, {
    method,
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'vieclambaove-worker', 'x-github-api-version': '2022-11-28', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(`GitHub ${method} ${path}: ${res.status} ${data.message || ''}`); e.status = res.status; throw e; }
  return data;
}

// Ảnh công khai đang được dùng: ảnh của tin đang hiển thị + logo công ty (chỉ ảnh do người dùng tải, nằm ở /images/)
function wantedImages(data) {
  const set = new Set();
  data.jobs.forEach((j) => (j.images || []).forEach((u) => set.add(u.slice(8))));
  data.companies.forEach((c) => c.logo?.startsWith('/images/') && set.add(c.logo.slice(8)));
  // Ảnh bài tin tức: ảnh đại diện + ảnh chèn trong nội dung
  (data.posts || []).forEach((p) => p.img?.startsWith('/images/') && set.add(p.img.slice(8)));
  Object.values(data.postContents || {}).forEach((html) => (String(html).match(/\/images\/posts\/[a-z0-9-]+\.(?:jpg|png|webp)/g) || []).forEach((u) => set.add(u.slice(8))));
  return set;
}

async function commitOnce(env, data, json) {
  const branch = env.GITHUB_BRANCH || 'main';
  const published = new Set(await getKv(env, 'published_images', []));
  const wanted = wantedImages(data);
  const add = [...wanted].filter((x) => !published.has(x));
  const del = [...published].filter((x) => !wanted.has(x));

  const ref = await gh(env, 'GET', `git/ref/heads/${encodeURIComponent(branch)}`);
  const head = await gh(env, 'GET', `git/commits/${ref.object.sha}`);
  const tree = [{ path: DATA_PATH, mode: '100644', type: 'blob', content: json }];
  // Nội dung bài tin tức: ghi file cho bài đang hiển thị, xoá file của bài đã ẩn/xoá
  const postFiles = data.postContents || {};
  for (const [slug, html] of Object.entries(postFiles)) tree.push({ path: `${POST_DIR}${slug}.html`, mode: '100644', type: 'blob', content: html });
  try {
    (await gh(env, 'GET', `contents/${POST_DIR.slice(0, -1)}?ref=${encodeURIComponent(branch)}`))
      .filter((f) => f.name.endsWith('.html') && !(f.name.slice(0, -5) in postFiles))
      .forEach((f) => tree.push({ path: f.path, mode: '100644', type: 'blob', sha: null }));
  } catch (e) { if (e.status !== 404) throw e; }
  for (const name of add) {
    const obj = await env.FILES.get('img/' + name);
    if (!obj) continue; // ảnh đã bị xoá khỏi R2 (NTD vừa xoá) - bỏ qua
    const blob = await gh(env, 'POST', 'git/blobs', { content: b64(new Uint8Array(await obj.arrayBuffer())), encoding: 'base64' });
    tree.push({ path: IMG_DIR + name, mode: '100644', type: 'blob', sha: blob.sha });
  }
  // Xoá ảnh không còn dùng (tin hết hạn/bị gỡ, logo cũ). Chỉ xoá file thật sự đang có trong repo.
  if (del.length) {
    const existing = new Set();
    for (const dir of new Set(del.map((n) => n.split('/')[0]))) {
      try { (await gh(env, 'GET', `contents/${IMG_DIR}${dir}?ref=${encodeURIComponent(branch)}`)).forEach((f) => existing.add(f.path)); } catch (e) { if (e.status !== 404) throw e; }
    }
    del.filter((n) => existing.has(IMG_DIR + n)).forEach((n) => tree.push({ path: IMG_DIR + n, mode: '100644', type: 'blob', sha: null }));
  }
  const newTree = await gh(env, 'POST', 'git/trees', { base_tree: head.tree.sha, tree });
  if (newTree.sha === head.tree.sha) return { commit: '', images: wanted };
  const commit = await gh(env, 'POST', 'git/commits', {
    message: `data: cập nhật website (${data.jobs.length} tin, ${data.videos.length} video, ${data.posts.length} bài viết${add.length ? `, +${add.length} ảnh` : ''}${del.length ? `, -${del.length} ảnh` : ''})`,
    tree: newTree.sha, parents: [head.sha],
    author: { name: 'vieclambaove-bot', email: 'bot@vieclambaove.invalid' }
  });
  await gh(env, 'PATCH', `git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha });
  return { commit: commit.sha, images: wanted };
}

/**
 * Xuất bản nếu có thay đổi (hoặc force): data/site.json + ảnh trong 1 commit.
 * Gọi ngay sau mỗi thay đổi (không dùng cron). Hai lần xuất bản chồng nhau → thử lại.
 */
export async function publish(env, { force = false } = {}) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return { ok: false, skipped: 'Chưa cấu hình GITHUB_TOKEN / GITHUB_REPO' };
  const dirty = await getKv(env, 'publish_dirty', 0);
  const last = await getKv(env, 'publish_last', { at: 0, hash: '' });
  if (!force && !(dirty > last.at)) return { ok: true, skipped: 'Không có thay đổi' };
  for (let attempt = 1; ; attempt++) {
    const startedAt = now();
    const data = await buildData(env);
    const json = JSON.stringify(data, null, 1) + '\n';
    try {
      const r = await commitOnce(env, data, json);
      await setKv(env, 'published_images', [...r.images]);
      await setKv(env, 'publish_last', { at: startedAt, hash: await sha256(json), commit: r.commit || last.commit || '', error: '' });
      return { ok: true, commit: r.commit, jobs: data.jobs.length };
    } catch (e) {
      // 422 = nhánh vừa có commit khác (lần xuất bản song song) → đọc lại và thử lại
      if (attempt < 3 && (e.status === 422 || e.status === 409)) continue;
      await setKv(env, 'publish_last', { ...last, error: e.message.slice(0, 300), errorAt: now() });
      throw e;
    }
  }
}

export const publishStatus = async (env) => ({
  configured: !!(env.GITHUB_TOKEN && env.GITHUB_REPO),
  dirtyAt: await getKv(env, 'publish_dirty', 0),
  last: await getKv(env, 'publish_last', null)
});
