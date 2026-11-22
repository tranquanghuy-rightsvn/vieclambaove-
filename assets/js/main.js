// Điểm vào: khai báo tuyến, vẽ khung trang, xử lý sự kiện chung
import { $, icon, esc, user, store, toggleSave, applyJob, reportJob, quickProfile, toast, SITE, api, syncMe } from './core.js';
import { route, onRender, match, clean, go } from './router.js';

route(/^\/$/, () => import('./pages/home.js'));
route(/^\/viec-lam(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/, () => import('./pages/jobs.js'));
route(/^\/tin\/(?:[a-z0-9-]*-)?(\d+)$/, () => import('./pages/job.js'));
route(/^\/cong-ty\/([a-z0-9-]+)$/, () => import('./pages/company.js'));
route(/^\/tin-tuc$/, () => import('./pages/blog.js'));
route(/^\/tin-tuc\/([a-z0-9-]+)$/, () => import('./pages/post.js'));
route(/^\/video(?:\/([a-z0-9-]+))?$/, () => import('./pages/video.js'));
route(/^\/bang-gia$/, () => import('./pages/pricing.js'));
route(/^\/dang-nhap$/, () => import('./pages/auth.js'));
route(/^\/ung-vien(?:\/([a-z-]+))?$/, () => import('./pages/candidate.js'));
route(/^\/nha-tuyen-dung(?:\/([a-z-]+))?$/, () => import('./pages/employer.js'));
route(/^\/chinh-sach(?:\/([a-z-]+))?$/, () => import('./pages/policy.js'));

const NAV = [
  ['jobs', '/viec-lam', 'Việc làm'],
  ['blog', '/tin-tuc', 'Tin tức'],
  ['video', '/video', 'Video'],
  ['pricing', '/bang-gia', 'Bảng giá'],
  ['employer', '/nha-tuyen-dung', 'Nhà tuyển dụng']
];

function acctLink(u) {
  if (!u) return { href: '/dang-nhap', label: 'Đăng nhập' };
  return { href: u.role === 'employer' ? '/nha-tuyen-dung' : '/ung-vien', label: u.role === 'employer' ? 'Quản lý tuyển dụng' : esc(u.name?.split(' ').pop() || 'Tài khoản') };
}

// Logo theo mẫu "Cổng thông tin tuyển dụng bảo vệ": ô vàng gradient + khiên, chữ vieclam·baove·.vn
const brand = () => `<a class="brand logo" href="/" aria-label="vieclambaove.vn – Trang chủ">
      <span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 2.2 4.2 5.3v5.9c0 4.9 3.3 9.2 7.8 10.6 4.5-1.4 7.8-5.7 7.8-10.6V5.3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 2.2v19.6c-4.5-1.4-7.8-5.7-7.8-10.6V5.3z" fill="currentColor"/></svg></span>
      <span class="logo-text"><span class="logo-name">vieclam<b>baove</b>.vn</span><small>AI Recruitment &amp; Auto-SEO</small></span>
    </a>`;

function header(navKey) {
  const u = user();
  const a = acctLink(u);
  const postHref = u?.role === 'employer' ? '/nha-tuyen-dung/dang-tin' : '/dang-nhap?vai-tro=nha-tuyen-dung';
  const right = u
    ? `<a class="acct" href="${a.href}">${icon('user')}${a.label}</a>`
    : `<a class="btn btn-line btn-s" href="/dang-nhap?dang-ky=1">Đăng ký</a><a class="btn btn-primary btn-s" href="/dang-nhap">Đăng nhập</a>`;
  $('#header').innerHTML = `
  <header class="mast"><div class="wrap">
    ${brand()}
    <nav class="nav" aria-label="Chính">${NAV.map(([k, h, t]) => `<a href="${h}" class="${k === navKey ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="mast-act">
      <button class="btn btn-quick btn-s mast-quick" type="button" data-quick>${icon('bolt')}<span>Tạo hồ sơ 1 chạm</span></button>
      ${right}
      ${u?.role === 'employer' ? '' : `<a class="emp-link" href="${postHref}"><small>Dành cho nhà tuyển dụng</small>Đăng tuyển, tìm ứng viên</a>`}
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
  // Nút "Tạo hồ sơ 1 chạm" nằm giữa thanh dưới, luôn thấy rõ trên mobile ở mọi trang
  const quick = `<button class="tb-quick" type="button" data-quick><span class="tb-quick-ic">${icon('bolt')}</span>Hồ sơ 1 chạm</button>`;
  return `<nav class="tabbar" aria-label="Điều hướng nhanh">${items.slice(0, 2).map(link).join('')}${quick}${items.slice(2).map(link).join('')}</nav>`;
}

function footer(path) {
  const V = window.VLBV;
  $('#footer').innerHTML = `<footer class="foot"><div class="wrap">
    <div class="foot-top">
      <div class="foot-co">
        ${brand()}
        <p class="foot-note">Chuyên trang tuyển dụng ngành bảo vệ, vệ sĩ. Tin được kiểm duyệt trước khi hiển thị, công ty được xác thực giấy phép.</p>
        <ul class="foot-contact">
          <li>${icon('phone', 'ico-s')}Hotline: <a href="tel:19006868">1900 6868</a> (8:00 – 21:00)</li>
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
        <li><a href="/bang-gia">Bảng giá dịch vụ</a></li>
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

function setMeta(name, content, attr = 'name') {
  let m = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!content) { m?.remove(); return; }
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.append(m); }
  m.content = content;
}

const notFound = async () => ({
  default: () => ({
    title: 'Không tìm thấy trang', noindex: true,
    html: `<div class="wrap nf"><b>404</b><h1>Trang này không còn tồn tại</h1><p class="mute">Có thể tin đã bị gỡ hoặc đường dẫn bị gõ sai.</p><p><a class="btn btn-primary" href="/viec-lam">Xem việc đang tuyển</a> <a class="btn btn-line" href="/">Về trang chủ</a></p></div>`
  })
});

const main = $('#main');
let first = true;
async function render({ keepScroll = false } = {}) {
  const want = clean(location.href);
  if (want !== location.pathname + location.search + location.hash) history.replaceState({}, '', want);
  const path = location.pathname;
  const m = match(path) || { load: notFound, params: [] };
  let page;
  try {
    const mod = await m.load();
    page = await mod.default({ params: m.params, query: new URLSearchParams(location.search), path });
  } catch (err) {
    console.error(err);
    page = (await notFound()).default();
  }
  if (page.redirect) return go(page.redirect, { replace: true });

  document.dispatchEvent(new Event('vlbv:leave'));
  main.innerHTML = page.html;
  document.title = page.title ? `${page.title} | Việc Làm Bảo Vệ` : 'Việc Làm Bảo Vệ – Tuyển dụng bảo vệ, vệ sĩ toàn quốc';
  setMeta('description', page.desc || 'Chuyên trang việc làm ngành bảo vệ: lương, ca làm, chỗ ở ghi rõ trong từng tin.');
  setMeta('robots', page.noindex ? 'noindex, follow' : '');
  setMeta('og:title', document.title, 'property');
  document.head.querySelector('link[rel=canonical]').href = SITE + (page.canonical || path);
  document.head.querySelectorAll('script[data-ld]').forEach((s) => s.remove());
  [].concat(page.ld || []).forEach((obj) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.dataset.ld = ''; s.textContent = JSON.stringify(obj);
    document.head.append(s);
  });
  document.body.classList.toggle('has-mbar', !!page.mbar);
  document.body.classList.toggle('has-tabbar', page.tabbar !== false);

  header(page.nav);
  footer(path);
  page.mount?.(main);

  if (!keepScroll) {
    const target = location.hash && document.getElementById(location.hash.slice(1));
    target ? target.scrollIntoView() : window.scrollTo(0, 0);
    if (!first) main.focus({ preventScroll: true });
  }
  first = false;
}
onRender(render);

/* ---------- Sự kiện chung ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  const save = t.closest('[data-save]');
  if (save) {
    e.preventDefault();
    const on = toggleSave(save.dataset.save);
    document.querySelectorAll(`[data-save="${save.dataset.save}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', on);
      if (b.dataset.label) b.lastChild.textContent = on ? ' Đã lưu' : ' Lưu tin';
    });
    toast(on ? 'Đã lưu tin. Xem lại trong mục Đã lưu.' : 'Đã bỏ lưu tin.', 'bookmark');
    return;
  }
  if (t.closest('[data-quick]')) { e.preventDefault(); quickProfile(); return; }
  const ap = t.closest('[data-apply]');
  if (ap) { e.preventDefault(); applyJob(ap.dataset.apply); return; }
  const rp = t.closest('[data-report]');
  if (rp) { e.preventDefault(); reportJob(rp.dataset.report); return; }
  if (t.closest('[data-drawer]')) { $('#drawer').classList.add('open'); $('[data-drawer]').setAttribute('aria-expanded', 'true'); $('#drawer .x').focus(); return; }
  if (t.closest('[data-undrawer]') || t.closest('#drawer a')) { $('#drawer')?.classList.remove('open'); }
  const tt = t.closest('[data-toast]');
  if (tt) toast(tt.dataset.toast);
  const tr = t.closest('[data-track]');
  if (tr) api('/track', { method: 'POST', body: { jobId: Number(tr.dataset.job), type: tr.dataset.track } }).catch(() => {});
  if (t.closest('[data-logout]')) {
    e.preventDefault();
    api('/auth/logout', { method: 'POST' }).catch(() => {}).finally(() => {
      ['user', 'profile', 'applied'].forEach(store.del);
      toast('Đã đăng xuất.');
      go('/');
    });
  }
});
document.addEventListener('vlbv:esc', () => $('#drawer')?.classList.remove('open'));

// Phiên đăng nhập nằm trong cookie HttpOnly: hỏi máy chủ trước khi vẽ trang cần tài khoản,
// trang công khai vẽ ngay rồi cập nhật đầu trang khi có kết quả
const PRIVATE = /^\/(ung-vien|nha-tuyen-dung|dang-nhap)/;
if (PRIVATE.test(location.pathname)) syncMe().then(() => render());
else {
  render();
  const before = JSON.stringify(user());
  syncMe().then((u) => { if (JSON.stringify(u) !== before) render({ keepScroll: true }); });
}
