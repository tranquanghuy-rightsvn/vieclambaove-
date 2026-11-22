# Việc Làm Bảo Vệ (vieclambaove)

Chuyên trang việc làm ngành bảo vệ. Phase 1: ứng viên (SĐT + mật khẩu), nhà tuyển dụng (email/Gmail),
đăng tin miễn phí 1–4 tuần, ứng tuyển nhanh, báo cáo lừa đảo, xác thực công ty, mục Video YouTube,
trang SEO + sitemap. Trang quản trị chạy trên Google Apps Script.

## Kiến trúc (site tĩnh theo playbook free-cms-static-site-pipeline)

```
NTD / ứng viên ──► Worker /api ──► D1 (tài khoản, công ty, tin, ứng tuyển) + R2 (ảnh chờ, giấy tờ xác thực riêng)
Admin (/quan-tri → GAS) ──► Worker /api/admin
   │ mỗi thay đổi nội dung công khai → xuất bản NGAY (không cron):
   ▼ 1 commit Git Data API: data/site.json + ảnh mới html/images/… (xoá ảnh không còn dùng)
GitHub Actions (token sẵn của GitHub) → node scripts/build.mjs → commit html/
Cloudflare Workers Builds nối thẳng repo → deploy html/ + Worker
GAS trigger 0h hằng ngày → /api/admin/expire → tin hết hạn bị gỡ (trang + ảnh)
```

- `html/` là site tĩnh (lưu trên GitHub): trang chủ, khu vực (tỉnh/quận có tin), tin, công ty, tin tức, video,
  chính sách là HTML đầy đủ; trang tài khoản chỉ là khung, JS vẽ sau khi đăng nhập.
- Đăng/duyệt xong là thấy NGAY: `/data/site.js` do Worker phục vụ trực tiếp từ D1; trang/ảnh chưa kịp build
  được Worker trả tạm (khung trang 200, ảnh từ R2). HTML tĩnh đầy đủ có sau khoảng 2–3 phút.
- Ảnh: mỗi tin tối đa 3 ảnh đại diện, công ty 1 logo (nén trên trình duyệt ≤1200px). Giấy tờ xác thực không lên GitHub.
- Không cho chèn link vào tiêu đề/mô tả/địa chỉ tin, tên/giới thiệu công ty (chặn cả máy chủ lẫn trình duyệt).

## Chạy ở máy

```bash
npm install
npm run db:migrate:local
npx wrangler d1 execute vieclambaove --local --file seed/demo.sql   # dữ liệu mẫu (tuỳ chọn)
echo "ADMIN_API_KEY=dev-admin-key" > .dev.vars
npm run dev                 # build html/ + wrangler dev → http://localhost:8787
npm run data:pull && npm run build   # xem trang tĩnh với dữ liệu D1 local (sửa assets/ cũng phải build lại)
```

## Triển khai

Một lần:
```bash
npm run db:migrate:remote                  # chạy lại mỗi khi có migration mới
npx wrangler secret put ADMIN_API_KEY      # trùng Script Property ADMIN_API_KEY của GAS
npx wrangler secret put GITHUB_TOKEN       # fine-grained PAT, repo này, Contents: Read and write
npx wrangler secret put GOOGLE_CLIENT_ID   # đăng nhập Gmail cho NTD (tuỳ chọn)
npx wrangler secret put GOOGLE_CLIENT_SECRET
```
Cloudflare dashboard → Workers & Pages → vieclambaove → Settings → Builds → Connect repo
`tranquanghuy-rightsvn/vieclambaove-`, nhánh `main`. Build command: để trống. Deploy command: `npx wrangler deploy`.
Build watch paths (include): `html/**`, `worker/**`, `wrangler.jsonc`. Không cần secret Cloudflare trên GitHub.
Khi gắn tên miền thật: đặt biến repo `SITE_URL` (Settings → Variables → Actions) để canonical/sitemap đúng.

Google OAuth redirect URI: `<tên miền>/api/auth/google/callback`. Trang quản trị GAS: xem `GAS.md` (chạy `setupCheck`).

## Cấu trúc

```
index.html, quan-tri/     khung trang, trang nhúng admin GAS (nguồn; bản build nằm ở html/)
html/                     site tĩnh đã build + html/images/ (ảnh Worker commit) — Cloudflare deploy thư mục này
assets/                   CSS, JS (core, router, pages/), ảnh; data.js = nội dung tĩnh (bài tin tức, bảng giá)
worker/                   index.js (định tuyến + cron), api.js, admin.js, publish.js (xuất bản lên GitHub), lib.js
migrations/               schema D1
seed/demo.sql             dữ liệu mẫu
scripts/build.mjs         sinh site tĩnh vào html/ từ data/site.json (giữ html/images/)
scripts/pull-data.mjs     kéo dữ liệu công khai từ Worker về data/site.json
data/site.json            dữ liệu công khai (Worker tự commit, không sửa tay)
```
