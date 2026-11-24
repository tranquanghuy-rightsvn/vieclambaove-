import { V, esc, icon, crumbs, SITE } from '../core.js';

const thumb = (v) => `https://i.ytimg.com/vi/${v.yt}/hqdefault.jpg`;
const card = (v) => `<a class="vcard" href="/video/${v.slug}/">
  <span class="vthumb"><img src="${thumb(v)}" alt="" loading="lazy" width="480" height="360"><span class="vplay">${icon('play')}</span></span>
  <b>${esc(v.title)}</b><small>${new Date(v.date).toLocaleDateString('vi-VN')}</small></a>`;

export default function ({ params: [slug] }) {
  const all = V.videos || [];
  if (!slug) {
    return {
      nav: 'video', title: 'Video nghề bảo vệ',
      desc: 'Video hướng dẫn nghiệp vụ, kinh nghiệm phỏng vấn và giới thiệu công việc bảo vệ.',
      html: `<div class="wrap" style="padding-top:20px">
        ${crumbs([['Trang chủ', '/'], ['Video', null]])}
        <h1 class="page-h">Video nghề bảo vệ</h1>
        ${all.length ? `<div class="vgrid">${all.map(card).join('')}</div>` : '<div class="empty"><h3>Chưa có video</h3><p>Video mới sẽ được cập nhật sớm.</p></div>'}
      </div>`
    };
  }
  const v = all.find((x) => x.slug === slug);
  if (!v) return { redirect: '/video' };
  const more = all.filter((x) => x.slug !== slug).slice(0, 6);
  return {
    nav: 'video', title: v.title, desc: (v.desc || v.title).slice(0, 160), canonical: '/video/' + v.slug + '/',
    html: `<div class="wrap" style="padding-top:20px">
      ${crumbs([['Trang chủ', '/'], ['Video', '/video'], [v.title, null]])}
      <article class="vdetail">
        <div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${v.yt}?rel=0" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
        <h1 class="page-h">${esc(v.title)}</h1>
        <p class="mute">${new Date(v.date).toLocaleDateString('vi-VN')}</p>
        ${v.desc ? `<p class="d-desc">${esc(v.desc)}</p>` : ''}
      </article>
      ${more.length ? `<section class="sec"><div class="sec-head"><h2>Video khác</h2><a class="more" href="/video">Xem tất cả ${icon('arrow', 'ico-s')}</a></div><div class="vgrid">${more.map(card).join('')}</div></section>` : ''}
    </div>`,
    ld: { '@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.desc || v.title, thumbnailUrl: thumb(v), uploadDate: new Date(v.date).toISOString(), embedUrl: `https://www.youtube.com/embed/${v.yt}`, url: SITE + '/video/' + v.slug + '/' }
  };
}
