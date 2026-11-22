import { V, $, $$, esc, icon, url, num, crumbs } from '../core.js';

export default function ({ query }) {
  const cats = [...new Set(V.posts.map((p) => p.cat))];
  const cur = query.get('chu-de') || '';
  const posts = V.posts.filter((p) => !cur || p.cat === cur);
  const [lead, ...rest] = posts;
  const html = `
  <div class="phead"><div class="wrap">
    ${crumbs([['Trang chủ', '/'], ['Tin tức', null]])}
    <h1>Tin tức nghề bảo vệ</h1>
    <p>Bảng lương, quyền lợi theo luật, kinh nghiệm phỏng vấn và cách tránh bị lừa phí đồng phục. Viết cho người đang làm hoặc sắp vào nghề.</p>
  </div></div>
  <div class="wrap" style="padding-top:20px">
    <nav class="ttabs" aria-label="Chủ đề">
      <a href="/tin-tuc" class="${!cur ? 'on' : ''}">Tất cả</a>
      ${cats.map((c) => `<a href="/tin-tuc?chu-de=${encodeURIComponent(c)}" class="${c === cur ? 'on' : ''}">${esc(c)}</a>`).join('')}
    </nav>
    ${lead ? `<article class="blead">
      <a class="bl-img" href="${url.post(lead)}" tabindex="-1" aria-hidden="true"><img src="${lead.img}" alt="" width="800" height="500"></a>
      <div class="bl-text">
        <span class="cat">${esc(lead.cat)}</span>
        <h2><a href="${url.post(lead)}">${esc(lead.title)}</a></h2>
        <p>${esc(lead.excerpt)}</p>
        <span class="meta">${lead.date} · ${lead.read} phút đọc · ${num(lead.views)} lượt đọc</span>
      </div>
    </article>` : ''}
    ${rest.length ? `<div class="bgrid">${rest.map((p) => `<article class="bcard">
      <a class="bc-thumb" href="${url.post(p)}" tabindex="-1" aria-hidden="true"><img src="${p.img}" alt="" loading="lazy" width="800" height="500"><span>${esc(p.cat)}</span></a>
      <h3><a href="${url.post(p)}">${esc(p.title)}</a></h3>
      <p class="bc-ex">${esc(p.excerpt)}</p>
      <p class="meta">${p.date} · ${p.read} phút đọc</p>
    </article>`).join('')}</div>` : '<p class="mute">Chưa có bài khác trong chủ đề này.</p>'}
  </div>`;
  return { nav: 'blog', html, title: cur ? `${cur} – Tin tức bảo vệ` : 'Tin tức nghề bảo vệ', desc: 'Bảng lương bảo vệ, quyền lợi theo luật, kinh nghiệm phỏng vấn và cảnh báo lừa đảo.', canonical: cur ? '/tin-tuc' : undefined };
}
