import { V, $, $$, esc, icon, url, mono, activeJobs, crumbs } from '../core.js';

// Danh sách tất cả nhà tuyển dụng (trang /cong-ty, link ở chân trang)
export const companyList = () => {
  const jobs = activeJobs();
  return V.companies.map((c) => ({ c, n: jobs.filter((j) => j.company === c.id).length }))
    .sort((a, b) => b.c.verified - a.c.verified || b.n - a.n || a.c.name.localeCompare(b.c.name, 'vi'));
};
export const coBox = ({ c, n }) => `<a class="cobox" href="${url.company(c)}" data-name="${esc(c.name.toLowerCase())}">
        ${mono(c, 'mono-l')}
        <b>${esc(c.name)}</b>
        <span>${c.verified ? `<i class="vtick">${icon('check')}</i>` : ''}${n} việc đang tuyển</span>
      </a>`;

export default function () {
  const list = companyList();
  const html = `<div class="wrap" style="padding-top:20px">
    ${crumbs([['Trang chủ', '/'], ['Nhà tuyển dụng', null]])}
    <h1 class="page-h">Nhà tuyển dụng ngành bảo vệ</h1>
    <section class="panel-box">
      <div class="pb-head"><label class="field" style="max-width:360px;width:100%;margin:0"><span class="sr">Tìm công ty</span><input class="input" id="coQ" placeholder="Tìm tên công ty…"></label><span class="mute">${list.length} công ty</span></div>
      <div class="cogrid" id="coAll">${list.map(coBox).join('')}</div>
      <p class="mute" id="coNone" hidden>Không tìm thấy công ty phù hợp.</p>
    </section>
  </div>`;
  const mount = (root) => $('#coQ', root).addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    $$('#coAll .cobox', root).forEach((a) => { const ok = !q || a.dataset.name.includes(q); a.hidden = !ok; shown += ok; });
    $('#coNone', root).hidden = shown > 0;
  });
  return { nav: '', html, mount, title: 'Nhà tuyển dụng ngành bảo vệ', desc: `Danh sách ${list.length} công ty bảo vệ đang tuyển dụng trên Việc Làm Bảo Vệ.` };
}
