import { V, esc, icon, url, pay, num, crumbs, activeJobs, province, SITE } from '../core.js';

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
  const urgent = activeJobs().filter((j) => j.urgent).slice(0, 4);
  const html = `
  <div class="wrap article">
    <article>
      ${crumbs([['Trang chủ', '/'], ['Tin tức', '/tin-tuc'], [p.cat, null]])}
      <span class="cat">${esc(p.cat)}</span>
      <h1 class="d-title" style="margin-top:8px;max-width:32ch">${esc(p.title)}</h1>
      <div class="byline"><span>Ban biên tập Việc Làm Bảo Vệ</span><span>${p.date}</span><span>${p.read} phút đọc</span><span>${num(p.views)} lượt đọc</span></div>
      <figure class="post-hero"><img src="${p.img}" alt="${esc(p.title)}" width="800" height="500"></figure>
      <link rel="stylesheet" href="/assets/css/article.css">
      <div class="prose post-detail-body">${(await loadBody(p.id)) || generic(p)}</div>
      <section class="sec" style="padding-top:40px">
        <div class="sec-head"><h2>Đọc tiếp</h2></div>
        <ul class="glist">${related.map((r) => `<li><div><span class="cat">${esc(r.cat)}</span><br><a href="${url.post(r)}">${esc(r.title)}</a></div><time>${r.date}</time></li>`).join('')}</ul>
      </section>
    </article>
    <aside class="aside">
      <div class="board">
        <div class="board-head"><h2>Đang tuyển gấp</h2></div>
        <ol>${urgent.map((j) => `<li><a href="${url.job(j)}"><span class="b-place">${esc(j.district)} · ${esc(province(j.province).short)}</span><span class="b-title">${esc(j.title)}</span><span class="b-pay">${pay(j)}<small>triệu</small></span></a></li>`).join('')}</ol>
        <div class="board-foot"><a class="more" href="/viec-lam?gap=1">Tất cả việc gấp ${icon('arrow', 'ico-s')}</a></div>
      </div>
      <aside class="jrow-ad" aria-label="Quảng cáo"><span class="adlabel">Quảng cáo</span><p><b>Khóa PCCC cơ bản</b> - học 2 ngày cuối tuần, cấp chứng chỉ.</p></aside>
    </aside>
  </div>`;
  return {
    nav: 'blog', html, title: p.title, desc: p.excerpt,
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.excerpt, datePublished: p.date.split('/').reverse().join('-'), author: { '@type': 'Organization', name: 'Việc Làm Bảo Vệ' }, mainEntityOfPage: SITE + url.post(p) }
  };
}
