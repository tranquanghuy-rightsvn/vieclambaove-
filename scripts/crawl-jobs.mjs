#!/usr/bin/env node
// Cào tin tuyển dụng bảo vệ từ các trang việc làm công khai và nhập vào website dưới dạng "Tin tổng hợp" (ghi rõ nguồn).
//
// Chạy hằng ngày:
//   node scripts/crawl-jobs.mjs                 # chạy thử: cào + chuẩn hoá, ghi crawl-out/jobs-<ngày>.json, KHÔNG nhập
//   node scripts/crawl-jobs.mjs --import        # cào rồi nhập luôn vào website (tin lên ngay, tự xuất bản)
//   node scripts/crawl-jobs.mjs --import-file crawl-out/jobs-2026-11-24.json   # nhập file đã cào (sau khi xem lại)
// Tuỳ chọn: --pages 3 (số trang danh sách mỗi nguồn), --max 40 (tối đa tin mỗi nguồn), --only vieclam24h,123job
//
// Khoá quản trị: biến môi trường VLBV_ADMIN_KEY hoặc file .admin-key ở thư mục gốc (đã gitignore).
// Website: biến VLBV_URL (mặc định https://vieclambaove.web100-vn.workers.dev).
//
// Quy tắc: tôn trọng robots.txt, nghỉ 1,5 giây giữa các lần tải, chỉ lấy tin có lương rõ ràng, thuộc 6 tỉnh của website,
// còn hạn; nội dung bỏ hết đường link. Trùng link nguồn thì website tự bỏ qua; trùng tiêu đề + công ty giữa các nguồn thì bỏ.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const PAGES = Number(opt('pages', 2));
const MAX = Number(opt('max', 40));
const ONLY = opt('only', '') ? String(opt('only')).split(',') : null;
const SITE = (process.env.VLBV_URL || 'https://vieclambaove.web100-vn.workers.dev').replace(/\/$/, '');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const DELAY = 1500;
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

/* ---------------- Tải trang lịch sự ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let last = 0;
async function get(url) {
  const wait = last + DELAY - Date.now(); if (wait > 0) await sleep(wait);
  last = Date.now();
  if (!(await allowed(url))) throw new Error('robots.txt không cho phép');
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'vi-VN,vi;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.text();
}
const robots = {};
async function allowed(url) {
  const u = new URL(url);
  if (!(u.host in robots)) {
    robots[u.host] = [];
    try {
      const t = await (await fetch(u.origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) })).text();
      let mine = false;
      for (const line of t.split(/\r?\n/)) {
        const [k, ...v] = line.split(':'); const key = k.trim().toLowerCase(), val = v.join(':').trim();
        if (key === 'user-agent') mine = val === '*';
        else if (mine && key === 'disallow' && val) robots[u.host].push(new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')));
      }
    } catch { /* không đọc được robots: coi như cho phép */ }
  }
  return !robots[u.host].some((re) => re.test(u.pathname + u.search));
}

/* ---------------- Tiện ích văn bản ---------------- */
const decode = (s) => String(s ?? '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n));
const strip = (html) => decode(String(html ?? '').replace(/<br\s*\/?>|<\/(p|li|div|h\d)>/gi, '\n').replace(/<li[^>]*>/gi, '- ').replace(/<[^>]+>/g, ' '));
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{2022}\u{25AA}-\u{25FF}\u{2600}-\u{27BF}]/gu;
const LINK = /(https?:\/\/\S+|www\.\S+|\b[a-z0-9][a-z0-9-]{0,62}\.(com|vn|net|org|info|biz|me|io|co|xyz|top|online|site|store|shop|link|ly|app|page|asia|club|live|pro|tv|cc|ws|to|gl|gg)\b(\.vn)?(\/\S*)?)/gi;
const clean = (s) => strip(s).replace(EMOJI, ' ').replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, ' ').replace(LINK, ' ').replace(/[–—]/g, '-').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').replace(/([^\s\n])- (?=\p{Lu})/gu, '$1\n- ').trim();
const oneLine = (s) => clean(s).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (s) => (s === s.toUpperCase() && /[A-ZĐ]/.test(s) ? s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/([\[(]\s*)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()) : s);
const isSecurityJob = (t) => /bảo vệ|an ninh|security|vệ sĩ|vệ sỹ/i.test(t) && !/thực vật|bảo vệ môi trường|hse|bảo vệ thực|kinh doanh|sale|camera|kỹ thuật|kế toán|bảo vệ sức khỏe|lập trình|marketing/i.test(t);

/* ---------------- Danh mục của website ---------------- */
const siteData = JSON.parse(readFileSync(join(root, 'data/site.json'), 'utf8'));
const PROVINCES = siteData.provinces;
const REGION = [ // nhận diện tỉnh theo chữ trong địa chỉ (gồm tên cũ trước sáp nhập)
  ['tp-hcm', /(tp\.?\s*hcm|ho chi minh|sai gon|thu duc)/], ['ha-noi', /ha noi/], ['binh-duong', /binh duong|thu dau mot|di an|thuan an|tan uyen|ben cat/],
  ['dong-nai', /dong nai|bien hoa|long thanh|nhon trach|trang bom/], ['bac-ninh', /bac ninh|tu son|que vo|yen phong/], ['da-nang', /da nang|hai chau|son tra|lien chieu|ngu hanh son|thanh khe|cam le/]
];
// Khu công nghiệp / địa danh hay gặp nhưng địa chỉ mới (sau sáp nhập) không còn tên quận/huyện
const LANDMARKS = [[/vsip ?(1|i)\b|vsip binh duong|kcn viet huong|binh hoa, thuan an/, 'binh-duong', 'Thuận An'], [/vsip ?(2|ii)|vinh tan|nam tan uyen/, 'binh-duong', 'Tân Uyên'],
  [/my phuoc|bau bang/, 'binh-duong', 'Bến Cát'], [/song than|kcn tan dong hiep/, 'binh-duong', 'Dĩ An'], [/amata|loteco|kcn bien hoa/, 'dong-nai', 'Biên Hòa'], [/vsip bac ninh|que vo/, 'bac-ninh', 'Quế Võ']];
function locate(text, region) {
  const f = fold(text);
  for (const [re, province, district] of LANDMARKS) if (re.test(f)) return { province, district };
  // Quận/huyện đã có trên website: so khớp cả tên đầy đủ và tên bỏ ngoặc
  for (const p of PROVINCES) for (const d of p.districts) {
    const base = fold(d.replace(/\s*\(.*\)/, ''));
    const re = new RegExp('(^|[^a-z0-9])' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])');
    if (base.length >= 4 && re.test(f)) {
      // "Quận 1" chỉ nhận khi văn bản cũng nói tới tỉnh đó (tránh nhầm Hà Nội / TP.HCM)
      const rg = REGION.find(([s]) => s === p.slug)[1];
      if (/^quan \d+$/.test(base) && !rg.test(f)) continue;
      return { province: p.slug, district: d };
    }
  }
  const fr = fold(region || '') + ' ' + f;
  const hit = REGION.find(([, re]) => re.test(fold(region || ''))) || REGION.find(([, re]) => re.test(fr));
  return hit ? { province: hit[0], district: '' } : null;
}
function districtFromAddress(addr) { // "Phường X, TP. Thủ Đức - Quận Thủ Đức, TP.HCM" → "Thủ Đức"
  const parts = String(addr || '').split(/[,\-]/).map((x) => x.trim()).filter(Boolean);
  const p = parts.find((x) => /^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i.test(x) && !/(hồ chí minh|hcm|hà nội|đà nẵng)$/i.test(x));
  return p ? p.replace(/^(quận|huyện|thị xã|tp\.?|thành phố)\s+/i, (m) => (/^quận/i.test(m) && /^\d/.test(p.slice(m.length)) ? 'Quận ' : '')).trim() : '';
}

/* ---------------- Phân loại ---------------- */
const TARGETS = [['kcn', /nha may|khu cong nghiep|\bkcn\b|xuong|kho hang|kho bai|\bkho\b|cong trinh|cang/], ['ngan-hang', /ngan hang|vietcombank|bidv|agribank|techcombank|vietinbank|atm/],
  ['truong-hoc', /truong hoc|truong mam non|truong tieu hoc|truong thcs|truong thpt|truong dai hoc|benh vien|phong kham/], ['su-kien', /su kien|trien lam|hoi cho/], ['ve-si', /\bve s[iy]\b|yeu nhan/],
  ['toa-nha', /chung cu|toa nha|van phong|cua hang|sieu thi|nha hang|khach san|quan nhau|\bkdc\b|khu dan cu|bai xe|giu xe|store|mart\b|shop/]];
const STRONG = /nha may|khu cong nghiep|\bkcn\b|ngan hang|benh vien|truong hoc|su kien|\bve s[iy]\b/;
// Ưu tiên tiêu đề; mô tả chỉ dùng khi có từ khoá rõ ràng (tránh "môi trường", "kho" trong câu mô tả)
const target = (title, desc) => (TARGETS.find(([, re]) => re.test(fold(title))) || (STRONG.test(fold(desc)) && TARGETS.find(([, re]) => re.test((fold(desc).match(STRONG) || [''])[0]))) || ['toa-nha'])[0];
const shift = (t) => { const f = fold(t); return /12 ?(tieng|h\b|gio)/.test(f) ? '12h' : /24 ?\/ ?24|truc 24|ca 24/.test(f) ? '24h' : /ca gay/.test(f) ? 'gay' : /ca dem|truc dem/.test(f) ? 'dem' : /8 ?(tieng|h\b|gio)/.test(f) ? '8h' : ''; };
const housing = (t) => /bao o|ky tuc|cho o mien phi|ho tro cho o|bo tri cho o|nha o mien phi|o tai cho/.test(fold(t));
const meals = (t) => /bao an|com trua|suat an|bua an|ho tro an|an ca|bao com|tro cap com|phu cap com/.test(fold(t));
const r05 = (n) => Math.round(n * 2) / 2;
function salary(min, max, text) {
  let a = Number(min) || 0, b = Number(max) || 0;
  if (a > 1000) a /= 1e6; if (b > 1000) b /= 1e6;
  if (!a && !b) { // tìm trong chữ: "8 - 9 triệu", "8tr - 10tr", "12tr", "11.300.000"
    const f = fold(text).replace(/(\d)[.,](\d{3})[.,](\d{3})/g, (m, x, y) => String(Number(x + y) / 1000)).replace(/(\d),(\d)/g, '$1.$2');
    const m = f.match(/(\d+(?:\.\d+)?)\s*(?:tr(?:ieu)?)?\s*(?:-|den|toi|~)\s*(\d+(?:\.\d+)?)\s*(?:tr|trieu)/) || f.match(/(\d+(?:\.\d+)?)\s*(?:tr|trieu)/);
    if (m) { a = Number(m[1]); b = Number(m[2] || m[1]); }
    if (a > 1000) { a /= 1000; b /= 1000; }
  }
  if (!a && b) a = b; if (!b) b = a;
  if (!(a >= 3 && b <= 60 && b >= a)) return null;
  return [r05(a), r05(b)];
}
const phone = (t) => { const m = String(t).replace(/[.\s]/g, '').match(/(?:\+84|0)(3|5|7|8|9)\d{8}/); return m ? m[0].replace(/^\+84/, '0') : ''; };
const qtyOf = (n, t) => Number(n) > 0 ? Math.min(999, Number(n)) : (Number((fold(t).match(/tuyen\s+(\d{1,3})\s+(nv|nhan vien|bao ve|nam|nu)/) || [])[1]) || 1);
const ageOf = (t) => (oneLine(t).match(/(?:tuổi|độ tuổi)[^.;\n]{0,25}?\d{2}\s*(?:-|đến|tới)\s*\d{2}/i) || [''])[0].slice(0, 60);
const heightOf = (t) => (oneLine(t).match(/cao\s*(?:từ|trên|tối thiểu)?\s*1m\d{0,2}|cao\s*(?:từ|trên)?\s*1[.,]\d{1,2}\s*m/i) || [''])[0].slice(0, 60);

/* ---------------- Đọc trang chi tiết ---------------- */
function jsonLd(html) {
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    let d; try { d = JSON.parse(m[1].trim()); } catch { continue; }
    const list = Array.isArray(d) ? d : d['@graph'] || [d];
    const jp = list.find((x) => x && (x['@type'] === 'JobPosting' || (Array.isArray(x['@type']) && x['@type'].includes('JobPosting'))));
    if (jp) return jp;
  }
  return null;
}
function fromJobPosting(jp) {
  const loc = [].concat(jp.jobLocation || [])[0]?.address || {};
  const val = jp.baseSalary?.value || {};
  const unit = String(val.unitText || jp.baseSalary?.unitText || 'MONTH').toUpperCase();
  return {
    title: jp.title, desc: [jp.description, jp.jobBenefits, jp.qualifications, jp.experienceRequirements?.description].filter((x) => typeof x === 'string').join('\n'),
    company: jp.hiringOrganization?.name || jp.identifier?.name, address: [loc.streetAddress, loc.addressLocality].filter(Boolean).join(', '),
    region: [loc.addressRegion, loc.addressLocality].filter(Boolean).join(' '), salaryMin: unit === 'MONTH' ? val.minValue ?? val.value : 0, salaryMax: unit === 'MONTH' ? val.maxValue ?? val.value : 0,
    postedAt: jp.datePosted, deadline: jp.validThrough, qty: jp.totalJobOpenings
  };
}
function fromMuaban(html) {
  const m = html.match(/__NEXT_DATA__[^>]*>([\s\S]*?)<\/script>/); if (!m) return null;
  const c = JSON.parse(m[1])?.props?.pageProps?.classified; if (!c || String(c.is_expired) === 'True') return null;
  let org = ''; try { org = (String(c.organization).match(/'name':\s*'([^']+)'/) || [])[1] || ''; } catch { /* */ }
  return {
    title: c.title, desc: c.body, company: c.job_company_name || org, address: c.address || c.location, region: c.address_region || c.location,
    salaryMin: Number(c.job_min_salary) || 0, salaryMax: Number(c.job_max_salary) || Number(c.price) || 0, postedAt: c.publish_at, deadline: c.job_submission_expired || '', qty: 0
  };
}

/* ---------------- Nguồn ---------------- */
const SOURCES = [
  { name: 'vieclam24h.vn', list: (p) => `https://vieclam24h.vn/viec-lam-an-ninh-bao-ve-o2.html${p > 1 ? '?page=' + p : ''}`,
    links: (h) => [...h.matchAll(/href="(\/[a-z0-9-]+\/[a-z0-9-]+id\d{9}\.html)[?"]/g)].map((m) => 'https://vieclam24h.vn' + m[1]), parse: (h) => { const jp = jsonLd(h); return jp && fromJobPosting(jp); } },
  { name: '123job.vn', list: (p) => `https://123job.vn/tuyen-dung?q=b%E1%BA%A3o+v%E1%BB%87${p > 1 ? '&page=' + p : ''}`,
    links: (h) => [...h.matchAll(/href="(https:\/\/123job\.vn\/viec-lam\/[A-Za-z0-9-]+)"/g)].map((m) => m[1]), parse: (h) => { const jp = jsonLd(h); return jp && fromJobPosting(jp); } },
  { name: 'muaban.net', list: (p) => `https://muaban.net/viec-lam/an-ninh-bao-ve${p > 1 ? '?page=' + p : ''}`,
    links: (h) => [...h.matchAll(/href="((?:https:\/\/muaban\.net)?\/viec-lam\/an-ninh-bao-ve-[a-z0-9-]+\/[a-z0-9-]+-id\d+)"/g)].map((m) => (m[1].startsWith('http') ? m[1] : 'https://muaban.net' + m[1])), parse: fromMuaban },
  { name: 'careerlink.vn', list: (p) => `https://www.careerlink.vn/viec-lam/k/bao-ve${p > 1 ? '?page=' + p : ''}`,
    links: (h) => [...h.matchAll(/href="(\/tim-viec-lam\/[^"?#]+\/\d{6,})"/g)].map((m) => 'https://www.careerlink.vn' + m[1]), parse: (h) => { const jp = jsonLd(h); return jp && fromJobPosting(jp); } }
];

/* ---------------- Chuẩn hoá 1 tin ---------------- */
function normalize(raw, url, source) {
  const title = titleCase(oneLine(raw.title)).slice(0, 150);
  const desc = clean(raw.desc).slice(0, 3000);
  const company = titleCase(oneLine(raw.company)).slice(0, 150);
  const all = `${title}\n${raw.address || ''}\n${desc}`;
  if (!title || !isSecurityJob(title)) return { skip: 'Không phải tin bảo vệ' };
  if (!company) return { skip: 'Thiếu tên công ty' };
  const where = locate(`${title} ${raw.address || ''}`, raw.region) || locate(all, raw.region);
  if (!where || !PROVINCES.some((p) => p.slug === where.province)) return { skip: 'Ngoài 6 tỉnh của website' };
  // TP.HCM: "Quận 11", "Q.11", "Q11" trong tiêu đề được ưu tiên (kể cả quận chưa có trên website)
  const qn = where.province === 'tp-hcm' && fold(title).match(/(?:^|[^a-z])(?:quan|q\.?)\s*(\d{1,2})(?![\d,])/);
  if (qn && Number(qn[1]) >= 1 && Number(qn[1]) <= 12 && !/,\s*q/i.test(title)) { const q = 'Quận ' + Number(qn[1]); where.district = PROVINCES[0].districts.concat(...PROVINCES.map((x) => x.districts)).find((d) => d === q || d.startsWith(q + ' (')) || q; }
  where.district ||= districtFromAddress(raw.address);
  if (!where.district) return { skip: 'Không rõ quận/huyện' };
  const pay = salary(raw.salaryMin, raw.salaryMax, `${title}\n${desc}`);
  if (!pay) return { skip: 'Không có mức lương rõ ràng' };
  const deadline = raw.deadline ? String(raw.deadline).slice(0, 10) : '';
  if (deadline && deadline < today) return { skip: 'Tin gốc đã hết hạn' };
  return {
    province: where.province, district: where.district, address: oneLine(raw.address).slice(0, 200),
    company, companyPhone: phone(desc), title, target: target(title, desc), shift: shift(`${title} ${desc}`), qty: qtyOf(raw.qty, title),
    salaryMin: pay[0], salaryMax: pay[1], housing: housing(all), meals: meals(all), age: ageOf(desc), height: heightOf(desc), desc,
    postedAt: raw.postedAt ? String(raw.postedAt).slice(0, 10) : today, deadline, sourceName: source, sourceUrl: url
  };
}

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
if (opt('import-file', '')) { await importItems(JSON.parse(readFileSync(String(opt('import-file')), 'utf8'))); process.exit(0); }

const seenFile = join(root, 'crawl-out/seen.json');
mkdirSync(join(root, 'crawl-out'), { recursive: true });
const seen = existsSync(seenFile) ? JSON.parse(readFileSync(seenFile, 'utf8')) : {}; // link đã xử lý (khỏi tải lại)
const out = [], keys = new Set(), stats = {};
for (const src of SOURCES) {
  if (ONLY && !ONLY.some((o) => src.name.startsWith(o))) continue;
  const st = (stats[src.name] = { links: 0, ok: 0, skip: {} });
  const urls = new Set();
  for (let p = 1; p <= PAGES; p++) {
    try { src.links(await get(src.list(p))).forEach((u) => urls.add(u.split('#')[0])); }
    catch (e) { console.warn(`[${src.name}] trang danh sách ${p}: ${e.message}`); break; }
  }
  st.links = urls.size;
  let n = 0;
  for (const url of urls) {
    if (n >= MAX) break;
    if (seen[url]) { st.skip['Đã xử lý hôm trước'] = (st.skip['Đã xử lý hôm trước'] || 0) + 1; continue; }
    n++;
    let res;
    try { const raw = src.parse(await get(url)); res = raw ? normalize(raw, url, src.name) : { skip: 'Không đọc được nội dung tin' }; }
    catch (e) { res = { skip: 'Lỗi tải: ' + e.message }; }
    if (!res.skip?.startsWith('Lỗi tải')) seen[url] = today;
    if (res.skip) { st.skip[res.skip] = (st.skip[res.skip] || 0) + 1; continue; }
    const k = slug(res.title + ' ' + res.province);
    if (keys.has(k)) { st.skip['Trùng tin ở nguồn khác'] = (st.skip['Trùng tin ở nguồn khác'] || 0) + 1; continue; }
    keys.add(k); out.push(res); st.ok++;
    process.stdout.write(`  + [${src.name}] ${res.title.slice(0, 70)} | ${res.salaryMin}-${res.salaryMax} tr | ${res.district || '?'}, ${res.province}\n`);
  }
}
const file = join(root, `crawl-out/jobs-${today}.json`);
writeFileSync(file, JSON.stringify(out, null, 1));
writeFileSync(seenFile, JSON.stringify(Object.fromEntries(Object.entries(seen).filter(([, d]) => d >= new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)))));
console.log('\nKết quả theo nguồn:');
for (const [k, s] of Object.entries(stats)) console.log(`  ${k}: ${s.links} link, lấy được ${s.ok} tin` + Object.entries(s.skip).map(([r, c]) => `; ${r}: ${c}`).join(''));
console.log(`\nĐã lưu ${out.length} tin vào ${file.replace(root + '/', '')}`);
if (opt('import', false) === true) await importItems(out);
else console.log('Xem lại file rồi nhập bằng: node scripts/crawl-jobs.mjs --import-file ' + file.replace(root + '/', ''));
