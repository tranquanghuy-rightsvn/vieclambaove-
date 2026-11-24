// Điểm vào: khai báo tuyến, vẽ khung trang, xử lý sự kiện chung
import { $, icon, esc, user, store, toggleSave, applyJob, reportJob, quickProfile, toast, SITE, api, syncMe } from './core.js';
import { onRender, clean, go } from './router.js';
import { match, headerHtml, footerHtml, notFoundPage, docTitle, DEFAULT_DESC, slashLinks, withSlash } from './layout.js';

function setMeta(name, content, attr = 'name') {
  let m = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!content) { m?.remove(); return; }
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, name); document.head.append(m); }
  m.content = content;
}

const notFound = async () => ({ default: notFoundPage });

const main = $('#main');
let first = true;
async function render({ keepScroll = false } = {}) {
  const want = clean(location.href);
  if (want !== location.pathname + location.search + location.hash) history.replaceState({}, '', want);
  // Trang nhận đường dẫn KHÔNG có / cuối (so sánh nội bộ); URL trên thanh địa chỉ luôn có / cuối
  const path = location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : '/';
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
  main.innerHTML = slashLinks(page.html);
  document.title = docTitle(page);
  setMeta('description', page.desc || DEFAULT_DESC);
  setMeta('robots', page.noindex ? 'noindex, follow' : '');
  setMeta('og:title', document.title, 'property');
  document.head.querySelector('link[rel=canonical]').href = SITE + withSlash(page.canonical || path);
  document.head.querySelectorAll('script[data-ld]').forEach((s) => s.remove());
  [].concat(page.ld || []).forEach((obj) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.dataset.ld = ''; s.textContent = JSON.stringify(obj);
    document.head.append(s);
  });
  document.body.classList.toggle('has-mbar', !!page.mbar);
  document.body.classList.toggle('has-tabbar', page.tabbar !== false);

  $('#header').innerHTML = slashLinks(headerHtml(page.nav));
  $('#footer').innerHTML = slashLinks(footerHtml(path));
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
