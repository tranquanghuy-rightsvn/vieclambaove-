import { V, esc, icon, url, pay, num, crumbs, activeJobs, province, company, jobThumb, ago, SITE } from '../core.js';

// Nội dung bài: file HTML riêng assets/content/tin-tuc/<slug>.html (khi dựng trang tĩnh thì đọc file, khi chuyển trang thì tải về)
const cache = {};
async function loadBody(id) {
  if (cache[id] != null) return cache[id];
  try {
    if (globalThis.__readContent) cache[id] = globalThis.__readContent(`tin-tuc/${id}.html`);
    else { const r = await fetch(`/assets/content/tin-tuc/${id}.html`); cache[id] = r.ok ? await r.text() : ''; }
  } catch { cache[id] = ''; }
  return cache[id];
}
const generic = (p) => `<p>${esc(p.excerpt)}</p>`;

export default async function ({ params: [id] }) {
  const p = V.posts.find((x) => x.id === id);
  if (!p) return { redirect: '/tin-tuc' };
  const related = V.posts.filter((x) => x.id !== p.id).slice(0, 3);
  const latest = activeJobs().slice().sort((a, b) => a.posted - b.posted || b.id - a.id).slice(0, 8);
  const html = `
  <div class="wrap article">
    <article>
      ${crumbs([['Trang chủ', '/'], ['Tin tức', '/tin-tuc'], [p.cat, null]])}
      <span class="cat">${esc(p.cat)}</span>
      <h1 class="d-title post-title">${esc(p.title)}</h1>
      <div class="byline"><span>Ban biên tập Việc Làm Bảo Vệ</span><span>${p.date}</span><span>${p.read} phút đọc</span>${p.views ? `<span>${num(p.views)} lượt đọc</span>` : ''}</div>
      <figure class="post-hero"><img src="${p.img}" alt="${esc(p.title)}" width="800" height="500"></figure>
      <link rel="stylesheet" href="/assets/css/article.css">
      <div class="prose post-detail-body">${(await loadBody(p.id)) || generic(p)}</div>
      <section class="post-more">
        <h2>Đọc tiếp</h2>
        <div class="pm-grid">${related.map((r) => `<a class="pm-card" href="${url.post(r)}"><span class="pm-img"><img src="${r.img}" alt="" loading="lazy" width="400" height="250"></span><span class="pm-body"><span class="cat">${esc(r.cat)}</span><b>${esc(r.title)}</b><small>${r.date} · ${r.read} phút đọc</small></span></a>`).join('')}</div>
        <p class="pm-all"><a class="more" href="/tin-tuc">Xem tất cả tin tức ${icon('arrow', 'ico-s')}</a></p>
      </section>
    </article>
    <aside class="aside post-aside">
      <div class="side-jobs">
        <h2>Việc làm bảo vệ mới nhất</h2>
        <ul>${latest.map((j) => { const c = company(j.company) || {}; return `<li><a href="${url.job(j)}"><span class="sj-logo">${jobThumb(j, c)}</span><span class="sj-body"><b>${esc(j.title)}</b><span class="sj-co">${esc(c.name || '')}</span><span class="sj-meta"><em>${pay(j)} triệu</em> · ${esc(j.district)}, ${esc(province(j.province).short)}</span></span></a></li>`; }).join('')}</ul>
        <a class="btn btn-primary btn-block" href="/viec-lam-bao-ve">Xem tất cả việc làm</a>
      </div>
    </aside>
  </div>`;
  return {
    nav: 'blog', html, title: p.title, desc: p.excerpt,
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt, datePublished: p.date.split('/').reverse().join('-'), author: { '@type': 'Organization', name: 'Việc Làm Bảo Vệ' }, mainEntityOfPage: SITE + url.post(p) }
  };
}
