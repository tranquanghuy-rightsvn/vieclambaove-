/* Nội dung tĩnh: bài tin tức, bảng giá.
   Tin tuyển dụng, công ty, danh mục nằm ở /data/site.js (Worker sinh từ cơ sở dữ liệu). */
window.VLBV = window.VLBV || {};

VLBV.posts = [
  { id: 'bang-luong-bao-ve-2026', img: '/assets/img/photos/blog-luong.jpg', cat: 'Bảng lương', title: 'Bảng lương bảo vệ mới nhất 2026 tại TP.HCM, Hà Nội và Bình Dương', excerpt: 'Mức lương ca 8 tiếng, ca 12 tiếng, chỉ huy mục tiêu và các khoản phụ cấp ca đêm cập nhật theo lương tối thiểu vùng mới.', read: 6, views: 18420, date: '12/11/2026' },
  { id: 'dau-hieu-cong-ty-bao-ve-lua-dao', img: '/assets/img/photos/blog-lua-dao.jpg', cat: 'Cảnh báo lừa đảo', title: '5 dấu hiệu nhận biết công ty bảo vệ lừa đảo thu tiền đồng phục', excerpt: 'Cách kiểm tra giấy phép đủ điều kiện ANTT, nhận diện tin tuyển dụng thu phí và việc cần làm khi bị lừa.', read: 5, views: 42190, date: '08/11/2026' },
  { id: 'quy-trinh-tuan-tra-pccc', img: '/assets/img/photos/blog-tuan-tra.jpg', cat: 'Nghiệp vụ', title: 'Quy trình tuần tra và xử lý sự cố PCCC cho bảo vệ tòa nhà chung cư', excerpt: 'Tài liệu nghiệp vụ cơ bản giúp người mới vượt qua phỏng vấn và làm tốt ngay tuần đầu tiên.', read: 8, views: 12850, date: '02/11/2026' },
  { id: 'kinh-nghiem-phong-van-bao-ve', img: '/assets/img/photos/blog-phong-van.jpg', cat: 'Phỏng vấn', title: '10 câu hỏi phỏng vấn bảo vệ thường gặp và cách trả lời', excerpt: 'Chuẩn bị giấy tờ gì, ăn mặc ra sao và trả lời thế nào để được nhận ngay trong buổi đầu.', read: 4, views: 9310, date: '28/10/2026' },
  { id: 'ca-12-tieng-co-dung-luat', img: '/assets/img/photos/blog-ca-12.jpg', cat: 'Pháp lý', title: 'Làm ca 12 tiếng có đúng luật? Quyền lợi làm thêm giờ của bảo vệ', excerpt: 'Giải thích quy định giờ làm, tiền làm thêm và nghỉ hằng tuần theo Bộ luật Lao động.', read: 7, views: 7640, date: '20/10/2026' },
  { id: 'chung-chi-bao-ve-can-co', img: '/assets/img/photos/blog-chung-chi.jpg', cat: 'Nghề nghiệp', title: 'Những chứng chỉ giúp bảo vệ tăng lương: PCCC, võ thuật, sơ cấp cứu', excerpt: 'Học ở đâu, mất bao lâu và mỗi chứng chỉ giúp tăng thu nhập thêm bao nhiêu.', read: 5, views: 5120, date: '14/10/2026' }
];

VLBV.packages = [
  { id: 'free', name: 'Miễn phí', price: 0, unit: '', desc: 'Dùng thử cho công ty mới', features: ['3 tin đăng / tháng', 'Hiển thị 30 ngày', 'AI viết tin 5 lần / ngày', 'Nhận hồ sơ ứng tuyển'], cta: 'Bắt đầu miễn phí' },
  { id: 'vip', name: 'Tin VIP', price: 299000, unit: '/ tin / 30 ngày', desc: 'Nổi bật, luôn nằm đầu danh sách', features: ['Khung vàng + nhãn VIP', 'Ưu tiên trên trang khu vực', 'Gấp 5 lần lượt xem', 'AI viết tin không giới hạn', 'Báo cáo lượt xem / gọi'], cta: 'Mua tin VIP', featured: true },
  { id: 'urgent', name: 'Tin Gấp', price: 149000, unit: '/ tin / 7 ngày', desc: 'Cần người đi làm ngay', features: ['Nhãn “Tuyển gấp” màu cam', 'Hiển thị mục Việc gấp trang chủ', 'Gửi thông báo Zalo cho ứng viên gần đó'], cta: 'Mua tin Gấp' },
  { id: 'enterprise', name: 'Doanh nghiệp', price: 2490000, unit: '/ tháng', desc: 'Công ty tuyển số lượng lớn', features: ['30 tin VIP / tháng', '200 điểm xem hồ sơ', 'Quản lý ứng viên (mini-ATS)', 'Trang công ty nổi bật', 'Hỗ trợ riêng 1-1'], cta: 'Liên hệ tư vấn' }
];

VLBV.addons = [
  { name: 'Đẩy tin lên đầu', price: '39.000đ / lần', desc: 'Đưa tin về vị trí đầu danh sách ngay lập tức.' },
  { name: 'Gói 50 điểm xem hồ sơ', price: '250.000đ', desc: 'Mỗi điểm mở 1 số điện thoại ứng viên.' },
  { name: 'Gói 200 điểm xem hồ sơ', price: '800.000đ', desc: 'Tiết kiệm 20% cho nhà tuyển dụng lớn.' },
  { name: 'Banner trang chủ', price: '3.000.000đ / tháng', desc: 'Đồng phục, bộ đàm, thiết bị an ninh…' },
  { name: 'Banner cột bên trang khu vực', price: '1.200.000đ / tháng', desc: 'Nhắm đúng khu vực tỉnh / quận.' }
];
