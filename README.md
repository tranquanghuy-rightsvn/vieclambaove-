# Việc Làm Bảo Vệ (vieclambaove)

Chuyên trang việc làm ngành bảo vệ. Phase 1: ứng viên (SĐT + mật khẩu), nhà tuyển dụng (email/Gmail),
đăng tin miễn phí 1–4 tuần, ứng tuyển nhanh, báo cáo lừa đảo, xác thực công ty, mục Video YouTube,
trang SEO + sitemap. Trang quản trị chạy trên Google Apps Script.

## Kiến trúc

```
Trình duyệt ──► Cloudflare Worker (worker/) ──► D1 (dữ liệu) + R2 (giấy tờ xác thực)
                 │  /api/*          API website + API quản trị (/api/admin/*, khoá ADMIN_API_KEY)
                 │  /data/site.js   dữ liệu công khai dạng file tĩnh, dựng lại mỗi khi có thay đổi;
                 │                  trình duyệt tìm kiếm/lọc ngay trên file này
                 │  /, /viec-lam, /tin/*, /cong-ty/*, /video*   chèn sẵn tiêu đề, mô tả, JSON-LD cho Google
                 │  /sitemap.xml, /robots.txt
                 └─ còn lại: file tĩnh trong dist/ (HTML/CSS/JS thuần, router phía client)
Trang quản trị /quan-tri ──(iframe)──► Google Apps Script (gas/, không nằm trong git) ──► /api/admin/*
```

Cron mỗi giờ: tin hết hạn bị xoá khỏi website (`status = expired`), dọn phiên đăng nhập cũ.

## Chạy ở máy

```bash
npm install
npm run db:migrate:local
npx wrangler d1 execute vieclambaove --local --file seed/demo.sql   # dữ liệu mẫu (tuỳ chọn)
echo "ADMIN_API_KEY=dev-admin-key" > .dev.vars
npm run dev            # http://localhost:8787
```

`node scripts/seed.mjs` sinh lại `migrations/0002_categories.sql` và `seed/demo.sql` từ dữ liệu mẫu cũ.

## Triển khai

```bash
npm run db:migrate:remote
npx wrangler secret put ADMIN_API_KEY          # trùng Script Property ADMIN_API_KEY của GAS
npx wrangler secret put GOOGLE_CLIENT_ID       # đăng nhập Gmail cho nhà tuyển dụng (tuỳ chọn)
npx wrangler secret put GOOGLE_CLIENT_SECRET
npm run deploy
```

Google OAuth: Authorized redirect URI = `<tên miền>/api/auth/google/callback`.
Chưa đặt 2 secret Google thì nút "Đăng nhập với Google" hiện thông báo chưa cấu hình.

Trang quản trị GAS: xem `GAS.md` (quyết định nghiệp vụ, phân quyền, Script Properties).

## Cấu trúc

```
index.html, quan-tri/     khung trang, trang nhúng admin GAS
assets/                   CSS, JS (core, router, pages/), ảnh; data.js = nội dung tĩnh (bài tin tức, bảng giá)
worker/                   index.js (định tuyến), api.js, admin.js, snapshot.js, seo.js, lib.js
migrations/               schema D1
seed/demo.sql             dữ liệu mẫu
scripts/build.sh          gom file web vào dist/
```
