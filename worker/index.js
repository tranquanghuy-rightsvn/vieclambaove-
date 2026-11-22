// Điểm vào Worker. Trang công khai là file HTML tĩnh do scripts/build.mjs sinh ra (dist/);
// Worker chỉ lo API (/api/*), robots.txt theo tên miền, và cron xuất bản dữ liệu.
import { api } from './api.js';
import { markDirty, publish, serveLive, LIVE_SQL, categories } from './publish.js';
import { slugify } from './lib.js';
import { now } from './lib.js';

const isTemporaryHost = (url) => url.hostname.endsWith('.workers.dev') || url.hostname === 'localhost' || url.hostname === '127.0.0.1';

function robots(url) {
  // Tên miền tạm (*.workers.dev) không cho Google lập chỉ mục, tránh trùng nội dung khi gắn tên miền thật
  const body = isTemporaryHost(url)
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /ung-vien\nDisallow: /nha-tuyen-dung\nDisallow: /quan-tri\nDisallow: /dang-nhap\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

// Đường dẫn công khai chưa có file tĩnh nhưng đã có trong D1 (tin/công ty/video vừa duyệt, quận vừa có tin)
async function existsLive(env, path) {
  path = path.replace(/\/+$/, '');
  let m = path.match(/^\/tin\/(?:[a-z0-9-]*-)?(\d+)$/);
  if (m) return !!(await env.DB.prepare(LIVE_SQL + ' AND j.id = ?2').bind(now(), Number(m[1])).first());
  m = path.match(/^\/cong-ty\/([a-z0-9-]+)$/);
  if (m) return !!(await env.DB.prepare('SELECT 1 FROM companies WHERE id = ? AND locked = 0').bind(m[1]).first());
  m = path.match(/^\/video\/([a-z0-9-]+)$/);
  if (m) return !!(await env.DB.prepare('SELECT 1 FROM videos WHERE slug = ? AND published = 1').bind(m[1]).first());
  m = path.match(/^\/viec-lam\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
  if (m) {
    const p = (await categories(env)).provinces.find((x) => x.slug === m[1]);
    return !!p && (!m[2] || p.districts.some((d) => slugify(d) === m[2]));
  }
  return false;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return api(req, env, url);
    if (url.pathname === '/robots.txt') return robots(url);
    if (url.pathname === '/data/site.js') return serveLive(env, req);
    // Tới đây nghĩa là KHÔNG có file tĩnh cho đường dẫn này (file tĩnh được phục vụ trước khi vào Worker).
    // Nội dung vừa duyệt chưa kịp build: trả khung trang (200) để JS vẽ ngay từ dữ liệu trực tiếp.
    if (req.method === 'GET' && (await existsLive(env, url.pathname))) {
      const shell = await env.ASSETS.fetch(new Request(url.origin + '/_shell.html'));
      return new Response(shell.body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
    }
    const nf = await env.ASSETS.fetch(new Request(url.origin + '/404.html'));
    return new Response(nf.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  },

  // 2 phút/lần: tin hết hạn rời website; có thay đổi thì xuất bản dữ liệu lên GitHub (CI build lại)
  async scheduled(event, env, ctx) {
    const t = now();
    const r = await env.DB.prepare('UPDATE jobs SET status = \'expired\', updated_at = ? WHERE status IN (\'live\', \'hidden\') AND expires_at <= ?').bind(t, t).run();
    if (r.meta.changes) await markDirty(env);
    if (new Date(t).getUTCMinutes() < 2) await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(t).run();
    ctx.waitUntil(publish(env).then((x) => x.commit && console.log('Đã xuất bản', x)).catch((e) => console.error('Xuất bản thất bại:', e.message)));
  }
};
