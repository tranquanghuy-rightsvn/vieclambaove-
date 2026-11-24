// Phần dùng chung giữa trình duyệt (main.js) và script sinh trang tĩnh (scripts/build.mjs):
// bảng tuyến, đầu trang, chân trang, tiêu đề trang. Sửa ở đây thì cả hai cùng đổi.
import { icon, esc, user } from './core.js';

export const SITE_NAME = 'Việc Làm Bảo Vệ';
export const DEFAULT_TITLE = 'Việc Làm Bảo Vệ - Tuyển dụng bảo vệ, vệ sĩ toàn quốc';
export const DEFAULT_DESC = 'Chuyên trang việc làm ngành bảo vệ: lương, ca làm, chỗ ở ghi rõ trong từng tin.';
// Mọi link tới trang trong HTML đều dạng /slug, KHÔNG có / cuối (trừ trang chủ "/")
const LINK_RE = /href="(\/[^"?#]*?)\/+((?:[?#][^"]*)?)"/g;
export const cleanLinks = (html) => String(html || '').replace(LINK_RE, (m, p, q) => `href="${p || '/'}${q}"`);
export const noSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export const docTitle = (page) => (page.title ? `${page.title} | ${SITE_NAME}` : DEFAULT_TITLE);

export const ROUTES = [
  [/^\/$/, () => import('./pages/home.js')],
  [/^\/viec-lam(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/, () => import('./pages/jobs.js')],
  [/^\/tin\/(?:[a-z0-9-]*-)?(\d+)$/, () => import('./pages/job.js')],
  [/^\/cong-ty\/([a-z0-9-]+)$/, () => import('./pages/company.js')],
  [/^\/tin-tuc$/, () => import('./pages/blog.js')],
  [/^\/tin-tuc\/([a-z0-9-]+)$/, () => import('./pages/post.js')],
  [/^\/video(?:\/([a-z0-9-]+))?$/, () => import('./pages/video.js')],
  // Bảng giá tạm ẩn (Phase 1 đăng tin miễn phí). Bật lại: thêm dòng [/^\/bang-gia$/, () => import('./pages/pricing.js')]
  [/^\/dang-nhap$/, () => import('./pages/auth.js')],
  [/^\/ung-vien(?:\/([a-z-]+))?$/, () => import('./pages/candidate.js')],
  [/^\/nha-tuyen-dung(?:\/([a-z-]+))?$/, () => import('./pages/employer.js')],
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
  ['jobs', '/viec-lam', 'Việc làm'],
  ['blog', '/tin-tuc', 'Tin tức'],
  ['video', '/video', 'Video']
];

function acctLink(u) {
  if (!u) return { href: '/dang-nhap', label: 'Đăng nhập' };
  return { href: u.role === 'employer' ? '/nha-tuyen-dung' : '/ung-vien', label: u.role === 'employer' ? 'Quản lý tuyển dụng' : esc(u.name?.split(' ').pop() || 'Tài khoản') };
}

// Logo theo mẫu "Cổng thông tin tuyển dụng bảo vệ": ô vàng gradient + khiên, chữ vieclam·baove·.vn
const brand = () => `<a class="brand logo" href="/" aria-label="vieclambaove.vn - Trang chủ">
      <span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.2 4.2 5.3v5.9c0 4.9 3.3 9.2 7.8 10.6 4.5-1.4 7.8-5.7 7.8-10.6V5.3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 2.2v19.6c-4.5-1.4-7.8-5.7-7.8-10.6V5.3z" fill="currentColor"/></svg></span>
      <span class="logo-text"><span class="logo-name">vieclam<b>baove</b>.vn</span><small>Tuyển dụng bảo vệ toàn quốc</small></span>
    </a>`;

export function headerHtml(navKey) {
  const u = user();
  const a = acctLink(u);
  const postHref = u?.role === 'employer' ? '/nha-tuyen-dung/dang-tin' : '/dang-nhap?vai-tro=nha-tuyen-dung';
  const right = u
    ? `<a class="acct" href="${a.href}">${icon('user')}${a.label}</a>`
    : `<a class="btn btn-line btn-s" href="/dang-nhap?dang-ky=1">Đăng ký</a><a class="btn btn-primary btn-s" href="/dang-nhap">Đăng nhập</a>`;
  return `
  <header class="mast"><div class="wrap">
    ${brand()}
    <nav class="nav" aria-label="Chính">${NAV.map(([k, h, t]) => `<a href="${h}" class="${k === navKey ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="mast-act">
      <button class="btn btn-quick btn-s mast-quick" type="button" data-quick>${icon('bolt')}<span class="q-full">Tạo hồ sơ xin việc nhanh</span><span class="q-short">Hồ sơ xin việc</span></button>
      ${u?.role === 'employer' ? '' : `<a class="emp-link" href="${postHref}"><small>Dành cho nhà tuyển dụng</small>Đăng tin tuyển dụng</a>`}
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
      <a class="btn btn-primary btn-l" href="${postHref}">Đăng tin tuyển dụng</a>
    </div>
  </div>
  <div class="floaty" aria-label="Hỗ trợ nhanh">
    <a href="/chinh-sach/lien-he" class="fz" aria-label="Chat Zalo với tư vấn viên">Zalo</a>
    <a href="tel:19006868" aria-label="Gọi hotline 1900 6868">${icon('phone')}</a>
  </div>`;
}

function tabbar(path) {
  const u = user();
  const items = [
    ['/', 'Trang chủ', 'building', path === '/'],
    ['/viec-lam', 'Tìm việc', 'search', path.startsWith('/viec-lam') || path.startsWith('/tin/')],
    ['/ung-vien/da-luu', 'Đã lưu', 'bookmark', path === '/ung-vien/da-luu'],
    [u ? acctLink(u).href : '/dang-nhap', 'Tài khoản', 'user', (path.startsWith('/ung-vien') && path !== '/ung-vien/da-luu') || path.startsWith('/dang-nhap') || path.startsWith('/nha-tuyen-dung')]
  ];
  const link = ([h, t, ic, on]) => `<a href="${h}" class="${on ? 'on' : ''}">${icon(ic)}${t}</a>`;
  // Nút "Tạo hồ sơ xin việc nhanh" nằm giữa thanh dưới, luôn thấy rõ trên mobile ở mọi trang
  const quick = `<button class="tb-quick" type="button" data-quick><span class="tb-quick-ic">${icon('bolt')}</span>Hồ sơ nhanh</button>`;
  return `<nav class="tabbar" aria-label="Điều hướng nhanh">${items.slice(0, 2).map(link).join('')}${quick}${items.slice(2).map(link).join('')}</nav>`;
}

export function footerHtml(path) {
  const V = window.VLBV;
  return `<footer class="foot"><div class="wrap">
    <div class="foot-top">
      <div class="foot-co">
        ${brand()}
        <p class="foot-note">Chuyên trang tuyển dụng ngành bảo vệ, vệ sĩ. Tin được kiểm duyệt trước khi hiển thị, công ty được xác thực giấy phép.</p>
        <ul class="foot-contact">
          <li>${icon('phone', 'ico-s')}Hotline: <a href="tel:19006868">1900 6868</a> (8:00 - 21:00)</li>
          <li>${icon('chat', 'ico-s')}Email: <a href="mailto:hotro@vieclambaove.vn">hotro@vieclambaove.vn</a></li>
          <li>${icon('pin', 'ico-s')}Tầng 5, 123 Nguyễn Văn Linh, Quận 7, TP.HCM</li>
        </ul>
      </div>
      <div><h4>Về Việc Làm Bảo Vệ</h4><ul>
        <li><a href="/chinh-sach/lien-he">Liên hệ</a></li>
        <li><a href="/chinh-sach/dieu-khoan">Điều khoản sử dụng</a></li>
        <li><a href="/chinh-sach/bao-mat">Chính sách bảo mật</a></li>
        <li><a href="/chinh-sach/quy-che">Quy chế hoạt động</a></li>
      </ul></div>
      <div><h4>Dành cho ứng viên</h4><ul>
        <li><a href="/viec-lam">Việc làm bảo vệ mới nhất</a></li>
        <li><a href="/viec-lam?gap=1">Việc làm tuyển gấp</a></li>
        <li><a href="/ung-vien">Hồ sơ của tôi</a></li>
        <li><a href="/tin-tuc">Tin tức nghề bảo vệ</a></li>
        <li><a href="/video">Video nghề bảo vệ</a></li>
        <li><a href="/tin-tuc/dau-hieu-cong-ty-bao-ve-lua-dao">Cảnh báo lừa đảo</a></li>
      </ul></div>
      <div><h4>Dành cho nhà tuyển dụng</h4><ul>
        <li><a href="/nha-tuyen-dung/dang-tin">Đăng tin tuyển dụng</a></li>
        <li><a href="/nha-tuyen-dung/xac-thuc">Xác thực công ty</a></li>
      </ul></div>
      <div><h4>Việc làm theo tỉnh</h4><ul>${V.provinces.map((p) => `<li><a href="/viec-lam/${p.slug}">Bảo vệ ${p.short}</a></li>`).join('')}</ul></div>
    </div>
    <div class="foot-base">
      <p><b>Công ty Cổ phần Việc Làm Bảo Vệ</b> (dữ liệu mẫu) · Giấy chứng nhận ĐKKD số 03xxxxxxxx do Sở KH&amp;ĐT TP.HCM cấp · Người chịu trách nhiệm nội dung: Ban biên tập.</p>
      <p>© 2026 ViecLamBaoVe.vn. Bản giao diện mẫu, số liệu minh họa.</p>
    </div>
  </div></footer>${tabbar(path)}`;
}

export const notFoundPage = () => ({
    title: 'Không tìm thấy trang', noindex: true,
    html: `<div class="wrap nf"><b>404</b><h1>Trang này không còn tồn tại</h1><p class="mute">Có thể tin đã bị gỡ hoặc đường dẫn bị gõ sai.</p><p><a class="btn btn-primary" href="/viec-lam">Xem việc đang tuyển</a> <a class="btn btn-line" href="/">Về trang chủ</a></p></div>`
});
