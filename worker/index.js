// Điểm vào Worker. Trang công khai là file HTML tĩnh trong html/ (scripts/build.mjs sinh ra, GitHub lưu);
// Worker lo API (/api/*), robots.txt, dữ liệu trực tiếp, nội dung vừa duyệt chưa kịp build, và xuất bản lên GitHub.
import { api } from './api.js';
import { publish, serveLive, LIVE_SQL, categories, getKv } from './publish.js';
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

// Ảnh công khai chưa kịp lên GitHub (vừa tải/vừa duyệt): phục vụ tạm từ R2, chỉ ảnh đang được dùng công khai
async function liveImage(env, name) {
  if (!/^(jobs|companies)\/[a-z0-9-]+\.(jpg|png|webp)$/.test(name)) return null;
  const used = name.startsWith('jobs/')
    ? await env.DB.prepare(LIVE_SQL + ' AND j.images LIKE ?2').bind(now(), '%"' + name + '"%').first()
    : await env.DB.prepare('SELECT 1 FROM companies WHERE locked = 0 AND logo = ?').bind('/images/' + name).first();
  if (!used) return null;
  const obj = await env.FILES.get('img/' + name);
  return obj && new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=300' } });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      const res = await api(req, env, url);
      // Không dùng cron: thao tác nào làm đổi nội dung công khai thì xuất bản lên GitHub ngay (chạy nền)
      if (req.method !== 'GET' && res.ok) ctx.waitUntil(publishIfDirty(env));
      return res;
    }
    if (url.pathname === '/robots.txt') return robots(url);
    if (url.pathname === '/data/site.js') return serveLive(env, req);
    // Tới đây nghĩa là KHÔNG có file tĩnh cho đường dẫn này (file tĩnh được phục vụ trước khi vào Worker).
    if (url.pathname.startsWith('/images/')) {
      const img = await liveImage(env, decodeURIComponent(url.pathname.slice(8)));
      if (img) return img;
    } else if (req.method === 'GET' && (await existsLive(env, url.pathname))) {
      // Nội dung vừa duyệt chưa kịp build: trả khung trang (200) để JS vẽ ngay từ dữ liệu trực tiếp
      const shell = await env.ASSETS.fetch(new Request(url.origin + '/_shell.html'));
      return new Response(shell.body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
    }
    const nf = await env.ASSETS.fetch(new Request(url.origin + '/404.html'));
    return new Response(nf.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
};

async function publishIfDirty(env) {
  try {
    const dirty = await getKv(env, 'publish_dirty', 0);
    const last = await getKv(env, 'publish_last', { at: 0 });
    if (dirty > (last.at || 0)) { const r = await publish(env); if (r.commit) console.log('Đã xuất bản', r.commit); }
  } catch (e) { console.error('Xuất bản thất bại (lần thay đổi sau hoặc GAS 0h sẽ thử lại):', e.message); }
}
