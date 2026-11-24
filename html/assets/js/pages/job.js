import { api, esc, icon, url, pay, jobRow, activeJobs, job as getJob, company, province, shift, target, isExpired, isSaved, crumbs, dateIn, num, mono, SITE } from '../core.js';

export default function ({ params: [id] }) {
  const j = getJob(id);
  if (!j) return { redirect: '/viec-lam' };
  const c = company(j.company);
  const p = province(j.province);
  const sh = shift(j.shift);
  const tg = target(j.target);
  const off = isExpired(j);
  const canonical = url.job(j);
  if (location.pathname !== canonical) history.replaceState({}, '', canonical);

  const similar = activeJobs().filter((x) => x.id !== j.id && (x.target === j.target || x.province === j.province))
    .sort((a, b) => (b.province === j.province) - (a.province === j.province)).slice(0, 4);
  // SĐT liên hệ của tin (nếu NTD nhập), không có thì dùng SĐT công ty
  const phone = j.phone || c.phone || '';
  const digits = phone.replace(/\D/g, '');
  const zalo = 'https://zalo.me/' + digits;
  const tel = 'tel:' + digits;
  const trk = (type) => `data-track="${type}" data-job="${j.id}"`;

  const facts = [
    ['Mức lương', `${pay(j)} triệu/tháng`, 'big'],
    ['Ca làm', sh.name],
    ['Số lượng', `${j.qty} người`],
    ['Địa điểm', `${j.district}, ${p.short}`],
    ['Độ tuổi', j.age],
    ['Chiều cao', j.height],
    ['Chỗ ở', j.housing ? 'Có, miễn phí' : 'Không'],
    ['Bữa ăn', j.meals ? 'Có hỗ trợ' : 'Tự túc'],
    [off ? 'Đã hết hạn' : 'Hạn nộp', off ? `${-j.daysLeft} ngày trước` : `${dateIn(j.daysLeft)} (còn ${j.daysLeft} ngày)`]
  ];

  const desc = [
    `Bảo vệ ${tg.name.toLowerCase()} tại ${j.address}.`,
    sh.id === '12h' ? 'Làm ca 12 tiếng, xoay ca ngày/đêm theo tuần.' : sh.id === 'dem' ? 'Làm ca đêm từ 18:00 đến 06:00, có phụ cấp ca đêm.' : sh.id === '24h' ? 'Trực 24 giờ, nghỉ 24 giờ; có phòng nghỉ tại mục tiêu.' : sh.id === 'gay' ? 'Ca gãy theo giờ cao điểm, phù hợp người muốn làm thêm.' : 'Làm giờ hành chính, nghỉ Chủ nhật hoặc nghỉ luân phiên.',
    'Kiểm soát ra vào, ghi sổ khách và phương tiện.',
    'Tuần tra theo lộ trình, phát hiện và báo cáo sự cố.',
    'Phối hợp ban quản lý xử lý tình huống PCCC, an ninh.'
  ];

  const apply = off ? '' : `
    <div class="box box-ink">
      <div class="apply-pay">${pay(j)} triệu<small>mỗi tháng · ${esc(sh.name.toLowerCase())}</small></div>
      <div class="apply-btns">
        ${digits ? `<a class="btn btn-call btn-l" href="${tel}" ${trk('call')}>${icon('phone')}Gọi ${esc(phone)}</a>` : ''}
        <div class="duo">
          ${digits ? `<a class="btn btn-zalo" href="${zalo}" target="_blank" rel="noopener" ${trk('zalo')}>${icon('chat')}Zalo</a>` : ''}
          <button class="btn btn-quiet" type="button" data-save="${j.id}" data-label aria-pressed="${isSaved(j.id)}">${icon('bookmark')} ${isSaved(j.id) ? 'Đã lưu' : 'Lưu tin'}</button>
        </div>
        <button class="btn btn-primary btn-l" type="button" data-apply="${j.id}">Ứng tuyển nhanh</button>
      </div>
      <p class="apply-note">Khi gọi, hãy nói bạn thấy tin trên Việc Làm Bảo Vệ.</p>
    </div>`;

  const html = `
  <div class="wrap detail">
    <article>
      ${crumbs([['Trang chủ', '/'], [p.name, url.area(p.slug)], [j.district, url.area(p.slug, j.district)], ['Chi tiết tin', null]])}
      ${off ? `<div class="expired" role="status">
        <h2>Tin đã hết hạn</h2>
        <p>Công ty đã ngừng nhận hồ sơ cho vị trí này. Số điện thoại liên hệ được ẩn để tránh làm phiền. Dưới đây là các việc tương tự đang tuyển.</p>
        <a class="btn btn-primary" href="${url.area(p.slug, j.district)}">Việc đang tuyển ở ${esc(j.district)}</a>
      </div>
      <div class="jlist" style="margin-bottom:32px">${similar.map(jobRow).join('')}</div>` : ''}
      <div class="d-flags">
        ${off ? '<span class="tag tag-off">Hết hạn</span>' : ''}
        ${!off && j.tier === 'vip' ? '<span class="tag tag-vip">VIP</span>' : ''}
        ${!off && j.urgent ? '<span class="tag tag-urgent">Tuyển gấp</span>' : ''}
        <span class="tag tag-off">${esc(tg.name)}</span>
      </div>
      <h1 class="d-title">${esc(j.title)}</h1>
      <div class="d-co">
        ${mono(c)}
        <div><a href="${url.company(c)}">${esc(c.name)}</a><br>
        ${c.verified ? `<span class="verified">${icon('check')}Đã xác thực giấy phép</span>` : '<span class="mute">Chưa xác thực</span>'}</div>
      </div>
      ${(j.images || []).length ? `<div class="d-gallery n${j.images.length}">${j.images.map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="${esc(j.title)} - ảnh ${i + 1}" loading="${i ? 'lazy' : 'eager'}"></a>`).join('')}</div>` : ''}
      <dl class="facts">${facts.filter(([, v]) => v).map(([k, v, cls]) => `<div class="${cls || ''}"><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>

      ${j.desc
        ? `<section class="d-sec"><h2>Mô tả công việc</h2><p class="d-desc">${esc(j.desc)}</p></section>`
        : `<section class="d-sec"><h2>Mô tả công việc</h2><ul>${desc.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>`}
      <section class="d-sec"><h2>Quyền lợi</h2><ul>
        <li>Lương ${pay(j)} triệu/tháng.</li>
        ${j.housing ? '<li>Có chỗ ở.</li>' : ''}
        ${j.meals ? '<li>Hỗ trợ bữa ăn.</li>' : ''}
      </ul></section>
      ${j.age || j.height ? `<section class="d-sec"><h2>Yêu cầu</h2><ul>
        ${j.age ? `<li>Độ tuổi: ${esc(j.age)}.</li>` : ''}${j.height ? `<li>Chiều cao: ${esc(j.height)}.</li>` : ''}
      </ul></section>` : ''}
      <section class="d-sec"><h2>Lưu ý khi đi phỏng vấn</h2><ul>
        <li>Mang CCCD photo, sơ yếu lý lịch, giấy khám sức khỏe. <b>Không nộp bản gốc.</b></li>
      </ul></section>
      <div class="notice notice-warn d-sec">${icon('alert')}<p><b>Không chuyển tiền cho bất kỳ ai.</b> Công ty bảo vệ hợp pháp không thu phí đồng phục, phí hồ sơ hay tiền đặt cọc. Nếu bị yêu cầu, hãy báo cáo tin ngay.</p></div>
      <div class="d-report">
        <span>Mã tin ${j.id} · đăng ${j.posted <= 0 ? 'hôm nay' : j.posted + ' ngày trước'} · ${num(j.views)} lượt xem</span>
        <button class="linkbtn" type="button" data-report="${j.id}">${icon('flag', 'ico-s')} Báo cáo tin</button>
      </div>
      ${!off && similar.length ? `<section class="sec" style="padding-top:40px"><div class="sec-head"><h2>Việc tương tự</h2><a class="more" href="${url.area(p.slug)}">Xem thêm ở ${esc(p.short)}</a></div><div class="jlist">${similar.map(jobRow).join('')}</div></section>` : ''}
    </article>

    <aside class="aside">
      ${apply}
      <div class="box">
        <div class="co-mini">${mono(c)}<div><b>${esc(c.name)}</b>${c.rating ? `<span class="stars">★ ${c.rating}</span> <span class="mute">(${c.reviews} đánh giá)</span>` : ''}</div></div>
        <ul class="kv">
          ${c.mst ? `<li><span>Mã số thuế</span><b>${esc(c.mst)}</b></li>` : ''}
          <li><span>Giấy phép</span><b>${c.verified ? 'Đã đối chiếu' : 'Chưa xác thực'}</b></li>
          ${c.size ? `<li><span>Quy mô</span><b>${esc(c.size)}</b></li>` : ''}
          ${c.founded ? `<li><span>Thành lập</span><b>${esc(c.founded)}</b></li>` : ''}
        </ul>
        <a class="more" href="${url.company(c)}" style="margin-top:12px">Xem công ty ${icon('arrow', 'ico-s')}</a>
      </div>
    </aside>
  </div>
  ${off ? '' : `<div class="mbar">${digits ? `<a class="btn btn-call" href="${tel}" ${trk('call')}>${icon('phone')}Gọi</a><a class="btn btn-zalo" href="${zalo}" target="_blank" rel="noopener" ${trk('zalo')}>Zalo</a>` : ''}<button class="btn btn-primary" type="button" data-apply="${j.id}">Ứng tuyển</button></div>`}`;

  // Đếm lượt xem: mỗi tin 1 lần trong một phiên trình duyệt
  const mount = () => {
    try { if (sessionStorage.getItem('v' + j.id)) return; sessionStorage.setItem('v' + j.id, '1'); } catch { /* bỏ qua */ }
    api('/track', { method: 'POST', body: { jobId: j.id, type: 'view' } }).catch(() => {});
  };
  const posted = new Date(); posted.setDate(posted.getDate() - j.posted);
  const until = new Date(); until.setDate(until.getDate() + j.daysLeft);
  return {
    nav: 'jobs', mbar: !off, html, mount,
    title: off ? `[Hết hạn] ${j.title}` : `${j.title} - ${pay(j)} triệu`,
    desc: `${c.short} tuyển ${j.qty} bảo vệ tại ${j.district}, ${p.short}. Lương ${pay(j)} triệu/tháng, ${sh.name.toLowerCase()}${j.housing ? ', bao ở' : ''}.`,
    canonical, noindex: off,
    ld: off ? [] : {
      '@context': 'https://schema.org', '@type': 'JobPosting',
      title: j.title, description: j.desc || desc.join(' '), ...(j.images?.length ? { image: j.images.map((u) => SITE + u) } : {}), datePosted: posted.toISOString().slice(0, 10), validThrough: until.toISOString().slice(0, 10),
      employmentType: 'FULL_TIME', industry: 'Dịch vụ bảo vệ', totalJobOpenings: j.qty,
      hiringOrganization: { '@type': 'Organization', name: c.name, sameAs: SITE + url.company(c) },
      jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: j.address, addressLocality: j.district, addressRegion: p.name, addressCountry: 'VN' } },
      baseSalary: { '@type': 'MonetaryAmount', currency: 'VND', value: { '@type': 'QuantitativeValue', minValue: j.salaryMin * 1e6, maxValue: j.salaryMax * 1e6, unitText: 'MONTH' } }
    }
  };
}
