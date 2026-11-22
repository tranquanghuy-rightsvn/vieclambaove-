// Bộ định tuyến History API: URL sạch, không đuôi .html
const routes = [];
let render = null;

export const route = (pattern, load) => routes.push({ pattern, load });
export const onRender = (fn) => { render = fn; };

export function match(path) {
  for (const r of routes) {
    const m = path.match(r.pattern);
    if (m) return { load: r.load, params: m.slice(1).map((x) => (x ? decodeURIComponent(x) : x)) };
  }
  return null;
}

// Chuẩn hóa URL: bỏ .html, bỏ index, bỏ dấu / cuối
const LEGACY = { 'chi-tiet': '/viec-lam', 'bai-viet': '/tin-tuc' };
export function clean(href) {
  const u = new URL(href, location.origin);
  let p = u.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  // "Cẩm nang" đã đổi thành "Tin tức": link cũ /cam-nang chuyển sang /tin-tuc
  if (/^\/cam-nang(\/|$)/.test(p)) p = p.replace(/^\/cam-nang/, '/tin-tuc');
  const id = u.searchParams.get('id');
  const seg = p.slice(1);
  if (LEGACY[seg] && id) { u.searchParams.delete('id'); p = seg === 'chi-tiet' ? `/tin/tin-${id}` : `/tin-tuc/${id}`; }
  else if (seg === 'cong-ty' && id) { u.searchParams.delete('id'); p = `/cong-ty/${id}`; }
  return p + (u.search === '?' ? '' : u.search) + u.hash;
}

export function go(href, { replace = false, keepScroll = false } = {}) {
  const next = clean(href);
  const cur = location.pathname + location.search + location.hash;
  if (next !== cur) history[replace ? 'replaceState' : 'pushState']({}, '', next);
  render?.({ keepScroll });
}

// Bắt mọi liên kết nội bộ
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target && a.target !== '_self') return;
  if (a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/assets/')) return;
  const u = new URL(href, location.origin);
  // Chỉ đổi #hash trong cùng trang
  if (u.pathname === location.pathname && u.search === location.search && u.hash) return;
  e.preventDefault();
  go(href);
});
window.addEventListener('popstate', () => render?.({ keepScroll: false, pop: true }));
