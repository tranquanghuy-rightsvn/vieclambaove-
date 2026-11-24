import { $, icon, toast, crumbs } from '../core.js';

const PAGES = {
  'dieu-khoan': ['Điều khoản sử dụng', `
    <p>Cập nhật ngày 01/11/2026. Khi dùng Việc Làm Bảo Vệ, bạn đồng ý với các điều khoản dưới đây.</p>
    <h2>1. Tài khoản</h2><p>Mỗi số điện thoại tương ứng một tài khoản. Bạn chịu trách nhiệm về thông tin đã cung cấp và giữ bí mật mã xác nhận.</p>
    <h2>2. Ứng viên</h2><p>Ứng viên dùng miễn phí mọi tính năng. Thông tin hồ sơ phải đúng sự thật; hồ sơ giả mạo sẽ bị khóa.</p>
    <h2>3. Nhà tuyển dụng</h2><ul><li>Chỉ đăng tin cho vị trí có thật, tại mục tiêu có thật.</li><li>Không thu bất kỳ khoản phí nào của người xin việc.</li><li>Gói dịch vụ đã kích hoạt không hoàn tiền, trừ trường hợp nêu trong Bảng giá.</li></ul>
    <h2>4. Giới hạn trách nhiệm</h2><p>Chúng tôi kiểm duyệt tin và xác thực giấy phép nhưng không phải bên ký hợp đồng lao động. Hãy đọc kỹ hợp đồng trước khi ký.</p>`],
  'bao-mat': ['Chính sách bảo mật', `
    <p>Chính sách tuân theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</p>
    <h2>Dữ liệu chúng tôi thu thập</h2><ul><li>Số điện thoại, họ tên, năm sinh, chiều cao, cân nặng, kinh nghiệm bạn tự khai.</li><li>Khu vực muốn làm việc. Vị trí GPS chỉ dùng khi bạn bấm "Gần tôi" và không được lưu.</li></ul>
    <h2>Ai được thấy</h2><p>Số điện thoại của ứng viên chỉ hiện với công ty khi ứng viên ứng tuyển, hoặc khi ứng viên đồng ý cho nhà tuyển dụng đã đăng ký trên website tìm thấy hồ sơ. Ứng viên có thể tắt đồng ý này bất cứ lúc nào trong trang hồ sơ.</p>
    <h2>Quyền của bạn</h2><ul><li>Xem, sửa, tải về toàn bộ dữ liệu trong mục Cài đặt.</li><li>Rút lại đồng ý và xóa tài khoản bất kỳ lúc nào. Dữ liệu bị xóa trong 30 ngày.</li></ul>
    <h2>Lưu trữ</h2><p>Dữ liệu được mã hóa khi truyền và khi lưu trữ, chỉ nhân sự được phân quyền mới truy cập được.</p>`],
  'quy-che': ['Quy chế đăng tin', `
    <p>Mọi tin đăng đều qua bộ lọc tự động. Tin có dấu hiệu rủi ro được kiểm duyệt thủ công trước khi hiển thị.</p>
    <h2>Tin bị từ chối nếu</h2><ul><li>Thu phí đồng phục, phí hồ sơ, phí đào tạo, đặt cọc dưới mọi hình thức.</li><li>Giữ CCCD, bằng cấp bản gốc của người lao động.</li><li>Lương ghi sai lệch so với thực tế hoặc thấp hơn lương tối thiểu vùng.</li><li>Không có địa chỉ mục tiêu cụ thể.</li><li>Trùng nội dung với tin đang hiển thị.</li></ul>
    <h2>Vòng đời tin</h2><p>Nháp → Chờ duyệt → Đang hiển thị → Sắp hết hạn (nhắc trước 3 ngày) → Hết hạn. Tin hết hạn vẫn giữ trang nhưng ẩn số điện thoại và gợi ý việc tương tự.</p>
    <h2>Xử lý vi phạm</h2><p>Tin bị báo cáo từ 3 lần tự ẩn chờ xử lý. Vi phạm lần hai, tài khoản công ty bị khóa.</p>`]
};

export default function ({ params: [slug = 'dieu-khoan'] }) {
  const tabs = [...Object.entries(PAGES).map(([k, [t]]) => [k, t]), ['lien-he', 'Liên hệ']];
  if (!tabs.some(([k]) => k === slug)) return { redirect: '/chinh-sach' };
  const title = tabs.find(([k]) => k === slug)[1];
  const body = slug === 'lien-he' ? `
    <p>Phản hồi trong giờ hành chính, thường trong 4 giờ.</p>
    <ul class="kv" style="margin:16px 0 28px">
      <li><span>Hotline</span><b><a href="tel:19006868">1900 6868</a></b></li>
      <li><span>Zalo</span><b>0909 000 868</b></li>
      <li><span>Email</span><b>hotro@vieclambaove.vn</b></li>
      <li><span>Địa chỉ</span><b>Tầng 5, 12 Nguyễn Thị Minh Khai, Quận 1, TP.HCM</b></li>
    </ul>
    <form class="formcard" id="ct" style="font-size:16px">
      <div class="grid2"><label class="field"><span>Họ tên</span><input class="input" name="name" required autocomplete="name"></label><label class="field"><span>Số điện thoại</span><input class="input" name="phone" required inputmode="tel" autocomplete="tel"></label></div>
      <label class="field" style="margin-bottom:16px"><span>Bạn cần</span><select class="select" name="topic"><option>Hỗ trợ tài khoản</option><option>Báo cáo lừa đảo</option><option>Mua gói, quảng cáo</option><option>Khác</option></select></label>
      <label class="field"><span>Nội dung</span><textarea class="textarea" name="msg" rows="4" required></textarea></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit">${icon('send')}Gửi</button></div>
    </form>` : PAGES[slug][1];
  const html = `
  <div class="phead"><div class="wrap">${crumbs([['Trang chủ', '/'], ['Chính sách', '/chinh-sach'], [title, null]])}<h1>${title}</h1></div></div>
  <div class="wrap">
    <nav class="ttabs" aria-label="Chính sách" style="margin-top:20px">${tabs.map(([k, t]) => `<a href="/chinh-sach${k === 'dieu-khoan' ? '' : '/' + k}" class="${k === slug ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="prose" style="padding:32px 0 56px;max-width:720px;border-top:1px solid var(--ink)">${body}</div>
  </div>`;
  function mount(root) {
    $('#ct', root)?.addEventListener('submit', (e) => { e.preventDefault(); e.target.reset(); toast('Đã gửi. Chúng tôi sẽ gọi lại sớm.'); });
  }
  return { nav: '', html, mount, title, desc: `${title} của Việc Làm Bảo Vệ.`, canonical: slug === 'dieu-khoan' ? '/chinh-sach' : undefined };
}
