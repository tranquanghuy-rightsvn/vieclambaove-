// Điểm vào Worker: API, file dữ liệu tĩnh, SEO, sitemap; còn lại là file tĩnh trong dist/
import { api } from './api.js';
import { serveSnapshot, buildSnapshot } from './snapshot.js';
import { seoPage, robots, sitemap } from './seo.js';
import { now } from './lib.js';

const SEO_PATH = /^\/(?:$|viec-lam(?:\/|$)|tin\/|cong-ty\/|video(?:\/|$))/;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (path.startsWith('/api/')) return api(req, env, url);
    if (path === '/data/site.js') return serveSnapshot(env, req);
    if (path === '/robots.txt') return robots(url);
    if (path === '/sitemap.xml') return sitemap(env, url);
    if (req.method === 'GET' && SEO_PATH.test(path)) return seoPage(req, env, url);
    return env.ASSETS.fetch(req);
  },

  // Mỗi giờ: tin hết hạn bị xoá khỏi website, dọn phiên đăng nhập cũ
  async scheduled(event, env, ctx) {
    const t = now();
    const r = await env.DB.prepare('UPDATE jobs SET status = \'expired\', updated_at = ? WHERE status IN (\'live\', \'hidden\') AND expires_at <= ?').bind(t, t).run();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(t).run();
    // Snapshot dựng lại khi có tin hết hạn, và ít nhất mỗi ngày 1 lần
    if (r.meta.changes || new Date(t).getUTCHours() === 17) ctx.waitUntil(buildSnapshot(env));
  }
};
