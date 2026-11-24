import { esc, icon, store, user, job, jobRow, crumbs } from '../core.js';

// Việc đã lưu: dùng được khi chưa đăng nhập (lưu trên máy); đăng nhập thì tự gộp vào tài khoản (syncMe)
export default function () {
  const u = user();
  const ids = store.get('saved', []);
  const jobs = ids.map(job).filter(Boolean);
  const gone = ids.length - jobs.length;
  const html = `<div class="wrap" style="padding-top:20px">
    ${crumbs([['Trang chủ', '/'], ['Việc đã lưu', null]])}
    <h1 class="page-h">Việc đã lưu</h1>
    ${u?.role === 'employer' ? '' : u ? `<p class="mute">Danh sách được đồng bộ với tài khoản ${esc(u.phone || u.name || '')}, xem được trên mọi thiết bị.</p>`
      : `<div class="notice notice-ok" style="margin-bottom:16px">${icon('bookmark')}<p>Tin đã lưu đang nằm trên máy này. <a href="/dang-nhap?tiep=/viec-da-luu">Đăng nhập</a> hoặc <a href="/dang-nhap?dang-ky=1&tiep=/viec-da-luu">tạo tài khoản</a> bằng số điện thoại để giữ danh sách trên mọi thiết bị.</p></div>`}
    ${jobs.length ? `<div class="jlist">${jobs.map(jobRow).join('')}</div>` : `<div class="empty"><h3>Chưa lưu việc nào</h3><p>Bấm biểu tượng trái tim ở mỗi tin để xem lại sau.</p><a class="btn btn-primary" href="/viec-lam">Tìm việc</a></div>`}
    ${gone > 0 ? `<p class="mute" style="margin-top:12px">${gone} tin đã lưu trước đây đã hết hạn nên không còn hiển thị.</p>` : ''}
  </div>`;
  return { nav: '', html, title: 'Việc đã lưu', noindex: true };
}
