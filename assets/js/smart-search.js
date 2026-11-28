// Đọc hiểu câu tìm kiếm (nội bộ gọi là "smart search", KHÔNG hiển thị tên này trên website).
// Tách câu người dùng gõ thành bộ lọc: tỉnh/quận, mức lương, ca làm, loại mục tiêu, chế độ ăn ở, tuyển gấp.
// Phần chữ còn lại (tên công ty, tòa nhà, KCN…) mới đem so với nội dung tin.
// VD: "việc làm bảo vệ lương 8 triệu đồng nai" → { tinh: 'dong-nai', min: 8, rest: '' }
import { V, url } from './core.js';

// Bỏ dấu tiếng Việt để so khớp: "Bảo vệ Đồng Nai" → "bao ve dong nai"
export const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
// Mỗi chữ trong câu phải khớp với ĐẦU một chữ trong nội dung ("nu" khớp "nữ" nhưng không khớp "nước" ở giữa từ khác)
export const matchQ = (text, q) => { const t = ' ' + norm(text).replace(/[^a-z0-9]+/g, ' '); return norm(q).replace(/[^a-z0-9]+/g, ' ').trim().split(' ').every((w) => t.includes(' ' + w)); };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const word = (k) => new RegExp(`(^| )${esc(k).replace(/ /g, ' ?')}(?= |$)`); // "q 7" khớp cả "q7"

// Tên gọi khác của tỉnh/thành
const PROVINCE_ALIAS = {
  'tp-hcm': ['tphcm', 'tp hcm', 'hcm', 'ho chi minh', 'sai gon', 'sg', 'thanh pho ho chi minh'],
  'ha-noi': ['hn', 'thu do'],
  'binh-duong': ['bd']
};
// Loại mục tiêu (id trong V.targets) và cách người dùng hay gõ
const TARGET_WORDS = {
  'toa-nha': ['toa nha', 'chung cu', 'can ho', 'van phong', 'cao oc', 'khu do thi', 'trung tam thuong mai', 'tttm'],
  kcn: ['kcn', 'khu cong nghiep', 'nha may', 'nha xuong', 'xuong', 'khu che xuat', 'kcx', 'kho bai', 'kho hang', 'cong trinh'],
  'ngan-hang': ['ngan hang'],
  'truong-hoc': ['truong hoc', 'benh vien', 'truong mam non', 'truong'],
  'su-kien': ['su kien', 'hoi cho', 'trien lam', 'concert'],
  've-si': ['ve si', 'bodyguard', 'bao ve yeu nhan']
};
const SHIFT_WORDS = {
  dem: ['ca dem', 'truc dem', 'lam dem', 'ban dem', 'dem'],
  '12h': ['ca 12 tieng', 'ca 12h', 'ca 12', '12 tieng', '12h', '12 gio'],
  '8h': ['ca 8 tieng', 'ca 8h', 'ca 8', '8 tieng', '8h', '8 gio', 'hanh chinh', 'gio hanh chinh'],
  '24h': ['truc 24h', 'truc 24 tieng', 'ca 24h', '24 tieng', '24h', '24 24'],
  gay: ['ca gay']
};
const PERK_WORDS = [
  [['bao an o', 'bao an bao o', 'bao an va o', 'bao com bao o', 'an o mien phi'], ['o', 'an']],
  [['bao o', 'co cho o', 'cho o', 'ky tuc xa', 'ktx', 'o lai', 'nha o'], ['o']],
  [['bao an', 'bao com', 'com trua', 'an ca', 'bua an'], ['an']]
];
const URGENT_WORDS = ['tuyen gap', 'can gap', 'gap', 'di lam ngay', 'nhan viec ngay', 'lam ngay'];
// Chữ tin nào cũng có, bỏ qua khi so nội dung
const STOP = new Set(('viec lam tim kiem tuyen dung can nhan vien nv bao ve bv an ninh security luong muc thu nhap tai o khu vuc gan '
  + 'cho va co cac moi nhat thang trieu tr cu dong vnd nguoi nam can ve tu hon').split(' '));

// Danh sách địa danh (dài trước để "nam tu liem" không bị "nam" ăn mất)
let PLACES = null;
function places() {
  if (PLACES) return PLACES;
  const out = [];
  V.provinces.forEach((p) => {
    [p.name, p.short, p.slug.replace(/-/g, ' '), ...(PROVINCE_ALIAS[p.slug] || [])]
      .forEach((k) => out.push({ k: norm(k).replace(/[.]/g, ' ').replace(/\s+/g, ' ').trim(), tinh: p.slug }));
    p.districts.forEach((d) => {
      const base = norm(d.replace(/\(.*?\)/g, ''));
      const keys = [base, base.replace(/^(tp|thanh pho|tx|thi xa|huyen) /, '')];
      const m = base.match(/^quan (\d+)$/);
      if (m) keys.push(`q ${m[1]}`, `q${m[1]}`, `quan${m[1]}`);
      keys.forEach((k) => k.length > 2 && out.push({ k, tinh: p.slug, quan: d }));
    });
  });
  PLACES = out.sort((a, b) => b.k.length - a.k.length);
  return PLACES;
}

const num = (s) => Number(String(s).replace(',', '.'));
// Lương ghi kiểu 8.000.000 / 8000000 → 8 (triệu)
const millions = (s) => { const n = Number(String(s).replace(/[.,\s]/g, '')); return n >= 100000 ? n / 1e6 : num(s); };

export function parseQuery(q) {
  let t = ' ' + norm(q).replace(/[.,;:!?"'()]+(?=\s|$)/g, ' ').replace(/(\d)\s*-\s*(\d)/g, '$1-$2').replace(/\s+/g, ' ').trim() + ' ';
  const f = { tinh: '', quan: '', min: 0, max: 0, ca: [], mt: [], cd: [], gap: false, rest: '' };
  const take = (re, fn) => { t = t.replace(re, (...m) => { fn(m); return ' '; }); };
  const takeWords = (list, fn) => list.forEach((k) => { const re = word(k); if (re.test(t.trim())) { t = ' ' + t.trim().replace(re, ' ') + ' '; fn(); } });

  // 1. Ca làm trước (để "ca 8 tiếng" không bị hiểu là lương 8 triệu)
  Object.entries(SHIFT_WORDS).forEach(([id, ws]) => takeWords(ws, () => { if (!f.ca.includes(id)) f.ca.push(id); }));
  // 2. Lương: khoảng "7-9 triệu", "từ 8 đến 10tr", "trên 10 triệu", "dưới 8tr", "8 triệu", "lương 8", "8.000.000"
  const U = '(?:trieu|tr|cu|m)\\b';
  const N = '(\\d+(?:[.,]\\d+)?)';
  take(new RegExp(`(?:(?<= )tu )?${N} ?(?:-|den|toi|~) ?${N} ?${U}`, 'g'), (m) => { f.min = num(m[1]); f.max = num(m[2]); });
  take(new RegExp(`(?<= )(?:tren|tu|hon|it nhat|toi thieu|>=?) ?${N} ?(?:${U})?`, 'g'), (m) => { if (num(m[1]) < 100) f.min = num(m[1]); });
  take(new RegExp(`(?<= )(?:duoi|toi da|khong qua|<=?) ?${N} ?(?:${U})?`, 'g'), (m) => { if (num(m[1]) < 100) f.max = num(m[1]); });
  take(new RegExp(`${N} ?${U}`, 'g'), (m) => { f.min = num(m[1]); });
  take(/luong (\d+(?:[.,]\d+)?)(?= )/g, (m) => { if (num(m[1]) < 100) f.min = num(m[1]); });
  take(/(\d{1,3}(?:[.,]\d{3}){2}|\d{7,9})(?: ?(?:d|vnd|dong))?/g, (m) => { f.min = millions(m[1]); });
  // 3. Chế độ, tuyển gấp, loại mục tiêu
  PERK_WORDS.forEach(([ws, cds]) => takeWords(ws, () => cds.forEach((c) => !f.cd.includes(c) && f.cd.push(c))));
  takeWords(URGENT_WORDS, () => { f.gap = true; });
  Object.entries(TARGET_WORDS).forEach(([id, ws]) => takeWords(ws, () => { if (!f.mt.includes(id) && V.targets.some((x) => x.id === id)) f.mt.push(id); }));
  // 4. Địa danh: quận/huyện kéo theo tỉnh; chỉ lấy 1 nơi (nơi dài/cụ thể nhất)
  for (const p of places()) {
    const re = word(p.k);
    if (!re.test(t.trim())) continue;
    if (f.tinh && f.tinh !== p.tinh) continue;
    t = ' ' + t.trim().replace(re, ' ') + ' ';
    f.tinh = p.tinh;
    if (p.quan && !f.quan) f.quan = p.quan;
  }
  // 5. Phần còn lại, bỏ chữ chung chung
  takeWords(['cong ty', 'doanh nghiep', 'dich vu'], () => {});
  f.rest = t.trim().split(' ').filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)).join(' ');
  return f;
}

// Câu tìm có hiểu được bộ lọc nào không
export const hasFilters = (f) => !!(f.tinh || f.min || f.max || f.ca.length || f.mt.length || f.cd.length || f.gap);

// Gộp bộ lọc hiểu được từ câu tìm vào bộ lọc đang chọn. Nơi chốn trong câu được ưu tiên (ý người dùng mới nhất).
export function mergeFilters(s, f) {
  const uni = (a, b) => [...new Set([...a, ...b])];
  return {
    ...s,
    tinh: f.tinh || s.tinh,
    quan: f.tinh ? f.quan : s.quan,
    min: f.min || s.min || 0,
    max: f.max || s.max || 0,
    ca: uni(s.ca || [], f.ca), mt: uni(s.mt || [], f.mt), cd: uni(s.cd || [], f.cd),
    gap: s.gap || f.gap,
    q: f.rest
  };
}

// Đường dẫn trang danh sách cho bộ lọc (cùng dạng với trang /viec-lam-bao-ve)
export function filterHref(s, page = 1) {
  const q = new URLSearchParams();
  if (s.q) q.set('q', s.q);
  if (s.luong) q.set('luong', s.luong);
  if (s.min) q.set('luong-tu', String(s.min));
  if (s.max) q.set('luong-den', String(s.max));
  if (s.ca?.length) q.set('ca', s.ca.join(','));
  if (s.mt?.length) q.set('muc-tieu', s.mt.join(','));
  if (s.cd?.length) q.set('che-do', s.cd.join(','));
  if (s.gap) q.set('gap', '1');
  if (s.sx && s.sx !== 'moi') q.set('sap-xep', s.sx);
  if (page > 1) q.set('trang', page);
  const qs = q.toString().replace(/%2C/g, ',');
  return url.area(s.tinh, s.quan) + (qs ? '?' + qs : '');
}

const tr = (n) => String(n).replace('.', ',');
export const payLabel = (min, max) => (min && max ? (min === max ? `Lương ${tr(min)} triệu` : `Lương ${tr(min)} - ${tr(max)} triệu`) : min ? `Lương từ ${tr(min)} triệu` : max ? `Lương đến ${tr(max)} triệu` : '');

// Mô tả ngắn bộ lọc, dùng cho dòng gợi ý trong ô tìm kiếm
export function describe(f) {
  const p = V.provinces.find((x) => x.slug === f.tinh);
  return [
    f.quan ? `${f.quan}, ${p?.short || ''}` : p?.name,
    payLabel(f.min, f.max),
    ...f.ca.map((id) => V.shifts.find((x) => x.id === id)?.name),
    ...f.mt.map((id) => V.targets.find((x) => x.id === id)?.name),
    f.cd.includes('o') && f.cd.includes('an') ? 'Bao ăn ở' : f.cd.includes('o') ? 'Có chỗ ở' : f.cd.includes('an') ? 'Bao ăn' : '',
    f.gap ? 'Tuyển gấp' : '',
    f.rest ? `"${f.rest}"` : ''
  ].filter(Boolean);
}
