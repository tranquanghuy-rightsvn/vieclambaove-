import { V, $, $$, esc, icon, url, jobRow, activeJobs, province, shift, target, districtBySlug, crumbs, SITE, company } from '../core.js';
import { go } from '../router.js';

const PAY = [['', 'Mọi mức lương'], ['duoi-8', 'Dưới 8 triệu'], ['8-10', '8 - 10 triệu'], ['10-15', '10 - 15 triệu'], ['tren-15', 'Trên 15 triệu']];
const payTest = { 'duoi-8': (j) => j.salaryMin < 8, '8-10': (j) => j.salaryMax >= 8 && j.salaryMin <= 10, '10-15': (j) => j.salaryMax >= 10 && j.salaryMin <= 15, 'tren-15': (j) => j.salaryMax > 15 };
const SORT = [['moi', 'Mới nhất'], ['luong', 'Lương cao nhất'], ['han', 'Sắp hết hạn']];
const PER = 8;
const list = (q, k) => (q.get(k) || '').split(',').filter(Boolean);

function filterJobs(all, s) {
  let r = all.filter((j) =>
    (!s.tinh || j.province === s.tinh) &&
    (!s.quan || j.district === s.quan) &&
    (!s.luong || payTest[s.luong]?.(j)) &&
    (!s.ca.length || s.ca.includes(j.shift)) &&
    (!s.mt.length || s.mt.includes(j.target)) &&
    (!s.cd.includes('o') || j.housing) &&
    (!s.cd.includes('an') || j.meals) &&
    (!s.gap || j.urgent) &&
    (!s.q || (j.title + ' ' + j.district + ' ' + company(j.company).name).toLowerCase().includes(s.q.toLowerCase()))
  );
  const vip = (j) => (j.tier === 'vip' ? 0 : 1);
  if (s.sx === 'luong') r.sort((a, b) => b.salaryMax - a.salaryMax);
  else if (s.sx === 'han') r.sort((a, b) => a.daysLeft - b.daysLeft);
  else r.sort((a, b) => vip(a) - vip(b) || a.posted - b.posted);
  return r;
}

function buildHref(s, page = 1) {
  const q = new URLSearchParams();
  if (s.q) q.set('q', s.q);
  if (s.luong) q.set('luong', s.luong);
  if (s.ca.length) q.set('ca', s.ca.join(','));
  if (s.mt.length) q.set('muc-tieu', s.mt.join(','));
  if (s.cd.length) q.set('che-do', s.cd.join(','));
  if (s.gap) q.set('gap', '1');
  if (s.sx && s.sx !== 'moi') q.set('sap-xep', s.sx);
  if (page > 1) q.set('trang', page);
  const qs = q.toString().replace(/%2C/g, ',');
  return url.area(s.tinh, s.quan) + (qs ? '?' + qs : '');
}

export default function ({ params: [ps, ds], query }) {
  let near = false;
  if (query.get('gan-toi') && !ps) { ps = 'tp-hcm'; near = true; }
  const p = ps ? province(ps) : null;
  if (ps && !p) return { redirect: '/viec-lam' };
  const d = ds ? districtBySlug(p, ds) : null;
  if (ds && !d) return { redirect: url.area(ps) };

  const s = { tinh: p?.slug || '', quan: d || '', q: query.get('q') || '', luong: query.get('luong') || '', ca: list(query, 'ca'), mt: list(query, 'muc-tieu'), cd: list(query, 'che-do'), gap: query.get('gap') === '1', sx: query.get('sap-xep') || 'moi' };
  const all = activeJobs();
  const res = filterJobs(all, s);
  const pages = Math.max(1, Math.ceil(res.length / PER));
  const page = Math.min(pages, Math.max(1, Number(query.get('trang')) || 1));
  const shown = res.slice((page - 1) * PER, page * PER);

  // Tiêu đề SEO theo bộ lọc
  const place = d ? `${d}, ${p.name}` : p ? p.name : 'toàn quốc';
  const what = (s.mt.length === 1 ? ' ' + target(s.mt[0]).name.toLowerCase() : '') + (s.ca.length === 1 ? ', ' + shift(s.ca[0]).name.toLowerCase() : '');
  const h1 = s.gap ? `Việc bảo vệ tuyển gấp${what} tại ${place}` : `Việc làm bảo vệ${what} tại ${place}`;
  const base = d ? res : filterJobs(all, { ...s, quan: '' });


  const chips = [];
  if (s.q) chips.push(['q', `"${s.q}"`]);
  if (s.luong) chips.push(['luong', PAY.find((x) => x[0] === s.luong)[1]]);
  s.ca.forEach((c) => chips.push(['ca:' + c, shift(c).name]));
  s.mt.forEach((m) => chips.push(['mt:' + m, target(m).name]));
  if (s.cd.includes('o')) chips.push(['cd:o', 'Bao ở']);
  if (s.cd.includes('an')) chips.push(['cd:an', 'Bao ăn']);
  if (s.gap) chips.push(['gap', 'Tuyển gấp']);

  const crumb = [['Trang chủ', '/'], ['Việc làm', p ? '/viec-lam' : null]];
  if (p) crumb.push([p.name, d ? url.area(p.slug) : null]);
  if (d) crumb.push([d, null]);

  const today = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const sel = (name, opts, cur, label) => `<label class="lf-sel${cur ? ' on' : ''}"><span class="sr">${label}</span><select name="${name}">${opts.map(([v, t]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
  const side = p
    ? p.districts.map((x) => [x, buildHref({ ...s, quan: x === d ? '' : x }), base.filter((j) => j.district === x).length, x === d])
    : V.provinces.map((x) => [x.name, url.area(x.slug), all.filter((j) => j.province === x.slug).length, false]);

  const html = `
  <div class="wrap">
    <section class="lhead">
      <p class="lh-k">Việc làm</p>
      <p class="lh-t">${esc(h1.replace(/^Việc làm /, ''))} <span>(${res.length})</span></p>
      <form class="lsearch" id="lsearch" role="search">
        <label class="ls-q">${icon('search')}<span class="sr">Từ khóa</span><input name="q" type="search" value="${esc(s.q)}" placeholder="Tên công ty, khu vực, tòa nhà…"></label>
        <label class="ls-sel">${icon('pin')}<span class="sr">Tỉnh thành</span><select name="tinh"><option value="">Toàn quốc</option>${V.provinces.map((x) => `<option value="${x.slug}" ${x.slug === s.tinh ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        <label class="ls-sel">${icon('clock')}<span class="sr">Ca làm</span><select name="ca"><option value="">Tất cả ca làm</option>${V.shifts.map((x) => `<option value="${x.id}" ${x.id === s.ca[0] ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        <button class="btn btn-gold" type="submit">Tìm kiếm</button>
      </form>
    </section>
    <form class="lfilter" id="lfilter" aria-label="Bộ lọc">
      <label class="lf-tog${s.gap ? ' on' : ''}"><input type="checkbox" name="gap" ${s.gap ? 'checked' : ''}>${icon('bolt', 'ico-s')}Tuyển gấp</label>
      <label class="lf-tog${s.cd.includes('o') ? ' on' : ''}"><input type="checkbox" name="o" ${s.cd.includes('o') ? 'checked' : ''}>${icon('bed', 'ico-s')}Có chỗ ở</label>
      ${sel('luong', PAY.map(([v, t]) => [v, v ? t : 'Tất cả mức lương']), s.luong, 'Mức lương')}
      ${sel('mt', [['', 'Tất cả mục tiêu'], ...V.targets.map((x) => [x.id, x.name])], s.mt[0] || '', 'Loại mục tiêu')}
      ${sel('an', [['', 'Chế độ ăn'], ['an', 'Bao ăn']], s.cd.includes('an') ? 'an' : '', 'Chế độ ăn')}
      ${sel('sx', SORT, s.sx, 'Sắp xếp')}
      ${chips.length ? `<button class="lf-clear" type="button" data-unset="*">${icon('refresh', 'ico-s')}Xóa lọc</button>` : ''}
    </form>
  </div>

  <div class="wrap">
    ${crumbs(crumb)}
    <h1 class="l-h1">Tuyển dụng <b>${res.length}</b> ${esc(h1.charAt(0).toLowerCase() + h1.slice(1))} mới nhất ${today}</h1>
    ${near ? '<p class="mute">Đang hiển thị theo vị trí gần đúng của bạn (TP.HCM).</p>' : ''}
    ${chips.length ? `<div class="active-f">${chips.map(([k, t]) => `<button type="button" data-unset="${k}" aria-label="Bỏ lọc ${esc(t)}">${esc(t)}${icon('x', 'ico-s')}</button>`).join('')}</div>` : ''}
    <div class="listing2">
      <div>
        <div class="jlist">
          ${shown.length ? shown.map(jobRow).join('') : `<div class="empty"><h3>Không có tin phù hợp</h3><p class="mute">Bỏ bớt điều kiện lọc hoặc xem khu vực lân cận.</p><p><a class="btn btn-soft" href="${url.area(s.tinh)}">Bỏ bộ lọc</a></p></div>`}
        </div>
        ${pages > 1 ? `<nav class="pager" aria-label="Phân trang">${Array.from({ length: pages }, (_, i) => i + 1).map((n) => (n === page ? `<span class="on" aria-current="page">${n}</span>` : `<a href="${buildHref(s, n)}">${n}</a>`)).join('')}</nav>` : ''}
        <section class="seo-text">
          <h2>Làm bảo vệ ở ${esc(d || p?.name || 'các tỉnh thành')}</h2>
          ${seoIntro(p, d, base)}
          <ul class="linkcloud">${V.targets.map((t) => `<li><a href="${url.area(s.tinh, s.quan)}?muc-tieu=${t.id}">Bảo vệ ${t.name.toLowerCase()}${p ? ' ' + p.short : ''}</a></li>`).join('')}</ul>
        </section>
      </div>
      <aside class="laside">
        <section class="lbox">
          <h2>${p ? 'Quận, huyện tại ' + p.short : 'Việc làm theo tỉnh'}</h2>
          <ul class="lb-list">${side.map(([t, h, n, on]) => `<li><a href="${h}" class="${on ? 'on' : ''}"><span>${esc(t)}</span><em>${n}</em></a></li>`).join('')}</ul>
        </section>
        <section class="lbox lbox-cta">
          <h2>Tạo hồ sơ trong 1 phút</h2>
          <p>Nhà tuyển dụng gọi cho bạn khi có việc phù hợp. Chỉ cần số điện thoại.</p>
          <a class="btn btn-gold btn-block" href="/ung-vien">Tạo hồ sơ ngay</a>
        </section>
        <section class="lbox">
          <h2>${icon('shield')}Cảnh giác lừa đảo</h2>
          <ul class="lb-warn"><li>Không đóng phí đồng phục, phí giữ chỗ.</li><li>Không nộp bản gốc CCCD, bằng cấp.</li><li>Lương quá cao so với mặt bằng cần hỏi kỹ.</li></ul>
          <a class="more" href="/tin-tuc/dau-hieu-cong-ty-bao-ve-lua-dao">Đọc thêm ${icon('arrow', 'ico-s')}</a>
        </section>
      </aside>
    </div>
  </div>`;

  function mount(root) {
    const goTo = (n) => go(buildHref(n), { replace: true, keepScroll: true });
    $('#lsearch', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const tinh = f.get('tinh') || '';
      goTo({ ...s, tinh, quan: tinh === s.tinh ? s.quan : '', q: (f.get('q') || '').trim(), ca: f.get('ca') ? [f.get('ca')] : [] });
    });
    $('#lsearch', root).addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') e.currentTarget.requestSubmit(); });
    $('#lfilter', root).addEventListener('change', (e) => {
      const f = new FormData(e.currentTarget);
      const cd = [f.get('o') ? 'o' : '', f.get('an') || ''].filter(Boolean);
      goTo({ ...s, gap: !!f.get('gap'), luong: f.get('luong') || '', mt: f.get('mt') ? [f.get('mt')] : [], cd, sx: f.get('sx') || 'moi' });
    });
    root.addEventListener('click', (e) => {
      const u = e.target.closest('[data-unset]');
      if (!u) return;
      const k = u.dataset.unset;
      const n = { ...s, ca: [...s.ca], mt: [...s.mt], cd: [...s.cd] };
      if (k === '*') Object.assign(n, { q: '', luong: '', ca: [], mt: [], cd: [], gap: false });
      else if (k === 'q' || k === 'luong') n[k] = '';
      else if (k === 'gap') n.gap = false;
      else { const [g, v] = k.split(':'); n[g] = n[g].filter((x) => x !== v); }
      goTo(n);
    });
  }

  const bc = crumb.map(([name, h], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + (h || url.area(s.tinh, s.quan)) }));
  const filtered = s.q || s.luong || s.ca.length > 1 || s.mt.length > 1 || s.cd.length || page > 1 || s.sx !== 'moi';
  return {
    nav: s.gap ? 'urgent' : 'jobs',
    title: h1 + (page > 1 ? ` - Trang ${page}` : ''),
    desc: `${res.length} tin tuyển bảo vệ tại ${place}. Lương, ca làm, chỗ ở ghi rõ; công ty đã xác thực giấy phép. Ứng tuyển miễn phí.`,
    canonical: filtered ? url.area(s.tinh, s.quan) : undefined,
    noindex: !!s.q,
    html, mount,
    ld: { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: bc }
  };
}

function seoIntro(p, d, jobs) {
  if (!jobs.length) return `<p>Hiện chưa có tin tuyển dụng ở khu vực này. <button class="linkbtn" type="button" data-quick>Tạo hồ sơ xin việc nhanh</button> để công ty bảo vệ gần bạn liên hệ khi có việc mới.</p>`;
  const avgMin = (jobs.reduce((a, j) => a + j.salaryMin, 0) / jobs.length).toFixed(1).replace('.', ',');
  const avgMax = (jobs.reduce((a, j) => a + j.salaryMax, 0) / jobs.length).toFixed(1).replace('.', ',');
  const byShift = V.shifts.map((x) => [x.name.toLowerCase(), jobs.filter((j) => j.shift === x.id).length]).filter((x) => x[1]).sort((a, b) => b[1] - a[1]);
  const housing = jobs.filter((j) => j.housing).length;
  const where = d ? `${d} (${p.name})` : p ? p.name : 'các tỉnh thành';
  return `<p>Lương bảo vệ tại ${esc(where)} hiện dao động trung bình ${avgMin}-${avgMax} triệu đồng/tháng. Phổ biến nhất là ${byShift.slice(0, 2).map((x) => x[0]).join(' và ')}; ${housing} trên ${jobs.length} tin có hỗ trợ chỗ ở cho người ở xa.</p>
  <p>Trước khi nhận việc, hãy hỏi rõ ngày trả lương, có đóng BHXH không và ai cấp đồng phục. Công ty bảo vệ hợp pháp không thu tiền của người lao động dưới bất kỳ hình thức nào.</p>`;
}
