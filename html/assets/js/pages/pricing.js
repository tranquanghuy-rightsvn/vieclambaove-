import { V, esc, icon, money, crumbs } from '../core.js';

export default function () {
  const faq = [
    ['Tin miễn phí có bị giới hạn không?', 'Công ty đã xác thực được 3 tin miễn phí mỗi tháng, hiển thị 30 ngày. Tin miễn phí vẫn được duyệt và hiển thị bình thường, chỉ không được ưu tiên vị trí.'],
    ['Thanh toán bằng cách nào?', 'Chuyển khoản qua mã QR, VNPay hoặc ví MoMo. Gói được kích hoạt ngay khi thanh toán thành công.'],
    ['Có xuất hóa đơn VAT không?', 'Có. Hóa đơn điện tử gửi về email công ty trong vòng 24 giờ, xem lại trong mục Thanh toán.'],
    ['Điểm xem hồ sơ dùng thế nào?', 'Mỗi điểm mở số điện thoại của một ứng viên trong mục Tìm ứng viên. Điểm có hạn dùng 12 tháng.'],
    ['Tin bị từ chối có được hoàn tiền?', 'Tin VIP hoặc Gấp bị từ chối do vi phạm quy định sẽ không mất phí nếu bạn sửa và đăng lại trong 7 ngày.']
  ];
  const html = `
  <div class="phead"><div class="wrap">
    ${crumbs([['Trang chủ', '/'], ['Bảng giá', null]])}
    <h1>Bảng giá cho nhà tuyển dụng</h1>
    <p>Giá đã gồm VAT. Ứng viên dùng trang hoàn toàn miễn phí.</p>
  </div></div>
  <div class="wrap">
    <section class="sec">
      <div class="plans">${V.packages.map((p) => `<div class="plan${p.featured ? ' hot' : ''}">
        ${p.featured ? '<span class="plan-flag">Được chọn nhiều nhất</span>' : ''}
        <span class="tier">${esc(p.name)}</span>
        <p class="desc">${esc(p.desc)}</p>
        <span class="price">${p.price ? money(p.price) : 'Miễn phí'}</span>
        <span class="unit">${esc(p.unit) || 'không cần thanh toán'}</span>
        <ul>${p.features.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
        <a class="btn ${p.featured ? 'btn-gold' : 'btn-line'} btn-block" href="${p.id === 'free' ? '/nha-tuyen-dung/dang-tin' : '/chinh-sach/lien-he'}">${esc(p.cta)}</a>
      </div>`).join('')}</div>
    </section>
    <section class="sec" id="quang-cao">
      <div class="sec-head"><div><h2>Dịch vụ thêm và quảng cáo</h2><p>Banner chỉ đặt ở vị trí riêng, không bao giờ che nút Gọi hay Ứng tuyển.</p></div></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Dịch vụ</th><th>Mô tả</th><th class="num">Giá</th><th></th></tr></thead>
        <tbody>${V.addons.map((a) => `<tr><td><b>${esc(a.name)}</b></td><td class="mute">${esc(a.desc)}</td><td class="num"><b>${esc(a.price)}</b></td><td class="num"><a class="btn btn-quiet btn-s" href="/chinh-sach/lien-he">Mua</a></td></tr>`).join('')}</tbody>
      </table></div>
    </section>
    <section class="sec">
      <div class="sec-head"><h2>Câu hỏi thường gặp</h2></div>
      <div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    </section>
  </div>`;
  return {
    nav: 'pricing', html, title: 'Bảng giá đăng tin tuyển bảo vệ',
    desc: 'Đăng tin tuyển bảo vệ miễn phí, tin VIP 299.000đ, tin Gấp 149.000đ. Thanh toán QR, VNPay, MoMo, có hóa đơn VAT.',
    ld: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  };
}
