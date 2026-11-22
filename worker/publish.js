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
  rating: c.rating || null, reviews: c.reviews || 0, mst: c.mst || '', license: c.license || '', verified: !!c.verified
});

export const publicJob = (j) => ({
  id: j.id, title: j.title, company: j.company_id, province: j.province, district: j.district, address: j.address,
  target: j.target, shift: j.shift, qty: j.qty, salaryMin: j.salary_min, salaryMax: j.salary_max,
  housing: !!j.housing, meals: !!j.meals, urgent: !!j.urgent, tier: j.tier, age: j.age, height: j.height,
  desc: j.descr || '', phone: j.contact_phone || '', views: j.views, calls: j.calls,
  postedAt: j.posted_at, expiresAt: j.expires_at, updatedAt: j.updated_at
});

export const publicVideo = (v) => ({ slug: v.slug, yt: v.youtube_id, title: v.title, desc: v.descr, date: v.created_at, updatedAt: v.updated_at });

// Tin công khai: đang hiển thị, chưa hết hạn, công ty không bị khoá
export const LIVE_SQL = `SELECT j.* FROM jobs j JOIN companies c ON c.id = j.company_id
  WHERE j.status = 'live' AND j.expires_at > ?1 AND c.locked = 0`;

export async function buildData(env) {
  const t = now();
  const [cats, cos, jobs, videos] = await Promise.all([
    categories(env),
    env.DB.prepare('SELECT * FROM companies WHERE locked = 0 ORDER BY verified DESC, name').all(),
    env.DB.prepare(LIVE_SQL + ' ORDER BY (j.tier = \'vip\') DESC, j.posted_at DESC, j.id DESC').bind(t).all(),
    env.DB.prepare('SELECT * FROM videos WHERE published = 1 ORDER BY created_at DESC').all()
  ]);
  return { ...cats, companies: cos.results.map(publicCompany), jobs: jobs.results.map(publicJob), videos: videos.results.map(publicVideo) };
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
  const body = `/* Dữ liệu trực tiếp lúc ${new Date().toISOString()} – không sửa tay */
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

/* ---------- GitHub Contents API ---------- */
const DATA_PATH = 'data/site.json';
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
async function gh(env, method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
    method,
    headers: { authorization: `Bearer ${env.GITHUB_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'vieclambaove-worker', 'x-github-api-version': '2022-11-28', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !(method === 'GET' && res.status === 404)) throw new Error(`GitHub ${method} ${path}: ${res.status} ${data.message || ''}`);
  return res.ok ? data : null;
}

/**
 * Xuất bản nếu có thay đổi (hoặc force). Trả về trạng thái để quản trị/cron biết.
 * Nội dung không đổi so với lần trước (so băm) thì không commit, tránh build thừa.
 */
export async function publish(env, { force = false } = {}) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return { ok: false, skipped: 'Chưa cấu hình GITHUB_TOKEN / GITHUB_REPO' };
  const dirty = await getKv(env, 'publish_dirty', 0);
  const last = await getKv(env, 'publish_last', { at: 0, hash: '' });
  if (!force && !(dirty > last.at)) return { ok: true, skipped: 'Không có thay đổi' };
  const startedAt = now();
  const data = await buildData(env);
  const json = JSON.stringify(data, null, 1) + '\n';
  const hash = await sha256(json);
  if (hash === last.hash && !force) {
    await setKv(env, 'publish_last', { at: startedAt, hash, commit: last.commit });
    return { ok: true, skipped: 'Nội dung không đổi' };
  }
  const branch = env.GITHUB_BRANCH || 'main';
  const cur = await gh(env, 'GET', `${DATA_PATH}?ref=${encodeURIComponent(branch)}`);
  const r = await gh(env, 'PUT', DATA_PATH, {
    message: `data: cập nhật dữ liệu website (${data.jobs.length} tin, ${data.videos.length} video)`,
    content: b64utf8(json), branch, ...(cur?.sha ? { sha: cur.sha } : {}),
    committer: { name: 'vieclambaove-bot', email: 'bot@vieclambaove.invalid' }
  });
  await setKv(env, 'publish_last', { at: startedAt, hash, commit: r.commit?.sha || '' });
  return { ok: true, commit: r.commit?.sha || '', jobs: data.jobs.length };
}

export const publishStatus = async (env) => ({
  configured: !!(env.GITHUB_TOKEN && env.GITHUB_REPO),
  dirtyAt: await getKv(env, 'publish_dirty', 0),
  last: await getKv(env, 'publish_last', null)
});
