import { V, esc, icon, url, pay, num, crumbs, activeJobs, province, SITE } from '../core.js';

const BODY = {
  'bang-luong-bao-ve-2026': `
    <p>Lương bảo vệ phụ thuộc ba thứ: khu vực, độ dài ca và loại mục tiêu. Bảng dưới tổng hợp từ các tin đang tuyển trên trang trong tháng 11/2026.</p>
    <h2>Mức lương theo khu vực</h2>
    <table><thead><tr><th>Khu vực</th><th>Ca 8 tiếng</th><th>Ca 12 tiếng</th><th>Chỉ huy mục tiêu</th></tr></thead><tbody>
      <tr><td>TP.HCM</td><td>7,5 – 8,5 triệu</td><td>8 – 9,5 triệu</td><td>11 – 13 triệu</td></tr>
      <tr><td>Hà Nội</td><td>7,5 – 9 triệu</td><td>8,5 – 10 triệu</td><td>11 – 14 triệu</td></tr>
      <tr><td>Bình Dương, Đồng Nai</td><td>7 – 8 triệu</td><td>8,5 – 10,5 triệu</td><td>10 – 12 triệu</td></tr>
      <tr><td>Đà Nẵng</td><td>7 – 8 triệu</td><td>8 – 9 triệu</td><td>10 – 11 triệu</td></tr>
    </tbody></table>
    <h2>Các khoản cộng thêm</h2>
    <ul><li>Phụ cấp ca đêm: tối thiểu 30% lương giờ làm đêm theo Bộ luật Lao động.</li><li>Chứng chỉ PCCC, võ thuật: thường cộng 300.000 – 800.000đ/tháng.</li><li>Bao ở, bao ăn: tương đương 1,5 – 2,5 triệu/tháng nếu tự lo.</li></ul>
    <blockquote>Khi so sánh hai tin, hãy cộng cả chỗ ở và bữa ăn. Tin 8 triệu bao ở có thể lợi hơn tin 9,5 triệu tự túc.</blockquote>
    <h2>Lương có thấp hơn mức tối thiểu vùng được không?</h2>
    <p>Không. Lương cho ca 8 tiếng không được thấp hơn lương tối thiểu vùng. Ca 12 tiếng phải trả thêm giờ làm thêm hoặc quy đổi thành lương cao hơn tương ứng.</p>`,
  'dau-hieu-cong-ty-bao-ve-lua-dao': `
    <p>Mỗi tháng đội kiểm duyệt chặn hàng chục tin có dấu hiệu thu tiền người xin việc. Dưới đây là năm dấu hiệu thường gặp nhất.</p>
    <h2>1. Đòi tiền đồng phục, phí hồ sơ</h2><p>Công ty hợp pháp cấp đồng phục miễn phí hoặc trừ dần vào lương có thỏa thuận bằng văn bản, không thu tiền mặt trước khi nhận việc.</p>
    <h2>2. Giữ bằng, CCCD bản gốc</h2><p>Luật cấm người sử dụng lao động giữ giấy tờ tùy thân bản gốc của người lao động.</p>
    <h2>3. Lương cao bất thường</h2><p>Tin bảo vệ phổ thông hứa 15 – 20 triệu mà không cần kinh nghiệm thường là mồi nhử.</p>
    <h2>4. Không có địa chỉ mục tiêu cụ thể</h2><p>Hỏi rõ sẽ làm ở đâu. Nếu chỉ được hẹn "lên văn phòng rồi phân công", hãy cẩn thận.</p>
    <h2>5. Không tra được giấy phép</h2><p>Kinh doanh dịch vụ bảo vệ cần giấy chứng nhận đủ điều kiện về an ninh trật tự. Công ty có dấu "Đã xác thực" trên trang đã được đối chiếu.</p>
    <blockquote>Nếu đã lỡ chuyển tiền, hãy giữ lại tin nhắn, biên lai và báo cáo tin ngay trên trang để người khác không bị lừa.</blockquote>`
};
const generic = (p) => `<p>${esc(p.excerpt)}</p>
  <h2>Những điều cần biết</h2><p>Nội dung chi tiết của bài viết đang được biên tập. Trong lúc chờ, bạn có thể xem các việc bảo vệ đang tuyển hoặc đọc bảng lương mới nhất.</p>
  <ul><li>Chuẩn bị CCCD, sơ yếu lý lịch, giấy khám sức khỏe.</li><li>Hỏi rõ ca làm, ngày trả lương và chế độ BHXH.</li><li>Không nộp tiền dưới bất kỳ hình thức nào.</li></ul>`;

export default function ({ params: [id] }) {
  const p = V.posts.find((x) => x.id === id);
  if (!p) return { redirect: '/tin-tuc' };
  const related = V.posts.filter((x) => x.id !== p.id).slice(0, 3);
  const urgent = activeJobs().filter((j) => j.urgent).slice(0, 4);
  const html = `
  <div class="wrap article">
    <article>
      ${crumbs([['Trang chủ', '/'], ['Tin tức', '/tin-tuc'], [p.cat, null]])}
      <span class="cat">${esc(p.cat)}</span>
      <h1 class="d-title" style="margin-top:8px;max-width:32ch">${esc(p.title)}</h1>
      <div class="byline"><span>Ban biên tập Việc Làm Bảo Vệ</span><span>${p.date}</span><span>${p.read} phút đọc</span><span>${num(p.views)} lượt đọc</span></div>
      <figure class="post-hero"><img src="${p.img}" alt="${esc(p.title)}" width="800" height="500"></figure>
      <div class="prose">${BODY[p.id] || generic(p)}</div>
      <section class="sec" style="padding-top:40px">
        <div class="sec-head"><h2>Đọc tiếp</h2></div>
        <ul class="glist">${related.map((r) => `<li><div><span class="cat">${esc(r.cat)}</span><br><a href="${url.post(r)}">${esc(r.title)}</a></div><time>${r.date}</time></li>`).join('')}</ul>
      </section>
    </article>
    <aside class="aside">
      <div class="board">
        <div class="board-head"><h2>Đang tuyển gấp</h2></div>
        <ol>${urgent.map((j) => `<li><a href="${url.job(j)}"><span class="b-place">${esc(j.district)} · ${esc(province(j.province).short)}</span><span class="b-title">${esc(j.title)}</span><span class="b-pay">${pay(j)}<small>triệu</small></span></a></li>`).join('')}</ol>
        <div class="board-foot"><a class="more" href="/viec-lam?gap=1">Tất cả việc gấp ${icon('arrow', 'ico-s')}</a></div>
      </div>
      <aside class="jrow-ad" aria-label="Quảng cáo"><span class="adlabel">Quảng cáo</span><p><b>Khóa PCCC cơ bản</b> – học 2 ngày cuối tuần, cấp chứng chỉ.</p></aside>
    </aside>
  </div>`;
  return {
    nav: 'blog', html, title: p.title, desc: p.excerpt,
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt, datePublished: p.date.split('/').reverse().join('-'), author: { '@type': 'Organization', name: 'Việc Làm Bảo Vệ' }, mainEntityOfPage: SITE + url.post(p) }
  };
}
