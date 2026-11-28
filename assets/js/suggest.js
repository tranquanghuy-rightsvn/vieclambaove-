// Ô tìm kiếm có gợi ý (tham khảo vieclam24h): bấm vào ô → tìm kiếm gần đây + từ khóa phổ biến + "Tìm việc gần tôi";
// gõ chữ → gợi ý chủ đề, khu vực, công ty, tin tuyển dụng (gõ không dấu vẫn ra). Dùng cho trang chủ và trang danh sách việc làm.
import { V, esc, icon, url, store, activeJobs } from './core.js';
import { TOPICS, topicPath, topicJobs } from './topics.js';
import { go } from './router.js';

// Bỏ dấu tiếng Việt để so khớp: "Bảo vệ Đồng Nai" → "bao ve dong nai"
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\s+/g, ' ').trim();
export const matchQ = (text, q) => { const t = norm(text); return norm(q).split(' ').every((w) => t.includes(w)); };

const RECENT = 'recentSearch';
export const saveRecent = (q) => {
  q = String(q || '').trim();
  if (q) store.set(RECENT, [q, ...store.get(RECENT, []).filter((x) => norm(x) !== norm(q))].slice(0, 6));
};

// Tâm các tỉnh/thành (vĩ độ, kinh độ) để tìm khu vực gần nhất theo vị trí người dùng
const GEO = {
  'tp-hcm': [10.78, 106.7], 'ha-noi': [21.03, 105.85], 'binh-duong': [11.0, 106.65], 'dong-nai': [10.95, 106.82], 'bac-ninh': [21.18, 106.07],
  'da-nang': [16.05, 108.2], 'hai-phong': [20.85, 106.68], 'long-an': [10.54, 106.41], 'ba-ria-vung-tau': [10.41, 107.14], 'can-tho': [10.03, 105.78],
  'khanh-hoa': [12.24, 109.19], 'hung-yen': [20.65, 106.05], 'hai-duong': [20.94, 106.33], 'thai-nguyen': [21.59, 105.85], 'quang-ninh': [20.95, 107.08],
  'tay-ninh': [11.31, 106.1], 'vinh-phuc': [21.31, 105.6], 'bac-giang': [21.27, 106.19], 'nghe-an': [18.68, 105.68], 'thanh-hoa': [19.81, 105.78]
};
const nearestProvince = (lat, lng) => V.provinces.filter((p) => GEO[p.slug])
  .map((p) => ({ p, d: (GEO[p.slug][0] - lat) ** 2 + ((GEO[p.slug][1] - lng) * Math.cos(lat * Math.PI / 180)) ** 2 }))
  .sort((a, b) => a.d - b.d)[0]?.p;

function suggestions(q) {
  const jobs = activeJobs();
  const out = [];
  TOPICS.forEach((t) => { if (matchQ(`việc làm ${t.name} ${t.short}`, q) && topicJobs(t).length) out.push(['sparkle', `Việc làm ${t.name}`, topicPath(t), 'Chủ đề']); });
  V.provinces.forEach((p) => {
    if (matchQ(`việc làm bảo vệ ${p.name} ${p.short}`, q)) out.push(['pin', `Việc làm bảo vệ tại ${p.name}`, url.area(p.slug), 'Khu vực']);
    p.districts.forEach((d) => { if (matchQ(`${d} ${p.short}`, q)) out.push(['pin', `Bảo vệ ${d}, ${p.short}`, url.area(p.slug, d), 'Khu vực']); });
  });
  V.companies.forEach((c) => { if (matchQ(c.name, q) && jobs.some((j) => j.company === c.id)) out.push(['building', c.name, url.company(c), 'Công ty']); });
  const head = out.slice(0, 6);
  jobs.filter((j) => matchQ(`${j.title} ${j.district}`, q)).slice(0, 8 - head.length).forEach((j) => head.push(['file', j.title, url.job(j), 'Tin tuyển dụng']));
  return head;
}

export function attachSuggest(form) {
  const input = form.querySelector('input[name="q"]');
  const box = input.closest('label');
  box.classList.add('sg-host');
  const dd = document.createElement('div');
  dd.className = 'sg';
  dd.hidden = true;
  dd.setAttribute('role', 'listbox');
  document.body.append(dd); // gắn vào body để không bị khối khác (thanh lọc, vùng overflow:hidden) che
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('aria-autocomplete', 'list');
  let active = -1;

  const item = ([ic, text, href, kind], i) => `<a class="sg-it" role="option" href="${href}" data-i="${i}">${icon(ic, 'ico-s')}<span>${esc(text)}</span>${kind ? `<small>${kind}</small>` : ''}</a>`;
  const render = () => {
    const q = input.value.trim();
    active = -1;
    if (q) {
      const list = suggestions(q);
      dd.innerHTML = `${list.map(item).join('')}<button class="sg-it sg-all" type="submit" data-i="${list.length}">${icon('search', 'ico-s')}<span>Tìm tất cả việc có "<b>${esc(q)}</b>"</span></button>`;
    } else {
      const recent = store.get(RECENT, []);
      const popular = TOPICS.filter((t) => topicJobs(t).length).slice(0, 8);
      dd.innerHTML = `<button class="sg-it sg-near" type="button" data-near data-i="0">${icon('locate', 'ico-s')}<span>Tìm việc làm gần tôi</span></button>
        ${recent.length ? `<div class="sg-h">Tìm kiếm gần đây <button type="button" data-clear>Xóa</button></div>${recent.map((r, i) => `<button class="sg-it" type="button" data-q="${esc(r)}" data-i="${i + 1}">${icon('clock', 'ico-s')}<span>${esc(r)}</span></button>`).join('')}` : ''}
        <div class="sg-h">Từ khóa phổ biến</div>
        <p class="sg-tags">${popular.map((t) => `<a href="${topicPath(t)}">${esc(t.short)}</a>`).join('')}</p>`;
    }
    dd.hidden = false;
    place();
    input.setAttribute('aria-expanded', 'true');
  };
  // Khung tìm kiếm nằm trong vùng overflow:hidden (hero) nên bảng gợi ý dùng position:fixed, canh theo ô nhập
  const place = () => {
    if (dd.hidden) return;
    if (!form.isConnected) { dd.remove(); return; }
    const r = box.getBoundingClientRect();
    const w = Math.min(Math.max(r.width, 360), window.innerWidth - 16);
    dd.style.top = `${r.bottom + 6}px`;
    dd.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
    dd.style.width = `${w}px`;
    dd.style.maxHeight = `${Math.max(200, window.innerHeight - r.bottom - 16)}px`;
  };
  window.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
  const close = () => { dd.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const items = () => [...dd.querySelectorAll('.sg-it')];
  const mark = () => items().forEach((el, i) => el.classList.toggle('on', i === active));

  input.addEventListener('focus', render);
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (dd.hidden) return;
    const n = items().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n; mark(); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); items()[active].click(); }
    else if (e.key === 'Escape') close();
  });
  dd.addEventListener('mousedown', (e) => e.preventDefault()); // giữ focus ô nhập khi bấm vào gợi ý
  dd.addEventListener('click', (e) => {
    const t = e.target.closest('a, button');
    if (!t) return;
    if (t.matches('[data-clear]')) { store.del(RECENT); render(); return; }
    if (t.matches('[data-q]')) { input.value = t.dataset.q; close(); form.requestSubmit(); return; }
    if (t.matches('[data-near]')) { e.preventDefault(); findNear(t); return; }
    if (t.tagName === 'A') { e.preventDefault(); close(); go(t.getAttribute('href')); }
    else if (t.type === 'submit') { e.preventDefault(); form.requestSubmit(); }
  });
  const onDoc = (e) => {
    if (!form.isConnected) { dd.remove(); document.removeEventListener('click', onDoc); window.removeEventListener('scroll', place); window.removeEventListener('resize', place); return; } // đã chuyển trang
    if (!form.contains(e.target) && !dd.contains(e.target)) close();
  };
  document.addEventListener('click', onDoc);
  form.addEventListener('submit', () => { saveRecent(input.value); close(); });
}

// Lấy vị trí trình duyệt → mở danh sách việc ở tỉnh/thành gần nhất
export function findNear(btn) {
  const label = btn.querySelector('span');
  const say = (t) => { if (label) label.textContent = t; };
  if (!navigator.geolocation) { say('Trình duyệt không hỗ trợ định vị'); return; }
  say('Đang xác định vị trí…');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => { const p = nearestProvince(coords.latitude, coords.longitude); if (p) go(url.area(p.slug)); else say('Chưa có việc ở gần bạn'); },
    () => say('Không lấy được vị trí, hãy chọn khu vực'),
    { timeout: 10000, maximumAge: 600000 }
  );
}
