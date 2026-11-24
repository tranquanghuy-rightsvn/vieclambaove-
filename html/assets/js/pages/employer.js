import { V, $, $$, esc, icon, user, toast, deskNav, url, num, modal, closeModal, api, busy, syncMe, mono, uploadImage, hasLink } from '../core.js';
import { go } from '../router.js';

const DAY = 864e5;
const STAGES = [['new', 'Mới'], ['called', 'Đã gọi'], ['interview', 'Hẹn phỏng vấn'], ['hired', 'Đi làm'], ['rejected', 'Không phù hợp']];
const STATUS = { draft: ['st-draft', 'Nháp'], pending: ['st-wait', 'Chờ duyệt'], live: ['st-live', 'Đang hiển thị'], soon: ['st-soon', 'Sắp hết hạn'], hidden: ['st-off', 'Đã ẩn'], rejected: ['st-soon', 'Bị từ chối'], removed: ['st-off', 'Bị gỡ'], expired: ['st-off', 'Hết hạn'] };
const WEEKS = [1, 2, 3, 4];
const tr = (n) => String(n).replace('.', ',');
const pay = (j) => (j.salaryMin === j.salaryMax ? tr(j.salaryMin) : `${tr(j.salaryMin)}-${tr(j.salaryMax)}`);
const daysLeft = (j) => (j.expiresAt ? Math.floor((j.expiresAt - Date.now()) / DAY) : null);
const shown = (j) => (j.status === 'live' && daysLeft(j) !== null && daysLeft(j) <= 3 ? 'soon' : j.status);
const ago = (ms) => { const m = Math.floor((Date.now() - ms) / 60000); return m < 60 ? `${Math.max(1, m)} phút trước` : m < 1440 ? `${Math.floor(m / 60)} giờ trước` : new Date(ms).toLocaleDateString('vi-VN'); };

/* ---- Kiểm tra rủi ro (theo quy tắc, giống máy chủ): chỉ báo trước, không tự sửa nội dung ---- */
function riskCheck(f) {
  const text = `${f.title || ''} ${f.desc || ''}`.toLowerCase();
  const out = [];
  if (/(phí|đóng tiền|nộp tiền|thu tiền).{0,20}(đồng phục|hồ sơ|đào tạo)|đồng phục.{0,12}(phí|\d+ ?k|\d{3}\.?000)/.test(text)) out.push('Có nội dung thu phí đồng phục hoặc hồ sơ. Quy chế cấm thu tiền người xin việc.');
  if (/(đặt )?cọc|giữ (bằng|cccd|căn cước)/.test(text)) out.push('Có nội dung đặt cọc hoặc giữ giấy tờ gốc.');
  if (Number(f.salaryMax) > 25) out.push(`Lương ${f.salaryMax} triệu cao bất thường so với mặt bằng (7 - 14 triệu).`);
  if (!f.address || f.address.length < 8) out.push('Thiếu địa chỉ mục tiêu cụ thể.');
  return out;
}

export default async function ({ params: [tab = ''], query }) {
  const u = user();
  if (!u) return { redirect: '/dang-nhap?vai-tro=nha-tuyen-dung&tiep=/nha-tuyen-dung' };
  if (u.role !== 'employer') return { redirect: '/ung-vien' };

  // Đăng nhập Google lần đầu: chưa có công ty
  if (!u.company) return onboarding(u);

  let data;
  try { data = await api('/employer/overview'); } catch (e) {
    if (e.status === 401) return { redirect: '/dang-nhap?vai-tro=nha-tuyen-dung&tiep=' + location.pathname };
    return { nav: 'employer', noindex: true, title: 'Nhà tuyển dụng', html: `<div class="wrap"><div class="empty"><h3>Không tải được dữ liệu</h3><p>${esc(e.message)}</p><a class="btn btn-primary" href="${location.pathname}">Thử lại</a></div></div>` };
  }
  const { company: c, jobs, applications: apps, approveMode } = data;
  const newApps = apps.filter((a) => a.status === 'new').length;
  const tabs = [['', 'Tổng quan', 'chart'], ['dang-tin', 'Đăng tin', 'plus'], ['tin-dang', 'Tin đã đăng', 'list', jobs.length || ''], ['ung-vien', 'Ứng viên', 'users', newApps || ''], ['tim-ung-vien', 'Tìm ứng viên', 'search'], ['xac-thuc', 'Xác thực công ty', 'shield'], ['cong-ty', 'Thông tin công ty', 'building']];
  if (!tabs.some((t) => t[0] === tab)) return { redirect: '/nha-tuyen-dung' };
  // Tìm ứng viên: tải khi mở tab; lọc tỉnh ở máy chủ, các điều kiện khác lọc ngay trên trình duyệt
  let cands = [];
  if (tab === 'tim-ung-vien') {
    try { cands = (await api('/employer/candidates?tinh=' + encodeURIComponent(query.get('tinh') || ''))).items; } catch (e) { toast(e.message, 'alert'); }
  }
  const count = (s) => jobs.filter((j) => shown(j) === s).length;
  const statusCell = (j) => `<span class="${STATUS[shown(j)][0]}"><b>${STATUS[shown(j)][1]}</b></span>${j.status === 'rejected' || j.status === 'removed' ? `<br><small class="mute">${esc(j.rejectReason)}</small>` : j.status === 'pending' && j.risks.length ? `<br><small class="mute">${esc(j.risks[0])}</small>` : ''}`;
  const verifyTag = c.verified ? `<span class="verified">${icon('check')}Đã xác thực</span>` : c.verifyStatus === 'pending' ? '<span class="tag tag-off">Đang chờ duyệt</span>' : c.verifyStatus === 'rejected' ? '<span class="tag tag-urgent">Bị từ chối</span>' : '<span class="tag tag-off">Chưa xác thực</span>';

  const views = {
    '': () => `
      <div class="desk-title"><div><h1>Chào ${esc(u.name || c.short)}</h1><p>${esc(c.name)} · ${verifyTag}</p></div><a class="btn btn-primary" href="/nha-tuyen-dung/dang-tin">${icon('plus')}Đăng tin mới</a></div>
      ${!c.verified && c.verifyStatus !== 'pending' ? `<div class="notice notice-warn" style="margin-bottom:16px">${icon('shield')}<p><b>Xác thực công ty</b> để tin được gắn dấu "Đã xác thực giấy phép" và ứng viên tin tưởng hơn. <a href="/nha-tuyen-dung/xac-thuc">Gửi giấy tờ</a></p></div>` : ''}
      <div class="kpis">
        <div><span>Tin đang hiển thị</span><b>${count('live') + count('soon')}</b><small>${count('soon')} tin sắp hết hạn</small></div>
        <div><span>Lượt xem tin</span><b>${num(jobs.reduce((a, j) => a + (j.views || 0), 0))}</b><small>tất cả tin</small></div>
        <div><span>Lượt bấm Gọi / Zalo</span><b>${num(jobs.reduce((a, j) => a + (j.calls || 0) + (j.zalos || 0), 0))}</b><small>tất cả tin</small></div>
        <div><span>Ứng viên mới</span><b>${newApps}</b><small>chưa gọi lại</small></div>
      </div>
      <section class="panel"><div class="panel-h"><h2>Vòng đời tin</h2><span class="mute">${approveMode === 'manual' ? 'Mọi tin được kiểm duyệt trước khi hiển thị' : 'Tin không có dấu hiệu rủi ro lên ngay'}</span></div>
        <div class="life">${['draft', 'pending', 'live', 'soon', 'expired'].map((s) => `<div class="${s === 'soon' ? 'warn' : ''}"><b>${count(s)}</b><span>${STATUS[s][1]}</span></div>`).join('')}</div>
      </section>
      <section class="panel"><div class="panel-h"><h2>Ứng viên mới nhất</h2><a class="more" href="/nha-tuyen-dung/ung-vien">Xem tất cả ${icon('arrow', 'ico-s')}</a></div>
        ${apps.length ? `<ul class="notes">${apps.slice(0, 5).map((a) => `<li><div><b>${esc(a.name)}</b> · <a href="tel:${esc(a.phone)}">${esc(a.phone)}</a><p>${esc(a.title)}</p></div><time class="mute">${ago(a.created_at)}</time></li>`).join('')}</ul>` : '<p class="mute">Chưa có ứng viên nào.</p>'}
      </section>`,

    'dang-tin': () => {
      const src = query.get('sua') ? jobs.find((j) => String(j.id) === query.get('sua')) : null;
      if (query.get('sua') && !src) return '<div class="empty"><h3>Không tìm thấy tin</h3><a class="btn btn-primary" href="/nha-tuyen-dung/tin-dang">Về danh sách tin</a></div>';
      if (src?.status === 'removed') return '<div class="empty"><h3>Tin đã bị quản trị gỡ, không sửa được</h3><a class="btn btn-primary" href="/nha-tuyen-dung/tin-dang">Về danh sách tin</a></div>';
      const f = src || { qty: 1, weeks: 4, phone: c.phone };
      const live = src && ['live', 'hidden'].includes(src.status);
      return `
      <div class="desk-title"><div><h1>${src ? 'Sửa tin' : 'Đăng tin tuyển'}</h1><p>Đăng tin miễn phí. ${approveMode === 'manual' ? 'Tin được kiểm duyệt trước khi hiển thị, thường trong 2 giờ.' : 'Tin không có dấu hiệu rủi ro được hiển thị ngay.'}</p></div></div>
      ${src?.status === 'rejected' ? `<div class="notice notice-warn" style="margin-bottom:16px">${icon('alert')}<p><b>Tin bị từ chối:</b> ${esc(src.rejectReason)}. Sửa lại rồi gửi duyệt.</p></div>` : ''}
      <form class="formcard" id="jf">
        <label class="field" style="margin-bottom:16px"><span>Tiêu đề</span><input class="input" name="title" required minlength="10" maxlength="150" value="${esc(f.title || '')}" placeholder="Tuyển 5 bảo vệ tòa nhà Quận 1, ca 12 tiếng, bao ở"></label>
        <div class="grid2">
          <label class="field"><span>Tỉnh/thành</span><select class="select" name="province" required><option value="">Chọn</option>${V.provinces.map((p) => `<option value="${p.slug}" ${f.province === p.slug ? 'selected' : ''}>${p.name}</option>`).join('')}</select></label>
          <label class="field"><span>Quận/huyện</span><select class="select" name="district" required>${districtOpts(f.province, f.district)}</select></label>
        </div>
        <label class="field" style="margin-bottom:16px"><span>Địa chỉ mục tiêu</span><input class="input" name="address" maxlength="200" value="${esc(f.address || '')}" placeholder="Số nhà, đường, tên tòa nhà/KCN"></label>
        <div class="grid3">
          <label class="field"><span>Loại mục tiêu</span><select class="select" name="target" required><option value="">Chọn</option>${V.targets.map((x) => `<option value="${x.id}" ${f.target === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="field"><span>Ca làm</span><select class="select" name="shift" required><option value="">Chọn</option>${V.shifts.map((x) => `<option value="${x.id}" ${f.shift === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="field"><span>Số lượng cần tuyển</span><input class="input" name="qty" type="number" min="1" max="999" value="${f.qty || 1}"></label>
        </div>
        <div class="grid2">
          <label class="field"><span>Lương từ (triệu/tháng)</span><input class="input" name="salaryMin" type="number" step="0.1" min="1" required value="${f.salaryMin ?? ''}"></label>
          <label class="field"><span>Đến (triệu/tháng)</span><input class="input" name="salaryMax" type="number" step="0.1" min="1" required value="${f.salaryMax ?? ''}"></label>
        </div>
        <div class="grid3">
          <label class="field"><span>Độ tuổi</span><input class="input" name="age" maxlength="60" value="${esc(f.age || '')}" placeholder="Nam 20-50 tuổi"></label>
          <label class="field"><span>Chiều cao</span><input class="input" name="height" maxlength="60" value="${esc(f.height || '')}" placeholder="Từ 1m65"></label>
          <label class="field"><span>SĐT liên hệ (Gọi/Zalo)</span><input class="input" name="phone" inputmode="tel" maxlength="20" value="${esc(f.phone || '')}" placeholder="0909 123 456"></label>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:12px"><label class="check"><input type="checkbox" name="housing" ${f.housing ? 'checked' : ''}>Bao ở</label><label class="check"><input type="checkbox" name="meals" ${f.meals ? 'checked' : ''}>Bao ăn</label><label class="check"><input type="checkbox" name="urgent" ${f.urgent ? 'checked' : ''}>Tuyển gấp</label></div>
        <label class="field"><span>Mô tả công việc, quyền lợi, yêu cầu</span><textarea class="textarea" name="desc" rows="6" maxlength="5000" placeholder="Công việc cụ thể, chế độ lương thưởng, giấy tờ cần mang…">${esc(f.desc || '')}</textarea></label>
        ${live ? '' : `<div class="field" style="margin-top:16px"><span>Thời gian hiển thị</span>
          <div class="pills">${WEEKS.map((w) => `<label class="pill"><input type="radio" name="weeks" value="${w}" ${Number(f.weeks || 4) === w ? 'checked' : ''}><span>${w} tuần</span></label>`).join('')}</div>
          <small>Hết thời gian, tin tự động bị gỡ khỏi website. Có thể gia hạn trong mục Tin đã đăng.</small></div>`}
        <div class="field" style="margin-top:16px"><span>Ảnh đại diện của tin (tối đa 3 ảnh, hiện ở danh sách và trang tin)</span>
          <div class="imgs" id="imgs"></div></div>
        <div id="risk" style="margin-top:16px"></div>
        <div class="form-foot">${live ? '' : '<button class="btn btn-quiet" type="button" id="draft">Lưu nháp</button>'}<button class="btn btn-primary" type="submit">${live ? 'Lưu thay đổi' : 'Đăng tin'}</button></div>
      </form>`;
    },

    'tin-dang': () => `
      <div class="desk-title"><div><h1>Tin đã đăng</h1><p>${count('live') + count('soon')} tin đang hiển thị · ${count('soon')} tin sắp hết hạn</p></div><a class="btn btn-primary" href="/nha-tuyen-dung/dang-tin">${icon('plus')}Đăng tin</a></div>
      ${jobs.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tin</th><th>Trạng thái</th><th class="num">Xem</th><th class="num">Gọi/Zalo</th><th class="num">Còn</th><th class="num">Thao tác</th></tr></thead><tbody>
      ${jobs.map((j) => {
        const d = daysLeft(j);
        const isLive = j.status === 'live' && d >= 0;
        return `<tr><td>${isLive ? `<a href="${url.job(j)}"><b>${esc(j.title)}</b></a>` : `<b>${esc(j.title)}</b>`}<br><small class="mute">${esc(j.district || '')}${j.salaryMin ? ' · ' + pay(j) + ' triệu' : ''}</small></td>
        <td>${statusCell(j)}</td><td class="num">${num(j.views || 0)}</td><td class="num">${num((j.calls || 0) + (j.zalos || 0))}</td>
        <td class="num">${['live', 'hidden'].includes(j.status) && d !== null ? (d < 0 ? '-' : d + ' ngày') : '-'}</td>
        <td><div class="acts">
          ${j.status !== 'removed' ? `<a class="btn btn-quiet btn-s" href="/nha-tuyen-dung/dang-tin?sua=${j.id}" title="Sửa">${icon('edit')}<span class="sr">Sửa</span></a>` : ''}
          ${['live', 'hidden', 'expired'].includes(j.status) ? `<button class="btn btn-quiet btn-s" type="button" data-renew="${j.id}" title="Gia hạn">${icon('refresh')}<span class="sr">Gia hạn</span></button>` : ''}
          ${j.status === 'live' ? `<button class="btn btn-quiet btn-s" type="button" data-hide="${j.id}" data-on="1" title="Tạm ẩn">${icon('pause')}<span class="sr">Ẩn</span></button>` : ''}
          ${j.status === 'hidden' ? `<button class="btn btn-quiet btn-s" type="button" data-hide="${j.id}" data-on="" title="Hiện lại">${icon('eye')}<span class="sr">Hiện lại</span></button>` : ''}
        </div></td></tr>`;
      }).join('')}
      </tbody></table></div>` : '<div class="empty"><h3>Chưa có tin nào</h3><p>Đăng tin miễn phí, hiển thị 1 - 4 tuần.</p><a class="btn btn-primary" href="/nha-tuyen-dung/dang-tin">Đăng tin đầu tiên</a></div>'}`,

    'ung-vien': () => {
      const only = query.get('tin');
      const list = only ? apps.filter((a) => String(a.job_id) === only) : apps;
      const titles = [...new Map(apps.map((a) => [a.job_id, a.title])).entries()];
      return `
      <div class="desk-title"><div><h1>Ứng viên</h1><p>${apps.length} hồ sơ · ${newApps} hồ sơ mới. Hãy gọi lại sớm, ứng viên thường nhận việc ở nơi gọi trước.</p></div>
        ${titles.length > 1 ? `<label class="field" style="min-width:240px"><span>Lọc theo tin</span><select class="select" id="byJob"><option value="">Tất cả tin</option>${titles.map(([id, t]) => `<option value="${id}" ${String(id) === only ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>` : ''}</div>
      ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Ứng viên</th><th>Liên hệ</th><th>Tin ứng tuyển</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead><tbody>
        ${list.map((a) => `<tr><td><b>${esc(a.name)}</b><br><small class="mute">${[a.year && 'Sinh ' + esc(a.year), a.height && 'Cao ' + esc(a.height)].filter(Boolean).join(' · ') || '&nbsp;'}</small></td>
          <td><a class="btn btn-call btn-s" href="tel:${esc(a.phone)}">${icon('phone')}${esc(a.phone)}</a></td>
          <td>${esc(a.title)}</td><td>${ago(a.created_at)}</td>
          <td><select class="select" data-move="${a.id}" aria-label="Trạng thái">${STAGES.map(([s, n]) => `<option value="${s}" ${s === a.status ? 'selected' : ''}>${n}</option>`).join('')}</select></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty"><h3>Chưa có ứng viên</h3><p>Ứng viên bấm "Ứng tuyển nhanh" ở tin của bạn sẽ hiện ở đây.</p></div>'}`;
    },

    'tim-ung-vien': () => {
      const kn = query.get('kn') || '', ca = query.get('ca') || '', o = query.get('o') === '1', q = (query.get('q') || '').toLowerCase();
      const list = cands.filter((x) => (!kn || x.exp.includes(kn)) && (!ca || !x.shift || x.shift === ca) && (!o || x.stay) && (!q || x.name.toLowerCase().includes(q)));
      const age = (y) => (/^\d{4}$/.test(y) ? new Date().getFullYear() - Number(y) + ' tuổi' : '');
      const EXPS = ['Xuất ngũ', 'Công an nghĩa vụ', 'Chứng chỉ PCCC', 'Võ thuật', 'Đã làm bảo vệ', 'Chưa có kinh nghiệm'];
      return `
      <div class="desk-title"><div><h1>Tìm ứng viên</h1><p>Ứng viên đã đồng ý cho nhà tuyển dụng xem hồ sơ và liên hệ. Hãy giới thiệu rõ tên công ty khi gọi.</p></div></div>
      <form class="formcard" id="cs">
        <div class="grid3">
          <label class="field"><span>Khu vực muốn làm</span><select class="select" name="tinh"><option value="">Mọi tỉnh/thành</option>${V.provinces.map((p) => `<option value="${p.slug}" ${query.get('tinh') === p.slug ? 'selected' : ''}>${p.name}</option>`).join('')}</select></label>
          <label class="field"><span>Kinh nghiệm</span><select class="select" name="kn"><option value="">Bất kỳ</option>${EXPS.map((e) => `<option ${kn === e ? 'selected' : ''}>${e}</option>`).join('')}</select></label>
          <label class="field"><span>Ca mong muốn</span><select class="select" name="ca"><option value="">Bất kỳ</option>${V.shifts.map((x) => `<option value="${x.id}" ${ca === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;margin-top:8px">
          <label class="field" style="flex:1;min-width:200px;margin:0"><span>Tên ứng viên</span><input class="input" name="q" value="${esc(query.get('q') || '')}"></label>
          <label class="check" style="margin:0 0 10px"><input type="checkbox" name="o" value="1" ${o ? 'checked' : ''}>Cần chỗ ở</label>
          <button class="btn btn-primary" type="submit">${icon('search')}Tìm</button>
        </div>
      </form>
      <p class="mute" style="margin:14px 0 10px">${list.length} ứng viên</p>
      ${list.length ? `<div class="people">${list.map((x) => {
        const pv = V.provinces.find((p) => p.slug === x.area);
        const sh = V.shifts.find((s) => s.id === x.shift);
        const digits = x.phone.replace(/\D/g, '');
        return `<div class="person">${mono({ initials: (x.name.trim().split(/\s+/).pop() || '?')[0].toUpperCase(), color: '#1e2a6e' })}
          <div><b>${esc(x.name)}</b><p>${[age(x.year), x.height && 'cao ' + esc(x.height) + (/^\d+$/.test(x.height) ? ' cm' : ''), pv && 'muốn làm ở ' + esc(pv.short), sh && esc(sh.name.toLowerCase()), x.stay && 'cần chỗ ở'].filter(Boolean).join(' · ')}</p>
          <p class="mute">${x.exp.length ? x.exp.map(esc).join(', ') : 'Chưa ghi kinh nghiệm'} · cập nhật ${ago(x.updatedAt)}</p></div>
          <div class="acts"><a class="btn btn-call btn-s" href="tel:${digits}">${icon('phone')}${esc(x.phone)}</a><a class="btn btn-zalo btn-s" href="https://zalo.me/${digits}" target="_blank" rel="noopener">Zalo</a></div></div>`;
      }).join('')}</div>` : '<div class="empty"><h3>Chưa có ứng viên phù hợp</h3><p>Thử bỏ bớt điều kiện lọc, hoặc quay lại sau khi có thêm hồ sơ mới.</p></div>'}`;
    },
    'xac-thuc': () => `
      <div class="desk-title"><div><h1>Xác thực công ty</h1><p>Tin của công ty đã xác thực được gắn dấu và ưu tiên hiển thị.</p></div>${verifyTag}</div>
      ${c.verifyStatus === 'rejected' && c.verifyNote ? `<div class="notice notice-warn" style="margin-bottom:16px">${icon('alert')}<p><b>Chưa được duyệt:</b> ${esc(c.verifyNote)}</p></div>` : ''}
      ${c.verifyStatus === 'pending' ? `<div class="notice notice-ok" style="margin-bottom:16px">${icon('clock')}<p>Hồ sơ đang được kiểm tra, kết quả trong 1 ngày làm việc.</p></div>` : ''}
      <form class="formcard" id="vf">
        <div class="grid2">
          <label class="field"><span>Tên công ty (theo giấy phép)</span><input class="input" name="name" value="${esc(c.name)}" required></label>
          <label class="field"><span>Mã số thuế</span><input class="input" name="mst" value="${esc(c.mst)}" inputmode="numeric" required></label>
        </div>
        <div class="grid2">
          <label class="field"><span>Giấy chứng nhận đủ điều kiện ANTT (số, ngày cấp)</span><input class="input" name="license" value="${esc(c.license)}" required></label>
          <label class="field"><span>Người đại diện theo pháp luật</span><input class="input" name="rep" value="${esc(c.rep)}" required></label>
        </div>
        <div class="field"><span>Giấy tờ đã tải lên (PDF, JPG, PNG · tối đa 5MB/file)</span>
          <ul class="docs" id="docs">${docList(c.docs)}</ul>
          <div class="grid2">
            <label class="upload">${icon('file')}<br>Giấy phép kinh doanh<input type="file" accept=".pdf,image/*" data-label="Giấy phép kinh doanh"></label>
            <label class="upload">${icon('file')}<br>Giấy chứng nhận đủ điều kiện ANTT<input type="file" accept=".pdf,image/*" data-label="Giấy chứng nhận ANTT"></label>
          </div>
        </div>
        <div class="form-foot"><button class="btn btn-primary" type="submit">${c.verifyStatus === 'none' ? 'Gửi xác thực' : 'Gửi xác thực lại'}</button></div>
      </form>`,

    'cong-ty': () => `
      <div class="desk-title"><div><h1>Thông tin công ty</h1><p>Hiển thị trên trang công ty <a href="/cong-ty/${esc(c.id)}">/cong-ty/${esc(c.id)}</a>.</p></div></div>
      <form class="formcard" id="cf">
        <div class="logo-edit"><span id="logoBox">${mono(c, 'mono-l')}</span>
          <div><b>Logo công ty</b><p class="mute" style="margin:2px 0 8px;font-size:14px">Hiện ở trang công ty và các tin chưa có ảnh. Ảnh vuông, nền trắng là đẹp nhất.</p>
          <label class="btn btn-quiet btn-s upload" style="position:relative">${icon('file')}Chọn logo<input type="file" id="logoIn" accept="image/jpeg,image/png,image/webp"></label>
          ${c.logo ? '<button class="linkbtn" type="button" id="logoDel" style="margin-left:10px">Xoá logo</button>' : ''}</div></div>
        <div class="grid3">
          <label class="field"><span>Số điện thoại</span><input class="input" name="phone" value="${esc(c.phone)}" inputmode="tel"></label>
          <label class="field"><span>Quy mô</span><input class="input" name="size" value="${esc(c.size)}" placeholder="200+ nhân viên"></label>
          <label class="field"><span>Năm thành lập</span><input class="input" name="founded" value="${esc(c.founded)}" inputmode="numeric" maxlength="4"></label>
        </div>
        <label class="field"><span>Giới thiệu</span><textarea class="textarea" name="about" rows="6" maxlength="2000">${esc(c.about)}</textarea></label>
        <div class="form-foot"><button class="btn btn-primary" type="submit">Lưu</button></div>
      </form>`
  };

  const html = `<div class="wrap desk">${deskNav('/nha-tuyen-dung', tabs, tab, `<b>${esc(c.short)}</b><small>${c.verified ? 'Đã xác thực' : c.verifyStatus === 'pending' ? 'Chờ xác thực' : 'Chưa xác thực'}</small>`)}<div>${views[tab]()}</div></div>`;

  function mount(root) {
    const reload = () => go(location.pathname + location.search, { replace: true, keepScroll: true });

    /* Đăng / sửa tin */
    const jf = $('#jf', root);
    if (jf) {
      const editing = query.get('sua');
      // Ảnh: tin đã có thì hiện ảnh cũ (xoá được ngay); ảnh mới chọn sẽ tải lên sau khi lưu tin
      const src = editing ? jobs.find((x) => String(x.id) === editing) : null;
      let saved = src ? [...(src.images || [])] : [];
      const pending = [];
      const drawImgs = () => {
        const n = saved.length + pending.length;
        $('#imgs', root).innerHTML = saved.map((u, i) => `<figure><img src="${esc(u)}" alt=""><button type="button" data-delimg="${i}" aria-label="Xoá ảnh">×</button></figure>`).join('')
          + pending.map((p, i) => `<figure class="pending"><img src="${p.url}" alt=""><button type="button" data-delpend="${i}" aria-label="Bỏ ảnh">×</button></figure>`).join('')
          + (n < 3 ? `<label class="imgs-add">${icon('plus')}Thêm ảnh<input type="file" accept="image/jpeg,image/png,image/webp" multiple></label>` : '');
        $('#imgs input', root)?.addEventListener('change', (e) => {
          [...e.target.files].slice(0, 3 - n).forEach((file) => pending.push({ file, url: URL.createObjectURL(file) }));
          drawImgs();
        });
      };
      $('#imgs', root).addEventListener('click', async (e) => {
        const d = e.target.closest('[data-delimg]');
        const dp = e.target.closest('[data-delpend]');
        if (dp) { pending.splice(Number(dp.dataset.delpend), 1); drawImgs(); }
        if (d) {
          try { saved = (await api(`/employer/jobs/${editing}/images/${d.dataset.delimg}`, { method: 'DELETE' })).images; drawImgs(); toast('Đã xoá ảnh.'); } catch (err) { toast(err.message, 'alert'); }
        }
      });
      drawImgs();
      const linkIn = () => ['title', 'desc', 'address', 'age', 'height'].find((k) => hasLink(jf[k]?.value));
      const showRisk = () => {
        const r = riskCheck(Object.fromEntries(new FormData(jf)));
        if (linkIn()) { $('#risk', root).innerHTML = `<div class="risk hi"><h4>${icon('alert')}Không được chèn đường link</h4><ul><li>Xoá link website, Zalo, Facebook… khỏi nội dung. Số điện thoại và email vẫn được.</li></ul></div>`; return; }
        $('#risk', root).innerHTML = r.length ? `<div class="risk hi"><h4>${icon('alert')}Tin sẽ được kiểm duyệt thủ công</h4><ul>${r.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : jf.title.value ? `<div class="risk lo"><h4>${icon('shield')}Không thấy dấu hiệu rủi ro</h4></div>` : '';
      };
      jf.province.addEventListener('change', () => (jf.district.innerHTML = districtOpts(jf.province.value)));
      jf.addEventListener('input', showRisk);
      const save = async (action, btn) => {
        const f = Object.fromEntries(new FormData(jf));
        const payload = { ...f, housing: !!f.housing, meals: !!f.meals, urgent: !!f.urgent, action };
        if (linkIn()) { toast('Nội dung không được chứa đường link. Vui lòng xoá link rồi lưu lại.', 'alert'); return; }
        const stop = busy(btn, 'Đang lưu…');
        try {
          const r = await api(editing ? `/employer/jobs/${editing}` : '/employer/jobs', { method: editing ? 'PUT' : 'POST', body: payload });
          for (let i = 0; i < pending.length; i++) {
            btn.innerHTML = `Đang tải ảnh ${i + 1}/${pending.length}…`;
            await uploadImage(`/employer/jobs/${r.id}/images`, pending[i].file).catch((err) => toast('Ảnh ' + (i + 1) + ': ' + err.message, 'alert'));
          }
          toast(r.status === 'live' || r.status === 'hidden' ? 'Đã lưu. Tin đang hiển thị trên website.' : r.status === 'pending' ? 'Tin đang chờ kiểm duyệt, thường xong trong 2 giờ.' : 'Đã lưu nháp.');
          go('/nha-tuyen-dung/tin-dang');
        } catch (err) { stop(); toast(err.message, 'alert'); }
      };
      jf.addEventListener('submit', (e) => { e.preventDefault(); save('submit', e.submitter); });
      $('#draft', root)?.addEventListener('click', (e) => { if (jf.title.value.trim().length < 10) { toast('Tiêu đề cần ít nhất 10 ký tự.', 'alert'); return; } save('draft', e.currentTarget); });
      showRisk();
    }

    /* Tin đã đăng: ẩn/hiện, gia hạn */
    root.addEventListener('click', async (e) => {
      const hd = e.target.closest('[data-hide]');
      const rn = e.target.closest('[data-renew]');
      if (hd) {
        const stop = busy(hd, '…');
        try { await api(`/employer/jobs/${hd.dataset.hide}/hide`, { method: 'POST', body: { hidden: !!hd.dataset.on } }); toast(hd.dataset.on ? 'Đã tạm ẩn tin.' : 'Tin đã hiển thị lại.'); reload(); } catch (err) { stop(); toast(err.message, 'alert'); }
      }
      if (rn) {
        const j = jobs.find((x) => String(x.id) === rn.dataset.renew);
        const box = modal(`<h2>Gia hạn tin</h2><p>${esc(j.title)}</p>
          <div class="pills" style="margin:12px 0 4px">${WEEKS.map((w) => `<label class="pill"><input type="radio" name="w" value="${w}" ${w === 4 ? 'checked' : ''}><span>${w} tuần</span></label>`).join('')}</div>
          <p class="mute" style="font-size:14px">${j.status === 'expired' ? 'Tin sẽ hiển thị lại từ hôm nay.' : 'Thời gian được cộng thêm vào hạn hiện tại.'}</p>
          <div class="form-foot"><button class="btn btn-quiet" data-close>Huỷ</button><button class="btn btn-primary" id="rnok">Gia hạn</button></div>`);
        $('#rnok', box).addEventListener('click', async (ev) => {
          const stop = busy(ev.currentTarget, 'Đang lưu…');
          try { await api(`/employer/jobs/${j.id}/renew`, { method: 'POST', body: { weeks: Number($('input[name=w]:checked', box).value) } }); closeModal(); toast('Đã gia hạn tin.'); reload(); } catch (err) { stop(); toast(err.message, 'alert'); }
        });
      }
    });

    /* Tìm ứng viên */
    $('#cs', root)?.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new URLSearchParams([...new FormData(e.target)].filter(([, v]) => v));
      go('/nha-tuyen-dung/tim-ung-vien' + (f.toString() ? '?' + f : ''));
    });

    /* Ứng viên */
    $('#byJob', root)?.addEventListener('change', (e) => go('/nha-tuyen-dung/ung-vien' + (e.target.value ? '?tin=' + e.target.value : '')));
    $$('[data-move]', root).forEach((s) => s.addEventListener('change', async () => {
      try { await api(`/employer/applications/${s.dataset.move}`, { method: 'POST', body: { status: s.value } }); toast('Đã cập nhật trạng thái.'); } catch (err) { toast(err.message, 'alert'); }
    }));

    /* Xác thực công ty */
    const vf = $('#vf', root);
    if (vf) {
      $$('input[type=file]', vf).forEach((inp) => inp.addEventListener('change', async () => {
        const file = inp.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast('File tối đa 5MB.', 'alert'); inp.value = ''; return; }
        const fd = new FormData();
        fd.append('file', file);
        fd.append('label', inp.dataset.label);
        toast('Đang tải lên…', 'download');
        try { const r = await api('/employer/verify/file', { method: 'POST', body: fd }); $('#docs', root).innerHTML = docList(r.docs); toast('Đã tải lên.'); } catch (err) { toast(err.message, 'alert'); }
        inp.value = '';
      }));
      $('#docs', root).addEventListener('click', async (e) => {
        const d = e.target.closest('[data-deldoc]');
        if (!d) return;
        try { const r = await api(`/employer/verify/file/${d.dataset.deldoc}`, { method: 'DELETE' }); $('#docs', root).innerHTML = docList(r.docs); } catch (err) { toast(err.message, 'alert'); }
      });
      vf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const stop = busy(e.submitter);
        try { await api('/employer/verify', { method: 'POST', body: Object.fromEntries(new FormData(vf)) }); await syncMe(); toast('Đã gửi hồ sơ xác thực. Kết quả trong 1 ngày làm việc.'); reload(); } catch (err) { stop(); toast(err.message, 'alert'); }
      });
    }

    /* Thông tin công ty */
    $('#logoIn', root)?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast('Đang tải logo…', 'download');
      try { await uploadImage('/employer/company/logo', file); toast('Đã cập nhật logo.'); reload(); } catch (err) { toast(err.message, 'alert'); }
    });
    $('#logoDel', root)?.addEventListener('click', async () => {
      try { await api('/employer/company/logo', { method: 'DELETE' }); toast('Đã xoá logo.'); reload(); } catch (err) { toast(err.message, 'alert'); }
    });
    $('#cf', root)?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (hasLink(e.target.about.value) || hasLink(e.target.size.value)) { toast('Giới thiệu công ty không được chứa đường link.', 'alert'); return; }
      const stop = busy(e.submitter, 'Đang lưu…');
      try { await api('/employer/company', { method: 'PUT', body: Object.fromEntries(new FormData(e.target)) }); toast('Đã lưu thông tin công ty.'); } catch (err) { toast(err.message, 'alert'); }
      stop();
    });
  }

  return { nav: 'employer', html, mount, title: tabs.find((t) => t[0] === tab)[1] + ' - Nhà tuyển dụng', noindex: true };
}

function onboarding(u) {
  const html = `<div class="wrap" style="max-width:560px;padding:48px 0">
    <h1>Thông tin công ty</h1><p class="mute">Chào ${esc(u.name)}. Nhập tên công ty để bắt đầu đăng tin.</p>
    <form class="formcard" id="ob">
      <label class="field" style="margin-bottom:16px"><span>Tên công ty</span><input class="input" name="name" required placeholder="Công ty TNHH Dịch vụ Bảo vệ ..."></label>
      <label class="field"><span>Số điện thoại công ty</span><input class="input" name="phone" inputmode="tel"></label>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Tiếp tục</button></div>
    </form></div>`;
  const mount = (root) => $('#ob', root).addEventListener('submit', async (e) => {
    e.preventDefault();
    const stop = busy(e.submitter);
    try { await api('/employer/company', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); await syncMe(); go('/nha-tuyen-dung', { replace: true }); } catch (err) { stop(); toast(err.message, 'alert'); }
  });
  return { nav: 'employer', html, mount, title: 'Thông tin công ty', noindex: true };
}

const docList = (docs) => docs.length
  ? docs.map((d, i) => `<li>${icon('file', 'ico-s')}<span>${esc(d.name)} <small class="mute">${Math.max(1, Math.round(d.size / 1024))} KB</small></span><button class="linkbtn" type="button" data-deldoc="${i}">Xoá</button></li>`).join('')
  : '<li class="mute">Chưa có giấy tờ nào.</li>';

function districtOpts(p, sel) {
  const pv = V.provinces.find((x) => x.slug === p);
  return pv ? `<option value="">Chọn</option>${pv.districts.map((d) => `<option ${d === sel ? 'selected' : ''}>${esc(d)}</option>`).join('')}` : '<option value="">Chọn tỉnh trước</option>';
}

