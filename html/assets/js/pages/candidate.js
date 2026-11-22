import { V, $, esc, icon, store, user, toast, deskNav, job, jobRow, url, province, modal, closeModal, api, busy } from '../core.js';
import { go } from '../router.js';

const EXP = ['Xuất ngũ', 'Công an nghĩa vụ', 'Chứng chỉ PCCC', 'Võ thuật', 'Đã làm bảo vệ', 'Có xe máy', 'Biết vi tính'];
const ST = { new: ['st-wait', 'Đã gửi'], called: ['st-live', 'Công ty đã gọi'], interview: ['st-soon', 'Hẹn phỏng vấn'], hired: ['st-live', 'Đã nhận việc'], rejected: ['st-off', 'Chưa phù hợp'] };
const tr = (n) => String(n).replace('.', ',');

export default async function ({ params: [tab = ''] }) {
  const u = user();
  if (!u) return { redirect: '/dang-nhap?tiep=/ung-vien' };
  if (u.role === 'employer') return { redirect: '/nha-tuyen-dung' };
  const p = { exp: [], ...store.get('profile', {}), phone: u.phone, name: store.get('profile', {}).name || u.name };
  const saved = store.get('saved', []);
  const tabs = [['', 'Hồ sơ của tôi', 'user'], ['da-ung-tuyen', 'Đã ứng tuyển', 'send'], ['da-luu', 'Việc đã lưu', 'bookmark', saved.length || ''], ['cai-dat', 'Cài đặt', 'settings']];
  if (!tabs.some((t) => t[0] === tab)) return { redirect: '/ung-vien' };

  let applied = [];
  if (tab === 'da-ung-tuyen') {
    try { applied = (await api('/my/applications')).items; } catch (e) { if (e.status === 401) return { redirect: '/dang-nhap?tiep=/ung-vien/da-ung-tuyen' }; toast(e.message, 'alert'); }
  }

  const done = ['name', 'phone', 'year', 'height', 'area'].filter((k) => p[k]).length + (p.exp?.length ? 1 : 0);
  const views = {
    '': () => `
      <div class="desk-title"><div><h1>Hồ sơ nhanh</h1><p>Hoàn thiện ${done}/6 mục. Công ty chỉ thấy số của bạn khi bạn ứng tuyển.</p></div></div>
      <form class="formcard" id="pf">
        <div class="grid2">
          <label class="field"><span>Họ tên</span><input class="input" name="name" value="${esc(p.name || '')}" required autocomplete="name"></label>
          <label class="field"><span>Số điện thoại / Zalo</span><input class="input" value="${esc(u.phone || '')}" readonly title="Số điện thoại dùng để đăng nhập"></label>
        </div>
        <div class="grid3">
          <label class="field"><span>Năm sinh</span><input class="input" name="year" inputmode="numeric" maxlength="4" value="${esc(p.year || '')}" placeholder="1995"></label>
          <label class="field"><span>Chiều cao (cm)</span><input class="input" name="height" inputmode="numeric" value="${esc(p.height || '')}" placeholder="168"></label>
          <label class="field"><span>Cân nặng (kg)</span><input class="input" name="weight" inputmode="numeric" value="${esc(p.weight || '')}" placeholder="62"></label>
        </div>
        <div class="field" style="margin-bottom:16px"><span>Kinh nghiệm, chứng chỉ</span>
          <div class="pills">${EXP.map((e) => `<label class="pill"><input type="checkbox" name="exp" value="${e}" ${(p.exp || []).includes(e) ? 'checked' : ''}><span>${e}</span></label>`).join('')}</div></div>
        <div class="grid2">
          <label class="field"><span>Muốn làm ở</span><select class="select" name="area"><option value="">Chọn tỉnh/thành</option>${V.provinces.map((x) => `<option value="${x.slug}" ${p.area === x.slug ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>
          <label class="field"><span>Ca mong muốn</span><select class="select" name="shift"><option value="">Ca nào cũng được</option>${V.shifts.map((s) => `<option value="${s.id}" ${p.shift === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
        </div>
        <label class="check"><input type="checkbox" name="stay" ${p.stay ? 'checked' : ''}>Cần chỗ ở</label>
        <div class="form-foot"><button class="btn btn-primary" type="submit">Lưu hồ sơ</button></div>
      </form>`,
    'da-ung-tuyen': () => `
      <div class="desk-title"><div><h1>Đã ứng tuyển</h1><p>Công ty thường gọi lại trong 24 giờ.</p></div></div>
      ${applied.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Công việc</th><th>Lương</th><th>Ngày gửi</th><th>Trạng thái</th></tr></thead><tbody>
        ${applied.map((a) => {
          const open = a.job_status === 'live' && a.expires_at > Date.now();
          const j = job(a.job_id);
          const st = open ? ST[a.status] || ST.new : ['st-off', 'Tin đã đóng'];
          const title = `<b>${esc(a.title || 'Tin đã bị xoá')}</b>`;
          return `<tr><td>${j ? `<a href="${url.job(j)}">${title}</a>` : title}<br><small class="mute">${esc(a.district || '')}${a.province ? ', ' + esc(province(a.province)?.short || '') : ''}</small></td>
            <td>${a.salary_min ? `<b>${tr(a.salary_min)}${a.salary_max !== a.salary_min ? '–' + tr(a.salary_max) : ''}</b> tr` : '–'}</td><td>${new Date(a.created_at).toLocaleDateString('vi-VN')}</td><td class="${st[0]}"><b>${st[1]}</b></td></tr>`;
        }).join('')}
      </tbody></table></div>` : empty('Bạn chưa ứng tuyển việc nào', 'Bấm "Ứng tuyển nhanh" ở tin bất kỳ, hồ sơ sẽ gửi tới công ty.')}`,
    'da-luu': () => {
      const js = saved.map(job).filter(Boolean);
      return `<div class="desk-title"><div><h1>Việc đã lưu</h1><p>Tin hết hạn sẽ tự biến mất khỏi danh sách.</p></div></div>
      ${js.length ? `<div class="jlist">${js.map(jobRow).join('')}</div>` : empty('Chưa lưu việc nào', 'Bấm biểu tượng trái tim ở mỗi tin để xem lại sau.')}`;
    },
    'cai-dat': () => `
      <div class="desk-title"><div><h1>Cài đặt</h1></div></div>
      <form class="panel" id="pwf"><div class="panel-h"><h2>Đổi mật khẩu</h2></div>
        <div class="grid2">
          <label class="field"><span>Mật khẩu hiện tại</span><input class="input" type="password" name="current" required autocomplete="current-password"></label>
          <label class="field"><span>Mật khẩu mới</span><input class="input" type="password" name="next" required minlength="6" autocomplete="new-password"></label>
        </div>
        <div class="form-foot"><button class="btn btn-primary" type="submit">Đổi mật khẩu</button></div>
      </form>
      <div class="panel"><div class="panel-h"><h2>Dữ liệu cá nhân</h2></div>
        <p class="mute">Theo Nghị định 13/2023, bạn có quyền tải về hoặc xoá toàn bộ dữ liệu của mình.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-line" href="/api/me/export" download>${icon('download')}Tải dữ liệu của tôi</a><button class="btn btn-danger" type="button" id="del">${icon('trash')}Xoá tài khoản</button></div>
      </div>`
  };

  const html = `<div class="wrap desk">${deskNav('/ung-vien', tabs, tab, `<b>${esc(p.name || u.name || 'Ứng viên')}</b><small>${esc(u.phone || 'Tài khoản ứng viên')}</small>`)}<div>${views[tab]()}</div></div>`;

  function mount(root) {
    $('#pf', root)?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const stop = busy(e.submitter, 'Đang lưu…');
      try {
        const r = await api('/profile', { method: 'POST', body: { ...Object.fromEntries(f), exp: f.getAll('exp'), stay: !!f.get('stay') } });
        store.set('profile', r.profile);
        store.set('user', { ...u, name: r.profile.name });
        toast('Đã lưu hồ sơ.');
        go('/ung-vien', { replace: true, keepScroll: true });
      } catch (err) { stop(); toast(err.message, 'alert'); }
    });
    $('#pwf', root)?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (f.next.length < 6) { toast('Mật khẩu mới cần ít nhất 6 ký tự.', 'alert'); return; }
      const stop = busy(e.submitter, 'Đang lưu…');
      try { await api('/auth/password', { method: 'POST', body: f }); e.target.reset(); toast('Đã đổi mật khẩu.'); } catch (err) { toast(err.message, 'alert'); }
      stop();
    });
    $('#del', root)?.addEventListener('click', () => {
      const box = modal(`<h2>Xoá tài khoản?</h2><p>Hồ sơ, việc đã lưu và thông tin trong các lần ứng tuyển sẽ bị xoá vĩnh viễn. Không thể khôi phục.</p><div class="form-foot"><button class="btn btn-quiet" data-close>Giữ lại</button><button class="btn btn-danger" id="delok">Xoá vĩnh viễn</button></div>`);
      $('#delok', box).addEventListener('click', async (e) => {
        const stop = busy(e.currentTarget, 'Đang xoá…');
        try {
          await api('/me/delete', { method: 'POST', body: {} });
          ['user', 'profile', 'applied', 'saved'].forEach(store.del);
          closeModal(); toast('Đã xoá tài khoản.'); go('/');
        } catch (err) { stop(); toast(err.message, 'alert'); }
      });
    });
  }

  return { nav: '', html, mount, title: tabs.find((t) => t[0] === tab)[1], noindex: true };
}

const empty = (h, p) => `<div class="empty"><h3>${h}</h3><p>${p}</p><a class="btn btn-primary" href="/viec-lam">Tìm việc</a></div>`;
