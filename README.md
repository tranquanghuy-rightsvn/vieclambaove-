# Việc Làm Bảo Vệ (vieclambaove)

Chuyên trang việc làm ngành bảo vệ. Phase 1: ứng viên (SĐT + mật khẩu), nhà tuyển dụng (email/Gmail),
đăng tin miễn phí 1–4 tuần, ứng tuyển nhanh, báo cáo lừa đảo, xác thực công ty, mục Video YouTube,
trang SEO + sitemap. Trang quản trị chạy trên Google Apps Script.

## Kiến trúc (site tĩnh theo playbook free-cms-static-site-pipeline)

```
Người dùng / NTD ──► Worker /api/* ──► D1 (dữ liệu), R2 (giấy tờ xác thực)
Quản trị (/quan-tri → GAS) ──► Worker /api/admin/*
            │ mọi thay đổi nội dung công khai: đánh dấu "cần xuất bản"
            ▼
Cron Worker (2 phút/lần) ──commit──► GitHub: data/site.json
                                        │ push kích hoạt GitHub Actions
                                        ▼
                         scripts/build.mjs sinh HTML tĩnh từng trang ──► wrangler deploy ──► dist/
```

- Trang công khai (trang chủ, khu vực, tin, công ty, tin tức, video, chính sách) là **file HTML đầy đủ**,
  render bằng chính các hàm trong `assets/js/pages/*.js`; JS trên trình duyệt vẽ lại y hệt và thêm phần động.
- Trang tài khoản (`/dang-nhap`, `/ung-vien/*`, `/nha-tuyen-dung/*`) chỉ là khung, JS vẽ sau khi đăng nhập.
- Tìm kiếm/lọc chạy trên `/data/site.js` do Worker phục vụ TRỰC TIẾP từ D1 (dựng lại ngay khi có thay đổi).
- Duyệt/đăng xong là lên web NGAY: trang chưa có file tĩnh (vừa duyệt) được Worker trả khung 200, JS vẽ từ dữ liệu trực tiếp;
  HTML tĩnh đầy đủ cho Google có sau khoảng 2–5 phút (thao tác quản trị xuất bản ngay, thao tác NTD qua cron 2 phút). Tin hết hạn: cron đổi trạng thái → lần build sau trang bị xoá (404).
- Actions còn build lại mỗi ngày 00:05 giờ VN để số "còn N ngày" trong HTML luôn đúng.

## Chạy ở máy

```bash
npm install
npm run db:migrate:local
npx wrangler d1 execute vieclambaove --local --file seed/demo.sql   # dữ liệu mẫu (tuỳ chọn)
echo "ADMIN_API_KEY=dev-admin-key" > .dev.vars
npm run dev                 # build + wrangler dev → http://localhost:8787
npm run data:pull           # kéo dữ liệu từ D1 local về data/site.json, rồi npm run build để xem trang tĩnh mới
```

## Triển khai

Một lần:
```bash
npm run db:migrate:remote
npx wrangler secret put ADMIN_API_KEY      # trùng Script Property ADMIN_API_KEY của GAS
npx wrangler secret put GITHUB_TOKEN       # fine-grained PAT, repo này, Contents: Read and write (Worker commit data/site.json)
npx wrangler secret put GOOGLE_CLIENT_ID   # đăng nhập Gmail cho NTD (tuỳ chọn)
npx wrangler secret put GOOGLE_CLIENT_SECRET
```
GitHub repo → Settings → Secrets and variables → Actions: `CLOUDFLARE_API_TOKEN` (mẫu "Edit Cloudflare Workers"),
`CLOUDFLARE_ACCOUNT_ID`; biến `SITE_URL` khi gắn tên miền thật. Sau đó mọi push lên `main` tự build + deploy
(`.github/workflows/deploy.yml`). Migration D1 mới vẫn chạy tay: `npm run db:migrate:remote`.

Google OAuth redirect URI: `<tên miền>/api/auth/google/callback`. Trang quản trị GAS: xem `GAS.md`.

## Cấu trúc

```
index.html, quan-tri/     khung trang, trang nhúng admin GAS
assets/                   CSS, JS (core, router, pages/), ảnh; data.js = nội dung tĩnh (bài tin tức, bảng giá)
worker/                   index.js (định tuyến + cron), api.js, admin.js, publish.js (xuất bản lên GitHub), lib.js
migrations/               schema D1
seed/demo.sql             dữ liệu mẫu
scripts/build.mjs         sinh site tĩnh vào dist/ từ data/site.json
scripts/pull-data.mjs     kéo dữ liệu công khai từ Worker về data/site.json
data/site.json            dữ liệu công khai (Worker tự commit, không sửa tay)
```
