import { V, $, $$, esc, icon, url, mono, jobRow, activeJobs, pagerHtml, company, province, SITE } from '../core.js';
import { companyList, coBox } from './companies.js';
import { go } from '../router.js';

const PER = 6;

export default function () {
  const jobs = activeJobs().sort((a, b) => (b.tier === 'vip') - (a.tier === 'vip') || a.posted - b.posted);
  const count = (fn) => jobs.filter(fn).length;
  const posts = V.posts.slice(0, 4);

  const quick = [
    ['Bảo vệ tòa nhà', '/viec-lam?muc-tieu=toa-nha'],
    ['Bảo vệ KCN Bình Dương', '/viec-lam/binh-duong?muc-tieu=kcn'],
    ['Vệ sĩ', '/viec-lam?muc-tieu=ve-si'],
    ['Bảo vệ ca đêm', '/viec-lam?ca=dem'],
    ['Có chỗ ở', '/viec-lam?che-do=o']
  ];


  const tops = companyList();
  // Banner: tin nổi bật có thật (VIP, rồi tin gấp, lương cao); không có thì ẩn
  const hot = [...jobs].sort((a, b) => (b.tier === 'vip') - (a.tier === 'vip') || b.urgent - a.urgent || b.salaryMax - a.salaryMax)[0];
  const hotCo = hot && company(hot.company);
  const pr = (n) => String(n).replace('.', ',');

  const tiles = [...V.targets.map((t) => [t.name, '/viec-lam?muc-tieu=' + t.id, t.icon, count((j) => j.target === t.id)]),
    ['Bảo vệ ca đêm', '/viec-lam?ca=dem', 'moon', count((j) => j.shift === 'dem')],
    ['Có chỗ ở miễn phí', '/viec-lam?che-do=o', 'bed', count((j) => j.housing)]];

  const html = `
  <section class="hero">
    <img class="hero-img" src="/assets/img/photos/hero-doi-bao-ve.webp" alt="" width="1600" height="1260" fetchpriority="high" decoding="async" onload="this.classList.add('is-in')">
    <div class="wrap">
    <h1>Việc bảo vệ uy tín, đi làm ngay!</h1>
    <p class="hero-sub">${jobs.length} tin đang tuyển từ ${V.companies.filter((c) => c.verified).length} công ty đã xác thực giấy phép · Ứng tuyển miễn phí</p>
    <form class="hsearch" id="finder" role="search">
      <label class="hs-q">${icon('search')}<span class="sr">Từ khóa</span><input name="q" type="search" placeholder="Tìm việc bảo vệ, tên công ty, khu công nghiệp…" autocomplete="off"></label>
      <label class="hs-sel">${icon('pin')}<span class="sr">Tỉnh thành</span><select name="tinh"><option value="">Chọn khu vực</option>${V.provinces.map((p) => `<option value="${p.slug}">${p.name}</option>`).join('')}</select></label>
      <label class="hs-sel">${icon('clock')}<span class="sr">Ca làm</span><select name="ca"><option value="">Ca làm</option>${V.shifts.map((x) => `<option value="${x.id}">${x.name}</option>`).join('')}</select></label>
      <button class="btn btn-gold" type="submit">Tìm việc</button>
    </form>
    <p class="hero-cta hero-search"><a class="btn btn-quick" href="/tim-kiem">${icon('filter')}Tìm kiếm chi tiết</a><span>Tìm kiếm theo quận huyện, mức lương mong muốn, công việc cụ thể và nhiều hơn thế.</span></p>
    <p class="hquick"><span>Tìm nhiều:</span>${quick.map(([t, h]) => `<a href="${h}">${t}</a>`).join('')}</p>
  </div></section>

  <div class="wrap home">
    <section class="panel-box" aria-labelledby="catH">
      <div class="pb-head"><h2 id="catH">Tìm việc theo loại mục tiêu</h2></div>
      <div class="tiles">${tiles.map(([t, h, ic, n]) => `<a class="tile" href="${h}"><span class="tile-ic">${icon(ic)}</span><b>${esc(t)}</b><small>${n} việc làm</small></a>`).join('')}</div>
    </section>

    ${hot && hotCo ? `<a class="hbanner" href="${url.job(hot)}">
      <span class="hb-ad">Nổi bật</span>
      <div class="hb-text">
        <span class="hb-co">${mono(hotCo)}${esc(hotCo.name)}</span>
        <strong>${esc(hot.title)}</strong>
        <ul><li>Lương ${pr(hot.salaryMin)}${hot.salaryMax !== hot.salaryMin ? ' - ' + pr(hot.salaryMax) : ''} triệu/tháng</li><li>${esc(hot.district)}, ${esc(province(hot.province)?.short || '')}</li>${hot.housing || hot.meals ? `<li>${[hot.housing && 'Có chỗ ở', hot.meals && 'Hỗ trợ bữa ăn'].filter(Boolean).join(', ')}</li>` : ''}</ul>
      </div>
      <div class="hb-cta"><b>${pr(hot.salaryMin)}${hot.salaryMax !== hot.salaryMin ? '-' + pr(hot.salaryMax) : ''}</b><span>triệu/tháng</span><span class="btn btn-gold">Ứng tuyển ngay</span></div>
    </a>` : ''}

    <section class="panel-box" aria-labelledby="hotH">
      <div class="pb-head">
        <h2 id="hotH">Việc làm bảo vệ mới nhất</h2>
        <a class="more" href="/viec-lam">Xem tất cả ${icon('arrow', 'ico-s')}</a>
      </div>
      <div class="pills-row" role="tablist" aria-label="Lọc theo tỉnh thành">
        <button class="on" role="tab" aria-selected="true" data-p="">Tất cả</button>
        ${V.provinces.map((p) => `<button role="tab" aria-selected="false" data-p="${p.slug}">${p.short}</button>`).join('')}
      </div>
      <div class="jlist" id="hotList">${jobs.slice(0, PER).map(jobRow).join('')}</div>
      <div class="pg" id="hotPg"></div>
    </section>

    <section class="panel-box" aria-labelledby="coH">
      <div class="pb-head"><h2 id="coH">Nhà tuyển dụng tiêu biểu</h2>${tops.length > 18 ? `<a class="more" href="/cong-ty-tuyen-dung">Xem tất cả ${tops.length} công ty ${icon('arrow', 'ico-s')}</a>` : ''}</div>
      <div class="cogrid">${tops.slice(0, 18).map(coBox).join('')}</div>
    </section>

    <section class="trust" aria-label="Cam kết">
      <div>${icon('shield')}<b>Tin được kiểm duyệt</b><p>Mỗi tin được duyệt trước khi hiển thị. Tin thu phí đồng phục, đặt cọc bị gỡ ngay.</p></div>
      <div>${icon('check')}<b>Công ty có giấy phép</b><p>Đối chiếu mã số thuế và giấy phép kinh doanh dịch vụ bảo vệ của Bộ Công an.</p></div>
      <div>${icon('phone')}<b>Gọi thẳng, không qua trung gian</b><p>Bấm gọi hoặc nhắn Zalo cho người tuyển. Ứng viên không mất bất kỳ khoản phí nào.</p></div>
      <div>${icon('flag')}<b>Báo cáo nhanh</b><p>Thấy dấu hiệu lừa đảo? Bấm báo cáo, đội kiểm duyệt xử lý trong 24 giờ.</p></div>
    </section>

    <div class="home-two">
      <section class="panel-box" aria-labelledby="areaH">
        <div class="pb-head"><h2 id="areaH">Việc làm theo khu vực</h2></div>
        <div class="arealinks">${V.provinces.map((p) => `<div>
          <h3><a href="${url.area(p.slug)}">Bảo vệ ${p.name}</a> <em>${count((j) => j.province === p.slug)}</em></h3>
          <ul>${p.districts.slice(0, 4).map((d) => `<li><a href="${url.area(p.slug, d)}">${esc(d)}</a></li>`).join('')}</ul>
        </div>`).join('')}</div>
      </section>
      <section class="empband">
        <img class="eb-img" src="/assets/img/photos/doi-bao-ve-toa-nha.webp" alt="Đội bảo vệ mặc đồng phục chào trước sảnh tòa nhà" loading="lazy" width="1100" height="825">
        <span class="kicker">Dành cho công ty bảo vệ</span>
        <h2>Tuyển đủ quân số trong 24 giờ</h2>
        <p>Đăng tin miễn phí 1 - 4 tuần, nhận cuộc gọi từ ứng viên đã xuất ngũ, có chứng chỉ nghiệp vụ.</p>
        <div class="eb-act">
          <a class="btn btn-gold" href="/trang-quan-ly-tuyen-dung/dang-tin">Đăng tin miễn phí</a>
          <a class="btn btn-ghost" href="/trang-quan-ly-tuyen-dung/tim-ung-vien">Tìm ứng viên</a>
        </div>
      </section>
    </div>

    <section class="panel-box" aria-labelledby="blogH">
      <div class="pb-head"><h2 id="blogH">Tin tức nghề bảo vệ</h2><a class="more" href="/tin-tuc">Xem tất cả ${icon('arrow', 'ico-s')}</a></div>
      <div class="bgrid">${posts.map((p, i) => `<article class="bcard">
        <a class="bc-thumb" href="${url.post(p)}" tabindex="-1" aria-hidden="true"><img src="${p.img}" alt="" loading="lazy" width="800" height="500"><span>${esc(p.cat)}</span></a>
        <h3><a href="${url.post(p)}">${esc(p.title)}</a></h3>
        <p class="meta">${p.date} · ${p.read} phút đọc</p>
      </article>`).join('')}</div>
    </section>
  </div>`;

  function mount(root) {
    const list = $('#hotList', root);
    const pg = $('#hotPg', root);
    let prov = '';
    let page = 1;
    const draw = () => {
      const rows = jobs.filter((j) => !prov || j.province === prov);
      const pages = Math.max(1, Math.ceil(rows.length / PER));
      page = Math.min(page, pages);
      list.innerHTML = rows.length
        ? rows.slice((page - 1) * PER, page * PER).map(jobRow).join('')
        : `<div class="empty"><h3>Chưa có tin ở khu vực này</h3><p class="mute"><a href="/viec-lam">Xem việc ở khu vực khác</a></p></div>`;
      pg.innerHTML = pagerHtml(page, pages);
    };
    draw();
    pg.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-page]');
      if (b) { page = Number(b.dataset.page); draw(); $('#hotH', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    $$('.pills-row button', root).forEach((b) => b.addEventListener('click', () => {
      $$('.pills-row button', root).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      prov = b.dataset.p; page = 1; draw();
    }));

    $('#finder', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const q = (f.get('q') || '').trim();
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (f.get('ca')) qs.set('ca', f.get('ca'));
      go(url.area(f.get('tinh')) + (qs.toString() ? '?' + qs : ''));
    });
  }

  return {
    nav: 'home', html, mount,
    ld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Việc Làm Bảo Vệ', url: SITE, potentialAction: { '@type': 'SearchAction', target: SITE + '/viec-lam?q={q}', 'query-input': 'required name=q' } }]
  };
}
