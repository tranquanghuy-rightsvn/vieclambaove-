-- Tin tức (bài viết): quản trị soạn trong trang quản trị, Worker xuất bản lên website
-- Nội dung bài (HTML) lưu ở cột content; khi xuất bản được ghi ra assets/content/tin-tuc/<slug>.html
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,         -- URL /tin-tuc/<slug>, không đổi sau khi tạo
  cat TEXT NOT NULL DEFAULT '',      -- chủ đề
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',  -- mô tả ngắn (cũng là mô tả cho Google)
  cover TEXT NOT NULL DEFAULT '',    -- ảnh đại diện: /images/posts/... hoặc /assets/img/...
  content TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  views INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER NOT NULL,     -- ngày đăng hiển thị
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_posts_pub ON posts(published, published_at);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('bang-luong-bao-ve-2026', 'Bảng lương', 'Lương bảo vệ 2026: bảng lương theo khu vực, ca trực và cách tính', 'Lương bảo vệ 2026 theo khu vực, loại mục tiêu, ca 8 và 12 tiếng từ tin đang tuyển; lương tối thiểu vùng, phụ cấp làm đêm, làm thêm giờ và cách so sánh tin.', '/assets/img/photos/blog-luong.jpg', '<p>Lương bảo vệ 2026 dao động khá rộng, từ khoảng 6 triệu đến hơn 20 triệu đồng mỗi tháng, tùy khu vực, loại mục tiêu và số giờ trực. Bài này tổng hợp mức lương từ các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, đối chiếu với lương tối thiểu vùng và quy định về làm đêm, làm thêm giờ trong Bộ luật Lao động 2019. Đọc xong, bạn sẽ biết một tin tuyển dụng trả cao hay thấp, và tự tính được lương ca 12 tiếng của mình.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg></span><strong>Lương bảo vệ 2026 thực tế đang ở mức nào?</strong></h2>
<p>Số liệu dưới đây lấy từ 36 tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, tại 6 tỉnh, thành. Mỗi tin ghi một khoảng lương "từ... đến...". Chúng tôi lấy mức thấp nhất và cao nhất mà các tin đưa ra, cùng mức giữa (trung vị) của hai đầu khoảng lương để bạn thấy mức phổ biến.</p>
<ul>
  <li>Mức thấp nhất trong các tin: <strong>6 triệu đồng/tháng</strong>.</li>
  <li>Mức cao nhất: <strong>25 triệu đồng/tháng</strong> (1 tin bảo vệ dự án tại <a href="/viec-lam/bac-ninh">Bắc Ninh</a>).</li>
  <li>Khoảng phổ biến: 25 trên 36 tin có mức giữa khoảng lương nằm trong <strong>7 đến 10 triệu đồng/tháng</strong>.</li>
  <li>Trung vị: mức "từ" khoảng 7,75 triệu, mức "đến" khoảng 9,75 triệu.</li>
</ul>
<p>Nói gọn, phần lớn công việc bảo vệ phổ thông đang trả khoảng 7,5 đến 10 triệu đồng. Các tin trên 12 triệu thường là khu đô thị lớn, giám sát mục tiêu hoặc công việc đòi hỏi kinh nghiệm.</p>

<h3>Lương bảo vệ theo khu vực</h3>
<div class="tbl-scroll">
<table>
  <thead><tr><th>Khu vực</th><th>Số tin</th><th>Thấp nhất</th><th>Cao nhất</th><th>Khoảng phổ biến (trung vị)</th></tr></thead>
  <tbody>
    <tr><td>TP. Hồ Chí Minh</td><td>10</td><td>6,5 triệu</td><td>12 triệu</td><td>7,9 - 9,5 triệu</td></tr>
    <tr><td>Hà Nội</td><td>8</td><td>6 triệu</td><td>20 triệu</td><td>9 - 12,5 triệu</td></tr>
    <tr><td>Bình Dương</td><td>8</td><td>6,5 triệu</td><td>14 triệu</td><td>7,4 - 9 triệu</td></tr>
    <tr><td><a href="/viec-lam/dong-nai">Đồng Nai</a></td><td>3</td><td>7 triệu</td><td>13 triệu</td><td>7,7 - 12 triệu</td></tr>
    <tr><td><a href="/viec-lam/da-nang">Đà Nẵng</a></td><td>6</td><td>6,5 triệu</td><td>10 triệu</td><td>7,5 - 8,5 triệu</td></tr>
    <tr><td>Bắc Ninh</td><td>1</td><td>14 triệu</td><td>25 triệu</td><td>Chỉ có 1 tin, chưa đủ để so sánh</td></tr>
  </tbody>
</table>
</div>
<p>Hà Nội có khoảng lương rộng nhất vì có cả tin tòa nhà nhỏ (6 - 7,5 triệu) lẫn khu đô thị lớn (14 - 20 triệu). Đà Nẵng có mặt bằng thấp hơn nhưng ổn định. Bạn có thể xem tin cụ thể theo từng nơi tại <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">Hà Nội</a> hoặc <a href="/viec-lam/binh-duong">Bình Dương</a>.</p>

<h3>Lương bảo vệ theo loại mục tiêu</h3>
<div class="tbl-scroll">
<table>
  <thead><tr><th>Loại mục tiêu</th><th>Số tin</th><th>Thấp nhất</th><th>Cao nhất</th><th>Khoảng phổ biến (trung vị)</th></tr></thead>
  <tbody>
    <tr><td>Tòa nhà, chung cư, nhà hàng, siêu thị</td><td>20</td><td>6 triệu</td><td>25 triệu</td><td>8 - 9,5 triệu</td></tr>
    <tr><td>Khu công nghiệp, nhà máy, kho</td><td>10</td><td>6,5 triệu</td><td>14 triệu</td><td>7,7 - 10,3 triệu</td></tr>
    <tr><td>Trường học, bệnh viện</td><td>4</td><td>6,5 triệu</td><td>10 triệu</td><td>7 - 8,8 triệu</td></tr>
    <tr><td>Ngân hàng</td><td>2</td><td>7 triệu</td><td>13 triệu</td><td>7 - 12,5 triệu</td></tr>
  </tbody>
</table>
</div>
<p>Nhà máy trong khu công nghiệp thường trả nhỉnh hơn ở đầu trên của khoảng lương, đổi lại hay phải trực ca 12 tiếng. Trường học có lương thấp hơn nhưng giờ giấc cố định, ít ca đêm.</p>

<h3>Lương theo ca làm việc</h3>
<p>Trong 36 tin, 10 tin ghi rõ ca 8 tiếng, 8 tin ghi ca 12 tiếng, số còn lại làm theo ca xoay hoặc không ghi rõ. Trung vị khoảng lương ca 8 tiếng là 8 - 10 triệu, ca 12 tiếng là khoảng 7,75 - 9,75 triệu. Điều này cho thấy ca 12 tiếng chưa chắc đã trả cao hơn ca 8 tiếng, nên bạn cần quy ra lương theo giờ trước khi chọn.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg></span><strong>Lương tối thiểu vùng 2026: mức sàn bạn cần biết</strong></h2>
<p>Từ ngày 01/01/2026, lương tối thiểu vùng áp dụng theo Nghị định 293/2025/NĐ-CP, thay cho Nghị định 74/2024/NĐ-CP. Đây là mức thấp nhất công ty được trả cho người làm đủ giờ bình thường trong tháng, chưa tính làm thêm giờ, làm đêm.</p>
<ul class="tv-facts">
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg></span><p><small>Vùng I</small>5.310.000 đồng/tháng</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M6 21V10l6-4 6 4v11"/><path d="M10 21v-5h4v5"/></svg></span><p><small>Vùng II</small>4.730.000 đồng/tháng</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M7 21v-8l5-4 5 4v8"/></svg></span><p><small>Vùng III</small>4.140.000 đồng/tháng</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M12 3c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z"/></svg></span><p><small>Vùng IV</small>3.700.000 đồng/tháng</p></li>
</ul>
<p>Các phường nội thành Hà Nội, TP.HCM và nhiều địa bàn công nghiệp lớn thuộc vùng I. Địa bàn cụ thể của từng vùng nằm trong phụ lục của Nghị định 293/2025/NĐ-CP, bạn nên tra theo nơi đặt mục tiêu (nơi bạn làm việc), không phải nơi đặt trụ sở công ty.</p>
<p>So với các tin đang tuyển, mức lương ghi trên tin cao hơn khá nhiều so với lương tối thiểu vùng. Lý do là tin tuyển dụng thường ghi tổng thu nhập, đã gộp tiền làm thêm giờ, phụ cấp. Vì vậy, khi ký hợp đồng, bạn cần hỏi rõ lương cơ bản là bao nhiêu, vì đây là con số dùng để tính tiền làm thêm và đóng bảo hiểm xã hội.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span><strong>Phụ cấp làm đêm và làm thêm giờ theo luật</strong></h2>
<p>Nghề bảo vệ gần như luôn có ca đêm và giờ làm thêm. Bộ luật Lao động 2019 quy định rõ mức trả tối thiểu, công ty có thể trả cao hơn nhưng không được thấp hơn.</p>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><div><span class="tv-panel-no">Phần 01</span><h3>Tiền làm thêm giờ (Điều 98)</h3></div></div>
  <p>Giờ làm thêm được trả ít nhất bằng tiền lương giờ bình thường nhân với:</p>
  <ul>
    <li><strong>150%</strong> nếu làm thêm vào ngày thường.</li>
    <li><strong>200%</strong> nếu làm thêm vào ngày nghỉ hằng tuần.</li>
    <li><strong>300%</strong> nếu làm vào ngày lễ, tết, ngày nghỉ có hưởng lương (chưa kể tiền lương ngày lễ bạn vốn được hưởng).</li>
  </ul>
  <p>Số giờ làm thêm cũng có giới hạn: không quá 40 giờ mỗi tháng và thường không quá 200 giờ mỗi năm, một số ngành nghề được phép đến 300 giờ mỗi năm (Điều 107).</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span><div><span class="tv-panel-no">Phần 02</span><h3>Tiền làm việc ban đêm (Điều 98, Điều 106)</h3></div></div>
  <p>Giờ làm việc ban đêm tính từ <strong>22 giờ đến 6 giờ sáng hôm sau</strong>. Mỗi giờ làm trong khung này được trả thêm ít nhất <strong>30%</strong> tiền lương của giờ làm ban ngày.</p>
  <p>Nếu giờ đó vừa là làm thêm vừa rơi vào ban đêm, bạn được hưởng cả tiền làm thêm, tiền làm đêm và thêm 20% tiền lương tính theo giờ làm ban ngày. Cách tính chi tiết được hướng dẫn tại Nghị định 145/2020/NĐ-CP.</p>
</div>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span><strong>Các khoản cộng thêm ngoài lương</strong></h2>
<p>Hai tin cùng ghi 8 triệu có thể chênh nhau 1 - 2 triệu mỗi tháng khi tính các khoản đi kèm. Đây là những thứ bạn nên hỏi kỹ:</p>
<ul>
  <li><strong>Bao ăn:</strong> 13 trên 36 tin có bao ăn hoặc hỗ trợ bữa ăn. Với người làm ca 12 tiếng, một bữa ăn tại mục tiêu giúp tiết kiệm đáng kể.</li>
  <li><strong>Chỗ ở:</strong> 6 trên 36 tin có chỗ ở, chủ yếu ở nhà máy, kho bãi tại Bình Dương, Đồng Nai và một số tòa nhà ở Hà Nội. Người từ tỉnh xa lên làm nên ưu tiên nhóm này.</li>
  <li><strong>Chứng chỉ nghiệp vụ bảo vệ:</strong> người đã có chứng chỉ thường được nhận nhanh hơn, dễ vào mục tiêu ngân hàng, khu đô thị cao cấp. Xem các tin <a href="/viec-lam-bao-ve-ngan-hang">việc làm bảo vệ ngân hàng</a> đang tuyển.</li>
  <li><strong>Phụ cấp chuyên cần, thâm niên, trưởng ca:</strong> mỗi công ty một mức, nên hỏi có ghi vào hợp đồng hay không.</li>
  <li><strong>Đồng phục và bảo hiểm:</strong> đồng phục do công ty cấp, bảo hiểm xã hội đóng theo quy định. Công ty thu tiền đồng phục là dấu hiệu cần cảnh giác.</li>
</ul>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><path d="M12 3v18"/></svg></span><strong>Cách so sánh lương bảo vệ 2026 giữa 2 tin tuyển dụng</strong></h2>
<p>Đừng chỉ nhìn con số to nhất trên tin. Hãy quy cả hai tin về cùng một thước đo theo các bước sau:</p>
<ol>
  <li><strong>Hỏi số giờ làm mỗi ngày và số ngày mỗi tháng.</strong> Ví dụ tin A ca 8 tiếng, 26 ngày; tin B ca 12 tiếng, 30 ngày.</li>
  <li><strong>Chia ra lương theo giờ.</strong> Tin A 8 triệu: 8.000.000 / (8 x 26) = khoảng 38.500 đồng/giờ. Tin B 9,5 triệu: 9.500.000 / (12 x 30) = khoảng 26.400 đồng/giờ.</li>
  <li><strong>Cộng giá trị bao ăn, chỗ ở.</strong> Nếu tin B có chỗ ở miễn phí, bạn tính thêm tiền thuê trọ mà mình tiết kiệm được.</li>
  <li><strong>Trừ chi phí đi lại.</strong> Mục tiêu xa nhà 15 km mỗi chiều sẽ tốn xăng và thời gian đáng kể.</li>
  <li><strong>Hỏi lương cơ bản trên hợp đồng.</strong> Lương cơ bản cao thì tiền làm thêm, tiền bảo hiểm và tiền nghỉ phép đều cao hơn.</li>
</ol>
<p>Trong ví dụ trên, tin B có tổng tiền cao hơn nhưng lương theo giờ thấp hơn khá nhiều. Nếu không có chỗ ở, tin A thường có lợi hơn. Bạn có thể xem riêng <a href="/viec-lam-bao-ve-ca-12-tieng">việc làm bảo vệ ca 12 tiếng</a> và <a href="/viec-lam-bao-ve-bao-an-o">việc làm bảo vệ bao ăn ở</a>, rồi so từng cặp tin như vậy.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h2M12 10h2M16 10h0M8 14h2M12 14h2M8 18h2M12 18h4"/></svg></span><strong>Cách tính lương ca 12 tiếng</strong></h2>
<p>Theo Điều 105 Bộ luật Lao động 2019, thời giờ làm việc bình thường không quá 8 giờ mỗi ngày (hoặc 10 giờ nếu công ty tính theo tuần) và không quá 48 giờ mỗi tuần. Vì vậy, một ca 12 tiếng thường gồm 8 giờ bình thường và 4 giờ làm thêm. Tổng giờ bình thường và giờ làm thêm cũng không được vượt 12 giờ mỗi ngày.</p>
<p>Ví dụ: hợp đồng ghi lương cơ bản 6.000.000 đồng cho 26 ngày, mỗi ngày 8 giờ.</p>
<ul>
  <li>Lương 1 giờ bình thường: 6.000.000 / 26 / 8 = khoảng 28.850 đồng.</li>
  <li>4 giờ làm thêm ngày thường: 4 x 28.850 x 150% = khoảng 173.100 đồng mỗi ngày.</li>
  <li>Làm 26 ca 12 tiếng ban ngày trong tháng: 6.000.000 + 26 x 173.100 = khoảng 10,5 triệu đồng.</li>
</ul>
<p>Nếu ca trực rơi vào khung 22 giờ đến 6 giờ, bạn còn được cộng tiền làm đêm như đã nói ở trên. Lưu ý, 26 ca x 4 giờ là 104 giờ làm thêm, vượt xa giới hạn 40 giờ mỗi tháng. Thực tế nhiều nơi trả lương "khoán" cho ca 12 tiếng, nên bạn hãy hỏi rõ công ty tính lương thế nào. Nếu muốn làm đúng giờ, bạn có thể tìm <a href="/viec-lam-bao-ve-ca-8-tieng">việc làm bảo vệ ca 8 tiếng</a>.</p>

<blockquote>Mẹo nhỏ: trước khi nhận việc, hãy xin xem mẫu hợp đồng hoặc bảng lương của tháng trước. Công ty minh bạch thường sẵn sàng cho bạn xem.</blockquote>

<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Lương bảo vệ 2026 trung bình là bao nhiêu?</h3></summary>
    <div class="tv-faq-a"><p>Theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, phần lớn tin có mức lương khoảng 7 đến 10 triệu đồng/tháng. Trung vị khoảng lương là 7,75 đến 9,75 triệu đồng.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Công ty trả lương thấp hơn lương tối thiểu vùng có được không?</h3></summary>
    <div class="tv-faq-a"><p>Không. Với người làm đủ thời giờ làm việc bình thường trong tháng, lương không được thấp hơn mức tối thiểu vùng theo Nghị định 293/2025/NĐ-CP, ví dụ 5.310.000 đồng/tháng ở vùng I.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Làm ca đêm có được cộng thêm tiền không?</h3></summary>
    <div class="tv-faq-a"><p>Có. Giờ làm từ 22 giờ đến 6 giờ sáng được trả thêm ít nhất 30% so với lương giờ làm ban ngày, theo Điều 98 Bộ luật Lao động 2019.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Ca 12 tiếng có phải lúc nào cũng lương cao hơn ca 8 tiếng?</h3></summary>
    <div class="tv-faq-a"><p>Không hẳn. Trong các tin đang tuyển, khoảng lương ca 12 tiếng không cao hơn ca 8 tiếng nhiều. Bạn nên chia ra lương theo giờ để so sánh cho đúng.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Tin bao ăn ở có đáng chọn hơn không?</h3></summary>
    <div class="tv-faq-a"><p>Nếu bạn ở xa và phải thuê trọ, tin có chỗ ở thường có lợi hơn dù lương ghi thấp hơn một chút. Hãy cộng tiền trọ, tiền ăn tiết kiệm được vào lương để so sánh.</p></div>
  </details>
</div>
<p>Muốn xem ngay các công việc phù hợp với mức lương mong muốn, bạn vào <a href="/viec-lam">danh sách việc làm bảo vệ</a> và lọc theo khu vực.</p>

<p class="note-src">Nguồn tham khảo: Bộ luật Lao động 2019 (Điều 98, 105, 106, 107); Nghị định 293/2025/NĐ-CP quy định mức lương tối thiểu đối với người lao động làm việc theo hợp đồng lao động; Nghị định 145/2020/NĐ-CP hướng dẫn Bộ luật Lao động về điều kiện lao động và quan hệ lao động; Thư viện Pháp luật; Luật Việt Nam; dữ liệu tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026.</p>
', 1, 18420, 1794445200000, 1794445200000, 1795503709548);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('dau-hieu-cong-ty-bao-ve-lua-dao', 'Cảnh báo lừa đảo', 'Công ty bảo vệ lừa đảo: 7 dấu hiệu nhận biết và cách xử lý', 'Nhận biết công ty bảo vệ lừa đảo: thu phí đồng phục, giữ giấy tờ gốc, lương cao bất thường. Quy định pháp luật, cách kiểm tra công ty, cách xử lý khi bị lừa.', '/assets/img/photos/blog-lua-dao.jpg', '<p>Không ít người tìm việc đã mất tiền, mất giấy tờ vì tin nhầm một công ty bảo vệ lừa đảo. Chiêu thường gặp là thu phí hồ sơ, phí đồng phục, giữ giấy tờ gốc rồi không cho đi làm hoặc trả lương rất thấp. Bài này giúp bạn nhận ra dấu hiệu sớm, biết pháp luật cấm những gì, cách kiểm tra một công ty trước khi nộp hồ sơ và việc cần làm nếu đã bị lừa.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></span><strong>7 dấu hiệu nhận biết công ty bảo vệ lừa đảo</strong></h2>
<p>Một tin tuyển dụng có thể có một vài điểm chưa rõ mà vẫn là tin thật. Nhưng nếu bạn gặp từ hai dấu hiệu dưới đây trở lên, hãy dừng lại và kiểm tra kỹ trước khi đưa tiền hay giấy tờ.</p>
<ul class="tv-harms">
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg></span><div><h3>Thu phí đồng phục, hồ sơ, đào tạo trước khi đi làm</h3><p>Công ty yêu cầu bạn nộp tiền đồng phục, phí "giữ chỗ", phí khám sức khỏe tại chỗ hay phí học nghiệp vụ trước khi ký hợp đồng. Sau khi nhận tiền, họ hẹn lần hẹn lữa hoặc chuyển bạn đến mục tiêu không có thật.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.8-1.5 1.8-2 3-2s2.2.5 3 2M14 10h4M14 13h3"/></svg></span><div><h3>Giữ căn cước, bằng cấp bản gốc</h3><p>Họ nói phải giữ căn cước công dân, bằng lái hay chứng chỉ bản gốc "để đảm bảo bạn không bỏ việc". Đây là hành vi pháp luật cấm, và là cách giữ chân bạn khi lương bị nợ.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17 9 11l4 4 8-8"/><path d="M14 7h7v7"/></svg></span><div><h3>Lương cao bất thường, việc nhẹ</h3><p>Tin hứa 15 - 20 triệu cho bảo vệ phổ thông, không cần kinh nghiệm, "chỉ ngồi trực". Trong khi phần lớn tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026 có mức 7 - 10 triệu đồng/tháng.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><path d="m9.5 7 5 5M14.5 7l-5 5"/></svg></span><div><h3>Không nói rõ địa chỉ mục tiêu</h3><p>Hỏi làm ở đâu thì chỉ nói "khu vực quận này", "đến văn phòng sẽ phân công". Công ty thật luôn biết bạn sẽ trực ở tòa nhà, nhà máy hay cửa hàng nào.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="m9.5 13 5 5M14.5 13l-5 5"/></svg></span><div><h3>Không có giấy chứng nhận đủ điều kiện về an ninh, trật tự</h3><p>Công ty không cho xem hoặc không có giấy chứng nhận đủ điều kiện về an ninh, trật tự do cơ quan công an cấp, chỉ có giấy đăng ký kinh doanh chung chung, thậm chí không có cả mã số thuế.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg></span><div><h3>Chỉ liên lạc qua tin nhắn, giục nộp tiền gấp</h3><p>Người tuyển chỉ nhắn qua mạng xã hội, không có văn phòng rõ ràng, liên tục hối "hôm nay hết suất", yêu cầu chuyển khoản vào tài khoản cá nhân.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg></span><div><h3>Không ký hợp đồng, hoặc hợp đồng mập mờ</h3><p>Không có hợp đồng lao động, hoặc hợp đồng có điều khoản "phạt bỏ việc", "trừ tiền đồng phục vào tháng lương đầu", "không trả lương tháng đầu nếu nghỉ".</p></div></li>
</ul>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14"/><path d="M6 7h12"/><path d="m6 7-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/></svg></span><strong>Pháp luật cấm những gì?</strong></h2>
<p>Nhiều người chấp nhận đóng tiền hay để lại giấy tờ vì nghĩ đó là "quy định chung của nghề". Thực tế, Bộ luật Lao động 2019 cấm rõ những việc này.</p>

<h3>Cấm giữ giấy tờ gốc và cấm thu tiền bảo đảm</h3>
<p>Điều 17 Bộ luật Lao động 2019 quy định những hành vi người sử dụng lao động không được làm khi giao kết, thực hiện hợp đồng lao động, trong đó có:</p>
<ul>
  <li><strong>Giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ</strong> của người lao động (khoản 1).</li>
  <li><strong>Yêu cầu người lao động thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản khác</strong> cho việc thực hiện hợp đồng lao động (khoản 2). Nói dễ hiểu, công ty không được bắt bạn đặt cọc, ký quỹ để được đi làm.</li>
</ul>
<p>Vi phạm các quy định này có thể bị xử phạt hành chính theo nghị định về xử phạt vi phạm trong lĩnh vực lao động, và công ty buộc phải trả lại giấy tờ, tiền cho người lao động. Công ty có thể xin bản sao có chứng thực, nhưng không được giữ bản gốc của bạn.</p>
<blockquote>Đồng phục là công cụ làm việc của công ty. Nếu công ty yêu cầu bạn nộp tiền trước mới được nhận việc, đó là dấu hiệu rất đáng ngờ.</blockquote>

<h3>Điều kiện kinh doanh dịch vụ bảo vệ</h3>
<p>Kinh doanh dịch vụ bảo vệ là ngành nghề kinh doanh có điều kiện về an ninh, trật tự, quy định tại Nghị định 96/2016/NĐ-CP (đã được sửa đổi, bổ sung nhiều lần). Theo đó:</p>
<ul>
  <li>Đơn vị kinh doanh dịch vụ bảo vệ phải là doanh nghiệp và phải được cơ quan công an cấp <strong>Giấy chứng nhận đủ điều kiện về an ninh, trật tự</strong> trước khi hoạt động.</li>
  <li>Nhân viên dịch vụ bảo vệ phải được đào tạo và có <strong>chứng chỉ nghiệp vụ bảo vệ</strong> do cơ quan có thẩm quyền cấp. Nếu chưa có chứng chỉ, hãy chọn <a href="/viec-lam-bao-ve-khong-can-kinh-nghiem">việc làm bảo vệ không cần kinh nghiệm</a> được công ty đào tạo.</li>
</ul>
<p>Một công ty chỉ có giấy đăng ký kinh doanh mà không có giấy chứng nhận về an ninh, trật tự thì không được cung cấp dịch vụ bảo vệ. Bạn làm cho đơn vị như vậy sẽ rất khó đòi quyền lợi khi có tranh chấp.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span><strong>Cách kiểm tra một công ty bảo vệ trước khi nộp hồ sơ</strong></h2>
<p>Chỉ mất 15 - 20 phút, bạn có thể tránh được phần lớn rủi ro. Làm theo các bước dưới đây:</p>
<div class="tv-process-wrap">
  <div class="tv-process-map" aria-hidden="true"><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span><span class="tv-map-label"><small>Bước 1</small>Tra mã số thuế</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><span class="tv-map-label"><small>Bước 2</small>Xem giấy ANTT</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><span class="tv-map-label"><small>Bước 3</small>Hỏi mục tiêu</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg></span><span class="tv-map-label"><small>Bước 4</small>Đọc hợp đồng</span></div></div>
  <ol class="tv-process">
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">01</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span><div><span class="tv-step-kicker">Bước 1</span><h3>Tra tên và mã số thuế công ty</h3></div></div>
        <p>Hỏi tên đầy đủ và mã số thuế, rồi tra trên Cổng thông tin quốc gia về đăng ký doanh nghiệp hoặc trang tra cứu mã số thuế. Xem công ty còn hoạt động không, ngành nghề có dịch vụ bảo vệ không, địa chỉ trụ sở có trùng với nơi hẹn phỏng vấn không.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Công ty có thật, còn hoạt động</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">02</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><div><span class="tv-step-kicker">Bước 2</span><h3>Xin xem giấy chứng nhận đủ điều kiện về an ninh, trật tự</h3></div></div>
        <p>Công ty dịch vụ bảo vệ làm ăn đàng hoàng thường treo hoặc sẵn sàng cho xem giấy này tại văn phòng. Nếu họ né tránh, nói "không cần", bạn nên cân nhắc.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Đủ điều kiện hành nghề</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">03</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><div><span class="tv-step-kicker">Bước 3</span><h3>Hỏi địa chỉ mục tiêu và ca trực cụ thể</h3></div></div>
        <p>Hỏi rõ bạn trực ở đâu, ca mấy giờ, bao nhiêu người một ca, ai là trưởng ca. Nếu được, hãy ghé qua mục tiêu đó hỏi bảo vệ đang làm về công ty và việc trả lương.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Biết chắc nơi làm việc</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">04</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg></span><div><span class="tv-step-kicker">Bước 4</span><h3>Đọc kỹ hợp đồng trước khi ký</h3></div></div>
        <p>Kiểm tra lương cơ bản, cách tính làm thêm, ngày trả lương, có đóng bảo hiểm xã hội không. Gạch bỏ hoặc từ chối các điều khoản đặt cọc, phạt tiền, giữ giấy tờ.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Quyền lợi rõ ràng trên giấy</span>
      </div>
    </li>
  </ol>
  <p class="tv-process-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Chỉ nộp <strong>bản sao</strong> giấy tờ. Chỉ chuyển khoản cho công ty khi đã có hợp đồng và có lý do rõ ràng, và luôn đòi phiếu thu có đóng dấu.</span></p>
</div>
<p>Ngoài ra, khi đọc tin trên mạng, hãy so mức lương với mặt bằng chung. Bạn có thể đối chiếu với các tin <a href="/viec-lam-bao-ve-luong-cao">việc làm bảo vệ lương cao</a> và <a href="/viec-lam-bao-ve-chung-cu">việc làm bảo vệ chung cư</a> đang tuyển.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></span><strong>Đã bị công ty bảo vệ lừa đảo, cần làm gì?</strong></h2>
<p>Nếu đã lỡ nộp tiền hoặc bị giữ giấy tờ, đừng tự xử lý một mình và đừng nộp thêm tiền để "lấy lại hồ sơ". Hãy làm theo thứ tự sau:</p>
<ol>
  <li><strong>Giữ lại mọi bằng chứng.</strong> Chụp màn hình tin tuyển dụng, tin nhắn, cuộc gọi, biên lai chuyển khoản, phiếu thu, ảnh văn phòng, tên và số điện thoại người tuyển. Không xóa đoạn chat dù bị đối phương yêu cầu.</li>
  <li><strong>Yêu cầu trả lại giấy tờ bằng văn bản.</strong> Gửi tin nhắn hoặc đơn đề nghị trả lại giấy tờ gốc, tiền đã nộp. Đây cũng là bằng chứng cho việc bạn đã đòi.</li>
  <li><strong>Báo cơ quan chức năng.</strong> Trình báo công an xã, phường nơi công ty đặt văn phòng hoặc nơi bạn nộp tiền nếu có dấu hiệu chiếm đoạt tiền. Với việc giữ giấy tờ, nợ lương, bạn có thể gửi đơn đến cơ quan quản lý nhà nước về lao động tại địa phương.</li>
  <li><strong>Báo cáo tin trên Việc Làm Bảo Vệ.</strong> Nếu bạn thấy tin trên trang của chúng tôi, hãy bấm nút báo cáo tin hoặc liên hệ theo hướng dẫn trong <a href="/chinh-sach/quy-che">quy chế hoạt động</a> để chúng tôi xem xét và gỡ tin vi phạm.</li>
  <li><strong>Cảnh báo người thân, bạn bè.</strong> Chia sẻ thông tin (không bịa thêm) để người khác không mắc cùng một chiêu.</li>
</ol>
<p>Càng báo sớm, khả năng lấy lại tiền và giấy tờ càng cao. Nếu bị mất căn cước, bạn nên làm thủ tục báo mất để tránh bị kẻ gian dùng giấy tờ của mình vào việc khác.</p>

<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Công ty bảo vệ thu tiền đồng phục có đúng luật không?</h3></summary>
    <div class="tv-faq-a"><p>Khoản 2 Điều 17 Bộ luật Lao động 2019 cấm người sử dụng lao động yêu cầu người lao động bảo đảm bằng tiền hay tài sản để thực hiện hợp đồng. Khoản thu bắt buộc trước khi được nhận việc là dấu hiệu bạn cần cảnh giác và hỏi rõ.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Công ty có được giữ căn cước bản gốc của tôi không?</h3></summary>
    <div class="tv-faq-a"><p>Không. Khoản 1 Điều 17 Bộ luật Lao động 2019 cấm giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động. Bạn chỉ cần nộp bản sao.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Làm sao biết công ty bảo vệ có giấy phép?</h3></summary>
    <div class="tv-faq-a"><p>Tra mã số thuế để xem công ty có thật, sau đó xin xem Giấy chứng nhận đủ điều kiện về an ninh, trật tự do công an cấp theo Nghị định 96/2016/NĐ-CP.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Lương bao nhiêu thì nên nghi ngờ?</h3></summary>
    <div class="tv-faq-a"><p>Theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, đa số tin có mức 7 - 10 triệu đồng/tháng. Tin bảo vệ phổ thông hứa cao gấp đôi mà không yêu cầu gì đặc biệt thì nên kiểm tra kỹ.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Bị lừa mất ít tiền có nên báo công an không?</h3></summary>
    <div class="tv-faq-a"><p>Có. Một người mất ít, nhưng nhiều người cùng bị một nhóm lừa thì số tiền lớn. Lời trình báo của bạn giúp cơ quan chức năng có thêm căn cứ xử lý.</p></div>
  </details>
</div>
<p>Muốn tìm việc an toàn hơn, bạn có thể bắt đầu từ <a href="/viec-lam">danh sách việc làm bảo vệ</a> và áp dụng các bước kiểm tra ở trên với từng tin.</p>

<p class="note-src">Nguồn tham khảo: Bộ luật Lao động 2019 (Điều 17); Nghị định 96/2016/NĐ-CP quy định điều kiện về an ninh, trật tự đối với một số ngành, nghề đầu tư kinh doanh có điều kiện (đã sửa đổi, bổ sung); Thư viện Pháp luật; Luật Việt Nam; Luật Minh Khuê; dữ liệu tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026.</p>
', 1, 42190, 1794099600000, 1794099600000, 1795503709548);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('quy-trinh-tuan-tra-pccc', 'Nghiệp vụ', 'Quy trình tuần tra bảo vệ tòa nhà, chung cư và xử lý khi có cháy', 'Quy trình tuần tra bảo vệ trước ca, trong ca, giao ca, ghi sổ; các điểm cần kiểm tra, cách xử lý khi phát hiện cháy, gọi 114 và nghĩa vụ PCCC theo luật mới.', '/assets/img/photos/blog-tuan-tra.jpg', '<p>Một ca trực yên ổn không đến từ may mắn mà đến từ việc làm đúng <strong>quy trình tuần tra bảo vệ</strong> mỗi ngày. Với tòa nhà văn phòng hay chung cư, người bảo vệ là người đầu tiên nhìn thấy sự cố: một cửa thoát hiểm bị chèn, một ổ điện bốc mùi khét, một người lạ đi lòng vòng ở tầng hầm. Phát hiện sớm 5 phút có thể là khác biệt giữa một vụ chập điện nhỏ và một đám cháy lớn.</p>
<p>Bài viết này tổng hợp cách làm phổ biến tại các tòa nhà, chung cư: việc cần làm trước ca, trong ca, khi giao ca và cách ghi sổ. Phần sau hướng dẫn xử lý khi phát hiện cháy và những nghĩa vụ phòng cháy chữa cháy (PCCC) mà người làm bảo vệ nên nắm. Mỗi nơi làm việc có nội quy và phương án riêng, bạn luôn ưu tiên làm theo hướng dẫn của đội trưởng và ban quản lý tòa nhà.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/></svg></span><strong>Quy trình tuần tra bảo vệ tòa nhà, chung cư gồm những bước nào?</strong></h2>
<p>Dù tòa nhà lớn hay nhỏ, một ca trực thường đi qua 4 giai đoạn. Làm đủ cả 4 giai đoạn giúp bạn không bỏ sót điểm nguy hiểm và có bằng chứng rõ ràng nếu có chuyện xảy ra trong ca của mình.</p>
<div class="tv-process-wrap">
  <div class="tv-process-map" aria-hidden="true"><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/></svg></span><span class="tv-map-label"><small>Bước 1</small>Trước ca</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/></svg></span><span class="tv-map-label"><small>Bước 2</small>Trong ca</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/></svg></span><span class="tv-map-label"><small>Bước 3</small>Giao ca</span></div><div class="tv-map-item"><span class="tv-map-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/></svg></span><span class="tv-map-label"><small>Bước 4</small>Ghi sổ</span></div></div>
  <ol class="tv-process">
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">01</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/></svg></span><div><span class="tv-step-kicker">Bước 1</span><h3>Chuẩn bị trước khi nhận ca</h3></div></div>
        <p>Có mặt sớm 10 đến 15 phút, mặc đồng phục chỉnh tề, đeo thẻ. Kiểm tra bộ đàm (pin, kênh liên lạc), đèn pin, chìa khóa, gậy hoặc còi theo trang bị của mục tiêu.</p><p>Đọc sổ giao ca của ca trước: có việc gì đang dở, khu nào đang sửa chữa, căn hộ nào báo vắng nhà, xe nào gửi qua đêm. Nắm số điện thoại đội trưởng, ban quản lý, kỹ thuật tòa nhà và các số khẩn cấp 113, 114, 115.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Trang bị đủ, nắm tình hình</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">02</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/></svg></span><div><span class="tv-step-kicker">Bước 2</span><h3>Tuần tra theo tuyến và giờ quy định</h3></div></div>
        <p>Đi đúng tuyến đã được phân công, đủ các điểm kiểm tra, đúng tần suất (ví dụ 1 đến 2 tiếng một vòng tùy nội quy). Nên thay đổi nhẹ thứ tự hoặc thời điểm trong khung cho phép để kẻ xấu khó đoán quy luật.</p><p>Vừa đi vừa quan sát bằng cả mắt, mũi và tai: mùi khét, mùi gas, tiếng rò nước, tiếng chuông báo cháy, đèn sự cố tắt. Tòa nhà có điểm quẹt thẻ hoặc mã QR tuần tra thì quét đủ, không quét hộ, không quét bù.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Đủ điểm, đúng giờ</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">03</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/></svg></span><div><span class="tv-step-kicker">Bước 3</span><h3>Bàn giao rõ ràng cho ca sau</h3></div></div>
        <p>Bàn giao trực tiếp, không bỏ vị trí khi người nhận ca chưa tới. Đếm và giao lại chìa khóa, bộ đàm, sổ sách, tài sản tạm giữ, thẻ xe.</p><p>Nói rõ việc đang dở và điểm cần theo dõi tiếp. Hai bên cùng ký vào sổ giao ca, ghi giờ giao nhận.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Hai bên cùng ký sổ</span>
      </div>
    </li>
    <li class="tv-step">
      <div class="tv-step-rail"><span class="tv-step-num">04</span></div>
      <div class="tv-step-card">
        <div class="tv-step-head"><span class="tv-step-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/></svg></span><div><span class="tv-step-kicker">Bước 4</span><h3>Ghi sổ trực và báo cáo sự việc</h3></div></div>
        <p>Ghi ngay sau mỗi vòng tuần tra và mỗi sự việc: giờ, vị trí, hiện tượng, người liên quan, đã xử lý thế nào, đã báo cho ai. Viết ngắn, đúng sự thật, không tẩy xóa; ghi sai thì gạch một nét và ký bên cạnh.</p><p>Sự việc lớn (mất trộm, cháy, va chạm, người bị thương) cần báo đội trưởng ngay bằng điện thoại, sau đó mới làm biên bản theo mẫu của đơn vị.</p>
        <span class="tv-step-out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>Có bằng chứng khi cần</span>
      </div>
    </li>
  </ol>
  <p class="tv-process-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Một vòng tuần tra chung cư 20 tầng thường mất khoảng <strong>30 đến 45 phút</strong> nếu kiểm tra kỹ hành lang, cầu thang bộ và tầng hầm. Thời gian thực tế phụ thuộc tuyến tuần tra của từng nơi.</span></p>
</div>
<h3>Mẹo để tuần tra hiệu quả hơn</h3>
<ul><li>Luôn mang theo đèn pin kể cả ban ngày, vì tầng hầm và buồng kỹ thuật thường thiếu sáng.</li><li>Giữ liên lạc bộ đàm với chốt cổng, báo vị trí khi vào khu vắng như sân thượng, phòng máy.</li><li>Không đụng vào thiết bị kỹ thuật (tủ điện, máy bơm, máy phát) nếu không được giao. Thấy bất thường thì báo kỹ thuật tòa nhà.</li><li>Ghi nhận cả những việc nhỏ như bóng đèn cháy, cửa kẹt, vì đó là dấu hiệu sớm của nguy cơ lớn hơn.</li></ul>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></span><strong>Các điểm cần kiểm tra khi tuần tra</strong></h2>
<p>Danh sách dưới đây là các điểm hay gặp ở tòa nhà văn phòng và chung cư. Bạn nên xin đội trưởng sơ đồ tuyến tuần tra và bảng điểm kiểm tra cụ thể của mục tiêu mình trực.</p>
<div class="tbl-scroll"><table><thead><tr><th>Khu vực</th><th>Cần kiểm tra gì</th><th>Dấu hiệu bất thường</th></tr></thead><tbody><tr><td>Cửa ra vào, cổng</td><td>Khóa, chốt, camera, người và xe ra vào</td><td>Cửa không khóa ngoài giờ, người lạ đứng lâu</td></tr><tr><td>Cầu thang bộ, lối thoát nạn</td><td>Thông thoáng, cửa ngăn cháy tự đóng, đèn chỉ dẫn thoát nạn sáng</td><td>Chèn cửa, chất đồ, xe đạp, rác chắn lối</td></tr><tr><td>Hành lang các tầng</td><td>Đèn chiếu sáng, bình chữa cháy, hộp vòi chữa cháy</td><td>Bình mất chốt, kim áp suất ngoài vùng xanh, hộp vòi bị khóa</td></tr><tr><td>Tầng hầm, bãi xe</td><td>Xe đỗ đúng chỗ, sạc xe điện đúng khu, không rò xăng dầu</td><td>Sạc xe ở chỗ không cho phép, mùi xăng, khói</td></tr><tr><td>Phòng kỹ thuật, tủ điện</td><td>Cửa khóa, không có tiếng lạ, không mùi khét</td><td>Nóng bất thường, tia lửa, mùi nhựa cháy</td></tr><tr><td>Khu rác, kho</td><td>Đóng cửa, không có tàn thuốc, vật dễ cháy gọn gàng</td><td>Đốt rác, hút thuốc, đồ dễ cháy tràn ra lối đi</td></tr><tr><td>Sân thượng, mái</td><td>Cửa đóng theo nội quy, không người lạ</td><td>Có người ngồi uống rượu, hút thuốc, trẻ em chơi một mình</td></tr></tbody></table></div>
<p>Với bình chữa cháy, bạn chỉ cần nhìn nhanh 3 thứ: còn chốt an toàn và kẹp chì, kim đồng hồ (với bình bột) nằm ở vùng xanh, vỏ bình không móp, vòi không nứt. Thấy bình hỏng hoặc mất thì ghi sổ và báo ngay, không tự ý chuyển bình từ tầng khác sang.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4 0 7-2.8 7-6.8 0-3.4-2.3-5.6-4-7.7-.6 2-1.6 3.1-2.7 3.5C12.7 8 11.6 5 9 2.5 9 6.6 5 9.5 5 15.2 5 19.2 8 22 12 22z"/></svg></span><strong>Xử lý khi phát hiện cháy trong ca tuần tra</strong></h2>
<p>Nguyên tắc chung là <strong>báo động sớm, gọi lực lượng chữa cháy sớm, chỉ dập khi đám cháy còn nhỏ và an toàn cho bản thân</strong>. Tính mạng con người luôn đặt trước tài sản. Các bước dưới đây là cách làm phổ biến, bạn cần thuộc phương án chữa cháy riêng của cơ sở mình.</p>
<h3>1. Báo động và báo tin</h3>
<ul><li>Hô to "Cháy! Cháy!" và nhấn nút báo cháy khẩn cấp gần nhất (hộp màu đỏ trên tường).</li><li>Báo qua bộ đàm cho chốt trực và đội trưởng: vị trí chính xác (tầng, phòng, khu), loại vật đang cháy, có người mắc kẹt hay không.</li><li>Gọi <strong>114</strong> (Cảnh sát PCCC và cứu nạn, cứu hộ). Nói rõ địa chỉ tòa nhà, tầng cháy, đường vào thuận tiện nhất. Nếu có người bị thương gọi thêm 115.</li></ul>
<h3>2. Ngắt điện, gas khu vực cháy</h3>
<p>Nếu được phân công và an toàn, ngắt cầu dao điện khu vực cháy, khóa van gas. Không dùng nước dập đám cháy liên quan đến điện khi chưa ngắt điện.</p>
<h3>3. Dùng bình chữa cháy khi đám cháy còn nhỏ</h3>
<p>Cách dùng bình chữa cháy xách tay (bình bột, bình khí CO2) theo hướng dẫn phổ biến:</p>
<ol><li>Xách bình đến gần đám cháy, đứng ở đầu hướng gió, cách đám cháy khoảng 1,5 đến 2 mét. Với bình bột, lắc vài lần cho bột tơi.</li><li>Rút chốt an toàn.</li><li>Một tay cầm vòi hoặc loa phun hướng vào gốc lửa, không phun vào ngọn.</li><li>Tay còn lại bóp cò, phun và quét qua lại phủ kín gốc lửa đến khi tắt hẳn.</li></ol>
<p>Với bình CO2, không cầm tay trần vào loa phun vì khí phun ra rất lạnh, dễ gây bỏng lạnh. Không dùng bình CO2 ở phòng kín hẹp có người. Nếu sau 1 bình mà lửa vẫn lan, khói dày, hãy rút lui ngay, đóng cửa khu cháy lại (không khóa) để làm chậm khói lan.</p>
<h3>4. Hướng dẫn thoát nạn</h3>
<ul><li>Hướng dẫn cư dân, khách đi theo lối thoát nạn và cầu thang bộ, tuyệt đối không dùng thang máy.</li><li>Nhắc mọi người cúi thấp, che mũi miệng bằng khăn ướt nếu có khói. Ưu tiên trẻ em, người già, người khuyết tật.</li><li>Tập trung tại điểm tập kết, phối hợp đếm người, báo cho lực lượng chữa cháy khi họ tới: còn ai mắc kẹt, ở đâu.</li><li>Ra đón xe chữa cháy, mở cổng, dọn xe chắn đường vào.</li></ul>
<ul class="tv-harms">
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><div><h3>Dập lửa một mình mà không báo</h3><p>Mất thời gian vàng để gọi 114 và sơ tán. Luôn báo động trước hoặc song song khi dập.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span><div><h3>Dùng nước dập cháy điện</h3><p>Dễ bị điện giật và làm cháy lan. Phải ngắt điện trước hoặc dùng bình bột, CO2.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6v18h8"/><path d="M14 3l5 2v14l-5 2z"/><path d="M11 12h.01"/></svg></span><div><h3>Đi thang máy khi có cháy</h3><p>Thang có thể mất điện, dừng giữa chừng hoặc mở cửa ngay tầng cháy.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4 0 7-2.8 7-6.8 0-3.4-2.3-5.6-4-7.7-.6 2-1.6 3.1-2.7 3.5C12.7 8 11.6 5 9 2.5 9 6.6 5 9.5 5 15.2 5 19.2 8 22 12 22z"/></svg></span><div><h3>Phun vào ngọn lửa</h3><p>Lửa không tắt mà bình nhanh hết. Phải hướng vào gốc lửa và quét đều.</p></div></li>
</ul>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/></svg></span><strong>Nghĩa vụ PCCC liên quan đến công việc bảo vệ</strong></h2>
<p>Từ ngày 01/7/2025, hoạt động PCCC được điều chỉnh bởi <strong>Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15</strong> (Quốc hội thông qua ngày 29/11/2024). Hướng dẫn chi tiết nằm ở <strong>Nghị định 105/2025/NĐ-CP</strong> của Chính phủ (thay thế Nghị định 136/2020/NĐ-CP) và <strong>Thông tư 36/2025/TT-BCA</strong> của Bộ Công an. Các văn bản này đã có điều chỉnh, sửa đổi sau đó, nên khi cần chi tiết bạn hãy tra bản cập nhật mới nhất.</p>
<p>Với người làm bảo vệ, có thể hiểu ngắn gọn như sau:</p>
<ul class="tv-facts">
  <li class="tv-fact tv-fact--wide"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><p><small>Mọi người</small>Có trách nhiệm phòng cháy, báo cháy khi phát hiện và tham gia chữa cháy, cứu nạn trong khả năng</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/></svg></span><p><small>Người đứng đầu cơ sở</small>Chịu trách nhiệm về PCCC của tòa nhà, tổ chức lực lượng tại chỗ</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/></svg></span><p><small>Huấn luyện</small>Lực lượng tại chỗ được huấn luyện, diễn tập theo phương án của cơ sở</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg></span><p><small>Phương án</small>Cơ sở có phương án chữa cháy, cứu nạn, cứu hộ; bảo vệ cần thuộc phần việc của mình</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span><p><small>Số báo cháy</small>114, gọi miễn phí từ điện thoại cố định và di động</p></li>
</ul>
<p>Thực tế, bảo vệ tòa nhà thường được đưa vào đội PCCC cơ sở hoặc lực lượng chữa cháy tại chỗ. Vì vậy bạn nên chủ động hỏi ban quản lý về lịch huấn luyện, diễn tập, và tham gia đầy đủ. Đây cũng là kinh nghiệm được nhiều nhà tuyển dụng đánh giá cao, nhất là khi bạn ứng tuyển vào các mục tiêu lớn.</p>
<blockquote><p>Nhớ 3 việc: thấy cháy là hô hoán và bấm chuông, gọi 114 càng sớm càng tốt, chỉ dập khi lửa còn nhỏ và có đường lui.</p></blockquote>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span><strong>Áp dụng quy trình tuần tra bảo vệ khi đi làm thực tế</strong></h2>
<p>Theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, nhóm việc bảo vệ tòa nhà, chung cư chiếm hơn một nửa số tin (20 trên 36 tin), mức lương thường gặp từ khoảng 8 đến 9,5 triệu đồng/tháng, có tin cao hơn với vị trí đội trưởng hoặc mục tiêu đặc thù. Người nắm vững quy trình tuần tra và kỹ năng PCCC cơ bản thường dễ được nhận và dễ lên tổ trưởng hơn.</p>
<p>Bạn có thể xem các tin <a href="/viec-lam">việc làm bảo vệ đang tuyển</a> hoặc lọc theo khu vực như <a href="/viec-lam/tp-hcm">bảo vệ tại TP.HCM</a>, <a href="/viec-lam/ha-noi">bảo vệ tại Hà Nội</a>. Các mục tiêu tuần tra nhiều nhất là <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a> và <a href="/viec-lam-bao-ve-truong-hoc-benh-vien">bảo vệ trường học, bệnh viện</a>.</p>
<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Bao lâu thì đi tuần tra một vòng?</h3></summary>
    <div class="tv-faq-a"><p>Tùy nội quy từng mục tiêu. Nhiều tòa nhà quy định 1 đến 2 tiếng một vòng, ban đêm có thể dày hơn. Bạn làm đúng tần suất trong phương án bảo vệ và ghi giờ thực tế vào sổ.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Phát hiện cháy nhỏ có cần gọi 114 không?</h3></summary>
    <div class="tv-faq-a"><p>Nên báo động và báo đội trưởng ngay. Nếu đám cháy có dấu hiệu lan, có khói dày hoặc bạn không chắc dập được, hãy gọi 114 ngay. Gọi sớm luôn an toàn hơn gọi muộn.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Bảo vệ có bắt buộc phải biết dùng bình chữa cháy không?</h3></summary>
    <div class="tv-faq-a"><p>Người làm bảo vệ tòa nhà thường thuộc lực lượng tại chỗ nên cần biết sử dụng phương tiện chữa cháy ban đầu. Bạn nên tham gia các buổi huấn luyện, diễn tập do cơ sở tổ chức.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Ghi sổ trực sai có được sửa không?</h3></summary>
    <div class="tv-faq-a"><p>Không tẩy xóa hay xé trang. Gạch một nét vào chỗ sai, ghi lại thông tin đúng bên cạnh và ký tên. Sổ trực có thể là căn cứ khi xác minh sự việc.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Luật PCCC hiện hành là văn bản nào?</h3></summary>
    <div class="tv-faq-a"><p>Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15, có hiệu lực từ 01/7/2025, cùng Nghị định 105/2025/NĐ-CP và Thông tư 36/2025/TT-BCA hướng dẫn thi hành, kèm các văn bản sửa đổi, bổ sung sau đó.</p></div>
  </details>
</div>
<p class="note-src">Nguồn tham khảo: Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ số 55/2024/QH15; Nghị định 105/2025/NĐ-CP quy định chi tiết một số điều và biện pháp thi hành Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ; Thông tư 36/2025/TT-BCA; Thư viện Pháp luật; Cổng thông tin Bộ Xây dựng.</p>
', 1, 12850, 1793581200000, 1793581200000, 1795503709548);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('kinh-nghiem-phong-van-bao-ve', 'Phỏng vấn', 'Kinh nghiệm phỏng vấn bảo vệ: hồ sơ, 10 câu hỏi và cách trả lời', 'Kinh nghiệm phỏng vấn bảo vệ: hồ sơ cần mang, trang phục, 10 câu hỏi thường gặp kèm gợi ý trả lời, câu nên hỏi lại về lương, ca, BHXH và dấu hiệu lừa đảo.', '/assets/img/photos/blog-phong-van.jpg', '<p>Buổi <strong>phỏng vấn bảo vệ</strong> thường ngắn, chỉ 10 đến 20 phút, nhưng đủ để nhà tuyển dụng đánh giá bạn có đúng giờ, đứng đắn và đáng tin hay không. Nghề bảo vệ không đòi hỏi bằng cấp cao, vì vậy thái độ, sức khỏe và sự trung thực lại là thứ được nhìn kỹ nhất.</p>
<p>Bài viết này giúp bạn chuẩn bị từ A đến Z: hồ sơ nên mang, mặc gì, 10 câu hỏi hay gặp kèm gợi ý trả lời, những câu nên hỏi lại để biết rõ lương, ca, bảo hiểm, và các dấu hiệu cần cảnh giác để tránh bị lừa.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/></svg></span><strong>Chuẩn bị hồ sơ trước khi đi phỏng vấn bảo vệ</strong></h2>
<p>Mỗi công ty yêu cầu hơi khác nhau, bạn nên hỏi trước qua điện thoại. Bảng dưới đây là các giấy tờ thường gặp trong hồ sơ xin việc bảo vệ:</p>
<div class="tbl-scroll"><table><thead><tr><th>Giấy tờ</th><th>Ghi chú</th></tr></thead><tbody><tr><td>Đơn xin việc, sơ yếu lý lịch</td><td>Có thể mua bộ hồ sơ in sẵn ở hiệu sách, điền rõ ràng, không tẩy xóa</td></tr><tr><td>Bản sao căn cước công dân</td><td>Mang theo bản gốc để đối chiếu, chỉ nộp bản sao</td></tr><tr><td>Giấy khám sức khỏe</td><td>Thường yêu cầu khám trong vòng 6 tháng gần nhất</td></tr><tr><td>Bản sao bằng cấp, chứng chỉ (nếu có)</td><td>Bằng tốt nghiệp, giấy chứng nhận nghiệp vụ bảo vệ, chứng nhận huấn luyện PCCC</td></tr><tr><td>Ảnh thẻ 3x4 hoặc 4x6</td><td>Mang 2 đến 4 tấm, ảnh rõ mặt, nền trắng hoặc xanh</td></tr><tr><td>Giấy xác nhận cư trú, lý lịch tư pháp</td><td>Chỉ một số nơi yêu cầu, hỏi trước để chuẩn bị</td></tr><tr><td>Quyết định xuất ngũ (nếu có)</td><td>Là điểm cộng với nhiều công ty bảo vệ</td></tr></tbody></table></div>
<p>Chưa có chứng chỉ nghiệp vụ cũng đừng lo, nhiều công ty tổ chức đào tạo sau khi nhận. Bạn có thể bắt đầu từ <a href="/viec-lam-bao-ve-khong-can-kinh-nghiem">việc làm bảo vệ không cần kinh nghiệm</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z"/></svg></span><strong>Trang phục và tác phong khi đi phỏng vấn</strong></h2>
<ul><li>Áo sơ mi sáng màu hoặc áo có cổ, quần tây hoặc quần kaki tối màu, giày hoặc dép quai hậu sạch sẽ. Tránh quần đùi, dép lê, áo ba lỗ.</li><li>Tóc gọn gàng, râu cạo sạch, móng tay cắt ngắn. Nhà tuyển dụng bảo vệ rất để ý vẻ ngoài vì bạn sẽ là bộ mặt của tòa nhà.</li><li>Không uống rượu bia trước khi đi, hạn chế hút thuốc ngay trước giờ hẹn.</li><li>Đến sớm 10 đến 15 phút. Đi muộn trong buổi phỏng vấn bảo vệ gần như bị loại ngay, vì đúng giờ là yêu cầu số một của nghề.</li><li>Khi nói chuyện: đứng thẳng, nhìn vào người hỏi, trả lời rõ ràng, không cắt ngang.</li></ul>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span><strong>10 câu hỏi phỏng vấn bảo vệ thường gặp và gợi ý trả lời</strong></h2>
<p>Các câu hỏi dưới đây được chia thành 3 nhóm. Bạn không cần học thuộc, chỉ cần nắm ý chính và trả lời bằng lời của mình, thật thà và ngắn gọn.</p>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><div><span class="tv-panel-no">Nhóm 1 · Câu 1 đến 3</span><h3>Câu hỏi về bản thân</h3></div></div>
  <p><strong>1. Bạn giới thiệu đôi chút về bản thân?</strong> Nêu tên, tuổi, quê, nơi ở hiện tại, công việc trước đây và lý do muốn làm bảo vệ. Khoảng 4 đến 5 câu là đủ.</p>
  <p><strong>2. Vì sao bạn nghỉ chỗ làm cũ?</strong> Nói thật nhưng tích cực, ví dụ chỗ cũ xa nhà, hết hợp đồng, muốn công việc ổn định hơn. Không nói xấu công ty cũ.</p>
  <p><strong>3. Sức khỏe của bạn thế nào, có đứng trực lâu được không?</strong> Trả lời trung thực. Nếu có bệnh như huyết áp, đau lưng thì nói rõ để được xếp vị trí phù hợp, tránh giấu rồi gặp chuyện khi đang trực.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><div><span class="tv-panel-no">Nhóm 2 · Câu 4 đến 6</span><h3>Câu hỏi về ca làm và kỷ luật</h3></div></div>
  <p><strong>4. Bạn có làm được ca đêm, ca 12 tiếng không?</strong> Nói rõ những ca bạn làm được. Nếu chỉ làm được ca ngày, hãy nói luôn, đừng nhận bừa rồi xin nghỉ sau một tuần.</p>
  <p><strong>5. Bạn có làm được ngày lễ, Tết không?</strong> Bảo vệ thường phải trực lễ. Có thể hỏi lại cách tính lương ngày lễ tại công ty.</p>
  <p><strong>6. Nếu bạn buồn ngủ giữa ca đêm thì làm gì?</strong> Gợi ý: ngủ đủ trước ca, đứng dậy đi tuần, rửa mặt, uống nước; tuyệt đối không ngủ gật hay bỏ vị trí. Câu này kiểm tra ý thức kỷ luật của bạn.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/></svg></span><div><span class="tv-panel-no">Nhóm 3 · Câu 7 đến 10</span><h3>Câu hỏi tình huống nghiệp vụ</h3></div></div>
  <p><strong>7. Có người lạ muốn vào tòa nhà mà không có thẻ, bạn xử lý thế nào?</strong> Lịch sự hỏi tên, lý do, người cần gặp; gọi xác nhận với cư dân hoặc lễ tân; ghi sổ khách và giữ giấy tờ theo đúng quy định của tòa nhà. Không cho vào khi chưa xác nhận.</p>
  <p><strong>8. Cư dân cãi nhau, to tiếng với bạn thì sao?</strong> Bình tĩnh, không đôi co, không động tay. Lắng nghe, giải thích nội quy, báo đội trưởng hoặc ban quản lý nếu căng thẳng.</p>
  <p><strong>9. Khi phát hiện cháy bạn làm gì đầu tiên?</strong> Hô hoán, bấm chuông báo cháy, báo đội trưởng và gọi 114, ngắt điện nếu được, dùng bình chữa cháy khi lửa còn nhỏ, hướng dẫn mọi người thoát nạn bằng cầu thang bộ.</p>
  <p><strong>10. Bạn nhặt được ví hoặc điện thoại của cư dân thì sao?</strong> Ghi sổ, báo đội trưởng, bàn giao cho ban quản lý theo quy trình, có ký nhận. Câu này kiểm tra sự trung thực, hãy trả lời dứt khoát.</p>
</div>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg></span><strong>Câu nên hỏi lại nhà tuyển dụng</strong></h2>
<p>Cuối buổi phỏng vấn, nhà tuyển dụng thường hỏi "Bạn có câu hỏi gì không?". Đây là lúc bạn làm rõ quyền lợi. Hỏi kỹ không làm bạn mất điểm, ngược lại cho thấy bạn nghiêm túc với công việc.</p>
<ul class="tv-reasons">
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg></span><div><h3>Lương bao nhiêu, gồm những khoản nào?</h3><p>Hỏi lương cơ bản, phụ cấp, tiền tăng ca, lương ngày lễ. Lương thử việc theo Bộ luật Lao động 2019 phải ít nhất bằng 85% lương chính thức của công việc đó.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><div><h3>Ca làm mấy tiếng, xoay ca thế nào?</h3><p>Ca 8 tiếng hay 12 tiếng, có xoay ca đêm không, mỗi tháng được nghỉ mấy ngày, nghỉ có bị trừ lương không.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6z"/></svg></span><div><h3>Có ký hợp đồng và đóng BHXH không?</h3><p>Hỏi bao giờ ký hợp đồng lao động, từ tháng nào đóng bảo hiểm xã hội, bảo hiểm y tế.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 3 6l2 5 2-1v11h10V10l2 1 2-5-5-3a4 4 0 0 1-8 0z"/></svg></span><div><h3>Đồng phục có mất tiền không?</h3><p>Đồng phục cấp miễn phí hay trừ lương, có phải đặt cọc không, nghỉ việc có phải trả lại không.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span><div><h3>Ngày nào trả lương, trả bằng cách nào?</h3><p>Trả vào ngày cố định mỗi tháng, chuyển khoản hay tiền mặt, tháng đầu có bị giữ lương không.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/></svg></span><div><h3>Làm ở mục tiêu nào, có bị điều chuyển không?</h3><p>Hỏi địa chỉ mục tiêu cụ thể, có ăn ở tại chỗ không, có bị chuyển sang mục tiêu xa mà không báo trước không.</p></div></li>
</ul>
<p>Để có cơ sở so sánh: theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026 (36 tin), mức lương thường gặp nằm trong khoảng 7,75 đến 9,75 triệu đồng/tháng, phần lớn tin ghi có tham gia BHXH theo quy định. Bạn có thể xem các tin <a href="/viec-lam-bao-ve-luong-cao">việc làm bảo vệ lương cao</a> hoặc <a href="/viec-lam-bao-ve-ca-12-tieng">việc làm bảo vệ ca 12 tiếng</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span><strong>Dấu hiệu cần cảnh giác khi phỏng vấn bảo vệ</strong></h2>
<p>Phần lớn công ty bảo vệ làm ăn nghiêm túc, nhưng vẫn có nơi lợi dụng người cần việc gấp. Nếu gặp một trong các dấu hiệu sau, hãy dừng lại và tìm hiểu kỹ trước khi nộp tiền hay giấy tờ.</p>
<ul class="tv-harms">
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg></span><div><h3>Đòi đặt cọc, thu phí hồ sơ</h3><p>Bộ luật Lao động 2019 cấm người sử dụng lao động buộc người lao động thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản cho việc thực hiện hợp đồng.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span><div><h3>Giữ bản gốc giấy tờ</h3><p>Giữ bản chính căn cước, văn bằng, chứng chỉ của người lao động cũng là hành vi bị cấm theo Điều 17 Bộ luật Lao động 2019.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></svg></span><div><h3>Không ký hợp đồng, hứa miệng</h3><p>Chỉ nói "làm đi rồi tính", không có hợp đồng lao động hay thỏa thuận thử việc bằng văn bản.</p></div></li>
  <li class="tv-harm"><span class="tv-harm-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span><div><h3>Lương cao bất thường</h3><p>Lương hứa cao hơn hẳn mặt bằng nhưng không rõ mục tiêu, không rõ công ty, phỏng vấn ở quán cà phê.</p></div></li>
</ul>
<p>Nếu cần đi làm ngay, xem các tin <a href="/viec-lam-bao-ve-tuyen-gap">việc làm bảo vệ tuyển gấp</a> và nhớ kiểm tra công ty trước khi đi làm.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg></span><strong>Sau buổi phỏng vấn bảo vệ nên làm gì?</strong></h2>
<ul><li>Cảm ơn người phỏng vấn, hỏi rõ khi nào có kết quả và ai sẽ liên hệ.</li><li>Ghi lại tên người phỏng vấn, số điện thoại, mức lương và ca làm đã trao đổi để đối chiếu khi ký hợp đồng.</li><li>Nếu sau 2 đến 3 ngày chưa có tin, bạn có thể gọi lại hỏi lịch sự một lần.</li><li>Khi được nhận, đọc kỹ hợp đồng: mức lương, thời gian thử việc, ca làm, BHXH phải khớp với những gì đã nói. Chỗ nào chưa rõ thì hỏi trước khi ký.</li><li>Trượt thì đừng nản, tiếp tục nộp ở các tin khác. Nhiều nơi tuyển liên tục, nhất là tòa nhà và khu công nghiệp.</li></ul>
<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Đi phỏng vấn bảo vệ cần mang những gì?</h3></summary>
    <div class="tv-faq-a"><p>Thường gồm sơ yếu lý lịch, đơn xin việc, bản sao căn cước công dân kèm bản gốc để đối chiếu, giấy khám sức khỏe, ảnh thẻ và bản sao bằng cấp, chứng chỉ nếu có. Nên gọi hỏi trước vì mỗi nơi yêu cầu khác nhau.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Chưa có kinh nghiệm có xin làm bảo vệ được không?</h3></summary>
    <div class="tv-faq-a"><p>Được. Nhiều công ty nhận người chưa có kinh nghiệm và đào tạo nghiệp vụ. Bạn chỉ cần đủ sức khỏe, trung thực và nghiêm túc với giờ giấc.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Công ty giữ căn cước bản gốc có đúng không?</h3></summary>
    <div class="tv-faq-a"><p>Không đúng. Điều 17 Bộ luật Lao động 2019 cấm người sử dụng lao động giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Lương thử việc bảo vệ tối thiểu bao nhiêu?</h3></summary>
    <div class="tv-faq-a"><p>Theo Bộ luật Lao động 2019, lương thử việc do hai bên thỏa thuận nhưng ít nhất bằng 85% mức lương của công việc đó.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Có nên hỏi về lương ngay khi phỏng vấn không?</h3></summary>
    <div class="tv-faq-a"><p>Nên. Hỏi lịch sự về lương, ca làm, BHXH, ngày trả lương là chuyện bình thường. Nơi né tránh những câu này là dấu hiệu cần cân nhắc.</p></div>
  </details>
</div>
<p class="note-src">Nguồn tham khảo: Bộ luật Lao động 2019 (số 45/2019/QH14), Điều 17, Điều 25, Điều 26; Thư viện Pháp luật; dữ liệu tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026.</p>
', 1, 9310, 1793149200000, 1793149200000, 1795503709548);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('ca-12-tieng-co-dung-luat', 'Pháp lý', 'Ca 12 tiếng bảo vệ có đúng luật? Giờ làm thêm, lương đêm 2026', 'Ca 12 tiếng bảo vệ có đúng luật không? Giới hạn làm thêm 40 giờ/tháng, 200 giờ/năm, tiền tăng ca 150-300%, làm đêm cộng 30% và ví dụ tính lương dễ hiểu.', '/assets/img/photos/blog-ca-12.jpg', '<p>Phần lớn tin tuyển bảo vệ hiện nay đều ghi "ca 12 tiếng". Nhiều người đi làm nhiều năm vẫn chưa rõ <strong>ca 12 tiếng bảo vệ</strong> có đúng luật hay không, 4 tiếng dôi ra có được tính tăng ca không, và làm đêm thì được cộng thêm bao nhiêu. Bài này tóm tắt các quy định của Bộ luật Lao động 2019 và Nghị định 145/2020/NĐ-CP theo cách dễ hiểu, kèm ví dụ tính lương để bạn tự đối chiếu với bảng lương của mình.</p>
<p>Lưu ý: bài viết mang tính tham khảo. Khi có tranh chấp, bạn nên đối chiếu nguyên văn văn bản luật hoặc hỏi Công đoàn, cơ quan quản lý lao động tại địa phương.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><strong>Ca 12 tiếng bảo vệ có đúng luật không?</strong></h2>
<p>Câu trả lời ngắn: ca 12 tiếng không bị cấm, nhưng 12 tiếng đó không thể là 12 giờ làm việc bình thường. Luật giới hạn giờ làm việc bình thường mỗi ngày, phần vượt quá phải được tính là làm thêm giờ, có sự đồng ý của bạn và được trả lương cao hơn.</p>
<p>Nói cách khác, một ca 12 tiếng hợp pháp thường gồm 8 đến 10 giờ làm việc bình thường cộng 2 đến 4 giờ làm thêm. Nếu công ty trả một mức lương "khoán" cho cả 12 tiếng mà không tách phần làm thêm, bạn nên hỏi lại cách tính trước khi nhận việc.</p>
<ul class="tv-facts">
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><p><small>Giờ làm bình thường</small>Tối đa 8 giờ/ngày, 48 giờ/tuần</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg></span><p><small>Nếu tính theo tuần</small>Tối đa 10 giờ/ngày, 48 giờ/tuần</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span><p><small>Giờ làm việc ban đêm</small>Từ 22 giờ đến 6 giờ sáng hôm sau</p></li>
  <li class="tv-fact"><span class="tv-fact-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4"/></svg></span><p><small>Tổng giờ trong 1 ngày</small>Bình thường cộng làm thêm không quá 12 giờ</p></li>
</ul>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg></span><strong>Thời giờ làm việc bình thường theo Bộ luật Lao động 2019</strong></h2>
<p>Theo Điều 105 Bộ luật Lao động 2019, thời giờ làm việc bình thường không quá 8 giờ trong 1 ngày và không quá 48 giờ trong 1 tuần. Công ty có quyền quy định giờ làm theo ngày hoặc theo tuần, nhưng phải thông báo cho người lao động biết.</p>
<p>Nếu công ty tính giờ làm theo tuần, giờ làm bình thường không quá 10 giờ trong 1 ngày và vẫn không quá 48 giờ trong 1 tuần. Đây là lý do nhiều đơn vị bảo vệ xếp ca 12 tiếng nhưng cho nghỉ xen kẽ, để tổng giờ trong tuần không vượt mức.</p>
<p>Điều 106 quy định giờ làm việc ban đêm tính từ 22 giờ đến 6 giờ sáng ngày hôm sau. Với bảo vệ trực ca đêm 18h-6h hoặc 19h-7h, phần lớn thời gian trong ca rơi vào khung giờ này nên được hưởng thêm tiền làm đêm.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg></span><strong>Giới hạn làm thêm giờ: theo ngày, tháng, năm</strong></h2>
<p>Điều 107 Bộ luật Lao động 2019 và Điều 60 Nghị định 145/2020/NĐ-CP đặt ra các giới hạn làm thêm giờ. Công ty chỉ được cho bạn làm thêm khi bạn đồng ý, và phải nằm trong các mức sau:</p>
<ul>
  <li><strong>Theo ngày:</strong> số giờ làm thêm không quá 50% số giờ làm việc bình thường trong ngày. Tổng giờ làm bình thường và làm thêm không quá 12 giờ trong 1 ngày.</li>
  <li><strong>Theo tháng:</strong> không quá 40 giờ làm thêm trong 1 tháng.</li>
  <li><strong>Theo năm:</strong> không quá 200 giờ làm thêm trong 1 năm.</li>
  <li><strong>Trường hợp đặc biệt:</strong> được làm thêm tối đa 300 giờ trong 1 năm, nhưng công ty phải thông báo cho cơ quan chuyên môn về lao động thuộc Ủy ban nhân dân cấp tỉnh.</li>
</ul>
<h3>Những trường hợp được làm thêm tới 300 giờ/năm</h3>
<p>Khoản 3 Điều 107 chỉ cho phép mức 300 giờ/năm với một số ngành, công việc cụ thể, gồm:</p>
<ul>
  <li>Sản xuất, gia công hàng dệt, may, da, giày, điện, điện tử; chế biến nông, lâm, diêm nghiệp, thủy sản.</li>
  <li>Sản xuất, cung cấp điện, viễn thông, lọc dầu; cấp, thoát nước.</li>
  <li>Công việc đòi hỏi lao động có trình độ chuyên môn, kỹ thuật cao mà thị trường không cung ứng đầy đủ, kịp thời.</li>
  <li>Công việc cấp bách, không thể trì hoãn do tính chất thời vụ, thời điểm của nguyên liệu, sản phẩm.</li>
  <li>Công việc phát sinh do yếu tố khách quan không dự liệu trước như thời tiết, thiên tai, hỏa hoạn, thiếu điện, thiếu nguyên liệu, sự cố kỹ thuật.</li>
  <li>Các trường hợp khác do Chính phủ quy định.</li>
</ul>
<p>Dịch vụ bảo vệ không nằm trong nhóm ngành được nêu đích danh. Vì vậy, với phần lớn bảo vệ, bạn nên lấy mốc 40 giờ/tháng và 200 giờ/năm để tự kiểm tra.</p>
<h3>Làm thử phép tính: ca 12 tiếng mỗi ngày có vượt giới hạn không?</h3>
<p>Nếu công ty tính theo ngày (8 giờ bình thường), mỗi ca 12 tiếng có 4 giờ làm thêm. Chỉ cần làm 10 ca như vậy là đã đủ 40 giờ làm thêm của cả tháng. Làm 26 ca 12 tiếng trong tháng sẽ thành 104 giờ làm thêm, vượt xa mức luật cho phép.</p>
<p>Nếu công ty tính theo tuần (10 giờ bình thường/ngày), mỗi ca 12 tiếng chỉ có 2 giờ làm thêm, nhưng tổng giờ bình thường vẫn phải dưới 48 giờ/tuần. Thực tế, cách xếp như "làm 1 ca 12 tiếng, nghỉ 24 tiếng" hoặc "2 ngày, 2 đêm, 2 nghỉ" giúp tổng giờ gần với giới hạn hơn. Trong các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026 có tin ghi rõ "ca 12 tiếng gồm 8 tiếng chính và 4 tiếng tăng ca", hoặc "đi ca 12 tiếng, nghỉ liên tục 24 tiếng". Đó là cách ghi minh bạch bạn nên ưu tiên.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="15" r="1.5"/></svg></span><strong>Tiền lương làm thêm giờ và làm đêm cho ca 12 tiếng bảo vệ</strong></h2>
<p>Điều 98 Bộ luật Lao động 2019, hướng dẫn tại Điều 55, 56 và 57 Nghị định 145/2020/NĐ-CP, quy định mức trả tối thiểu như bảng dưới. "Lương giờ" là tiền lương giờ của công việc bạn đang làm vào ngày làm việc bình thường.</p>
<div class="tbl-scroll">
<table>
  <thead>
    <tr><th>Trường hợp</th><th>Mức trả tối thiểu</th><th>Ghi chú</th></tr>
  </thead>
  <tbody>
    <tr><td>Làm thêm vào ngày thường</td><td>150% lương giờ</td><td>Ví dụ 4 giờ dôi ra trong ca 12 tiếng</td></tr>
    <tr><td>Làm thêm vào ngày nghỉ hằng tuần</td><td>200% lương giờ</td><td>Ngày nghỉ theo lịch công ty, thường là Chủ nhật</td></tr>
    <tr><td>Làm thêm vào ngày lễ, Tết, ngày nghỉ có hưởng lương</td><td>300% lương giờ</td><td>Chưa kể tiền lương ngày lễ, Tết mà bạn vẫn được hưởng</td></tr>
    <tr><td>Làm việc vào ban đêm (22h-6h), trong giờ bình thường</td><td>Cộng thêm ít nhất 30% lương giờ</td><td>Áp dụng cho từng giờ làm trong khung đêm</td></tr>
    <tr><td>Làm thêm giờ vào ban đêm</td><td>Mức làm thêm tương ứng + 30% làm đêm + 20% lương giờ ban ngày</td><td>Ví dụ ngày thường: 150% + 30% + 20%, tính trên lương giờ</td></tr>
  </tbody>
</table>
</div>
<p>Nhiều tin tuyển dụng ghi "làm đêm cộng 30%, lễ Tết hưởng 300%". Đó là mức tối thiểu theo luật, công ty có thể trả cao hơn nhưng không được thấp hơn.</p>
<h3>Lương tối thiểu vùng năm 2026</h3>
<p>Lương cho giờ làm bình thường cũng không được thấp hơn lương tối thiểu vùng. Theo Nghị định 293/2025/NĐ-CP, áp dụng từ 01/01/2026, mức lương tối thiểu tháng là 5.310.000 đồng (vùng I), 4.730.000 đồng (vùng II), 4.140.000 đồng (vùng III) và 3.700.000 đồng (vùng IV). Phần tiền tăng ca, làm đêm được tính thêm ngoài mức này.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h3M8 18h3M14 14h2v4h-2z"/></svg></span><strong>Ví dụ tính lương ca 12 tiếng (minh họa)</strong></h2>
<p>Ví dụ dưới đây chỉ để minh họa cách tính, không phải mức lương của một công ty cụ thể. Bảng lương thật còn phụ thuộc hợp đồng, quy chế lương và cách công ty xác định giờ làm bình thường trong ca.</p>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span><div><span class="tv-panel-no">Giả định</span><h3>Lương 7.000.000 đồng/tháng cho 26 ngày x 8 giờ</h3></div></div>
  <p>Lương giờ = 7.000.000 : (26 x 8) = khoảng 33.650 đồng/giờ. Công ty tính giờ làm theo ngày, mỗi ca có 8 giờ bình thường và 4 giờ làm thêm.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><div><span class="tv-panel-no">Ca ngày 7h-19h</span><h3>4 giờ làm thêm vào ngày thường</h3></div></div>
  <p>Tiền làm thêm = 4 x 33.650 x 150% = khoảng 201.900 đồng/ca. Nếu ca này rơi vào Chủ nhật là ngày nghỉ hằng tuần, mức 200% áp dụng thay cho 150%.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span><div><span class="tv-panel-no">Ca đêm 19h-7h</span><h3>Có cả giờ đêm và giờ làm thêm ban đêm</h3></div></div>
  <p>Giả định 8 giờ đầu (19h-3h) là giờ bình thường, 4 giờ sau (3h-7h) là làm thêm. Phần cộng thêm gồm:</p>
  <ul>
    <li>Làm đêm trong giờ bình thường (22h-3h, 5 giờ): 5 x 33.650 x 30% = khoảng 50.500 đồng.</li>
    <li>Làm thêm ban đêm (3h-6h, 3 giờ): 3 x 33.650 x (150% + 30% + 20%) = khoảng 201.900 đồng.</li>
    <li>Làm thêm ban ngày (6h-7h, 1 giờ): 1 x 33.650 x 150% = khoảng 50.500 đồng.</li>
  </ul>
  <p>Tổng phần cộng thêm của ca đêm khoảng 302.900 đồng, cao hơn ca ngày khoảng 100.000 đồng.</p>
</div>
<p>Hãy nhớ giới hạn 40 giờ làm thêm/tháng ở phần trên. Theo ví dụ này, chỉ 10 ca 12 tiếng đã chạm mức tối đa. Nếu bạn làm nhiều ca hơn mà bảng lương không thay đổi cách tính, hãy hỏi phòng nhân sự xem giờ làm được xếp theo ngày hay theo tuần.</p>
<p>Để so sánh, theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, 8 tin ghi rõ ca 12 tiếng có mức lương nêu trong tin từ khoảng 7 đến 14 triệu đồng/tháng, tùy tỉnh và loại mục tiêu. Bạn có thể xem các tin <a href="/viec-lam-bao-ve-luong-cao">việc làm bảo vệ lương cao</a> để biết mặt bằng thu nhập.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg></span><strong>Nghỉ giữa ca, nghỉ chuyển ca và nghỉ hằng tuần</strong></h2>
<p>Ca dài càng cần được nghỉ đúng luật. Đây là các mốc chính của Bộ luật Lao động 2019:</p>
<ul class="tv-reasons">
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/></svg></span><div><h3>Nghỉ giữa giờ</h3><p>Làm từ 6 giờ trở lên trong 1 ngày được nghỉ liên tục ít nhất 30 phút, làm ban đêm ít nhất 45 phút (Điều 109). Làm theo ca liên tục từ 6 giờ trở lên thì thời gian nghỉ giữa giờ được tính vào giờ làm việc.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span><div><h3>Nghỉ chuyển ca</h3><p>Người làm theo ca được nghỉ ít nhất 12 giờ trước khi chuyển sang ca làm việc khác (Điều 110). Đổi từ ca đêm sang ca ngày liền nhau là không đúng.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="m9 15 2 2 4-4"/></svg></span><div><h3>Nghỉ hằng tuần</h3><p>Mỗi tuần được nghỉ ít nhất 24 giờ liên tục. Nếu vì tính chất công việc không thể nghỉ hằng tuần, công ty phải bảo đảm bình quân 1 tháng nghỉ ít nhất 4 ngày (Điều 111).</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><div><h3>Không ép làm thêm</h3><p>Làm thêm giờ phải được bạn đồng ý (Điều 107). Từ chối tăng ca ngoài giới hạn luật không phải là vi phạm kỷ luật.</p></div></li>
</ul>
<p>Mục tiêu bảo vệ thường phải có người trực liên tục, nên công ty cần bố trí người thay để bạn được nghỉ giữa ca. Nếu bạn phải ăn cơm ngay tại chốt và không được rời vị trí, hãy hỏi rõ thời gian đó có được tính là giờ làm hay không.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="m9 15 2 2 4-4"/></svg></span><strong>Người làm ca 12 tiếng bảo vệ nên kiểm tra gì trong hợp đồng?</strong></h2>
<p>Trước khi ký, hãy đọc kỹ hợp đồng lao động và hỏi lại những điểm sau. Chụp lại hợp đồng và bảng lương mỗi tháng để có căn cứ khi cần.</p>
<ol>
  <li><strong>Giờ làm bình thường mỗi ca:</strong> hợp đồng ghi 8 giờ hay 10 giờ, tính theo ngày hay theo tuần.</li>
  <li><strong>Lương cơ bản và lương giờ:</strong> lương cơ bản có bằng hoặc cao hơn lương tối thiểu vùng, và công ty dùng con số nào để tính lương giờ.</li>
  <li><strong>Cách trả tiền làm thêm và làm đêm:</strong> có tách 150%, 200%, 300% và phụ cấp đêm 30% hay gộp vào một mức "khoán".</li>
  <li><strong>Lịch xoay ca:</strong> bao nhiêu ca mỗi tháng, ngày nghỉ hằng tuần là ngày nào, có nghỉ đủ 12 giờ khi đổi ca không.</li>
  <li><strong>Bảo hiểm xã hội:</strong> hợp đồng từ 1 tháng trở lên phải tham gia bảo hiểm xã hội bắt buộc theo quy định hiện hành.</li>
  <li><strong>Các khoản trừ lương:</strong> tiền đồng phục, tiền cọc, phí đào tạo. Khoản thu trước khi đi làm là dấu hiệu cần thận trọng.</li>
</ol>
<blockquote><p>Mẹo nhỏ: khi phỏng vấn, hãy hỏi thẳng "Ca 12 tiếng thì mấy tiếng là tăng ca, tăng ca tính bao nhiêu phần trăm?". Công ty làm đúng sẽ trả lời rõ ràng và ghi được ra giấy.</p></blockquote>
<p>Nếu đang tìm việc, bạn có thể xem riêng <a href="/viec-lam-bao-ve-ca-12-tieng">việc làm bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">việc làm bảo vệ ca 8 tiếng</a>, hoặc xem toàn bộ <a href="/viec-lam">việc làm bảo vệ đang tuyển</a> để so sánh tin ghi rõ giờ tăng ca.</p>

<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Ca 12 tiếng bảo vệ có phạm luật không?</h3></summary>
    <div class="tv-faq-a"><p>Không phạm luật nếu 12 tiếng được chia thành giờ làm bình thường và giờ làm thêm, bạn đồng ý làm thêm, tổng giờ làm thêm không quá 40 giờ/tháng và 200 giờ/năm, và phần làm thêm được trả ít nhất 150% vào ngày thường.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Làm ca đêm bảo vệ được cộng thêm bao nhiêu?</h3></summary>
    <div class="tv-faq-a"><p>Giờ làm từ 22h đến 6h được cộng thêm ít nhất 30% lương giờ. Nếu giờ đó còn là giờ làm thêm thì được trả mức làm thêm tương ứng, cộng 30% làm đêm và thêm 20% lương giờ ban ngày theo Điều 98 Bộ luật Lao động 2019.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Bảo vệ có được làm thêm tới 300 giờ/năm không?</h3></summary>
    <div class="tv-faq-a"><p>Mức 300 giờ/năm chỉ áp dụng cho một số ngành, công việc nêu tại khoản 3 Điều 107, và công ty phải thông báo cho cơ quan quản lý lao động cấp tỉnh. Dịch vụ bảo vệ không nằm trong nhóm ngành được nêu đích danh, nên thông thường vẫn áp dụng mức 200 giờ/năm.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Trực lễ Tết thì tính lương thế nào?</h3></summary>
    <div class="tv-faq-a"><p>Làm thêm vào ngày lễ, Tết được trả ít nhất 300% lương giờ, chưa kể tiền lương của ngày lễ, Tết mà bạn vẫn được hưởng. Nếu làm vào ban đêm của ngày lễ thì cộng thêm phần làm đêm.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Công ty trả lương khoán cho ca 12 tiếng có đúng không?</h3></summary>
    <div class="tv-faq-a"><p>Lương khoán không bị cấm, nhưng tổng tiền nhận được không được thấp hơn số tiền tính đúng theo luật, gồm lương giờ bình thường, tiền làm thêm và làm đêm. Bạn nên đề nghị công ty ghi rõ cách tính trong hợp đồng hoặc phiếu lương.</p></div>
  </details>
</div>
<p class="note-src">Nguồn tham khảo: Bộ luật Lao động 2019 (Điều 98, 105, 106, 107, 109, 110, 111); Nghị định 145/2020/NĐ-CP quy định chi tiết một số điều của Bộ luật Lao động về điều kiện lao động và quan hệ lao động; Nghị định 293/2025/NĐ-CP quy định mức lương tối thiểu đối với người lao động làm việc theo hợp đồng lao động; Thư viện Pháp luật; LuatVietnam.</p>
', 1, 7640, 1792458000000, 1792458000000, 1795503709548);
INSERT INTO posts (slug, cat, title, excerpt, cover, content, published, views, published_at, created_at, updated_at) VALUES ('chung-chi-bao-ve-can-co', 'Nghề nghiệp', 'Chứng chỉ bảo vệ cần có gì? Nghiệp vụ, PCCC, sơ cứu, võ thuật', 'Chứng chỉ bảo vệ theo Nghị định 96/2016 sửa đổi: ai bắt buộc phải có, học nghiệp vụ ở đâu, chứng nhận PCCC, sơ cấp cứu, võ thuật và lợi ích về lương.', '/assets/img/photos/blog-chung-chi.jpg', '<p>Khi nộp hồ sơ làm bảo vệ, nhiều người hỏi: chưa có <strong>chứng chỉ bảo vệ</strong> thì có được nhận không, học ở đâu, mất bao lâu, và có chứng chỉ thì lương có cao hơn không. Bài này giải thích quy định hiện hành về đào tạo nghiệp vụ bảo vệ, các loại chứng nhận nên có như phòng cháy chữa cháy, sơ cấp cứu, võ thuật, và cách đi học sao cho đúng, không tốn tiền oan.</p>
<p>Thông tin pháp lý trong bài được tóm tắt để dễ hiểu. Khi cần làm thủ tục, bạn nên hỏi trực tiếp công ty tuyển dụng hoặc cơ quan Công an nơi công ty đăng ký.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg></span><strong>Chứng chỉ bảo vệ là gì và ai bắt buộc phải có?</strong></h2>
<p>Tên gọi chính thức trong văn bản pháp luật là <strong>Chứng chỉ nghiệp vụ bảo vệ</strong>. Đây là giấy xác nhận bạn đã qua đào tạo và đạt yêu cầu sát hạch về nghiệp vụ bảo vệ.</p>
<p>Kinh doanh dịch vụ bảo vệ là ngành nghề kinh doanh có điều kiện về an ninh, trật tự, được quy định tại Nghị định 96/2016/NĐ-CP. Nghị định này đã được sửa đổi, bổ sung bởi Nghị định 56/2023/NĐ-CP (hiệu lực từ 15/08/2023) và tiếp tục được sửa một số điều bởi Nghị định 58/2026/NĐ-CP. Thông tư 42/2017/TT-BCA của Bộ Công an hướng dẫn chi tiết, trong đó có các biểu mẫu về quản lý đào tạo nhân viên dịch vụ bảo vệ.</p>
<p>Theo các văn bản này, doanh nghiệp kinh doanh dịch vụ bảo vệ chỉ được sử dụng nhân viên đã qua đào tạo và có Chứng chỉ nghiệp vụ bảo vệ. Nghị định 56/2023/NĐ-CP đã sửa quy định về thẩm quyền cấp chứng chỉ và bổ sung quy định về hình thức đào tạo nhân viên dịch vụ bảo vệ. Chứng chỉ do công ty bảo vệ tự in, tự cấp không có giá trị.</p>
<h3>Bảo vệ nội bộ có cần chứng chỉ không?</h3>
<p>Quy định trên áp dụng cho nhân viên của doanh nghiệp kinh doanh dịch vụ bảo vệ, tức công ty đưa người đi bảo vệ tại tòa nhà, nhà máy, ngân hàng của khách hàng. Nếu bạn là bảo vệ nội bộ do chính nhà máy, tòa nhà tuyển trực tiếp, yêu cầu về chứng chỉ tùy chính sách nơi đó. Tuy vậy, nhiều nơi vẫn ưu tiên người đã có chứng chỉ hoặc đã từng được đào tạo.</p>
<h3>Chưa có chứng chỉ có được nhận việc không?</h3>
<p>Có. Trong các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, nhiều tin ghi "không cần kinh nghiệm, được đào tạo" hoặc "đào tạo nghiệp vụ trước khi làm". Thông thường công ty dịch vụ bảo vệ sẽ tổ chức hoặc gửi bạn đi đào tạo và sát hạch để được cấp chứng chỉ theo quy định. Bạn nên hỏi rõ ai trả chi phí và bạn có phải cam kết làm việc một thời gian hay không.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg></span><strong>Nội dung đào tạo nghiệp vụ bảo vệ thường gồm những gì?</strong></h2>
<p>Chương trình đào tạo nhân viên dịch vụ bảo vệ do cơ sở đào tạo xây dựng và phải được cơ quan Công an có thẩm quyền thẩm duyệt. Nội dung cụ thể có thể khác nhau giữa các nơi, nhưng thường xoay quanh các nhóm kiến thức sau:</p>
<ul class="tv-materials">
  <li class="tv-material"><span class="tv-material-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 4-8 4-8-4 8-4z"/><path d="M4 7v6M12 11v10M8 21h8"/></svg></span><h3>Kiến thức pháp luật</h3><p>Quyền và nghĩa vụ của nhân viên bảo vệ, những việc được làm và không được làm, cách phối hợp với Công an khi có vụ việc.</p></li>
  <li class="tv-material"><span class="tv-material-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg></span><h3>Nghiệp vụ bảo vệ</h3><p>Canh gác, tuần tra, kiểm soát người và xe ra vào, ghi sổ trực, giao ca, xử lý tình huống trộm cắp, gây rối, tiếp nhận tài sản.</p></li>
  <li class="tv-material"><span class="tv-material-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.7 1.3 2.7 2.5 2.7z"/></svg></span><h3>Phòng cháy, chữa cháy và sơ cấp cứu</h3><p>Nhận biết nguy cơ cháy, sử dụng bình chữa cháy, hướng dẫn thoát nạn, sơ cứu ban đầu cho người bị nạn trước khi đội y tế đến.</p></li>
  <li class="tv-material"><span class="tv-material-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></span><h3>Kỹ năng tự vệ, công cụ hỗ trợ</h3><p>Các động tác tự vệ, khống chế cơ bản, sử dụng công cụ hỗ trợ đúng quy định, kỹ năng giao tiếp và giữ bình tĩnh khi va chạm.</p></li>
</ul>
<p>Về thời gian học, mỗi cơ sở có lịch riêng theo chương trình đã được thẩm duyệt. Hãy hỏi trước tổng số buổi, học vào ngày nào và hình thức sát hạch để sắp xếp công việc.</p>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg></span><strong>Các chứng chỉ, chứng nhận bảo vệ nên có thêm</strong></h2>
<p>Ngoài Chứng chỉ nghiệp vụ bảo vệ, một số chứng nhận khác giúp hồ sơ của bạn nổi bật hơn, nhất là khi ứng tuyển vào nhà máy, khu công nghiệp, ngân hàng hay tòa nhà lớn.</p>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.3 1.7 1.3 2.7 2.5 2.7z"/></svg></span><div><span class="tv-panel-no">Chứng nhận 01</span><h3>Chứng nhận huấn luyện nghiệp vụ PCCC và cứu nạn, cứu hộ</h3></div></div>
  <p>Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ năm 2024 (hiệu lực từ 01/07/2025) và Nghị định 105/2025/NĐ-CP quy định việc huấn luyện, bồi dưỡng nghiệp vụ PCCC và cứu nạn, cứu hộ cho người được phân công làm nhiệm vụ này tại cơ sở. Bảo vệ nhà máy, kho xưởng, chung cư thường kiêm luôn việc kiểm tra thiết bị PCCC, nên có chứng nhận là điểm cộng rõ rệt.</p>
  <p>Thực tế trong các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, nhiều tin bảo vệ nhà máy ghi nhiệm vụ "kiểm tra hệ thống PCCC" hoặc "tham gia ứng phó sự cố, PCCC".</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h5l2-3 3 6 2-3h5"/></svg></span><div><span class="tv-panel-no">Chứng nhận 02</span><h3>Giấy chứng nhận sơ cấp cứu</h3></div></div>
  <p>Bảo vệ thường là người có mặt đầu tiên khi có người ngất, té ngã, tai nạn lao động. Các khóa sơ cấp cứu cơ bản thường dạy cầm máu, băng bó, xử lý bỏng, cố định gãy xương và hồi sức tim phổi. Bạn có thể tìm khóa học do Hội Chữ thập đỏ địa phương hoặc cơ sở y tế tổ chức.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><div><span class="tv-panel-no">Chứng nhận 03</span><h3>Đẳng cấp võ thuật</h3></div></div>
  <p>Pháp luật không bắt buộc bảo vệ phải có đai võ. Tuy nhiên, các vị trí như bảo vệ sự kiện, áp tải hàng hóa, bảo vệ yếu nhân thường ưu tiên người có nền tảng võ thuật hoặc từng là quân nhân, công an xuất ngũ. Giấy chứng nhận đẳng cấp từ câu lạc bộ, liên đoàn võ thuật hợp pháp giúp bạn dễ chứng minh năng lực.</p>
</div>
<div class="tv-panel">
  <div class="tv-panel-head"><span class="tv-panel-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg></span><div><span class="tv-panel-no">Kỹ năng 04</span><h3>Kỹ năng phụ: lái xe, camera, bộ đàm, tin học</h3></div></div>
  <p>Một số tin tuyển ưu tiên người biết lái ô tô, giám sát camera, sử dụng bộ đàm hoặc sửa chữa điện nước cơ bản. Bằng lái xe và kinh nghiệm thực tế này không thay được chứng chỉ nghiệp vụ, nhưng giúp bạn được nhận vào vị trí tốt hơn.</p>
</div>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg></span><strong>Học chứng chỉ bảo vệ ở đâu, cách học thế nào?</strong></h2>
<p>Đào tạo nhân viên dịch vụ bảo vệ chỉ được thực hiện bởi các cơ sở đủ điều kiện theo Nghị định 96/2016/NĐ-CP đã sửa đổi, có chương trình được Công an thẩm duyệt. Thường có các con đường sau:</p>
<ul>
  <li><strong>Học qua công ty dịch vụ bảo vệ:</strong> đây là cách phổ biến nhất. Công ty đủ điều kiện tự đào tạo hoặc liên kết với cơ sở đào tạo, sau đó đăng ký sát hạch cho nhân viên.</li>
  <li><strong>Học tại cơ sở đào tạo được cấp phép:</strong> một số trường, trung tâm có chức năng đào tạo nghiệp vụ bảo vệ nhận học viên tự do.</li>
  <li><strong>Huấn luyện PCCC, sơ cấp cứu:</strong> học theo lớp do cơ quan PCCC, cơ sở được phép huấn luyện, Hội Chữ thập đỏ hoặc cơ sở y tế tổ chức.</li>
</ul>
<h3>Cách kiểm tra nơi học có đúng quy định</h3>
<ol>
  <li>Hỏi tên đơn vị cấp chứng chỉ và đơn vị sát hạch. Chứng chỉ hợp lệ không do chính công ty bảo vệ tự cấp.</li>
  <li>Hỏi rõ học phí, thời gian học, có phải đặt cọc hay ký cam kết không. Ghi lại hoặc yêu cầu biên nhận.</li>
  <li>Cẩn thận với lời hứa "có chứng chỉ ngay, không cần học" hoặc thu tiền làm chứng chỉ trước khi nhận việc.</li>
  <li>Nếu còn nghi ngờ, hỏi trực tiếp cơ quan Công an cấp tỉnh hoặc Công an nơi công ty đặt trụ sở.</li>
</ol>
<blockquote><p>Lời khuyên: chứng chỉ nghiệp vụ gắn với kiến thức thật. Học đủ buổi, nắm chắc cách xử lý tình huống sẽ giúp bạn qua phỏng vấn và làm việc tự tin hơn nhiều so với chỉ cầm tờ giấy.</p></blockquote>

<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg></span><strong>Có chứng chỉ bảo vệ thì lương và cơ hội ra sao?</strong></h2>
<p>Chứng chỉ không tự động làm lương tăng một mức cố định, nhưng giúp bạn mở ra nhiều lựa chọn hơn. Dưới đây là những lợi ích bạn có thể thấy rõ:</p>
<ul class="tv-reasons">
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span><div><h3>Đi làm ngay, không chờ đào tạo</h3><p>Công ty có thể phân bạn ra mục tiêu sớm hơn, không phải chờ khóa học và sát hạch.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1"/></svg></span><div><h3>Vào được mục tiêu yêu cầu cao</h3><p>Ngân hàng, nhà máy lớn, tòa nhà văn phòng thường chọn người có hồ sơ đầy đủ, mức lương nêu trong tin cũng cao hơn.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg></span><div><h3>Lên chỉ huy, giám sát</h3><p>Vị trí chỉ huy mục tiêu, giám sát an ninh cần người nắm chắc nghiệp vụ để hướng dẫn bảo vệ mới.</p></div></li>
  <li class="tv-reason"><span class="tv-reason-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></span><div><h3>Tự bảo vệ mình khi có sự cố</h3><p>Biết xử lý đúng quy trình giúp bạn tránh bị quy trách nhiệm khi xảy ra mất tài sản, cháy nổ hay xô xát.</p></div></li>
</ul>
<p>Để tham khảo, theo các tin đang tuyển trên Việc Làm Bảo Vệ tháng 11/2026, mức lương nêu trong tin của bảo vệ phổ thông phần lớn khoảng 6,5 đến 12 triệu đồng/tháng. Một tin giám sát an ninh các mục tiêu tại Hà Nội, có nhiệm vụ hướng dẫn và đào tạo nghiệp vụ cho bảo vệ mới, ghi mức 10 đến 13 triệu đồng/tháng. Đây là số liệu từ một số tin cụ thể, không phải thống kê toàn ngành.</p>
<p>Bạn có thể xem các tin <a href="/viec-lam-bao-ve-ngan-hang">việc làm bảo vệ ngân hàng</a>, <a href="/viec-lam-bao-ve-luong-cao">việc làm bảo vệ lương cao</a>, hoặc tìm tin phù hợp ở <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>.</p>

<p class="geo-links">Đang tìm việc ở một khu vực cụ thể? Xem ngay <a href="/viec-lam/tp-hcm">việc làm bảo vệ TP.HCM</a>, <a href="/viec-lam/ha-noi">việc làm bảo vệ Hà Nội</a>, <a href="/viec-lam/binh-duong">việc làm bảo vệ Bình Dương</a>, <a href="/viec-lam/dong-nai">việc làm bảo vệ Đồng Nai</a>, <a href="/viec-lam/bac-ninh">việc làm bảo vệ Bắc Ninh</a>, <a href="/viec-lam/da-nang">việc làm bảo vệ Đà Nẵng</a>, hoặc chọn theo nhu cầu: <a href="/viec-lam-bao-ve-ca-12-tieng">bảo vệ ca 12 tiếng</a>, <a href="/viec-lam-bao-ve-ca-8-tieng">bảo vệ ca 8 tiếng</a>, <a href="/viec-lam-bao-ve-ca-dem">bảo vệ ca đêm</a>, <a href="/viec-lam-bao-ve-luong-cao">bảo vệ lương cao</a>, <a href="/viec-lam-bao-ve-bao-an-o">bảo vệ bao ăn ở</a>, <a href="/viec-lam-bao-ve-chung-cu">bảo vệ chung cư</a>, <a href="/viec-lam-bao-ve-khu-cong-nghiep">bảo vệ khu công nghiệp</a>, <a href="/viec-lam-bao-ve-tuyen-gap">bảo vệ tuyển gấp</a>.</p>
<h2><span class="tv-h2-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span><strong>Câu hỏi thường gặp</strong></h2>
<div class="tv-faq">
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">1</span><h3>Làm bảo vệ có bắt buộc phải có chứng chỉ không?</h3></summary>
    <div class="tv-faq-a"><p>Nếu bạn làm cho doanh nghiệp kinh doanh dịch vụ bảo vệ thì có. Nghị định 96/2016/NĐ-CP (đã sửa đổi) yêu cầu doanh nghiệp chỉ sử dụng nhân viên đã qua đào tạo và có Chứng chỉ nghiệp vụ bảo vệ. Bảo vệ nội bộ do cơ quan, nhà máy tự tuyển thì tùy yêu cầu của nơi tuyển.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">2</span><h3>Chưa có chứng chỉ bảo vệ có xin việc được không?</h3></summary>
    <div class="tv-faq-a"><p>Được. Nhiều công ty nhận người chưa có kinh nghiệm và tổ chức đào tạo, sát hạch cho bạn. Hãy hỏi rõ chi phí do ai trả và có cam kết thời gian làm việc hay không trước khi ký.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">3</span><h3>Chứng chỉ do công ty bảo vệ tự cấp có dùng được không?</h3></summary>
    <div class="tv-faq-a"><p>Không. Chứng chỉ nghiệp vụ bảo vệ hợp lệ do cơ quan có thẩm quyền theo Nghị định 56/2023/NĐ-CP cấp sau khi sát hạch. Giấy do công ty tự in, tự cấp không có giá trị pháp lý.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">4</span><h3>Bảo vệ có cần chứng nhận PCCC không?</h3></summary>
    <div class="tv-faq-a"><p>Nếu bạn được phân công làm nhiệm vụ PCCC tại cơ sở, bạn thuộc diện cần được huấn luyện nghiệp vụ theo Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024 và Nghị định 105/2025/NĐ-CP. Kể cả khi không bắt buộc, chứng nhận PCCC vẫn là điểm cộng khi ứng tuyển bảo vệ nhà máy, chung cư.</p></div>
  </details>
  <details class="tv-faq-item">
    <summary><span class="tv-faq-q">5</span><h3>Có đai võ thì lương bảo vệ có cao hơn không?</h3></summary>
    <div class="tv-faq-a"><p>Không có mức cộng cố định theo luật. Đai võ giúp bạn có lợi thế khi ứng tuyển các vị trí cần thể lực, như bảo vệ sự kiện, áp tải, bảo vệ yếu nhân, và các vị trí này thường có thu nhập cao hơn bảo vệ phổ thông.</p></div>
  </details>
</div>
<p class="note-src">Nguồn tham khảo: Nghị định 96/2016/NĐ-CP quy định điều kiện về an ninh, trật tự đối với một số ngành, nghề đầu tư kinh doanh có điều kiện; Nghị định 56/2023/NĐ-CP sửa đổi, bổ sung Nghị định 96/2016/NĐ-CP; Nghị định 58/2026/NĐ-CP sửa đổi, bổ sung một số điều của các nghị định liên quan đến an ninh, trật tự; Thông tư 42/2017/TT-BCA hướng dẫn Nghị định 96/2016/NĐ-CP; Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ 2024; Nghị định 105/2025/NĐ-CP; Thư viện Pháp luật; LuatVietnam.</p>
', 1, 5120, 1791939600000, 1791939600000, 1795503709548);
