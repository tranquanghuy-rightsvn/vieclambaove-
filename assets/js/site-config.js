// Công tắc chung cho trình duyệt, scripts/build.mjs và Worker (file này không được import gì để Worker dùng được).
// SITE_LOCKED = true: tạm chặn Google lập chỉ mục toàn site (meta robots noindex + header X-Robots-Tag),
// dùng khi đang hoàn thiện nội dung. Mở lại: đổi thành false, build + deploy, rồi gửi lại sitemap trong Google Search Console.
export const SITE_LOCKED = true;
