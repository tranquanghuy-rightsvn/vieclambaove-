// SEO: chèn sẵn tiêu đề, mô tả, canonical, JSON-LD và nội dung chính vào index.html
// để Google đọc được trang tin / trang khu vực / trang công ty mà không cần chạy JavaScript.
import { now, slugify } from './lib.js';
import { categories, publicCompany, LIVE_SQL } from './snapshot.js';

const SITE_NAME = 'Việc Làm Bảo Vệ';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tr = (n) => String(n).replace('.', ',');
const pay = (j) => (j.salary_min === j.salary_max ? tr(j.salary_min) : `${tr(j.salary_min)}–${tr(j.salary_max)}`);
const jobUrl = (j) => `/tin/${slugify(j.title)}-${j.id}`;
const areaUrl = (p, d) => '/viec-lam' + (p ? '/' + p : '') + (d ? '/' + slugify(d) : '');
const isTemporaryHost = (url) => url.hostname.endsWith('.workers.dev') || url.hostname === 'localhost' || url.hostname === '127.0.0.1';

/* ---------- Trang HTML ---------- */
export async function seoPage(req, env, url) {
  const page = await describe(env, url).catch((e) => { console.error(e); return null; });
  const res = await env.ASSETS.fetch(new Request(url.origin + '/', req));
  if (!page) return res;
  const headers = new Headers(res.headers);
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  headers.delete('etag');
  const out = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(page.title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', page.desc); } })
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', url.origin + page.canonical); } })
    .on('head', { element(e) {
      e.append(`<meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.desc)}"><meta property="og:url" content="${esc(url.origin + page.canonical)}"><meta property="og:type" content="website">`, { html: true });
      if (page.noindex || isTemporaryHost(url)) e.append('<meta name="robots" content="noindex, follow">', { html: true });
      [].concat(page.ld || []).forEach((o) => e.append(`<script type="application/ld+json" data-ld>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`, { html: true }));
    } })
    .on('main#main', { element(e) { if (page.body) e.setInnerContent(`<div class="wrap ssr">${page.body}</div>`, { html: true }); } })
    .transform(new Response(res.body, { status: page.status || res.status, headers }));
  return out;
}

async function describe(env, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const t = now();

  let m = path.match(/^\/tin\/(?:[a-z0-9-]*-)?(\d+)$/);
  if (m) {
    const j = await env.DB.prepare(LIVE_SQL + ' AND j.id = ?2').bind(t, Number(m[1])).first();
    if (!j) return { status: 404, noindex: true, title: `Tin không còn tồn tại | ${SITE_NAME}`, desc: 'Tin tuyển dụng đã hết hạn hoặc bị gỡ.', canonical: path, body: '<h1>Tin tuyển dụng đã hết hạn hoặc không còn tồn tại</h1><p><a href="/viec-lam">Xem việc làm bảo vệ đang tuyển</a></p>' };
    const [c, cats] = await Promise.all([env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(j.company_id).first(), categories(env)]);
    const p = cats.provinces.find((x) => x.slug === j.province) || { name: j.province, short: j.province };
    const sh = cats.shifts.find((x) => x.id === j.shift)?.name || '';
    const tg = cats.targets.find((x) => x.id === j.target)?.name || '';
    const desc = `${c.short} tuyển ${j.qty} bảo vệ tại ${j.district}, ${p.short}. Lương ${pay(j)} triệu/tháng, ${sh.toLowerCase()}${j.housing ? ', bao ở' : ''}${j.meals ? ', bao ăn' : ''}.`;
    const facts = [['Mức lương', `${pay(j)} triệu/tháng`], ['Ca làm', sh], ['Loại mục tiêu', tg], ['Số lượng', `${j.qty} người`], ['Địa điểm', `${j.address ? j.address + ', ' : ''}${j.district}, ${p.name}`], ['Độ tuổi', j.age], ['Chiều cao', j.height], ['Chỗ ở', j.housing ? 'Có' : 'Không'], ['Bữa ăn', j.meals ? 'Có hỗ trợ' : 'Tự túc'], ['Hạn nộp', new Date(j.expires_at).toLocaleDateString('vi-VN')]].filter(([, v]) => v);
    return {
      title: `${j.title} – ${pay(j)} triệu | ${SITE_NAME}`, desc, canonical: jobUrl(j),
      body: `<nav class="crumbs"><a href="/">Trang chủ</a> › <a href="${areaUrl(p.slug)}">${esc(p.name)}</a> › <a href="${areaUrl(p.slug, j.district)}">${esc(j.district)}</a></nav>
        <article><h1>${esc(j.title)}</h1><p><a href="/cong-ty/${esc(c.id)}">${esc(c.name)}</a>${c.verified ? ' · Đã xác thực giấy phép' : ''}</p>
        <dl>${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        ${j.descr ? `<h2>Mô tả công việc</h2><p>${esc(j.descr).replace(/\n/g, '<br>')}</p>` : ''}</article>`,
      ld: {
        '@context': 'https://schema.org', '@type': 'JobPosting', title: j.title, description: j.descr || desc,
        datePosted: new Date(j.posted_at).toISOString().slice(0, 10), validThrough: new Date(j.expires_at).toISOString(),
        employmentType: j.shift === 'gay' ? 'PART_TIME' : 'FULL_TIME', industry: 'Dịch vụ bảo vệ', totalJobOpenings: j.qty,
        hiringOrganization: { '@type': 'Organization', name: c.name, sameAs: url.origin + '/cong-ty/' + c.id, ...(c.logo ? { logo: url.origin + c.logo } : {}) },
        jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', streetAddress: j.address || j.district, addressLocality: j.district, addressRegion: p.name, addressCountry: 'VN' } },
        baseSalary: { '@type': 'MonetaryAmount', currency: 'VND', value: { '@type': 'QuantitativeValue', minValue: j.salary_min * 1e6, maxValue: j.salary_max * 1e6, unitText: 'MONTH' } }
      }
    };
  }

  m = path.match(/^\/viec-lam(?:\/([a-z0-9-]+))?(?:\/([a-z0-9-]+))?$/);
  if (m || path === '/') {
    const cats = await categories(env);
    const p = m?.[1] ? cats.provinces.find((x) => x.slug === m[1]) : null;
    if (m?.[1] && !p) return { status: 404, noindex: true, title: `Không tìm thấy | ${SITE_NAME}`, desc: '', canonical: '/viec-lam' };
    const d = m?.[2] ? p.districts.find((x) => slugify(x) === m[2]) : null;
    if (m?.[2] && !d) return { status: 404, noindex: true, title: `Không tìm thấy | ${SITE_NAME}`, desc: '', canonical: areaUrl(p.slug) };
    let sql = LIVE_SQL, args = [t];
    if (p) { sql += ' AND j.province = ?2'; args.push(p.slug); }
    if (d) { sql += ' AND j.district = ?3'; args.push(d); }
    const jobs = (await env.DB.prepare(sql + ' ORDER BY j.posted_at DESC LIMIT 60').bind(...args).all()).results;
    const place = d ? `${d}, ${p.name}` : p ? p.name : 'toàn quốc';
    const home = path === '/';
    const h1 = home ? 'Việc làm bảo vệ, vệ sĩ uy tín – đi làm ngay' : `Tuyển dụng ${jobs.length} việc làm bảo vệ tại ${place}`;
    const sub = !home && p && !d ? `<h2>Theo quận/huyện</h2><ul>${p.districts.map((x) => `<li><a href="${areaUrl(p.slug, x)}">Bảo vệ ${esc(x)}</a></li>`).join('')}</ul>` : '';
    const areas = home || !p ? `<h2>Việc làm bảo vệ theo tỉnh</h2><ul>${cats.provinces.map((x) => `<li><a href="${areaUrl(x.slug)}">Việc làm bảo vệ ${esc(x.name)}</a></li>`).join('')}</ul>` : '';
    return {
      title: home ? `${SITE_NAME} – Tuyển dụng bảo vệ, vệ sĩ toàn quốc` : `Việc làm bảo vệ tại ${place} | ${SITE_NAME}`,
      desc: home ? `Chuyên trang việc làm ngành bảo vệ: ${jobs.length}+ tin đang tuyển, lương, ca làm, chỗ ở ghi rõ. Công ty được xác thực giấy phép, ứng viên không mất phí.`
        : `${jobs.length} tin tuyển bảo vệ tại ${place}: lương, ca làm, chỗ ở ghi rõ. Tin được kiểm duyệt, công ty xác thực giấy phép. Ứng tuyển miễn phí.`,
      canonical: home ? '/' : areaUrl(p?.slug, d),
      body: `<h1>${esc(h1)}</h1><ul>${jobs.map((j) => `<li><a href="${jobUrl(j)}">${esc(j.title)}</a> – ${pay(j)} triệu/tháng – ${esc(j.district)}</li>`).join('')}</ul>${sub}${areas}`,
      ld: home ? { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: url.origin + '/', potentialAction: { '@type': 'SearchAction', target: url.origin + '/viec-lam?q={q}', 'query-input': 'required name=q' } } : null
    };
  }

  m = path.match(/^\/video(?:\/([a-z0-9-]+))?$/);
  if (m) {
    if (!m[1]) {
      const vs = (await env.DB.prepare('SELECT * FROM videos WHERE published = 1 ORDER BY created_at DESC LIMIT 60').all()).results;
      return { title: `Video nghề bảo vệ | ${SITE_NAME}`, desc: 'Video hướng dẫn nghiệp vụ, kinh nghiệm phỏng vấn và giới thiệu công việc bảo vệ.', canonical: '/video',
        body: `<h1>Video nghề bảo vệ</h1><ul>${vs.map((v) => `<li><a href="/video/${esc(v.slug)}">${esc(v.title)}</a></li>`).join('')}</ul>` };
    }
    const v = await env.DB.prepare('SELECT * FROM videos WHERE slug = ? AND published = 1').bind(m[1]).first();
    if (!v) return { status: 404, noindex: true, title: `Không tìm thấy video | ${SITE_NAME}`, desc: '', canonical: path };
    const thumb = `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`;
    return {
      title: `${v.title} | ${SITE_NAME}`, desc: (v.descr || v.title).slice(0, 160), canonical: path,
      body: `<h1>${esc(v.title)}</h1><p><a href="https://www.youtube.com/watch?v=${esc(v.youtube_id)}">Xem trên YouTube</a></p>${v.descr ? `<p>${esc(v.descr).replace(/\n/g, '<br>')}</p>` : ''}`,
      ld: { '@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.descr || v.title, thumbnailUrl: thumb, uploadDate: new Date(v.created_at).toISOString(), embedUrl: `https://www.youtube.com/embed/${v.youtube_id}`, url: url.origin + path }
    };
  }

  m = path.match(/^\/cong-ty\/([a-z0-9-]+)$/);
  if (m) {
    const c = await env.DB.prepare('SELECT * FROM companies WHERE id = ? AND locked = 0').bind(m[1]).first();
    if (!c) return { status: 404, noindex: true, title: `Không tìm thấy công ty | ${SITE_NAME}`, desc: '', canonical: path };
    const jobs = (await env.DB.prepare(LIVE_SQL + ' AND j.company_id = ?2 ORDER BY j.posted_at DESC').bind(t, c.id).all()).results;
    const pc = publicCompany(c);
    return {
      title: `${c.name} tuyển dụng bảo vệ | ${SITE_NAME}`,
      desc: `${c.name}${c.verified ? ' (đã xác thực giấy phép)' : ''} đang tuyển ${jobs.length} vị trí bảo vệ. ${String(c.about || '').slice(0, 120)}`,
      canonical: path,
      body: `<h1>${esc(c.name)}</h1>${c.about ? `<p>${esc(c.about)}</p>` : ''}<h2>Đang tuyển ${jobs.length} vị trí</h2><ul>${jobs.map((j) => `<li><a href="${jobUrl(j)}">${esc(j.title)}</a> – ${pay(j)} triệu</li>`).join('')}</ul>`,
      ld: { '@context': 'https://schema.org', '@type': 'Organization', name: pc.name, url: url.origin + path, ...(pc.logo ? { logo: url.origin + pc.logo } : {}) }
    };
  }
  return null;
}

/* ---------- robots.txt + sitemap.xml ---------- */
export function robots(url) {
  // Tên miền tạm (*.workers.dev) không cho Google lập chỉ mục, tránh trùng nội dung khi gắn tên miền thật
  const body = isTemporaryHost(url)
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /ung-vien\nDisallow: /nha-tuyen-dung\nDisallow: /quan-tri\nDisallow: /dang-nhap\n\nSitemap: ${url.origin}/sitemap.xml\n`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}

export async function sitemap(env, url) {
  const t = now();
  const [cats, jobs, cos, vids] = await Promise.all([
    categories(env),
    env.DB.prepare(LIVE_SQL).bind(t).all(),
    env.DB.prepare('SELECT id, created_at FROM companies WHERE locked = 0').all(),
    env.DB.prepare('SELECT slug, updated_at FROM videos WHERE published = 1').all()
  ]);
  const day = (ms) => new Date(ms).toISOString().slice(0, 10);
  const urls = [['/', t], ['/viec-lam', t], ['/tin-tuc', t], ['/video', t]];
  const withJobs = new Set(jobs.results.map((j) => j.province + '|' + j.district));
  cats.provinces.forEach((p) => {
    urls.push([areaUrl(p.slug), t]);
    p.districts.filter((d) => withJobs.has(p.slug + '|' + d)).forEach((d) => urls.push([areaUrl(p.slug, d), t]));
  });
  jobs.results.forEach((j) => urls.push([jobUrl(j), j.updated_at]));
  cos.results.forEach((c) => urls.push(['/cong-ty/' + c.id, c.created_at]));
  vids.results.forEach((v) => urls.push(['/video/' + v.slug, v.updated_at]));
  // Bài tin tức đang nằm trong file tĩnh data.js: lấy danh sách mã bài từ đó
  const data = await env.ASSETS.fetch(new Request(url.origin + '/assets/js/data.js')).then((r) => r.text()).catch(() => '');
  const posts = (data.split('VLBV.posts')[1] || '').split('VLBV.packages')[0];
  [...posts.matchAll(/id: '([a-z0-9-]+)'/g)].forEach(([, id]) => urls.push(['/tin-tuc/' + id, t]));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${esc(url.origin + u)}</loc><lastmod>${day(d)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
