import { esc, icon, url, jobRow, activeJobs, company, crumbs, mono, SITE } from '../core.js';

export default function ({ params: [id] }) {
  const c = company(id);
  if (!c) return { redirect: '/viec-lam' };
  const jobs = activeJobs().filter((j) => j.company === c.id);
  const html = `
  <div class="phead"><div class="wrap">
    ${crumbs([['Trang chủ', '/'], ['Công ty bảo vệ', '/viec-lam'], [c.short, null]])}
    <div class="co-head">${mono(c, 'mono-l')}<div>
      <h1>${esc(c.name)}</h1>
      <p>${c.verified ? `<span class="verified">${icon('check')}Đã xác thực giấy phép kinh doanh dịch vụ bảo vệ</span>` : '<span class="tag tag-off">Đang chờ xác thực</span>'}
      ${c.rating ? `· <span class="stars">★ ${c.rating}</span> <span class="mute">${c.reviews} đánh giá từ nhân viên</span>` : ''}</p>
    </div></div>
  </div></div>
  <div class="wrap detail">
    <div>
      ${c.about ? `<section class="d-sec" style="margin-top:8px"><h2>Giới thiệu</h2><p>${esc(c.about)}</p></section>` : ''}
      <section class="d-sec">
        <div class="sec-head"><h2>Đang tuyển ${jobs.length} vị trí</h2></div>
        <div class="jlist">${jobs.length ? jobs.map(jobRow).join('') : '<div class="empty"><h3>Hiện chưa có tin tuyển</h3></div>'}</div>
      </section>
    </div>
    <aside class="aside">
      <div class="box">
        <h3>Thông tin pháp lý</h3>
        <ul class="kv">
          <li><span>Mã số thuế</span><b>${esc(c.mst)}</b></li>
          <li><span>Giấy phép</span><b>${esc(c.license)}</b></li>
          <li><span>Quy mô</span><b>${esc(c.size)}</b></li>
          <li><span>Thành lập</span><b>${c.founded}</b></li>
          <li><span>Trụ sở</span><b>${esc(c.address)}</b></li>
        </ul>
      </div>
      ${c.verified ? `<div class="notice notice-ok">${icon('shield')}<p>Giấy phép và mã số thuế đã được đối chiếu với cơ quan cấp phép.</p></div>` : `<div class="notice notice-warn">${icon('alert')}<p>Công ty chưa hoàn tất xác thực. Hãy hỏi kỹ giấy phép trước khi đi làm.</p></div>`}
    </aside>
  </div>`;
  return {
    nav: 'jobs', html,
    title: `${c.name} – tuyển dụng bảo vệ`,
    desc: `${c.name}: ${jobs.length} vị trí bảo vệ đang tuyển. ${c.size}, thành lập ${c.founded}.`,
    ld: { '@context': 'https://schema.org', '@type': 'Organization', name: c.name, url: SITE + url.company(c), address: c.address, taxID: c.mst }
  };
}
