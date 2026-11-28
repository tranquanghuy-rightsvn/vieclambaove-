// Phần dùng chung giữa trình duyệt (main.js) và script sinh trang tĩnh (scripts/build.mjs):
// bảng tuyến, đầu trang, chân trang, tiêu đề trang. Sửa ở đây thì cả hai cùng đổi.
import { icon, esc, user, store } from './core.js';
import { topicPages, topicPath } from './topics.js';

export const SITE_NAME = 'Việc Làm Bảo Vệ';
export const DEFAULT_TITLE = 'Việc làm bảo vệ - Chuyên trang tuyển dụng bảo vệ uy tín toàn quốc';
export const DEFAULT_DESC = 'Tìm kiếm việc làm bảo vệ lương cao, đi làm ngay tại 34 tỉnh thành. Chuyên trang tuyển dụng bảo vệ uy tín, trực tiếp từ công ty, bao ăn ở, không thu phí.';
// Mọi link tới trang trong HTML đều dạng /slug, KHÔNG có / cuối (trừ trang chủ "/")
const LINK_RE = /href="(\/[^"?#]*?)\/+((?:[?#][^"]*)?)"/g;
export const cleanLinks = (html) => String(html || '').replace(LINK_RE, (m, p, q) => `href="${p || '/'}${q}"`);
export const noSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export const docTitle = (page) => (page.title ? `${page.title} | ${SITE_NAME}` : DEFAULT_TITLE);

export const ROUTES = [
  [/^\/$/, () => import('./pages/home.js')],
  [/^\/viec-lam-bao-ve-([a-z0-9-]+)$/, () => import('./pages/topic.js')],
  [/^\/viec-lam-bao-ve(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/, () => import('./pages/jobs.js')],
  [/^\/tin\/(?:[a-z0-9-]*-)?(\d+)$/, () => import('./pages/job.js')],
  [/^\/cong-ty-tuyen-dung$/, () => import('./pages/companies.js')],
  [/^\/viec-da-luu$/, () => import('./pages/saved.js')],
  [/^\/tim-kiem$/, () => import('./pages/search.js')],
  [/^\/cong-ty\/([a-z0-9-]+)$/, () => import('./pages/company.js')],
  [/^\/tin-tuc$/, () => import('./pages/blog.js')],
  [/^\/tin-tuc\/([a-z0-9-]+)$/, () => import('./pages/post.js')],
  [/^\/video(?:\/([a-z0-9-]+))?$/, () => import('./pages/video.js')],
  [/^\/dang-nhap$/, () => import('./pages/auth.js')],
  [/^\/ung-vien(?:\/([a-z-]+))?$/, () => import('./pages/candidate.js')],
  [/^\/trang-quan-ly-tuyen-dung(?:\/([a-z-]+))?$/, () => import('./pages/employer.js')],
  [/^\/chinh-sach(?:\/([a-z-]+))?$/, () => import('./pages/policy.js')],

];

export function match(path) {
  if (path.length > 1) path = path.replace(/\/+$/, '');
  for (const [pattern, load] of ROUTES) {
    const m = path.match(pattern);
    if (m) return { load, params: m.slice(1).map((x) => (x ? decodeURIComponent(x) : x)) };
  }
  return null;
}

export const NAV = [
  ['jobs', '/viec-lam-bao-ve', 'Việc làm'],
  ['blog', '/tin-tuc', 'Tin tức'],
  ['video', '/video', 'Video']
];

function acctLink(u) {
  if (!u) return { href: '/dang-nhap', label: 'Đăng nhập' };
  return { href: u.role === 'employer' ? '/trang-quan-ly-tuyen-dung' : '/ung-vien', label: u.role === 'employer' ? 'Quản lý tuyển dụng' : esc(u.name?.split(' ').pop() || 'Tài khoản') };
}

// Logo: khiên bảo vệ xanh navy viền vàng (PNG nền trong suốt), chữ vieclam·baove·.vn
const brand = () => `<a class="brand logo" href="/" aria-label="vieclambaove.vn - Trang chủ">
      <picture class="logo-mark"><source srcset="/assets/img/logo-160.webp" type="image/webp"><img src="/assets/img/logo-160.png" alt="" width="38" height="40" decoding="async"></picture>
      <span class="logo-text"><span class="logo-name">vieclam<b>baove</b>.vn</span><small>Tuyển dụng bảo vệ toàn quốc</small></span>
    </a>`;

export function headerHtml(navKey) {
  const u = user();
  const a = acctLink(u);
  const postHref = u?.role === 'employer' ? '/trang-quan-ly-tuyen-dung/dang-tin' : '/dang-nhap?vai-tro=nha-tuyen-dung';
  const right = u
    ? `<a class="acct" href="${a.href}">${icon('user')}${a.label}</a><button class="mast-logout" type="button" data-logout title="Đăng xuất" aria-label="Đăng xuất">${icon('logout')}<span>Đăng xuất</span></button>`
    : `<a class="btn btn-line btn-s" href="/dang-nhap?dang-ky=1">Đăng ký</a><a class="btn btn-primary btn-s" href="/dang-nhap">Đăng nhập</a>`;
  return `
  <header class="mast"><div class="wrap">
    ${brand()}
    <nav class="nav" aria-label="Chính">${NAV.map(([k, h, t]) => `<a href="${h}" class="${k === navKey ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="mast-act">
 ${u?.role === 'employer' ? '' : `<a class="mast-saved" href="/viec-da-luu" title="Việc đã lưu" aria-label="Việc đã lưu">${icon('heart')}${store.get('saved', []).length ? `<em>${store.get('saved', []).length}</em>` : ''}</a>`}
      <button class="btn btn-quick btn-s mast-quick" type="button" data-quick>${icon('bolt')}<span class="q-full">Tạo hồ sơ xin việc nhanh</span><span class="q-short">Hồ sơ xin việc</span></button>
      ${u ? '' : `<a class="emp-link" href="${postHref}"><small>Nhà tuyển dụng</small>Đăng tin tuyển dụng</a>`}
      ${right}
      <button class="burger" type="button" data-drawer aria-label="Mở menu" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div></header>
  <div class="drawer" id="drawer"><div class="drawer-bg" data-undrawer></div>
    <div class="drawer-panel" role="dialog" aria-label="Menu">
      <button class="x" type="button" data-undrawer aria-label="Đóng menu">${icon('x')}</button>
      ${NAV.map(([, h, t]) => `<a href="${h}">${t}</a>`).join('')}
      <a href="/chinh-sach/lien-he">Liên hệ</a>
      <a href="${a.href}">${u ? 'Tài khoản của tôi' : 'Đăng nhập / Đăng ký'}</a>
      ${u ? '<a href="#" data-logout>Đăng xuất</a>' : ''}
      ${u?.role === 'candidate' ? '' : `<a class="btn btn-primary btn-l" href="${postHref}">Đăng tin tuyển dụng</a>`}
    </div>
  </div>`;
}

function tabbar(path) {
  const u = user();
  const items = [
    ['/', 'Trang chủ', 'building', path === '/'],
    ['/viec-lam-bao-ve', 'Tìm việc', 'search', path.startsWith('/viec-lam-bao-ve') || path.startsWith('/tin/')],
    ['/viec-da-luu', 'Đã lưu', 'bookmark', path === '/viec-da-luu' || path === '/ung-vien/da-luu'],
    [u ? acctLink(u).href : '/dang-nhap', 'Tài khoản', 'user', (path.startsWith('/ung-vien') && path !== '/ung-vien/da-luu') || path.startsWith('/dang-nhap') || path.startsWith('/trang-quan-ly-tuyen-dung')]
  ];
  const link = ([h, t, ic, on]) => `<a href="${h}" class="${on ? 'on' : ''}">${icon(ic)}${t}</a>`;
  // Nút "Tạo hồ sơ xin việc nhanh" nằm giữa thanh dưới, luôn thấy rõ trên mobile ở mọi trang
  const quick = `<button class="tb-quick" type="button" data-quick><span class="tb-quick-ic">${icon('bolt')}</span>Hồ sơ nhanh</button>`;
  return `<nav class="tabbar" aria-label="Điều hướng nhanh">${items.slice(0, 2).map(link).join('')}${quick}${items.slice(2).map(link).join('')}</nav>`;
}

// Mạng xã hội ở chân trang (dưới cột vieclambaove.vn). Điền link vào đây; link để trống thì icon đó không hiện.
export const SOCIAL = [
  ['Facebook', '', '<path d="M13.5 21v-7.5H16l.4-3H13.5V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/>'],
  ['TikTok', '', '<path d="M16.6 3h-3.1v12.3a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .8.1V9.5a5.9 5.9 0 1 0 5 5.8V9.1a7.6 7.6 0 0 0 4.4 1.4V7.4c-2.4 0-4.4-2-4.4-4.4z"/>'],
  ['YouTube', '', '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z"/>'],
  ['Zalo', '', '<text x="12" y="15.6" text-anchor="middle" font-size="9.5" font-weight="800" font-family="Arial, sans-serif">Zalo</text>']
];
const socialHtml = () => {
  const items = SOCIAL.filter(([, href]) => href);
  return items.length ? `<p class="foot-social">${items.map(([name, href, svg]) => `<a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${name}" title="${name}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${svg}</svg></a>`).join('')}</p>` : '';
};

export function footerHtml(path) {
  const V = window.VLBV;
  return `<footer class="foot"><div class="wrap">
    <div class="foot-top">
      <div class="foot-co">
        ${brand()}
        <p class="foot-note">Chuyên trang tuyển dụng ngành bảo vệ, vệ sĩ. Tin được kiểm duyệt trước khi hiển thị, công ty được xác thực giấy phép.</p>
        <ul class="foot-contact">
          <li>${icon('phone', 'ico-s')}Hotline: <a href="tel:0986864878">09 86 86 48 78</a> (8:00 - 21:00)</li>
          <li>${icon('chat', 'ico-s')}Email: <a href="mailto:vieclambaove@gmail.com">vieclambaove@gmail.com</a></li>
          <li>${icon('pin', 'ico-s')}Tầng 5, 123 Nguyễn Văn Linh, Quận 7, TP.HCM</li>
        </ul>
        ${socialHtml()}
      </div>
      <div><h4>Về Việc Làm Bảo Vệ</h4><ul>
        <li><a href="/chinh-sach/lien-he">Liên hệ</a></li>
        <li><a href="/chinh-sach/dieu-khoan">Điều khoản sử dụng</a></li>
        <li><a href="/chinh-sach/bao-mat">Chính sách bảo mật</a></li>
        <li><a href="/chinh-sach/quy-che">Quy chế hoạt động</a></li>
      </ul></div>
      <div><h4>Dành cho ứng viên</h4><ul>
        <li><a href="/viec-lam-bao-ve">Việc làm bảo vệ mới nhất</a></li>
        <li><a href="/viec-lam-bao-ve?gap=1">Việc làm tuyển gấp</a></li>
        <li><a href="/ung-vien">Hồ sơ của tôi</a></li>
        <li><a href="/tin-tuc">Tin tức nghề bảo vệ</a></li>
        <li><a href="/video">Video nghề bảo vệ</a></li>
        <li><a href="/viec-da-luu">Việc đã lưu</a></li>
        <li><a href="/cong-ty-tuyen-dung">Nhà tuyển dụng</a></li>
        <li><a href="/tin-tuc/dau-hieu-cong-ty-bao-ve-lua-dao">Cảnh báo lừa đảo</a></li>
      </ul></div>
      <div><h4>Nhà tuyển dụng</h4><ul>
        <li><a href="/trang-quan-ly-tuyen-dung/dang-tin">Đăng tin tuyển dụng</a></li>
        <li><a href="/trang-quan-ly-tuyen-dung/tim-ung-vien">Tìm ứng viên</a></li>
        <li><a href="/trang-quan-ly-tuyen-dung/xac-thuc">Xác thực công ty</a></li>
      </ul></div>
      <div><h4>Việc làm theo tỉnh</h4><ul>${V.provinces.map((p) => `<li><a href="/viec-lam-bao-ve/${p.slug}">Bảo vệ ${p.short}</a></li>`).join('')}</ul></div>
    </div>
    <div class="foot-tags"><h4>Tìm kiếm nhiều</h4><p>${topicPages().map((x) => `<a href="${topicPath(x.t, x.pv)}">${esc(x.t.short + (x.pv ? ' ' + x.pv.short : ''))}</a>`).join('')}</p></div>
    <div class="foot-base">
      <p class="foot-copy">© 2026 vieclambaove.vn - Chuyên trang tuyển dụng bảo vệ, vệ sĩ. Bảo lưu mọi quyền.</p>
    </div>
  </div></footer>${tabbar(path)}`;
}

export const notFoundPage = () => ({
    title: 'Không tìm thấy trang', noindex: true,
    html: `<div class="wrap nf"><b>404</b><h1>Trang này không còn tồn tại</h1><p class="mute">Có thể tin đã bị gỡ hoặc đường dẫn bị gõ sai.</p><p><a class="btn btn-primary" href="/viec-lam-bao-ve">Xem việc đang tuyển</a> <a class="btn btn-line" href="/">Về trang chủ</a></p></div>`
});
