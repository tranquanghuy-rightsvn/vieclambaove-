// Điểm vào Worker. Trang công khai là file HTML tĩnh do scripts/build.mjs sinh ra (dist/);
// Worker chỉ lo API (/api/*), robots.txt theo tên miền, và cron xuất bản dữ liệu.
import { api } from './api.js';
import { markDirty, publish } from './publish.js';
import { now } from './lib.js';

const isTemporaryHost = (url) => url.hostname.endsWith('.workers.dev') || url.hostname === 'localhost' || url.hostname === '127.0.0.1';

function robots(url) {
  // Tên miền tạm (*.workers.dev) không cho Google lập chỉ mục, tránh trùng nội dung khi gắn tên miền thật
  const body = isTemporaryHost(url)
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /ung-vien\nDisallow: /nha-tuyen-dung\nDisallow: /quan-tri\nDisallow: /dang-nhap\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return api(req, env, url);
    if (url.pathname === '/robots.txt') return robots(url);
    return env.ASSETS.fetch(req);
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
