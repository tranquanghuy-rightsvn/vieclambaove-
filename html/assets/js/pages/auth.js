import { $, $$, icon, store, user, toast, api, busy, syncMe } from '../core.js';
import { go } from '../router.js';

const ERR = {
  'google-chua-cau-hinh': 'Đăng nhập Google chưa được cấu hình. Vui lòng dùng email và mật khẩu.',
  'google-that-bai': 'Đăng nhập Google không thành công. Vui lòng thử lại.',
  'tai-khoan-bi-khoa': 'Tài khoản đã bị khoá. Liên hệ hỗ trợ để biết thêm.'
};

export default async function ({ query }) {
  let role = query.get('vai-tro') === 'nha-tuyen-dung' ? 'employer' : 'candidate';
  let mode = query.get('dang-ky') ? 'register' : 'login';
  const back = (query.get('tiep') || '').startsWith('/') ? query.get('tiep') : '';
  const u = user();
  if (u) return { redirect: back || (u.role === 'employer' ? '/trang-quan-ly-tuyen-dung' : '/ung-vien') };
  const cfg = await api('/auth/config').catch(() => ({ google: false }));

  const side = {
    candidate: ['Tìm việc bảo vệ gần nhà', 'Đăng nhập bằng số điện thoại để lưu tin, xem lại các việc đã ứng tuyển và sửa hồ sơ bất cứ lúc nào.', ['Ứng tuyển nhanh, không cần CV', 'Số điện thoại chỉ hiện với công ty bạn ứng tuyển', 'Hoàn toàn miễn phí']],
    employer: ['Tuyển bảo vệ nhanh, miễn phí', 'Đăng tin miễn phí trong giai đoạn ra mắt. Tin hiển thị 1 - 4 tuần tuỳ bạn chọn, nhận hồ sơ ứng viên ngay trong tài khoản.', ['Đăng nhập bằng email công ty hoặc Gmail', 'Xác thực giấy phép để được gắn dấu tin cậy', 'Theo dõi lượt xem, lượt gọi từng tin']]
  };

  const html = `
  <div class="auth">
    <div class="auth-side" id="authSide"></div>
    <div class="auth-main"><div class="auth-form">
      <div class="seg" role="tablist" aria-label="Bạn là">
        <button type="button" role="tab" data-role="candidate">${icon('user')}Người tìm việc</button>
        <button type="button" role="tab" data-role="employer">${icon('building')}Nhà tuyển dụng</button>
      </div>
      <h1 id="authH"></h1>
      <p id="authP" class="mute"></p>
      ${query.get('loi') && ERR[query.get('loi')] ? `<div class="notice notice-warn" role="alert">${icon('alert')}<p>${ERR[query.get('loi')]}</p></div>` : ''}
      <form id="authForm" class="stack" novalidate></form>
      <p class="mute" style="font-size:14px;margin-top:20px">Tiếp tục nghĩa là bạn đồng ý với <a href="/chinh-sach/dieu-khoan">Điều khoản</a> và <a href="/chinh-sach/bao-mat">Chính sách bảo mật</a>.</p>
    </div></div>
  </div>`;

  function mount(root) {
    const form = $('#authForm', root);
    const draw = () => {
      $$('[data-role]', root).forEach((b) => { const on = b.dataset.role === role; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      const [h, p, list] = side[role];
      $('#authSide', root).innerHTML = `<p class="kicker">vieclambaove.vn</p><h2>${h}</h2><p>${p}</p><ol>${list.map((x) => `<li><span>${x}</span></li>`).join('')}</ol>`;
      const reg = mode === 'register';
      $('#authH', root).textContent = reg ? (role === 'employer' ? 'Đăng ký nhà tuyển dụng' : 'Tạo tài khoản tìm việc') : 'Đăng nhập';
      $('#authP', root).innerHTML = reg ? 'Đã có tài khoản? <button class="linkbtn" type="button" data-mode="login">Đăng nhập</button>' : `Chưa có tài khoản? <button class="linkbtn" type="button" data-mode="register">Đăng ký miễn phí</button>`;
      const pw = `<label class="field"><span>Mật khẩu</span><input class="input" type="password" name="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Ít nhất 6 ký tự' : ''}"></label>`;
      const google = role === 'employer' ? `<div class="or">hoặc</div>
        <a class="btn btn-quiet btn-l btn-block${cfg.google ? '' : ' is-off'}" href="/api/auth/google/start?tiep=${encodeURIComponent(back || '/trang-quan-ly-tuyen-dung')}" ${cfg.google ? '' : 'aria-disabled="true" data-nogoogle'}>${icon('google')}${reg ? 'Đăng ký' : 'Đăng nhập'} với Google</a>` : '';
      form.innerHTML = role === 'candidate'
        ? `${reg ? '<label class="field"><span>Họ và tên</span><input class="input" name="name" required autocomplete="name"></label>' : ''}
           <div class="field"><span class="lbl">Số điện thoại</span><div class="phone"><span>+84</span><input name="phone" inputmode="tel" autocomplete="tel" placeholder="909 123 456" required></div></div>
           ${pw}<button class="btn btn-primary btn-l btn-block" type="submit">${reg ? 'Tạo tài khoản' : 'Đăng nhập'}</button>`
        : `${reg ? `<label class="field"><span>Tên công ty</span><input class="input" name="companyName" required placeholder="Công ty TNHH Dịch vụ Bảo vệ ..." autocomplete="organization"></label>
           <div class="grid2"><label class="field"><span>Người liên hệ</span><input class="input" name="name" required autocomplete="name"></label>
           <label class="field"><span>Số điện thoại công ty</span><input class="input" name="companyPhone" inputmode="tel" autocomplete="tel"></label></div>` : ''}
           <label class="field"><span>Email</span><input class="input" type="email" name="email" required autocomplete="email" placeholder="tuyendung@congty.vn"></label>
           ${pw}<button class="btn btn-primary btn-l btn-block" type="submit">${reg ? 'Đăng ký' : 'Đăng nhập'}</button>${google}`;
      form.querySelector('input')?.focus();
    };
    root.addEventListener('click', (e) => {
      const r = e.target.closest('[data-role]');
      const md = e.target.closest('[data-mode]');
      if (r && r.dataset.role !== role) { role = r.dataset.role; draw(); }
      if (md) { mode = md.dataset.mode; draw(); }
      if (e.target.closest('[data-nogoogle]')) { e.preventDefault(); toast(ERR['google-chua-cau-hinh'], 'lock'); }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      if (role === 'candidate') {
        const d = String(f.phone || '').replace(/\D/g, '').replace(/^84/, '').replace(/^0/, '');
        if (d.length !== 9) { toast('Số điện thoại cần 10 số, ví dụ 0909 123 456.', 'alert'); return; }
        f.phone = '0' + d;
      }
      if (String(f.password || '').length < 6) { toast('Mật khẩu cần ít nhất 6 ký tự.', 'alert'); return; }
      const done = busy(e.submitter, mode === 'register' ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…');
      try {
        const r = await api(mode === 'register' ? '/auth/register' : '/auth/login', { method: 'POST', body: { ...f, role } });
        store.set('user', r.user);
        await syncMe();
        toast(mode === 'register' ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.');
        go(back || (r.user.role === 'employer' ? '/trang-quan-ly-tuyen-dung' : '/ung-vien'));
      } catch (err) { done(); toast(err.message, 'alert'); }
    });
    draw();
  }

  return { nav: '', html, mount, title: 'Đăng nhập', noindex: true, tabbar: false };
}

