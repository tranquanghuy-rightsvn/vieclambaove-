// Hàm dùng chung cho mọi trang
export const V = window.VLBV;

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Tên miền lấy theo trang đang chạy (workers.dev hoặc tên miền thật khi gắn sau)
export const SITE = location.origin;
export const company = (id) => V.companies.find((c) => c.id === id);
export const province = (s) => V.provinces.find((p) => p.slug === s);
export const shift = (id) => V.shifts.find((s) => s.id === id) || { id: '', name: 'Ca theo thỏa thuận' };
export const target = (id) => V.targets.find((t) => t.id === id);
export const districtBySlug = (p, ds) => p?.districts.find((d) => slug(d) === ds);
// Tách "<quận>-<tỉnh>" (vd "hai-chau-da-nang") thành [mã tỉnh, tên quận]; không khớp trả null
export function splitArea(seg) {
  for (const p of V.provinces || []) {
    if (!seg.endsWith('-' + p.slug)) continue;
    const d = districtBySlug(p, seg.slice(0, -(p.slug.length + 1)));
    if (d) return [p.slug, d];
  }
  return null;
}

/* ---------- Gọi API của Worker ---------- */
export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch('/api' + path, {
      method, credentials: 'same-origin',
      headers: body !== undefined && !(body instanceof FormData) ? { 'content-type': 'application/json' } : {},
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body)
    });
  } catch {
    throw new Error('Mất kết nối mạng, vui lòng thử lại.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && store.get('user')) store.del('user');
    const err = new Error(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Nút đang gửi: khoá + đổi chữ, trả về hàm khôi phục
export function busy(btn, label = 'Đang gửi…') {
  if (!btn) return () => {};
  const old = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = label;
  return () => { btn.disabled = false; btn.innerHTML = old; };
}

/* ---------- Lưu trữ cục bộ trong trình duyệt ---------- */
export const store = {
  get(k, d = null) { try { const v = localStorage.getItem('vlbv2_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { localStorage.setItem('vlbv2_' + k, JSON.stringify(v)); },
  del(k) { localStorage.removeItem('vlbv2_' + k); }
};
export const user = () => store.get('user');

// Đồng bộ phiên đăng nhập từ máy chủ (cookie HttpOnly) về bộ nhớ trình duyệt
export async function syncMe() {
  try {
    const r = await api('/me');
    if (r.user) {
      store.set('user', r.user);
      if (r.user.role === 'candidate') {
        // Gộp tin đã lưu trên máy này vào tài khoản
        const local = store.get('saved', []).filter((id) => !r.saved.includes(id));
        if (local.length) api('/saved', { method: 'POST', body: { ids: local } }).catch(() => {});
        store.set('saved', [...local, ...r.saved]);
        if (r.profile) store.set('profile', r.profile);
      }
    } else if (store.get('user')) {
      store.del('user');
      store.del('profile');
    }
  } catch { /* mất mạng: giữ trạng thái cũ */ }
  return user();
}

/* Tin công khai lấy từ file dữ liệu tĩnh /data/site.js (Worker sinh lại mỗi khi có thay đổi) */
export const allJobs = () => V.jobs || [];
export const job = (id) => allJobs().find((j) => j.id === Number(id));
export const isExpired = (j) => j.daysLeft < 0;
export const activeJobs = () => allJobs().filter((j) => !isExpired(j));

/* ---------- Định dạng ---------- */
export const num = (n) => Number(n).toLocaleString('vi-VN');
export const money = (n) => (n === 0 ? '0đ' : num(n) + 'đ');
const tr = (n) => String(n).replace('.', ',');
export const pay = (j) => (j.salaryMin === j.salaryMax ? tr(j.salaryMin) : `${tr(j.salaryMin)}-${tr(j.salaryMax)}`);
export const ago = (d) => (d <= 0 ? 'Hôm nay' : d === 1 ? 'Hôm qua' : `${d} ngày trước`);
export const dateIn = (days) => { const t = new Date(); t.setDate(t.getDate() + days); return t.toLocaleDateString('vi-VN'); };

/* ---------- URL sạch ---------- */
export const url = {
  job: (j) => `/tin/${slug(j.title)}-${j.id}`,
  // Khu vực 1 cấp: /viec-lam/<tỉnh> và /viec-lam/<quận>-<tỉnh> (vd /viec-lam/hai-chau-da-nang)
  area: (p, d) => '/viec-lam' + (p ? '/' + (d ? slug(d) + '-' : '') + p : ''),
  company: (c) => `/cong-ty/${c.id}`,
  post: (p) => `/tin-tuc/${p.id}`
};

/* ---------- Icon (nét mảnh, tự vẽ) ---------- */
const P = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  meal: '<path d="M7 3v8a2 2 0 0 0 2 2v8M11 3v8a2 2 0 0 1-2 2M17 3c-2 2-2 6 0 8v10"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  flag: '<path d="M5 21V4h11l-1.5 4L16 12H5"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.6 3.5-5.5 6.5-5.5s5.5 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.5 3.5 5.2"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M7 15h4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  ruler: '<path d="M4 17 17 4l3 3L7 20z"/><path d="m8 13 2 2M11 10l2 2M14 7l2 2"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  send: '<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m10 13.5 4-4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5M20 20v-4h-4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  factory: '<path d="M3 21V10l6 4v-4l6 4V5h4l2 16zM3 21h18M7 17h2M12 17h2M17 17h1"/>',
  bank: '<path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18M3 18h18"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  school: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.2c-.5-.8-1.4-1.2-2.6-1.2-1.5 0-2.5.8-2.5 1.9 0 2.6 5.2 1.4 5.2 4.1 0 1.1-1.1 2-2.7 2-1.2 0-2.2-.5-2.7-1.4M12 6.5V8M12 16v1.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.6 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3.1 4.2 6.3C19.5 15.4 12 20 12 20z"/>',
  building: '<path d="M4 21V5l8-2v18M12 8h8v13M2 21h20M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2H4z"/><path d="M12 5v16"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/>',
  google: '<path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5a4.3 4.3 0 0 1-1.9 2.8v2.3h3A9 9 0 0 0 21 12.2z"/><path d="M12 21c2.5 0 4.6-.8 6.1-2.3l-3-2.3c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H3.8v2.4A9 9 0 0 0 12 21z"/><path d="M6.9 13.5a5.4 5.4 0 0 1 0-3.4V7.7H3.8a9 9 0 0 0 0 8.2z"/><path d="M12 6.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 3.8 7.7l3.1 2.4C7.6 8.1 9.6 6.6 12 6.6z"/>'
};
export const icon = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

export const mono = (c, cls = '') => c.logo
  ? `<span class="mono mono-img ${cls}" aria-hidden="true"><img src="${c.logo}" alt="" loading="lazy"></span>`
  : `<span class="mono ${cls}" style="background:${c.color}" aria-hidden="true">${c.initials}</span>`;

// Ảnh đại diện của tin: ảnh đầu tiên NTD tải lên, không có thì logo công ty
const jobThumb = (j, c) => (j.images && j.images[0]
  ? `<span class="mono mono-img mono-photo" aria-hidden="true"><img src="${esc(j.images[0])}" alt="" loading="lazy"></span>`
  : mono(c));

/* ---------- Ảnh: nén phía trình duyệt trước khi tải lên (cạnh dài ≤ max, JPEG) ---------- */
export function resizeImage(file, max = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error('Chỉ nhận ảnh JPG, PNG hoặc WEBP.')); return; }
    const img = new Image();
    const src = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); // nền trắng cho logo PNG trong suốt
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(src);
      cv.toBlob((b) => (b ? resolve(b) : reject(new Error('Không xử lý được ảnh.'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Không đọc được ảnh.')); };
    img.src = src;
  });
}
export async function uploadImage(path, file) {
  const fd = new FormData();
  fd.append('file', await resizeImage(file), 'anh.jpg');
  return api(path, { method: 'POST', body: fd });
}

// Giống quy tắc máy chủ: không cho chèn link vào nội dung công khai (email, SĐT vẫn được)
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]{0,62}\.(com|vn|net|org|info|biz|me|io|co|xyz|top|online|site|store|shop|link|ly|app|page|asia|club|live|pro|tv|cc|ws|to|gl|gg)\b(\.vn)?(\/|\b))/i;
export const hasLink = (t) => LINK_RE.test(String(t ?? '').replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, ' '));

/* ---------- Dòng tin tuyển dụng ---------- */
export const isSaved = (id) => store.get('saved', []).includes(Number(id));
export function toggleSave(id) {
  id = Number(id);
  const s = store.get('saved', []);
  const i = s.indexOf(id);
  i > -1 ? s.splice(i, 1) : s.unshift(id);
  store.set('saved', s);
  if (user()?.role === 'candidate') api('/saved', { method: 'POST', body: { jobId: id, on: i === -1 } }).catch(() => {});
  return i === -1;
}

function jobBits(j) {
  const c = company(j.company);
  const p = province(j.province);
  const off = isExpired(j);
  const tags = off ? '<span class="tag tag-off">Hết hạn</span>'
    : (j.tier === "vip" ? '<span class="tag tag-vip">VIP</span>' : "") + (j.urgent ? '<span class="tag tag-urgent">' + icon("bolt") + 'Tuyển gấp</span>' : "");
  const tick = c.verified ? '<span class="vtick" title="Công ty đã xác thực giấy phép">' + icon("check") + "</span>" : "";
  const save = '<button class="savebtn" type="button" data-save="' + j.id + '" aria-pressed="' + isSaved(j.id) + '" aria-label="Lưu tin">' + icon("heart") + "</button>";
  const left = off ? "Đã hết hạn" : j.daysLeft <= 3 ? '<b class="soon">Còn ' + j.daysLeft + " ngày</b>" : "Còn " + j.daysLeft + " ngày";
  return { c, p, off, tags, tick, save, left };
}

/* Thẻ dạng lưới (trang chủ) */
export function jobCard(j) {
  const { c, p, off, tags, tick, save } = jobBits(j);
  return `<article class="jcard${j.tier === "vip" && !off ? " is-vip" : ""}">
    <a class="jc-logo" href="${url.job(j)}" tabindex="-1" aria-hidden="true">${jobThumb(j, c)}</a>
    <div class="jc-body">
      ${tags ? `<p class="jc-tags">${tags}</p>` : ""}
      <h3><a href="${url.job(j)}" title="${esc(j.title)}">${esc(j.title)}</a></h3>
      <p class="jc-co">${esc(c.name)}${tick}</p>
      <p class="jc-pay">${pay(j)} triệu/tháng</p>
      <p class="jc-loc">${icon("pin", "ico-s")}${esc(j.district)}, ${esc(p.short)}</p>
    </div>
    <div class="jc-foot">
      <span>${ago(j.posted)} · ${num(j.calls || 0)} lượt gọi</span>
      ${save}
    </div>
  </article>`;
}

/* Dòng tin dạng danh sách (trang việc làm, công ty) */
export function jobRow(j) {
  const { c, p, off, tags, tick, save, left } = jobBits(j);
  return `<article class="jrow${j.tier === "vip" && !off ? " is-vip" : ""}${off ? " is-off" : ""}">
    <a class="jr-logo" href="${url.job(j)}" tabindex="-1" aria-hidden="true">${jobThumb(j, c)}</a>
    <div class="jr-body">
      ${tags ? `<p class="jr-tags">${tags}</p>` : ""}
      <h3><a href="${url.job(j)}">${esc(j.title)}</a></h3>
      <p class="jr-co">${esc(c.name)}${tick}</p>
      <ul class="jr-facts">
        <li class="jr-pay">${icon("money", "ico-s")}${pay(j)} triệu</li>
        <li>${icon("pin", "ico-s")}${esc(j.district)}, ${esc(p.short)}</li>
        <li>${icon("clock", "ico-s")}${left}</li>
      </ul>
      <p class="jr-chips">
        <span class="chip">${esc(target(j.target).name)}</span>
        <span class="chip">${esc(shift(j.shift).name)}</span>
        ${j.housing ? '<span class="chip chip-ok">Bao ở</span>' : ""}${j.meals ? '<span class="chip chip-ok">Bao ăn</span>' : ""}
        ${j.source ? '<span class="chip chip-src" title="Tin tổng hợp từ nguồn công khai">Tin tổng hợp</span>' : ""}
      </p>
    </div>
    <div class="jr-act">
      ${off ? "" : `<button class="btn btn-primary jr-apply" type="button" data-apply="${j.id}">${icon("bolt")}Ứng tuyển nhanh</button>`}
      ${save}
    </div>
  </article>`;
}

/* ---------- Toast, modal ---------- */
export function toast(msg, ic = 'check') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = icon(ic) + `<span>${esc(msg)}</span>`;
  box.append(t);
  setTimeout(() => t.remove(), 3200);
}

let lastFocus = null;
export function modal(html) {
  closeModal();
  lastFocus = document.activeElement;
  const m = document.createElement('div');
  m.className = 'modal';
  m.innerHTML = `<div class="modal-bg" data-close></div><div class="modal-box" role="dialog" aria-modal="true"><button class="modal-x" type="button" data-close aria-label="Đóng">${icon('x')}</button>${html}</div>`;
  document.body.append(m);
  m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  (m.querySelector('input, select, textarea, .btn') || m.querySelector('.modal-x')).focus();
  return m.querySelector('.modal-box');
}
export function closeModal() {
  const m = $('.modal');
  if (m) { m.remove(); lastFocus?.focus?.(); }
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); document.dispatchEvent(new Event('vlbv:esc')); } });

/* ---------- Hành động dùng chung: ứng tuyển, báo cáo ---------- */
export function applyJob(id) {
  const j = job(id);
  if (!j) { toast('Tin này đã hết hạn.', 'alert'); return; }
  const u = user();
  const p = store.get('profile', {});
  const me = u?.role === 'candidate';
  const box = modal(`<h2>Ứng tuyển nhanh</h2><p>${esc(j.title)}</p>
    <form class="stack" id="applyForm">
      <label class="field"><span>Họ và tên</span><input class="input" name="name" required autocomplete="name" value="${esc(p.name || (me ? u.name : '') || '')}"></label>
      <label class="field"><span>Số điện thoại / Zalo</span><input class="input" name="phone" required inputmode="tel" autocomplete="tel" placeholder="09xx xxx xxx" value="${esc(me ? u.phone : p.phone || '')}" ${me ? 'readonly' : ''}></label>
      <div class="grid2">
        <label class="field"><span>Năm sinh</span><input class="input" name="year" inputmode="numeric" maxlength="4" placeholder="1990" value="${esc(p.year || '')}"></label>
        <label class="field"><span>Chiều cao</span><input class="input" name="height" placeholder="1m68" value="${esc(p.height || '')}"></label>
      </div>
      <p class="mute" style="margin:0;font-size:14px">Nhà tuyển dụng sẽ gọi lại cho bạn. Không công ty nào được thu phí khi nhận hồ sơ.</p>
      <button class="btn btn-primary btn-l" type="submit">Gửi hồ sơ</button>
    </form>`);
  box.querySelector('#applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const done = busy(e.submitter);
    try {
      const r = await api('/apply', { method: 'POST', body: { jobId: j.id, ...f } });
      const list = store.get('applied', []);
      if (!list.find((a) => a.id === j.id)) list.unshift({ id: j.id, at: new Date().toLocaleDateString('vi-VN') });
      store.set('applied', list);
      if (!me) store.set('profile', { ...p, name: f.name, phone: f.phone, year: f.year, height: f.height });
      closeModal();
      toast(r.duplicate ? 'Bạn đã ứng tuyển tin này trước đó.' : 'Đã gửi hồ sơ. Công ty thường gọi lại trong 24 giờ.');
    } catch (err) { done(); toast(err.message, 'alert'); }
  });
}

export function reportJob(id) {
  const reasons = ['Thu phí đồng phục, phí giữ chỗ', 'Yêu cầu đặt cọc giấy tờ gốc', 'Lương thực tế khác tin đăng', 'Không liên lạc được', 'Tin trùng lặp, sai thông tin', 'Lý do khác'];
  const box = modal(`<h2>Báo cáo tin này</h2><p>Đội kiểm duyệt xem xét trong 24 giờ. Danh tính người báo cáo được giữ kín.</p>
    <form class="stack" id="repForm">
      <div>${reasons.map((r, i) => `<label class="check"><input type="radio" name="r" value="${i}" ${i === 0 ? 'checked' : ''}>${r}</label>`).join('')}</div>
      <label class="field"><span>Mô tả thêm (không bắt buộc)</span><textarea class="textarea" name="note" rows="3"></textarea></label>
      <button class="btn btn-primary" type="submit">Gửi báo cáo</button>
    </form>`);
  box.querySelector('#repForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const done = busy(e.submitter);
    try {
      await api('/report', { method: 'POST', body: { jobId: Number(id), reason: reasons[e.target.r.value], note: e.target.note.value } });
      closeModal();
      toast('Cảm ơn bạn. Báo cáo đã được ghi nhận.');
    } catch (err) { done(); toast(err.message, 'alert'); }
  });
}

/* Giao diện tab trong trang quản trị/khu vực cá nhân */
export function deskNav(base, items, active, who) {
  return `<aside class="desk-nav">
    ${who ? `<div class="desk-who">${who}</div>` : ''}
    <nav aria-label="Mục">${items.map(([k, label, ic, badge]) => `<a href="${base}${k ? '/' + k : ''}" class="${k === active ? 'on' : ''}"${k === active ? ' aria-current="page"' : ''}>${icon(ic)}${label}${badge ? `<em>${badge}</em>` : ''}</a>`).join('')}<a href="#" class="desk-logout" data-logout>${icon('logout')}Đăng xuất</a></nav>
  </aside>`;
}

export const crumbs = (items) => `<ol class="crumbs">${items.map(([t, h]) => `<li>${h ? `<a href="${h}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`}</li>`).join('')}</ol>`;

/* ---------- Tạo hồ sơ xin việc nhanh: ít gõ, chọn là xong ---------- */
const QUICK_EXP = ['Xuất ngũ', 'Công an nghĩa vụ', 'Chứng chỉ PCCC', 'Võ thuật', 'Chưa có kinh nghiệm'];
export function quickProfile() {
  const u = user();
  if (u?.role === 'employer') { toast('Bạn đang đăng nhập tài khoản nhà tuyển dụng.', 'alert'); return; }
  const me = u?.role === 'candidate';
  const p = store.get('profile', {});
  const box = modal(`<h2>Tạo hồ sơ xin việc nhanh</h2>
    <p>Chỉ cần tên và số điện thoại. Nhà tuyển dụng bảo vệ gần bạn sẽ tìm thấy hồ sơ và gọi hoặc nhắn Zalo.</p>
    <form class="stack" id="quickForm">
      <label class="field"><span>Họ và tên</span><input class="input" name="name" required autocomplete="name" value="${esc(p.name || u?.name || '')}"></label>
      <label class="field"><span>Số điện thoại / Zalo</span><input class="input" name="phone" required inputmode="tel" autocomplete="tel" pattern="[0-9 .+]{9,13}" placeholder="09xx xxx xxx" value="${esc(me ? u.phone : p.phone || '')}" ${me ? 'readonly' : ''}></label>
      <div class="grid2">
        <label class="field"><span>Năm sinh</span><input class="input" name="year" inputmode="numeric" maxlength="4" placeholder="1995" value="${esc(p.year || '')}"></label>
        <label class="field"><span>Muốn làm ở</span><select class="select" name="area">${V.provinces.map((x) => `<option value="${x.slug}" ${p.area === x.slug ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
      </div>
      <div class="field"><span>Kinh nghiệm (chọn nếu có)</span>
        <div class="pills">${QUICK_EXP.map((e) => `<label class="pill"><input type="checkbox" name="exp" value="${e}" ${(p.exp || []).includes(e) ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div>
      </div>
      <label class="check consent"><input type="checkbox" name="share" required ${p.share ? 'checked' : ''}><span>Tôi đồng ý cho <b>nhà tuyển dụng trên website</b> xem hồ sơ này và gọi/nhắn Zalo cho tôi. Có thể tắt bất cứ lúc nào trong trang hồ sơ.</span></label>
      <button class="btn btn-quick btn-l btn-block" type="submit">Gửi hồ sơ - nhận cuộc gọi tuyển dụng</button>
      <p class="mute" style="margin:0;font-size:13.5px">Miễn phí hoàn toàn. Không công ty nào được thu phí đồng phục hay đặt cọc.${me ? '' : ' Muốn xem lại và sửa hồ sơ? <a href="/dang-nhap?dang-ky=1">Tạo tài khoản</a> bằng chính số điện thoại này.'}</p>
    </form>`);
  box.querySelector('#quickForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const done = busy(e.submitter);
    try {
      const r = await api('/profile', { method: 'POST', body: { ...Object.fromEntries(f), exp: f.getAll('exp'), share: !!f.get('share') } });
      store.set('profile', r.profile);
      closeModal();
      toast('Đã gửi hồ sơ. Nhà tuyển dụng sẽ liên hệ bạn sớm.');
    } catch (err) { done(); toast(err.message, 'alert'); }
  });
}
