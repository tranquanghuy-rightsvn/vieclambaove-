# GAS.md — Trang quản trị vieclambaove (Google Apps Script)

Nguồn quyết định CHỐT cho mọi code trong `gas/`. Đọc toàn bộ trước khi sửa `gas/*`.
Theo playbook `free-cms-static-site-pipeline`, mẫu gốc: xevip. Khác playbook ở 1 điểm lớn
(chốt với chủ dự án ngày 22/11/2026): **dữ liệu KHÔNG nằm trong Google Sheet/GitHub** mà nằm
trong Cloudflare D1 của Worker, vì website có tài khoản người dùng cuối (ứng viên, nhà tuyển
dụng). GAS chỉ là giao diện quản trị, gọi API quản trị của Worker bằng khoá bí mật.

```
Trình duyệt quản trị ──google.script.run──► GAS (Code.js) ──UrlFetchApp + Bearer ADMIN_API_KEY──► Worker /api/admin/* ──► D1 / R2
                                              │
                                              ├── Google Sheet "vieclambaove Admin": CHỈ danh sách quản trị viên (Users)
                                              └── Trigger hằng ngày 0h: dailyExpire() → Worker /api/admin/expire

Xuất bản (chốt 22/11/2026, "Triển khai thực tế"): mọi thay đổi nội dung công khai → Worker xuất bản NGAY
(không cron Cloudflare): 1 commit Git Data API gồm data/site.json + ảnh mới vào html/images/ (+ xoá ảnh
không còn dùng) → GitHub Actions (token sẵn của GitHub, KHÔNG secret Cloudflare) chạy scripts/build.mjs,
commit html/ → Cloudflare Workers Builds nối thẳng repo, deploy html/ + Worker.
```

## 0. Phạm vi (Phase 1, không làm rộng hơn)

Duyệt tin · Báo cáo vi phạm · Video YouTube · Công ty (xác thực/khoá) · Người dùng website
(khoá/mở) · Danh mục + chế độ duyệt · Quản trị viên. Không có: blog AI, gói/thanh toán,
banner/AdSense, danh sách đen, email báo việc mới.

## I. Đăng nhập

1. OTP gửi qua email → xác nhận → vào admin. Không mật khẩu, không dựa session Google.
2. Chỉ email có trong Sheet `Users` mới xin được OTP.
3. Chủ script (người deploy) LUÔN là `root`, không lưu trong Sheet, không hiện trong UI.
4. Phân quyền 3 cấp `root > admin > moderator` (chốt 22/11/2026):
   | Chức năng | moderator (Kiểm duyệt) | admin | root |
   |---|---|---|---|
   | Tổng quan (kèm trạng thái xuất bản, nút Xuất bản ngay), Duyệt tin, Báo cáo vi phạm, Video | ✔ | ✔ | ✔ |
   | Công ty (xác thực, khoá), Người dùng website (khoá/mở) | | ✔ | ✔ |
   | Danh mục + chế độ duyệt tin | | ✔ | ✔ |
   | Quản trị viên: thêm/xoá moderator | | ✔ | ✔ |
   | Quản trị viên: thêm/xoá admin | | | ✔ |
   Không ai tự sửa/xoá chính mình. Dòng `root` không quản lý qua UI.
5. OTP sống 10 phút, cooldown 60 giây, tối đa 5 lần nhập sai. Token sống 30 ngày, lưu
   localStorage (`vlbv_admin_token`), thu hồi thật khi Đăng xuất.
6. Server (Code.js) tự `requireRole_` ở MỌI hàm. Ẩn menu chỉ để gọn giao diện.

## II. Duyệt tin

- Danh sách theo trạng thái: `pending` (mặc định), `live`, `rejected`, `removed`, `expired`, `all`; ô tìm theo tiêu đề/công ty.
- Hiển thị cờ rủi ro (quy tắc, không AI) và số báo cáo đang mở.
- Thao tác: Duyệt (`pending` → `live`, hạn tính từ lúc duyệt theo số tuần NTD chọn), Từ chối
  (bắt nhập lý do, NTD thấy lý do), Gỡ (tin đang hiển thị → `removed`).
- Chế độ duyệt (`approve_mode`): `auto` (mặc định ban đầu) = tin không có cờ lên ngay; `manual` = mọi tin chờ duyệt.
- KHÔNG cho người dùng đưa link: tiêu đề, mô tả, địa chỉ, yêu cầu của tin, tên/giới thiệu công ty chứa
  đường link (http, www, tên miền, zalo.me, bit.ly…) bị từ chối ngay khi lưu (email và số điện thoại vẫn được).
- Ảnh: mỗi tin tối đa 3 ảnh đại diện; công ty có 1 logo. NTD tải lên (nén phía trình duyệt, cạnh dài ≤1200px,
  JPEG), lưu tạm R2 `img/…`; khi tin lên website ảnh được chép sang `html/images/jobs|companies/…` trên GitHub.
  Ảnh riêng 1-1 theo tin/công ty (tên `jobs/<id>-<băm>.jpg`, `companies/<id>-<băm>.jpg`) nên xoá kèm an toàn
  khi tin hết hạn/bị gỡ. Giấy tờ xác thực KHÔNG BAO GIỜ lên GitHub (chỉ ở R2 `verify/…`).
- Tin hết hạn: GAS trigger hằng ngày lúc 0h gọi Worker chuyển `expired` → xuất bản → trang + ảnh bị xoá.
  Trong ngày, trình duyệt tự ẩn tin quá hạn khỏi danh sách (dữ liệu trực tiếp).

## III. Báo cáo vi phạm

- Gom theo tin, hiện số lần, các lý do, ghi chú. Tin bị ≥3 người báo cáo đã tự ẩn (về `pending`).
- Gỡ tin (kèm lý do) hoặc Bỏ qua (tin đang tự ẩn vì báo cáo được hiển thị lại nếu còn hạn).

## IV. Video YouTube

- Field: Link YouTube (bắt buộc; nhận watch?v=, youtu.be, shorts, embed hoặc mã 11 ký tự),
  Tiêu đề (bắt buộc), Mô tả (tuỳ chọn), Hiển thị (bật/tắt).
- Slug tự sinh từ tiêu đề lúc tạo, BẤT BIẾN (URL `/video/<slug>`).
- Xoá có bước xác nhận.

## V. Công ty, Người dùng website

- Công ty: lọc chờ xác thực lên đầu; xem giấy tờ qua link ký 15 phút; Xác thực / Từ chối (lý
  do) / Khoá / Mở khoá. Khoá công ty = khoá mọi tài khoản NTD thuộc công ty, tin bị ẩn.
- Người dùng website: lọc theo vai trò, tìm theo tên/SĐT/email; Khoá / Mở khoá.

## VI. Danh mục

- Tỉnh/thành (mã, tên, tên ngắn, danh sách quận/huyện cách nhau dấu phẩy), Loại mục tiêu (mã,
  tên, icon), Ca làm (mã, tên). Mã tự sinh từ tên nếu để trống. KHÔNG đổi mã của mục đã có tin
  (URL khu vực và tin cũ dùng mã này).

## VII. UX

- Modal XÁC NHẬN (Huỷ/Đồng ý) và modal THÔNG BÁO (Đóng) riêng, không alert()/confirm().
- Mọi nút async: `withLoading` (disable + spinner).
- Sau thao tác thành công: danh sách tự cập nhật, không F5.
- Chuyển tab chỉ ẩn/hiện; dữ liệu tab tải khi mở tab, hiện ngay bản đã lưu trong localStorage.
- Boot 1 lượt; lần sau hiện từ cache rồi làm mới ngầm (stale-while-revalidate).
- Key localStorage (trừ token) mang hậu tố `CLIENT_BUILD` do server băm từ app.html + js.html.
- Website cập nhật NGAY: Worker dựng lại `/data/site.js` trực tiếp từ D1 và trả khung trang cho nội dung chưa có file tĩnh; đồng thời commit data/site.json lên GitHub → Actions build HTML tĩnh đầy đủ (cho Google) sau vài phút. Thông báo kết quả: "Website đã cập nhật ngay."

- Giao diện admin KHÔNG nhắc tên công nghệ/dịch vụ (GitHub, Cloudflare, Worker, commit, Sheet, trang tĩnh…), kể cả trong thông báo lỗi: Code.js lọc dữ liệu (`publishView_`, `wkParse_`) trước khi gửi xuống, chi tiết kỹ thuật chỉ ghi Logger.log. Dùng từ nghiệp vụ: "Cập nhật website", "trang tối ưu cho Google".

## VIII. Lưu trữ

- Google Sheet `vieclambaove Admin` (tự tạo lần đầu), sheet `Users`: cột `email`, `role`
  (`admin` | `moderator`).
- Mọi dữ liệu nghiệp vụ: Cloudflare D1 qua Worker. GAS không lưu bản sao.
- Dữ liệu công khai được Worker commit vào repo tại `data/site.json` (file trigger CI); `scripts/build.mjs` sinh HTML tĩnh vào `html/` (thư mục site trên GitHub, Cloudflare deploy thư mục này).
- Ảnh công khai: `html/images/jobs/`, `html/images/companies/` (Worker commit). Danh sách ảnh đã xuất bản lưu ở D1 kv `published_images`.
- Script Properties `token_<uuid>`: phiên đăng nhập admin, tự dọn khi hết hạn.

## IX. Bug đã gặp ở dự án này

- (chưa có)

## X. Script Properties (tên cố định)

- `WORKER_URL` — gốc website, vd `https://vieclambaove.web100-vn.workers.dev` (không có `/` cuối).
- `ADMIN_API_KEY` — trùng secret `ADMIN_API_KEY` của Worker (`wrangler secret put ADMIN_API_KEY`).
- `SPREADSHEET_ID` — KHÔNG cần điền, tự tạo lần đầu.
- Trigger: chạy tay `installTriggers()` 1 lần để cài trigger `dailyExpire` 0h–1h mỗi ngày (giờ VN).
