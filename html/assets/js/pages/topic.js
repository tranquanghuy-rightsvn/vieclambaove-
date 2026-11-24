import { V, $, esc, icon, url, jobRow, pagerHtml, crumbs, SITE } from '../core.js';
import { TOPICS, parseTopic, topicJobs, topicPath, topicTitle, topicPages } from '../topics.js';

// Trang tìm kiếm phổ biến: /viec-lam-bao-ve-<chủ đề>[-<tỉnh>]
const PER = 10;
const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

export default function ({ params: [rest], query }) {
  const hit = parseTopic(rest || '');
  if (!hit) return { redirect: '/viec-lam' };
  const { t, pv } = hit;
  const jobs = topicJobs(t, pv).sort((a, b) => (a.tier === 'vip' ? 0 : 1) - (b.tier === 'vip' ? 0 : 1) || a.posted - b.posted);
  const pages = Math.max(1, Math.ceil(jobs.length / PER));
  let page = Math.min(pages, Math.max(1, Number(query.get('trang')) || 1));
  const h1 = topicTitle(t, pv);
  const path = topicPath(t, pv);

  // Số liệu thật từ các tin đang tuyển
  const lo = jobs.length ? Math.min(...jobs.map((j) => j.salaryMin)) : 0;
  const hi = jobs.length ? Math.max(...jobs.map((j) => j.salaryMax)) : 0;
  const byArea = {};
  jobs.forEach((j) => { const k = pv ? j.district : V.provinces.find((p) => p.slug === j.province)?.name; if (k) byArea[k] = (byArea[k] || 0) + 1; });
  const topAreas = Object.entries(byArea).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
  const stat = jobs.length
    ? `Hiện có <b>${jobs.length} việc làm ${esc(t.name)}</b>${pv ? ` tại ${esc(pv.name)}` : ''} đang tuyển, mức lương từ <b>${fmt(lo)} đến ${fmt(hi)} triệu đồng/tháng</b>${topAreas.length ? `, nhiều nhất ở ${topAreas.map(esc).join(', ')}` : ''}.`
    : `Hiện chưa có việc làm ${esc(t.name)}${pv ? ` tại ${esc(pv.name)}` : ''} đang tuyển. Bạn có thể xem các việc bảo vệ khác bên dưới.`;

  // Liên kết liên quan
  const all = topicPages();
  const sameTopic = all.filter((x) => x.t === t && x.pv && x.pv !== pv);
  const samePlace = all.filter((x) => x.t !== t && x.pv === pv);
  const chip = (x) => `<a class="chip-link" href="${topicPath(x.t, x.pv)}">${esc(x.pv && x.t === t ? x.pv.name : x.t.short)}<em>${x.n}</em></a>`;

  const list = (pg) => (jobs.length ? jobs.slice((pg - 1) * PER, pg * PER).map(jobRow).join('') : `<div class="empty"><h3>Chưa có tin phù hợp</h3><p class="mute">Xem <a href="/viec-lam">tất cả việc làm bảo vệ</a> hoặc dùng <a href="/tim-kiem">tìm kiếm chi tiết</a>.</p></div>`);

  const html = `<div class="wrap" style="padding-top:20px">
    ${crumbs([['Trang chủ', '/'], ['Việc làm', '/viec-lam'], ...(pv ? [[t.short, topicPath(t)]] : []), [pv ? pv.name : t.short, null]])}
    <div class="topic-head">
      <h1 class="page-h">${esc(h1)}</h1>
      <p class="topic-stat">${stat}</p>
      <p class="topic-intro">${esc(t.intro)}</p>
      <p class="topic-cta"><a class="btn btn-quiet" href="/tim-kiem">${icon('filter')}Lọc thêm theo quận huyện, lương, ca làm</a>${pv ? `<a class="btn btn-quiet" href="${url.area(pv.slug)}">${icon('pin')}Mọi việc bảo vệ tại ${esc(pv.name)}</a>` : ''}</p>
    </div>
    <div class="topic-grid">
      <section aria-live="polite"><div class="jlist" id="tpList">${list(page)}</div><div id="tpPg">${pagerHtml(page, pages)}</div></section>
      <aside class="topic-side">
        ${sameTopic.length ? `<div class="side-box"><h2>${esc(t.short)} theo tỉnh</h2><div class="chip-links">${(pv ? [{ t, pv: null, n: topicJobs(t).length }] : []).map((x) => `<a class="chip-link" href="${topicPath(t)}">Toàn quốc<em>${x.n}</em></a>`).join('')}${sameTopic.map(chip).join('')}</div></div>` : ''}
        <div class="side-box"><h2>Tìm kiếm nhiều${pv ? ' tại ' + esc(pv.name) : ''}</h2><div class="chip-links">${(samePlace.length ? samePlace : all.filter((x) => !x.pv && x.t !== t)).map(chip).join('')}</div></div>
        <div class="side-box"><h2>Việc làm theo khu vực</h2><div class="chip-links">${V.provinces.map((p) => `<a class="chip-link" href="${url.area(p.slug)}">${esc(p.name)}</a>`).join('')}</div></div>
      </aside>
    </div>
  </div>`;

  function mount(root) {
    $('#tpPg', root)?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-page]'); if (!b) return;
      page = Number(b.dataset.page);
      $('#tpList', root).innerHTML = list(page);
      $('#tpPg', root).innerHTML = pagerHtml(page, pages);
      history.replaceState({}, '', path + (page > 1 ? '?trang=' + page : ''));
      $('#tpList', root).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return {
    nav: 'jobs', html, mount,
    title: `${h1} mới nhất${jobs.length ? ` - ${jobs.length} tin đang tuyển` : ''}`,
    desc: `${h1}: ${jobs.length ? `${jobs.length} tin đang tuyển, lương ${fmt(lo)} - ${fmt(hi)} triệu/tháng. ` : ''}Tin đã kiểm duyệt, ứng tuyển nhanh, không thu phí người tìm việc.`.slice(0, 160),
    noindex: !jobs.length,
    ld: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, url: SITE + path }
  };
}

export { TOPICS };
