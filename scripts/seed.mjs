// Tạo SQL từ dữ liệu mẫu assets/js/data.js
//  - migrations/0002_categories.sql: danh mục + cấu hình (bắt buộc)
//  - seed/demo.sql: công ty + tin mẫu (tuỳ chọn, để có dữ liệu ngay khi ra mắt)
// Chạy: node scripts/seed.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const ctx = { window: {} };
ctx.VLBV = ctx.window.VLBV = {};
vm.runInNewContext(readFileSync(root + 'assets/js/data.js', 'utf8'), ctx);
const V = ctx.window.VLBV;

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const now = Date.now();
const DAY = 86400000;

const kv = [
  ['provinces', V.provinces],
  ['targets', V.targets],
  ['shifts', V.shifts],
  ['approve_mode', 'auto'] // auto: tin không có dấu hiệu rủi ro lên ngay · manual: mọi tin chờ duyệt
];
writeFileSync(root + 'migrations/0002_categories.sql',
  '-- Danh mục ban đầu (sinh bởi scripts/seed.mjs)\n' +
  kv.map(([k, v]) => `INSERT INTO kv (key, value, updated_at) VALUES (${q(k)}, ${q(JSON.stringify(v))}, ${now});`).join('\n') + '\n');

const co = V.companies.map((c) => `INSERT INTO companies (id, name, short, initials, color, logo, phone, about, size, founded, rating, reviews, mst, license, verified, verify_status, created_at) VALUES (${[c.id, c.name, c.short, c.initials, c.color, c.logo, c.phone, c.about, c.size, c.founded, c.rating, c.reviews || 0, c.mst, c.license, c.verified ? 1 : 0, c.verified ? 'done' : 'none', now].map(q).join(', ')});`);
const jobs = V.jobs.map((j) => {
  const expired = j.daysLeft < 0;
  const posted = now - j.posted * DAY;
  return `INSERT INTO jobs (id, company_id, title, province, district, address, target, shift, qty, salary_min, salary_max, housing, meals, urgent, tier, age, height, status, weeks, views, calls, posted_at, expires_at, created_at, updated_at) VALUES (${[j.id, j.company, j.title, j.province, j.district, j.address, j.target, j.shift, j.qty, j.salaryMin, j.salaryMax, j.housing ? 1 : 0, j.meals ? 1 : 0, j.urgent ? 1 : 0, j.tier === 'vip' ? 'vip' : 'normal', j.age, j.height, expired ? 'expired' : 'live', 4, j.views, j.calls, posted, now + j.daysLeft * DAY, posted, now].map(q).join(', ')});`;
});
writeFileSync(root + 'seed/demo.sql', '-- Dữ liệu mẫu: công ty + tin (sinh bởi scripts/seed.mjs)\n' + co.join('\n') + '\n' + jobs.join('\n') + '\n');
console.log(`OK: ${kv.length} cấu hình, ${co.length} công ty, ${jobs.length} tin`);
