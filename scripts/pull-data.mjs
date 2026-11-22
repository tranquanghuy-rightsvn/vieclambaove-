// Tải dữ liệu công khai hiện tại từ Worker về data/site.json (để build site tĩnh ở máy).
// Chạy: node scripts/pull-data.mjs [url-worker]   (mặc định http://127.0.0.1:8787, khoá lấy từ .dev.vars hoặc biến ADMIN_API_KEY)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const base = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/+$/, '');
const vars = existsSync(root + '.dev.vars') ? Object.fromEntries(readFileSync(root + '.dev.vars', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])) : {};
const key = process.env.ADMIN_API_KEY || vars.ADMIN_API_KEY;
if (!key) { console.error('Thiếu ADMIN_API_KEY'); process.exit(1); }
const res = await fetch(base + '/api/admin/export', { headers: { authorization: 'Bearer ' + key } });
if (!res.ok) { console.error('Lỗi', res.status, await res.text()); process.exit(1); }
const data = await res.json();
mkdirSync(root + 'data', { recursive: true });
writeFileSync(root + 'data/site.json', JSON.stringify(data, null, 1) + '\n');
console.log(`data/site.json: ${data.jobs.length} tin, ${data.companies.length} công ty, ${data.videos.length} video`);
