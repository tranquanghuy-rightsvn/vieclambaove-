import { V, $, $$, esc, icon, activeJobs, company, jobRow, pagerHtml, crumbs, slug } from '../core.js';

// Tìm kiếm chi tiết: lọc ngay trên dữ liệu đã tải (không gọi máy chủ), bộ lọc lưu trên URL để chia sẻ
const PER = 10;
const POSTED = [['', 'Bất kỳ'], ['1', '24 giờ qua'], ['3', '3 ngày qua'], ['7', '7 ngày qua'], ['30', '30 ngày qua']];
const SORTS = [['moi', 'Mới nhất'], ['luong', 'Lương cao nhất'], ['han', 'Sắp hết hạn']];
const PAY_PRESETS = [['', '', 'Mọi mức'], ['', '8', 'Dưới 8 tr'], ['8', '10', '8 - 10 tr'], ['10', '15', '10 - 15 tr'], ['15', '', 'Trên 15 tr']];
const list = (q, k) => (q.get(k) || '').split(',').filter(Boolean);

function readState(q) {
  return {
    q: q.get('q') || '', tinh: q.get('tinh') || '', quan: q.get('quan') || '',
    tu: q.get('luong-tu') || '', den: q.get('luong-den') || '',
    mt: list(q, 'muc-tieu'), ca: list(q, 'ca'), cd: list(q, 'che-do'),
    gap: q.get('gap') === '1', xt: q.get('xac-thuc') === '1', con: q.get('con-han') || '', dang: q.get('dang-trong') || '',
    sx: q.get('sap-xep') || 'moi', trang: Math.max(1, Number(q.get('trang')) || 1)
  };
}
function toQuery(s) {
  const q = new URLSearchParams();
  const set = (k, v) => { if (v !== '' && v !== false && v != null && !(Array.isArray(v) && !v.length)) q.set(k, Array.isArray(v) ? v.join(',') : v === true ? '1' : v); };
  set('q', s.q); set('tinh', s.tinh); set('quan', s.quan); set('luong-tu', s.tu); set('luong-den', s.den);
  set('muc-tieu', s.mt); set('ca', s.ca); set('che-do', s.cd); set('gap', s.gap); set('xac-thuc', s.xt); set('con-han', s.con); set('dang-trong', s.dang);
  if (s.sx !== 'moi') q.set('sap-xep', s.sx);
  if (s.trang > 1) q.set('trang', s.trang);
  return q.toString().replace(/%2C/g, ',');
}
function filter(s) {
  const kw = s.q.trim().toLowerCase();
  const tu = Number(s.tu) || 0, den = Number(s.den) || 0;
  let r = activeJobs().filter((j) => {
    const c = company(j.company) || {};
    if (s.tinh && j.province !== s.tinh) return false;
    if (s.quan && slug(j.district) !== s.quan) return false;
    if (tu && j.salaryMax < tu) return false;           // khoảng lương của tin phải giao với khoảng chọn
    if (den && j.salaryMin > den) return false;
    if (s.mt.length && !s.mt.includes(j.target)) return false;
    if (s.ca.length && !s.ca.includes(j.shift)) return false;
    if (s.cd.includes('o') && !j.housing) return false;
    if (s.cd.includes('an') && !j.meals) return false;
    if (s.gap && !j.urgent) return false;
    if (s.xt && !c.verified) return false;
    if (s.con && j.daysLeft < Number(s.con)) return false;
    if (s.dang && j.posted > Number(s.dang)) return false;
    if (kw && !`${j.title} ${c.name || ''} ${j.address || ''} ${j.district} ${j.desc || ''}`.toLowerCase().includes(kw)) return false;
    return true;
  });
  if (s.sx === 'luong') r.sort((a, b) => b.salaryMax - a.salaryMax);
  else if (s.sx === 'han') r.sort((a, b) => a.daysLeft - b.daysLeft);
  else r.sort((a, b) => a.posted - b.posted || b.id - a.id);
  return r;
}

const districtOpts = (tinh, quan) => {
  const pv = V.provinces.find((p) => p.slug === tinh);
  return `<option value="">${pv ? 'Mọi quận/huyện' : 'Chọn tỉnh trước'}</option>${pv ? pv.districts.map((d) => `<option value="${slug(d)}" ${slug(d) === quan ? 'selected' : ''}>${esc(d)}</option>`).join('') : ''}`;
};
const chk = (name, value, label, on) => `<label class="pill"><input type="checkbox" name="${name}" value="${value}" ${on ? 'checked' : ''}><span>${esc(label)}</span></label>`;

export default function ({ query }) {
  const s = readState(query);
  const html = `<div class="wrap" style="padding-top:20px">
    ${crumbs([['Trang chủ', '/'], ['Tìm kiếm chi tiết', null]])}
    <h1 class="page-h">Tìm kiếm chi tiết</h1>
    <div class="search-x">
      <form class="formcard sx-form" id="sx" autocomplete="off">
        <label class="field"><span>Từ khóa</span><input class="input" name="q" value="${esc(s.q)}" placeholder="Tên công ty, tòa nhà, khu công nghiệp…"></label>
        <div class="grid2">
          <label class="field"><span>Tỉnh/thành</span><select class="select" name="tinh"><option value="">Toàn quốc</option>${V.provinces.map((p) => `<option value="${p.slug}" ${p.slug === s.tinh ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
          <label class="field"><span>Quận/huyện</span><select class="select" name="quan" ${s.tinh ? '' : 'disabled'}>${districtOpts(s.tinh, s.quan)}</select></label>
        </div>
        <div class="field"><span>Mức lương mong muốn (triệu/tháng)</span>
          <div class="sx-pay"><input class="input" name="luong-tu" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Từ" value="${esc(s.tu)}"><span>-</span><input class="input" name="luong-den" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Đến" value="${esc(s.den)}"></div>
          <div class="sx-presets">${PAY_PRESETS.map(([a, b, l]) => `<button type="button" class="chip-btn ${s.tu === a && s.den === b ? 'on' : ''}" data-pay="${a}|${b}">${l}</button>`).join('')}</div>
        </div>
        <div class="field"><span>Loại mục tiêu</span><div class="pills">${V.targets.map((t) => chk('muc-tieu', t.id, t.name, s.mt.includes(t.id))).join('')}</div></div>
        <div class="field"><span>Ca làm</span><div class="pills">${V.shifts.map((x) => chk('ca', x.id, x.name, s.ca.includes(x.id))).join('')}</div></div>
        <div class="field"><span>Chế độ và điều kiện</span><div class="pills">
          ${chk('che-do', 'o', 'Bao ở', s.cd.includes('o'))}${chk('che-do', 'an', 'Bao ăn', s.cd.includes('an'))}
          ${chk('gap', '1', 'Tuyển gấp', s.gap)}${chk('xac-thuc', '1', 'Công ty đã xác thực', s.xt)}</div></div>
        <div class="grid3">
          <label class="field"><span>Đăng trong</span><select class="select" name="dang-trong">${POSTED.map(([v, l]) => `<option value="${v}" ${v === s.dang ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field"><span>Còn hạn ít nhất</span><select class="select" name="con-han">${[['', 'Bất kỳ'], ['3', '3 ngày'], ['7', '7 ngày'], ['14', '14 ngày']].map(([v, l]) => `<option value="${v}" ${v === s.con ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field"><span>Sắp xếp</span><select class="select" name="sap-xep">${SORTS.map(([v, l]) => `<option value="${v}" ${v === s.sx ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <div class="form-foot"><button class="btn btn-quiet" type="button" id="sxReset">Xoá bộ lọc</button></div>
      </form>
      <section class="sx-res" aria-live="polite"><div class="sx-head"><b id="sxCount"></b></div><div class="jlist" id="sxList"></div><div id="sxPg"></div></section>
    </div>
  </div>`;

  function mount(root) {
    const form = $('#sx', root);
    let st = s;
    const read = () => {
      const f = new FormData(form);
      return { q: f.get('q') || '', tinh: f.get('tinh') || '', quan: f.get('quan') || '', tu: f.get('luong-tu') || '', den: f.get('luong-den') || '',
        mt: f.getAll('muc-tieu'), ca: f.getAll('ca'), cd: f.getAll('che-do'), gap: !!f.get('gap'), xt: !!f.get('xac-thuc'),
        con: f.get('con-han') || '', dang: f.get('dang-trong') || '', sx: f.get('sap-xep') || 'moi', trang: 1 };
    };
    const draw = (scroll) => {
      const res = filter(st);
      const pages = Math.max(1, Math.ceil(res.length / PER));
      st.trang = Math.min(st.trang, pages);
      $('#sxCount', root).textContent = `${res.length} việc làm phù hợp`;
      $('#sxList', root).innerHTML = res.length ? res.slice((st.trang - 1) * PER, st.trang * PER).map(jobRow).join('')
        : '<div class="empty"><h3>Không có việc phù hợp</h3><p class="mute">Thử bỏ bớt điều kiện hoặc mở rộng khoảng lương.</p></div>';
      $('#sxPg', root).innerHTML = pagerHtml(st.trang, pages);
      $$('.chip-btn', root).forEach((b) => b.classList.toggle('on', b.dataset.pay === `${st.tu}|${st.den}`));
      const qs = toQuery(st);
      history.replaceState({}, '', '/tim-kiem' + (qs ? '?' + qs : ''));
      if (scroll) $('#sxCount', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    form.addEventListener('input', (e) => { if (e.target.name === 'tinh') return; st = read(); draw(); });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'tinh') { form.quan.innerHTML = districtOpts(e.target.value, ''); form.quan.disabled = !e.target.value; }
      st = read(); draw();
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    $$('.chip-btn', root).forEach((b) => b.addEventListener('click', () => { const [a, c] = b.dataset.pay.split('|'); form['luong-tu'].value = a; form['luong-den'].value = c; st = read(); draw(); }));
    $('#sxReset', root).addEventListener('click', () => { form.reset(); $$('input[type=checkbox]', form).forEach((x) => (x.checked = false)); $$('input:not([type=checkbox])', form).forEach((x) => (x.value = '')); $$('select', form).forEach((x) => (x.selectedIndex = 0)); form.quan.innerHTML = districtOpts('', ''); form.quan.disabled = true; st = read(); draw(); });
    $('#sxPg', root).addEventListener('click', (e) => { const b = e.target.closest('button[data-page]'); if (b) { st.trang = Number(b.dataset.page); draw(true); } });
    draw();
  }

  return { nav: 'jobs', html, mount, title: 'Tìm kiếm việc làm bảo vệ chi tiết', desc: 'Tìm việc bảo vệ theo quận huyện, mức lương mong muốn, loại mục tiêu, ca làm, chế độ ăn ở.', noindex: true };
}
