#!/usr/bin/env node
// Cào tin tuyển dụng bảo vệ chạy tay ở máy (website đã tự cào lúc 6h sáng mỗi ngày bằng cron của Worker).
//   node scripts/crawl-jobs.mjs                 # chạy thử: cào + chuẩn hoá, ghi crawl-out/jobs-<ngày>.json, KHÔNG nhập
//   node scripts/crawl-jobs.mjs --import        # cào rồi nhập luôn vào website (tin lên ngay, tự xuất bản)
//   node scripts/crawl-jobs.mjs --import-file crawl-out/jobs-2026-11-24.json   # nhập file đã cào (sau khi xem lại)
// Tuỳ chọn: --pages 3 (số trang danh sách mỗi nguồn), --max 40 (tối đa tin mỗi nguồn), --only vieclam24h,123job
// Khoá quản trị: biến VLBV_ADMIN_KEY hoặc file .admin-key (đã gitignore). Website: biến VLBV_URL.
// Logic cào nằm ở worker/crawl.js (dùng chung với cron).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crawl, statsText } from '../worker/crawl.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const SITE = (process.env.VLBV_URL || 'https://vieclambaove.web100-vn.workers.dev').replace(/\/$/, '');
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
/* ---------------- Nhập vào website ---------------- */
function adminKey() {
  if (process.env.VLBV_ADMIN_KEY) return process.env.VLBV_ADMIN_KEY.trim();
  const f = join(root, '.admin-key'); if (existsSync(f)) return readFileSync(f, 'utf8').trim();
  console.error('Thiếu khoá quản trị: đặt biến VLBV_ADMIN_KEY hoặc tạo file .admin-key'); process.exit(1);
}
async function importItems(items) {
  const key = adminKey(); let created = 0; const skipped = [];
  for (let i = 0; i < items.length; i += 50) {
    const r = await fetch(SITE + '/api/admin/import-jobs', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key }, body: JSON.stringify({ items: items.slice(i, i + 50) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error('Nhập lỗi:', r.status, j.error || ''); process.exit(1); }
    created += j.created; skipped.push(...(j.skipped || []));
  }
  console.log(`\nĐã nhập ${created} tin mới. Website bỏ qua ${skipped.length} tin:`);
  const why = {}; skipped.forEach((s) => (why[s.reason] = (why[s.reason] || 0) + 1));
  Object.entries(why).forEach(([k, v]) => console.log(`  - ${k}: ${v}`));
}

/* ---------------- Chạy ---------------- */

/* ---------------- Chạy ---------------- */
if (opt('import-file', '')) { await importItems(JSON.parse(readFileSync(String(opt('import-file')), 'utf8'))); process.exit(0); }
mkdirSync(join(root, 'crawl-out'), { recursive: true });
const seenFile = join(root, 'crawl-out/seen.json');
const { provinces } = JSON.parse(readFileSync(join(root, 'data/site.json'), 'utf8'));
const { items, stats, seen } = await crawl({
  provinces, seen: existsSync(seenFile) ? JSON.parse(readFileSync(seenFile, 'utf8')) : {},
  pages: Number(opt('pages', 2)), max: Number(opt('max', 40)), only: opt('only', '') ? String(opt('only')).split(',') : null, log: (s) => console.log(s)
});
const file = join(root, `crawl-out/jobs-${today}.json`);
writeFileSync(file, JSON.stringify(items, null, 1));
writeFileSync(seenFile, JSON.stringify(seen));
console.log('\nKết quả theo nguồn:\n' + statsText(stats).replace(/^/gm, '  '));
console.log(`\nĐã lưu ${items.length} tin vào ${file.replace(root + '/', '')}`);
if (opt('import', false) === true) await importItems(items);
else console.log('Xem lại file rồi nhập bằng: node scripts/crawl-jobs.mjs --import-file ' + file.replace(root + '/', ''));
