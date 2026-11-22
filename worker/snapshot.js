// Dữ liệu công khai được "render" thành 1 file tĩnh /data/site.js mỗi khi có thay đổi.
// Trình duyệt tải file này 1 lần, tìm kiếm + lọc ngay trên máy (không gọi API khi tìm).
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
  postedAt: j.posted_at, expiresAt: j.expires_at
});

export const publicVideo = (v) => ({ slug: v.slug, yt: v.youtube_id, title: v.title, desc: v.descr, date: v.created_at });

// Tin công khai: đang hiển thị, chưa hết hạn, công ty không bị khoá
export const LIVE_SQL = `SELECT j.* FROM jobs j JOIN companies c ON c.id = j.company_id
  WHERE j.status = 'live' AND j.expires_at > ?1 AND c.locked = 0`;

export async function buildSnapshot(env) {
  const t = now();
  const [cats, cos, jobs, videos] = await Promise.all([
    categories(env),
    env.DB.prepare('SELECT * FROM companies WHERE locked = 0 ORDER BY verified DESC, name').all(),
    env.DB.prepare(LIVE_SQL + ' ORDER BY (j.tier = \'vip\') DESC, j.posted_at DESC').bind(t).all(),
    env.DB.prepare('SELECT * FROM videos WHERE published = 1 ORDER BY created_at DESC').all()
  ]);
  const data = { ...cats, companies: cos.results.map(publicCompany), jobs: jobs.results.map(publicJob), videos: videos.results.map(publicVideo), builtAt: t };
  // Ngày đăng/hết hạn tính lại theo giờ máy người xem, tin vừa hết hạn tự rơi khỏi danh sách
  const body = `/* Sinh tự động từ cơ sở dữ liệu lúc ${new Date(t).toISOString()} – không sửa tay */
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
  const etag = '"' + (await sha256(body)).slice(0, 16) + '"';
  await setKv(env, 'snapshot', { body, etag, builtAt: t });
  return { body, etag };
}

export async function serveSnapshot(env, req) {
  let snap = await getKv(env, 'snapshot');
  if (!snap) snap = await buildSnapshot(env);
  if (req.headers.get('if-none-match') === snap.etag) return new Response(null, { status: 304, headers: { etag: snap.etag } });
  return new Response(snap.body, {
    headers: { 'content-type': 'text/javascript; charset=utf-8', etag: snap.etag, 'cache-control': 'no-cache' }
  });
}
