// Sinh site tĩnh vào html/ (thư mục site trên GitHub, Cloudflare deploy thư mục này) từ data/site.json (dữ liệu Worker xuất bản lên GitHub) + assets/js/data.js.
// Mỗi trang công khai (trang chủ, khu vực, tin, công ty, tin tức, video, chính sách) thành 1 file HTML
// đầy đủ nội dung, render bằng CHÍNH các hàm vẽ trang của website (assets/js/pages/*.js) nên HTML
// tĩnh và giao diện khi JS chạy là một. Trang cần tài khoản chỉ là khung, JS tự vẽ.
//
// Chạy: node scripts/build.mjs        (SITE_URL=https://ten-mien node scripts/build.mjs khi có tên miền)
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'html');
const SITE = (process.env.SITE_URL || 'https://vieclambaove.web100-vn.workers.dev').replace(/\/+$/, '');
const BUILT = Date.now();

/* ---------- Dữ liệu ---------- */
const dataFile = join(root, 'data/site.json');
const data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : { provinces: [], targets: [], shifts: [], companies: [], jobs: [], videos: [] };

// Tính ngày đăng / số ngày còn lại theo giờ build; tin đã quá hạn không sinh trang (giống trình duyệt)
const DAY = 864e5;
const withDays = (d) => ({
  ...d,
  jobs: d.jobs.map((j) => ({ ...j, posted: Math.max(0, Math.floor((BUILT - j.postedAt) / DAY)), daysLeft: Math.floor((j.expiresAt - BUILT) / DAY) })).filter((j) => j.expiresAt > BUILT)
});

/* ---------- Môi trường trình duyệt tối thiểu để chạy hàm vẽ trang ---------- */
const noop = () => {};
const loc = new URL(SITE + '/');
globalThis.window = globalThis;
globalThis.location = { get origin() { return SITE; }, get pathname() { return loc.pathname; }, get search() { return loc.search; }, get href() { return loc.href; }, hash: '' };
globalThis.history = { replaceState: noop, pushState: noop };
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.sessionStorage = globalThis.localStorage;
globalThis.document = { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], dispatchEvent: noop };
globalThis.addEventListener = noop;
vm.runInThisContext(readFileSync(join(root, 'assets/js/data.js'), 'utf8')); // bài tin tức
Object.assign(globalThis.VLBV, withDays(data));

const imp = (p) => import(pathToFileURL(join(root, p)).href);
const core = await imp('assets/js/core.js');
const layout = await imp('assets/js/layout.js');
const V = globalThis.VLBV;

/* ---------- Khung HTML ---------- */
const shell = readFileSync(join(root, 'index.html'), 'utf8');
const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function htmlPage(path, page, { status } = {}) {
  const title = layout.docTitle(page);
  const desc = page.desc || layout.DEFAULT_DESC;
  const canonical = SITE + layout.noSlash(page.canonical || path);
  const ld = [].concat(page.ld || []).map((o) => `<script type="application/ld+json" data-ld>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('');
  const head = `<meta property="og:title" content="${escAttr(title)}"><meta property="og:description" content="${escAttr(desc)}"><meta property="og:url" content="${escAttr(canonical)}"><meta property="og:type" content="website">${page.noindex ? '<meta name="robots" content="noindex, follow">' : ''}${ld}`;
  const cls = [page.mbar && 'has-mbar', page.tabbar !== false && 'has-tabbar'].filter(Boolean).join(' ');
  return shell
    .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escAttr(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${escAttr(canonical)}">`)
    .replace('</head>', head + '\n</head>')
    .replace('<body>', cls ? `<body class="${cls}">` : '<body>')
    .replace('<div id="header"></div>', `<div id="header">${layout.cleanLinks(layout.headerHtml(page.nav))}</div>`)
    .replace('<main id="main" tabindex="-1"></main>', `<main id="main" tabindex="-1">${layout.cleanLinks(page.html)}</main>`)
    .replace('<div id="footer"></div>', `<div id="footer">${layout.cleanLinks(layout.footerHtml(layout.noSlash(path)))}</div>`);
}

function write(path, html) {
  const file = path === '/' ? join(out, 'index.html') : path.endsWith('.html') || path.endsWith('.xml') || path.endsWith('.js') ? join(out, path) : join(out, path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

async function render(path) {
  loc.pathname = path;
  const m = layout.match(path);
  if (!m) throw new Error('Không có tuyến cho ' + path);
  const page = await (await m.load()).default({ params: m.params, query: new URLSearchParams(), path });
  if (page.redirect) return null;
  return page;
}

/* ---------- Sinh trang ---------- */
// Dọn html/ nhưng GIỮ html/images/ (ảnh tin + logo do Worker commit, build không tạo lại được)
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f !== 'images') rmSync(join(out, f), { recursive: true, force: true });
cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true, filter: (s) => !s.endsWith('.DS_Store') });
cpSync(join(root, 'quan-tri'), join(out, 'quan-tri'), { recursive: true });

// Dữ liệu cho tìm kiếm/lọc phía trình duyệt (cùng nguồn với HTML vừa sinh)
write('/data/site.js', `/* Sinh bởi scripts/build.mjs từ data/site.json - không sửa tay */
(function (V, d) {
  var t = Date.now(), D = 864e5;
  d.jobs = d.jobs.map(function (j) {
    j.posted = Math.max(0, Math.floor((t - j.postedAt) / D));
    j.daysLeft = Math.floor((j.expiresAt - t) / D);
    return j;
  }).filter(function (j) { return j.expiresAt > t; });
  for (var k in d) V[k] = d[k];
})(window.VLBV = window.VLBV || {}, ${JSON.stringify(data).replace(/</g, '\\u003c')});
`);

const pub = [];          // [path, lastmod] cho sitemap
const add = (path, lastmod = BUILT) => pub.push([path, lastmod]);
add('/'); add('/viec-lam'); add('/tin-tuc'); add('/video'); add('/cong-ty-tuyen-dung');
['dieu-khoan', 'bao-mat', 'quy-che', 'lien-he'].forEach((s) => add('/chinh-sach/' + s));
const withJobs = new Set(V.jobs.map((j) => j.province + '|' + j.district));
V.provinces.forEach((p) => {
  add(core.url.area(p.slug));
  // Quận/huyện chỉ sinh trang khi có tin (tránh trang rỗng); quận chưa có tin vẫn xem được qua JS
  p.districts.filter((d) => withJobs.has(p.slug + '|' + d)).forEach((d) => add(core.url.area(p.slug, d)));
});
V.jobs.forEach((j) => add(core.url.job(j), j.updatedAt || j.postedAt));
V.companies.forEach((c) => add(core.url.company(c)));
V.posts.forEach((p) => add(core.url.post(p)));
(V.videos || []).forEach((v) => add('/video/' + v.slug, v.updatedAt || v.date));

let n = 0;
for (const [path] of pub) {
  const page = await render(path);
  if (!page) continue;
  write(path, htmlPage(path, page));
  n++;
}
write('/chinh-sach', htmlPage('/chinh-sach', await render('/chinh-sach/dieu-khoan'))); // /chinh-sach = điều khoản

// Trang cần tài khoản: chỉ khung (JS vẽ sau khi biết đăng nhập), không cho lập chỉ mục
const PRIVATE = {
  '/dang-nhap': 'Đăng nhập',
  '/ung-vien': 'Hồ sơ của tôi', '/ung-vien/da-ung-tuyen': 'Đã ứng tuyển', '/ung-vien/da-luu': 'Việc đã lưu', '/ung-vien/cai-dat': 'Cài đặt',
  '/trang-quan-ly-tuyen-dung': 'Nhà tuyển dụng', '/trang-quan-ly-tuyen-dung/dang-tin': 'Đăng tin', '/trang-quan-ly-tuyen-dung/tin-dang': 'Tin đã đăng', '/trang-quan-ly-tuyen-dung/ung-vien': 'Ứng viên', '/trang-quan-ly-tuyen-dung/tim-ung-vien': 'Tìm ứng viên',
  '/trang-quan-ly-tuyen-dung/xac-thuc': 'Xác thực công ty', '/trang-quan-ly-tuyen-dung/cong-ty': 'Thông tin công ty'
};
const loading = '<div class="wrap" style="padding:80px 0;text-align:center"><p class="mute">Đang tải…</p></div>';
for (const [path, title] of Object.entries(PRIVATE)) {
  write(path, htmlPage(path, { title, noindex: true, html: loading, nav: path.startsWith('/trang-quan-ly-tuyen-dung') ? 'employer' : '', tabbar: path !== '/dang-nhap' }));
}
// Khung trống: Worker trả cho nội dung vừa duyệt chưa kịp build (JS vẽ từ dữ liệu trực tiếp)
write('/_shell', htmlPage('/', { title: '', noindex: true, html: loading }).replace('<link rel="canonical" href="' + SITE + '/">', '<link rel="canonical" href="/">'));
// 404: vẫn là khung app - đường dẫn hợp lệ nhưng chưa có trang tĩnh (vd quận chưa có tin) JS sẽ vẽ đúng trang
write('/404.html', htmlPage('/404', layout.notFoundPage()));
write('/_404', htmlPage('/404', layout.notFoundPage()));

const day = (ms) => new Date(ms).toISOString().slice(0, 10);
write('/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pub.map(([u, d]) => `  <url><loc>${escAttr(SITE + u)}</loc><lastmod>${day(d)}</lastmod></url>`).join('\n')}\n</urlset>\n`);

console.log(`build: ${n} trang công khai, ${Object.keys(PRIVATE).length} khung trang tài khoản, ${V.jobs.length} tin, ${(V.videos || []).length} video → html/ (SITE_URL=${SITE})`);
