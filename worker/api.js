// API của website: /api/*
import {
  HttpError, fail, json, now, DAY, body, str, normPhone, normEmail, slugify, sha256, randomToken,
  MAX_LIFE, hashPassword, verifyPassword, checkPassword, createSession, destroySession, currentUser, publicUser,
  riskCheck, rateLimit, ipHash, getCookie, cookie, noLinks
} from './lib.js';
import { markDirty, getKv, categories, LIVE_SQL } from './publish.js';
import { adminApi } from './admin.js';

const WEEK = 7 * DAY;
const COLORS = ['#1f2a6b', '#7a5a12', '#0f6b4f', '#8b1e2d', '#2d4a8a', '#0b6b8a', '#5b3a8a', '#8a4b0b'];

export async function api(req, env, url) {
  try {
    return await route(req, env, url);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Lỗi máy chủ, vui lòng thử lại.' }, 500);
  }
}

async function route(req, env, url) {
  const p = url.pathname.slice(4); // bỏ "/api"
  const m = req.method;
  {
    if (p.startsWith('/admin/')) return await adminApi(req, env, url, p.slice(6));

    /* ---------- Tài khoản ---------- */
    if (p === '/me' && m === 'GET') return me(env, req);
    if (p === '/me/export' && m === 'GET') return exportMe(env, req);
    if (p === '/me/delete' && m === 'POST') return deleteMe(env, req);
    if (p === '/auth/config' && m === 'GET') return json({ google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) });
    if (p === '/auth/register' && m === 'POST') return register(env, req);
    if (p === '/auth/login' && m === 'POST') return login(env, req);
    if (p === '/auth/logout' && m === 'POST') return json({ ok: true }, 200, { 'set-cookie': await destroySession(env, req) });
    if (p === '/auth/password' && m === 'POST') return changePassword(env, req);
    if (p === '/auth/google/start' && m === 'GET') return googleStart(env, req, url);
    if (p === '/auth/google/callback' && m === 'GET') return googleCallback(env, req, url);

    /* ---------- Ứng viên ---------- */
    if (p === '/apply' && m === 'POST') return apply(env, req);
    if (p === '/profile' && m === 'POST') return saveProfile(env, req);
    if (p === '/saved' && m === 'POST') return toggleSaved(env, req);
    if (p === '/my/applications' && m === 'GET') return myApplications(env, req);
    if (p === '/report' && m === 'POST') return report(env, req);
    if (p === '/track' && m === 'POST') return track(env, req);

    /* ---------- Nhà tuyển dụng ---------- */
    if (p.startsWith('/employer/')) return await employer(req, env, url, p.slice(9));

    fail(404, 'Không tìm thấy.');
  }
}

/* ======================= TÀI KHOẢN ======================= */

async function companyOf(env, u) {
  return u?.company_id ? env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(u.company_id).first() : null;
}

async function me(env, req) {
  const u = await currentUser(env, req);
  if (!u) return json({ user: null });
  const [co, saved, prof] = await Promise.all([
    companyOf(env, u),
    env.DB.prepare('SELECT job_id FROM saved WHERE user_id = ? ORDER BY created_at DESC').bind(u.id).all(),
    u.phone ? env.DB.prepare('SELECT data FROM profiles WHERE phone = ?').bind(u.phone).first() : null
  ]);
  return json({ user: publicUser(u, co), saved: saved.results.map((r) => r.job_id), profile: prof ? JSON.parse(prof.data) : null });
}

async function register(env, req) {
  await rateLimit(req, 'register', 10, 3600);
  const b = await body(req);
  const password = checkPassword(b.password);
  const name = str(b.name, 80);
  if (!name) fail(400, 'Vui lòng nhập họ tên.');
  const t = now();
  let user;
  if (b.role === 'candidate') {
    const phone = normPhone(b.phone);
    if (!phone) fail(400, 'Số điện thoại cần 10 số, ví dụ 0909 123 456.');
    if (await env.DB.prepare('SELECT 1 FROM users WHERE phone = ?').bind(phone).first()) fail(409, 'Số điện thoại này đã có tài khoản. Hãy đăng nhập.');
    user = await env.DB.prepare('INSERT INTO users (role, phone, password_hash, name, created_at) VALUES (\'candidate\', ?, ?, ?, ?) RETURNING *')
      .bind(phone, await hashPassword(password), name, t).first();
    // Gắn hồ sơ nhanh đã gửi trước đó (nếu có) vào tài khoản
    await env.DB.prepare('UPDATE profiles SET user_id = ? WHERE phone = ?').bind(user.id, phone).run();
    await env.DB.prepare('UPDATE applications SET user_id = ? WHERE phone = ? AND user_id IS NULL').bind(user.id, phone).run();
  } else if (b.role === 'employer') {
    const email = normEmail(b.email);
    if (!email) fail(400, 'Email không hợp lệ.');
    const coName = str(b.companyName, 120);
    if (!coName) fail(400, 'Vui lòng nhập tên công ty.');
    noLinks({ 'Tên công ty': coName });
    if (await env.DB.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) fail(409, 'Email này đã có tài khoản. Hãy đăng nhập.');
    const co = await createCompany(env, coName, str(b.companyPhone, 20));
    user = await env.DB.prepare('INSERT INTO users (role, email, password_hash, name, company_id, created_at) VALUES (\'employer\', ?, ?, ?, ?, ?) RETURNING *')
      .bind(email, await hashPassword(password), name, co.id, t).first();
  } else fail(400, 'Chọn bạn là người tìm việc hay nhà tuyển dụng.');
  return json({ ok: true, user: publicUser(user, await companyOf(env, user)) }, 200, { 'set-cookie': await createSession(env, req, user.id) });
}

// Bỏ phần loại hình ("Công ty TNHH Dịch vụ Bảo vệ ...") để lấy tên riêng: dùng cho mã URL, tên ngắn, chữ viết tắt
const companyCore = (name) => name.replace(/^(công ty|cty)\s+((cổ phần|cp|tnhh|mtv|một thành viên)\s+)*((dịch vụ|dv)\s+)?((bảo vệ|an ninh|vệ sĩ)\s+)?/i, '').trim() || name;

export async function createCompany(env, name, phone = '') {
  const core = companyCore(name);
  const base = slugify(core).slice(0, 46) || 'cong-ty';
  let id = base;
  for (let i = 2; await env.DB.prepare('SELECT 1 FROM companies WHERE id = ?').bind(id).first(); i++) id = `${base}-${i}`;
  const words = core.split(/\s+/);
  const short = core.length <= 22 ? core : words.slice(0, 3).join(' ');
  const initials = words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  const color = COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  return env.DB.prepare('INSERT INTO companies (id, name, short, initials, color, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *')
    .bind(id, name, short, initials, color, phone, now()).first();
}

async function login(env, req) {
  await rateLimit(req, 'login', 20, 600);
  const b = await body(req);
  let u;
  if (b.role === 'candidate') {
    const phone = normPhone(b.phone);
    if (!phone) fail(400, 'Số điện thoại cần 10 số.');
    u = await env.DB.prepare('SELECT * FROM users WHERE phone = ? AND role = \'candidate\'').bind(phone).first();
  } else {
    const email = normEmail(b.email);
    if (!email) fail(400, 'Email không hợp lệ.');
    u = await env.DB.prepare('SELECT * FROM users WHERE email = ? AND role = \'employer\'').bind(email).first();
    if (u && !u.password_hash) fail(400, 'Tài khoản này đăng nhập bằng Google. Bấm nút "Đăng nhập với Google".');
  }
  if (!u || !(await verifyPassword(String(b.password ?? ''), u.password_hash))) fail(401, b.role === 'candidate' ? 'Sai số điện thoại hoặc mật khẩu.' : 'Sai email hoặc mật khẩu.');
  if (u.locked) fail(403, 'Tài khoản đã bị khoá. Liên hệ hỗ trợ để biết thêm.');
  return json({ ok: true, user: publicUser(u, await companyOf(env, u)) }, 200, { 'set-cookie': await createSession(env, req, u.id) });
}

async function changePassword(env, req) {
  const u = await needUser(env, req);
  const b = await body(req);
  if (u.password_hash && !(await verifyPassword(String(b.current ?? ''), u.password_hash))) fail(400, 'Mật khẩu hiện tại không đúng.');
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(checkPassword(b.next)), u.id).run();
  return json({ ok: true });
}

async function needUser(env, req, role) {
  const u = await currentUser(env, req);
  if (!u) fail(401, 'Vui lòng đăng nhập.');
  if (role && u.role !== role) fail(403, 'Tài khoản không có quyền này.');
  return u;
}

async function exportMe(env, req) {
  const u = await needUser(env, req);
  const [prof, apps, saved] = await Promise.all([
    u.phone ? env.DB.prepare('SELECT data FROM profiles WHERE phone = ?').bind(u.phone).first() : null,
    env.DB.prepare('SELECT a.job_id, j.title, a.name, a.phone, a.year, a.height, a.status, a.created_at FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE a.user_id = ?').bind(u.id).all(),
    env.DB.prepare('SELECT job_id, created_at FROM saved WHERE user_id = ?').bind(u.id).all()
  ]);
  const data = { account: { role: u.role, name: u.name, phone: u.phone, email: u.email, createdAt: new Date(u.created_at).toISOString() }, profile: prof ? JSON.parse(prof.data) : null, applications: apps.results, saved: saved.results };
  return new Response(JSON.stringify(data, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="du-lieu-cua-toi.json"', 'cache-control': 'no-store' } });
}

// Xoá tài khoản theo Nghị định 13/2023: xoá hồ sơ, việc đã lưu, phiên; ẩn danh hồ sơ ứng tuyển
async function deleteMe(env, req) {
  const u = await needUser(env, req);
  if (u.role === 'employer') fail(400, 'Tài khoản nhà tuyển dụng cần liên hệ hỗ trợ để xoá (còn tin đăng của công ty).');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM profiles WHERE phone = ? OR user_id = ?').bind(u.phone, u.id),
    env.DB.prepare('DELETE FROM saved WHERE user_id = ?').bind(u.id),
    env.DB.prepare('UPDATE applications SET user_id = NULL, name = \'(đã xoá)\', phone = \'xoa-\' || id, year = \'\', height = \'\' WHERE user_id = ? OR phone = ?').bind(u.id, u.phone),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id)
  ]);
  return json({ ok: true }, 200, { 'set-cookie': await destroySession(env, req) });
}

/* ---------- Google (chỉ dành cho nhà tuyển dụng) ---------- */
function googleRedirectUri(url) { return url.origin + '/api/auth/google/callback'; }

async function googleStart(env, req, url) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return Response.redirect(url.origin + '/dang-nhap?vai-tro=nha-tuyen-dung&loi=google-chua-cau-hinh', 302);
  const state = randomToken(16);
  const next = (url.searchParams.get('tiep') || '').startsWith('/') ? url.searchParams.get('tiep') : '';
  const q = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: googleRedirectUri(url), response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' });
  return new Response(null, { status: 302, headers: {
    location: 'https://accounts.google.com/o/oauth2/v2/auth?' + q,
    'set-cookie': cookie('gst', JSON.stringify({ state, next }), 600, url.protocol === 'https:')
  } });
}

async function googleCallback(env, req, url) {
  const back = (err) => Response.redirect(url.origin + '/dang-nhap?vai-tro=nha-tuyen-dung&loi=' + err, 302);
  let saved = {};
  try { saved = JSON.parse(getCookie(req, 'gst') || '{}'); } catch { /* bỏ qua */ }
  if (!saved.state || saved.state !== url.searchParams.get('state') || !url.searchParams.get('code')) return back('google-that-bai');
  const tok = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: googleRedirectUri(url), grant_type: 'authorization_code' })
  }).then((r) => r.json()).catch(() => ({}));
  if (!tok.id_token) return back('google-that-bai');
  // id_token nhận trực tiếp từ Google qua HTTPS nên chỉ cần kiểm tra aud/iss/hạn
  const claims = JSON.parse(atob(tok.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (claims.aud !== env.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.exp * 1000 < now() || !claims.email_verified) return back('google-that-bai');
  const email = claims.email.toLowerCase();
  let u = await env.DB.prepare('SELECT * FROM users WHERE google_sub = ? OR (email = ? AND role = \'employer\')').bind(claims.sub, email).first();
  if (u?.locked) return back('tai-khoan-bi-khoa');
  if (!u) {
    u = await env.DB.prepare('INSERT INTO users (role, email, google_sub, name, created_at) VALUES (\'employer\', ?, ?, ?, ?) RETURNING *')
      .bind(email, claims.sub, str(claims.name || email.split('@')[0], 80), now()).first();
  } else if (!u.google_sub) {
    await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(claims.sub, u.id).run();
  }
  const headers = new Headers({ location: url.origin + (saved.next || '/trang-quan-ly-tuyen-dung') + (saved.next?.includes('?') ? '&' : '?') + 'dang-nhap=google' });
  headers.append('set-cookie', await createSession(env, req, u.id));
  headers.append('set-cookie', cookie('gst', '', 0, url.protocol === 'https:'));
  return new Response(null, { status: 302, headers });
}

/* ======================= ỨNG VIÊN ======================= */

async function liveJob(env, id) {
  const j = await env.DB.prepare(LIVE_SQL + ' AND j.id = ?2').bind(now(), Number(id)).first();
  if (!j) fail(404, 'Tin này đã hết hạn hoặc không còn tồn tại.');
  return j;
}

async function apply(env, req) {
  await rateLimit(req, 'apply', 30, 3600);
  const b = await body(req);
  const j = await liveJob(env, b.jobId);
  const phone = normPhone(b.phone);
  if (!phone) fail(400, 'Số điện thoại cần 10 số, ví dụ 0909 123 456.');
  const name = str(b.name, 80);
  if (!name) fail(400, 'Vui lòng nhập họ tên.');
  const u = await currentUser(env, req);
  const r = await env.DB.prepare(`INSERT INTO applications (job_id, user_id, name, phone, year, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(job_id, phone) DO NOTHING`).bind(j.id, u?.id ?? null, name, phone, str(b.year, 4), str(b.height, 10), now()).run();
  return json({ ok: true, duplicate: r.meta.changes === 0 });
}

const PROFILE_KEYS = ['name', 'year', 'height', 'weight', 'area', 'shift'];
async function saveProfile(env, req) {
  await rateLimit(req, 'profile', 30, 3600);
  const b = await body(req);
  const u = await currentUser(env, req);
  const phone = u?.role === 'candidate' ? u.phone : normPhone(b.phone);
  if (!phone) fail(400, 'Số điện thoại cần 10 số, ví dụ 0909 123 456.');
  if (!str(b.name, 80)) fail(400, 'Vui lòng nhập họ tên.');
  const old = await env.DB.prepare('SELECT data, user_id FROM profiles WHERE phone = ?').bind(phone).first();
  // Hồ sơ đã gắn tài khoản thì chỉ chủ tài khoản mới được sửa
  const owner = await env.DB.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first('id');
  if ((owner && owner !== u?.id) || (old?.user_id && old.user_id !== u?.id)) fail(403, 'Số điện thoại này đã có tài khoản. Hãy đăng nhập để sửa hồ sơ.');
  const data = { ...(old ? JSON.parse(old.data) : {}), phone };
  PROFILE_KEYS.forEach((k) => { if (b[k] !== undefined) data[k] = str(b[k], 80); });
  // Giới thiệu bản thân (không bắt buộc): nhà tuyển dụng xem được nên không cho chèn link
  if (b.about !== undefined) { noLinks({ 'Giới thiệu bản thân': b.about }); data.about = str(b.about, 1000); }
  if (Array.isArray(b.exp)) data.exp = b.exp.slice(0, 12).map((x) => str(x, 40));
  if (b.stay !== undefined) data.stay = !!b.stay;
  // Đồng ý cho công ty bảo vệ đã xác thực xem hồ sơ và liên hệ (Nghị định 13/2023): lưu cả thời điểm đồng ý
  if (b.share !== undefined) { data.share = !!b.share; data.shareAt = b.share ? now() : null; }
  await env.DB.prepare('INSERT INTO profiles (phone, user_id, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, user_id = COALESCE(profiles.user_id, excluded.user_id)')
    .bind(phone, owner || null, JSON.stringify(data), now()).run();
  if (u?.role === 'candidate' && data.name && data.name !== u.name) await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?').bind(data.name, u.id).run();
  return json({ ok: true, profile: data });
}

async function toggleSaved(env, req) {
  const u = await needUser(env, req);
  const b = await body(req);
  const ids = (Array.isArray(b.ids) ? b.ids : [b.jobId]).map(Number).filter((x) => x > 0).slice(0, 200);
  const stmts = ids.map((id) => b.on === false
    ? env.DB.prepare('DELETE FROM saved WHERE user_id = ? AND job_id = ?').bind(u.id, id)
    : env.DB.prepare('INSERT OR IGNORE INTO saved (user_id, job_id, created_at) VALUES (?, ?, ?)').bind(u.id, id, now()));
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}

async function myApplications(env, req) {
  const u = await needUser(env, req, 'candidate');
  const r = await env.DB.prepare(`SELECT a.id, a.job_id, a.status, a.created_at, j.title, j.district, j.province, j.salary_min, j.salary_max, j.status AS job_status, j.expires_at
    FROM applications a LEFT JOIN jobs j ON j.id = a.job_id WHERE a.user_id = ? OR a.phone = ? ORDER BY a.created_at DESC LIMIT 200`).bind(u.id, u.phone).all();
  return json({ items: r.results });
}

const REPORT_REASONS = ['Thu phí đồng phục, phí giữ chỗ', 'Yêu cầu đặt cọc giấy tờ gốc', 'Lương thực tế khác tin đăng', 'Không liên lạc được', 'Tin trùng lặp, sai thông tin', 'Lý do khác'];
async function report(env, req) {
  await rateLimit(req, 'report', 10, 3600);
  const b = await body(req);
  const j = await liveJob(env, b.jobId);
  const reason = REPORT_REASONS.includes(b.reason) ? b.reason : REPORT_REASONS.at(-1);
  const ip = await ipHash(req);
  const u = await currentUser(env, req);
  if (await env.DB.prepare('SELECT 1 FROM reports WHERE job_id = ? AND ip_hash = ? AND status = \'open\'').bind(j.id, ip).first()) return json({ ok: true });
  await env.DB.prepare('INSERT INTO reports (job_id, reason, note, user_id, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(j.id, reason, str(b.note, 1000), u?.id ?? null, ip, now()).run();
  // Bị báo cáo từ 3 lần (khác người): tự ẩn, chuyển về hàng chờ duyệt
  const n = await env.DB.prepare('SELECT COUNT(DISTINCT ip_hash) AS n FROM reports WHERE job_id = ? AND status = \'open\'').bind(j.id).first('n');
  if (n >= 3) {
    const risks = [...JSON.parse(j.risks || '[]').filter((x) => !x.startsWith('Bị báo cáo')), `Bị báo cáo ${n} lần`];
    await env.DB.prepare('UPDATE jobs SET status = \'pending\', risks = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(risks), now(), j.id).run();
    await markDirty(env);
  }
  return json({ ok: true });
}

async function track(env, req) {
  const b = await body(req);
  const col = { view: 'views', call: 'calls', zalo: 'zalos' }[b.type];
  if (!col) fail(400, 'Sai loại.');
  await rateLimit(req, 'track-' + b.type + '-' + Number(b.jobId), 3, 3600);
  await env.DB.prepare(`UPDATE jobs SET ${col} = ${col} + 1 WHERE id = ? AND status = 'live'`).bind(Number(b.jobId)).run();
  return json({ ok: true });
}

/* ======================= NHÀ TUYỂN DỤNG ======================= */

async function employer(req, env, url, p) {
  const m = req.method;
  const u = await needUser(env, req, 'employer');
  const co = await companyOf(env, u);

  // Đăng nhập Google lần đầu: chưa có công ty → tạo công ty trước
  if (p === '/company' && m === 'POST') {
    if (co) fail(400, 'Tài khoản đã có công ty.');
    const b = await body(req);
    const name = str(b.name, 120);
    if (!name) fail(400, 'Vui lòng nhập tên công ty.');
    noLinks({ 'Tên công ty': name });
    const c = await createCompany(env, name, str(b.phone, 20));
    await env.DB.prepare('UPDATE users SET company_id = ? WHERE id = ?').bind(c.id, u.id).run();
    return json({ ok: true, company: c });
  }
  if (!co) fail(409, 'Cần tạo công ty trước.');
  if (co.locked) fail(403, 'Công ty đã bị khoá. Liên hệ hỗ trợ để biết thêm.');

  if (p === '/company' && m === 'PUT') {
    const b = await body(req);
    noLinks({ 'Giới thiệu công ty': b.about, 'Quy mô': b.size });
    await env.DB.prepare('UPDATE companies SET phone = ?, about = ?, size = ?, founded = ? WHERE id = ?')
      .bind(str(b.phone, 20), str(b.about, 2000), str(b.size, 40), Number(b.founded) || null, co.id).run();
    await markDirty(env);
    return json({ ok: true });
  }

  /* Tìm ứng viên: hồ sơ nhanh của ứng viên đã đồng ý cho nhà tuyển dụng liên hệ. Mọi NTD đã đăng ký (công ty bị khoá thì không). */
  if (p === '/candidates' && m === 'GET') {
    await rateLimit(req, 'cand-search', 120, 3600);
    const area = str(url.searchParams.get('tinh'), 40);
    const r = await env.DB.prepare(`SELECT phone, data, updated_at FROM profiles
      WHERE json_extract(data, '$.share') = 1 AND (?1 = '' OR json_extract(data, '$.area') = ?1)
      ORDER BY updated_at DESC LIMIT 500`).bind(area).all();
    return json({ items: r.results.map((x) => {
      const d = JSON.parse(x.data);
      return { phone: x.phone, name: d.name || '', about: d.about || '', year: d.year || '', height: d.height || '', weight: d.weight || '', area: d.area || '', shift: d.shift || '', stay: !!d.stay, exp: d.exp || [], updatedAt: x.updated_at };
    }) });
  }

  if (p === '/overview' && m === 'GET') {
    const [jobs, apps] = await Promise.all([
      env.DB.prepare('SELECT * FROM jobs WHERE company_id = ? ORDER BY updated_at DESC').bind(co.id).all(),
      env.DB.prepare('SELECT a.*, j.title FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = ? ORDER BY a.created_at DESC LIMIT 300').bind(co.id).all()
    ]);
    return json({ company: companyForOwner(co), jobs: jobs.results.map(ownJob), applications: apps.results, approveMode: await getKv(env, 'approve_mode', 'auto') });
  }

  /* Logo công ty */
  if (p === '/company/logo' && m === 'POST') {
    const name = await putImage(env, req, `companies/${co.id}`);
    const old = co.logo?.startsWith('/images/') ? co.logo.slice(8) : null;
    await env.DB.prepare('UPDATE companies SET logo = ? WHERE id = ?').bind('/images/' + name, co.id).run();
    if (old) await env.FILES.delete('img/' + old);
    await markDirty(env);
    return json({ ok: true, logo: '/images/' + name });
  }
  if (p === '/company/logo' && m === 'DELETE') {
    if (co.logo?.startsWith('/images/')) await env.FILES.delete('img/' + co.logo.slice(8));
    await env.DB.prepare('UPDATE companies SET logo = NULL WHERE id = ?').bind(co.id).run();
    await markDirty(env);
    return json({ ok: true });
  }

  /* Ảnh đại diện của tin (tối đa 3) */
  const im = p.match(/^\/jobs\/(\d+)\/images(?:\/(\d+))?$/);
  if (im) {
    const j = await env.DB.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').bind(Number(im[1]), co.id).first();
    if (!j) fail(404, 'Không tìm thấy tin.');
    if (j.status === 'removed') fail(400, 'Tin đã bị gỡ.');
    const imgs = JSON.parse(j.images || '[]');
    if (m === 'POST' && !im[2]) {
      if (imgs.length >= 3) fail(400, 'Mỗi tin tối đa 3 ảnh. Xoá bớt ảnh cũ trước.');
      imgs.push(await putImage(env, req, `jobs/${j.id}`));
    } else if (m === 'DELETE' && im[2] !== undefined) {
      const [gone] = imgs.splice(Number(im[2]), 1);
      if (!gone) fail(404, 'Không tìm thấy ảnh.');
      await env.FILES.delete('img/' + gone);
    } else fail(405, 'Không hỗ trợ.');
    await env.DB.prepare('UPDATE jobs SET images = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(imgs), now(), j.id).run();
    if (['live', 'hidden'].includes(j.status)) await markDirty(env);
    return json({ ok: true, images: imgs.map((x) => '/images/' + x) });
  }

  const jm = p.match(/^\/jobs(?:\/(\d+))?(?:\/(hide|renew))?$/);
  if (jm) {
    const [, id, act] = jm;
    if (!id && m === 'POST') return saveJob(env, req, co, null);
    const j = id && await env.DB.prepare('SELECT * FROM jobs WHERE id = ? AND company_id = ?').bind(Number(id), co.id).first();
    if (!j) fail(404, 'Không tìm thấy tin.');
    if (!act && m === 'GET') return json({ job: ownJob(j) });
    if (!act && m === 'PUT') return saveJob(env, req, co, j);
    if (act === 'hide' && m === 'POST') {
      const b = await body(req);
      if (b.hidden && j.status !== 'live') fail(400, 'Chỉ ẩn được tin đang hiển thị.');
      if (!b.hidden && j.status !== 'hidden') fail(400, 'Tin không ở trạng thái ẩn.');
      if (!b.hidden && j.expires_at <= now()) fail(400, 'Tin đã hết hạn, hãy gia hạn.');
      await env.DB.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').bind(b.hidden ? 'hidden' : 'live', now(), j.id).run();
      await markDirty(env);
      return json({ ok: true });
    }
    if (act === 'renew' && m === 'POST') {
      const b = await body(req);
      const weeks = Math.min(4, Math.max(1, Number(b.weeks) || 4));
      if (!['live', 'expired', 'hidden'].includes(j.status)) fail(400, 'Chỉ gia hạn được tin đã duyệt.');
      const t = now();
      // Tin còn hạn: cộng thêm từ ngày hết hạn hiện tại; tin đã hết hạn: tính từ hôm nay
      const from = j.status !== 'expired' && j.expires_at > t ? j.expires_at : t;
      await env.DB.prepare('UPDATE jobs SET status = CASE WHEN status = \'expired\' THEN \'live\' ELSE status END, expires_at = ?, weeks = ?, updated_at = ? WHERE id = ?')
        .bind(Math.min(from + weeks * WEEK, t + MAX_LIFE), weeks, t, j.id).run(); // gia hạn cũng không quá 30 ngày tính từ hôm nay
      await markDirty(env);
      return json({ ok: true });
    }
  }

  const am = p.match(/^\/applications\/(\d+)$/);
  if (am && m === 'POST') {
    const b = await body(req);
    if (!['new', 'called', 'interview', 'hired', 'rejected'].includes(b.status)) fail(400, 'Trạng thái không hợp lệ.');
    const r = await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ? AND job_id IN (SELECT id FROM jobs WHERE company_id = ?)').bind(b.status, Number(am[1]), co.id).run();
    if (!r.meta.changes) fail(404, 'Không tìm thấy hồ sơ.');
    return json({ ok: true });
  }

  if (p === '/verify' && m === 'POST') {
    const b = await body(req);
    const name = str(b.name, 120), mst = str(b.mst, 20), license = str(b.license, 200), rep = str(b.rep, 80);
    noLinks({ 'Tên công ty': name });
    if (!name || !mst || !license || !rep) fail(400, 'Vui lòng điền đủ tên công ty, mã số thuế, giấy phép và người đại diện.');
    if (!JSON.parse(co.docs || '[]').length) fail(400, 'Vui lòng tải lên ít nhất 1 giấy tờ.');
    await env.DB.prepare('UPDATE companies SET name = ?, mst = ?, license = ?, rep_name = ?, verify_status = \'pending\', verify_note = NULL WHERE id = ?')
      .bind(name, mst, license, rep, co.id).run();
    return json({ ok: true });
  }
  if (p === '/verify/file' && m === 'POST') return uploadDoc(env, req, co);
  const dm = p.match(/^\/verify\/file\/(\d+)$/);
  if (dm && m === 'DELETE') {
    const docs = JSON.parse(co.docs || '[]');
    const [d] = docs.splice(Number(dm[1]), 1);
    if (!d) fail(404, 'Không tìm thấy file.');
    await env.FILES.delete(d.key);
    await env.DB.prepare('UPDATE companies SET docs = ? WHERE id = ?').bind(JSON.stringify(docs), co.id).run();
    return json({ ok: true, docs: docs.map(({ name, type, size }) => ({ name, type, size })) });
  }

  fail(404, 'Không tìm thấy.');
}

const companyForOwner = (c) => ({
  id: c.id, name: c.name, short: c.short, initials: c.initials, color: c.color, logo: c.logo || '', phone: c.phone || '', about: c.about || '', size: c.size || '', founded: c.founded || '',
  mst: c.mst || '', license: c.license || '', rep: c.rep_name || '', verified: !!c.verified, verifyStatus: c.verify_status, verifyNote: c.verify_note || '',
  docs: JSON.parse(c.docs || '[]').map(({ name, type, size }) => ({ name, type, size }))
});

const ownJob = (j) => ({
  id: j.id, title: j.title, province: j.province, district: j.district, address: j.address, target: j.target, shift: j.shift,
  qty: j.qty, salaryMin: j.salary_min, salaryMax: j.salary_max, housing: !!j.housing, meals: !!j.meals, urgent: !!j.urgent,
  age: j.age, height: j.height, desc: j.descr, phone: j.contact_phone, status: j.status, risks: JSON.parse(j.risks || '[]'),
  images: JSON.parse(j.images || '[]').map((x) => '/images/' + x),
  rejectReason: j.reject_reason || '', weeks: j.weeks, views: j.views, calls: j.calls, zalos: j.zalos,
  postedAt: j.posted_at, expiresAt: j.expires_at, updatedAt: j.updated_at
});

async function saveJob(env, req, co, old) {
  await rateLimit(req, 'job-save', 60, 3600);
  const b = await body(req);
  const cats = await categories(env);
  const f = {
    title: str(b.title, 150), province: str(b.province, 40), district: str(b.district, 80), address: str(b.address, 200),
    target: str(b.target, 40), shift: str(b.shift, 40), qty: Math.min(999, Math.max(1, Number(b.qty) || 1)),
    salary_min: Number(b.salaryMin), salary_max: Number(b.salaryMax) || Number(b.salaryMin),
    housing: b.housing ? 1 : 0, meals: b.meals ? 1 : 0, urgent: b.urgent ? 1 : 0,
    age: str(b.age, 60), height: str(b.height, 60), descr: str(b.desc, 5000), contact_phone: str(b.phone, 20),
    weeks: Math.min(4, Math.max(1, Number(b.weeks) || 4))
  };
  const draft = b.action === 'draft';
  if (!f.title || f.title.length < 10) fail(400, 'Tiêu đề cần ít nhất 10 ký tự.');
  noLinks({ 'Tiêu đề': f.title, 'Mô tả': f.descr, 'Địa chỉ': f.address, 'Độ tuổi': f.age, 'Chiều cao': f.height });
  if (!draft) {
    const pv = cats.provinces.find((x) => x.slug === f.province);
    if (!pv) fail(400, 'Chọn tỉnh/thành.');
    if (!pv.districts.includes(f.district)) fail(400, 'Chọn quận/huyện.');
    if (!cats.targets.some((x) => x.id === f.target)) fail(400, 'Chọn loại mục tiêu.');
    if (!cats.shifts.some((x) => x.id === f.shift)) fail(400, 'Chọn ca làm.');
    if (!(f.salary_min >= 1 && f.salary_min <= 200)) fail(400, 'Lương (triệu/tháng) không hợp lệ.');
    if (f.salary_max < f.salary_min) fail(400, 'Lương "đến" phải lớn hơn hoặc bằng lương "từ".');
    if (f.contact_phone && !normPhone(f.contact_phone)) fail(400, 'Số điện thoại liên hệ cần 10 số.');
  }
  if (old && ['removed'].includes(old.status)) fail(400, 'Tin đã bị quản trị gỡ, không sửa được.');

  const risks = riskCheck(f);
  const mode = await getKv(env, 'approve_mode', 'auto');
  const t = now();
  let status, posted = old?.posted_at ?? null, expires = old?.expires_at ?? null;
  if (draft) status = old && ['live', 'hidden'].includes(old.status) ? fail(400, 'Tin đang hiển thị không chuyển về nháp được.') : 'draft';
  else if (risks.length || mode === 'manual') status = 'pending';
  else {
    status = old?.status === 'hidden' ? 'hidden' : 'live';
    // Tin mới lên hoặc tin hết hạn: tính hạn từ hôm nay theo số tuần đã chọn
    if (!old || !['live', 'hidden'].includes(old.status) || !expires || expires <= t) { posted = posted ?? t; expires = t + f.weeks * WEEK; }
  }
  if (old?.status === 'expired' && status === 'pending') expires = null;
  const cols = Object.keys(f);
  let id = old?.id;
  if (old) {
    await env.DB.prepare(`UPDATE jobs SET ${cols.map((c) => c + ' = ?').join(', ')}, status = ?, risks = ?, reject_reason = NULL, posted_at = ?, expires_at = ?, updated_at = ? WHERE id = ?`)
      .bind(...cols.map((c) => f[c]), status, JSON.stringify(risks), posted, expires, t, old.id).run();
  } else {
    id = (await env.DB.prepare(`INSERT INTO jobs (company_id, ${cols.join(', ')}, status, risks, posted_at, expires_at, created_at, updated_at) VALUES (?, ${cols.map(() => '?').join(', ')}, ?, ?, ?, ?, ?, ?) RETURNING id`)
      .bind(co.id, ...cols.map((c) => f[c]), status, JSON.stringify(risks), posted, expires, t, t).first()).id;
  }
  if (status === 'live' || (old && ['live', 'hidden'].includes(old.status))) await markDirty(env);
  return json({ ok: true, id, status, risks });
}

// Ảnh công khai (đã được trình duyệt nén ≤1200px): lưu R2 "img/<base>-<băm>.<đuôi>", trả tên file
const IMG_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export async function putImage(env, req, base) {
  await rateLimit(req, 'img', 60, 3600);
  const form = await req.formData().catch(() => fail(400, 'Không đọc được ảnh.'));
  const file = form.get('file');
  if (!file || typeof file === 'string') fail(400, 'Chưa chọn ảnh.');
  if (!IMG_TYPES[file.type]) fail(400, 'Chỉ nhận ảnh JPG, PNG hoặc WEBP.');
  if (file.size > 2 * 1024 * 1024) fail(400, 'Ảnh tối đa 2MB.');
  const buf = await file.arrayBuffer();
  const name = `${base}-${(await sha256(String.fromCharCode(...new Uint8Array(buf.slice(0, 4096))) + buf.byteLength + Date.now())).slice(0, 8)}.${IMG_TYPES[file.type]}`;
  await env.FILES.put('img/' + name, buf, { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } });
  return name;
}

const DOC_TYPES = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
async function uploadDoc(env, req, co) {
  await rateLimit(req, 'upload', 30, 3600);
  const form = await req.formData().catch(() => fail(400, 'Không đọc được file.'));
  const file = form.get('file');
  if (!file || typeof file === 'string') fail(400, 'Chưa chọn file.');
  if (!DOC_TYPES[file.type]) fail(400, 'Chỉ nhận file PDF, JPG, PNG hoặc WEBP.');
  if (file.size > 5 * 1024 * 1024) fail(400, 'File tối đa 5MB.');
  const docs = JSON.parse(co.docs || '[]');
  if (docs.length >= 6) fail(400, 'Tối đa 6 file. Xoá bớt file cũ trước.');
  const key = `verify/${co.id}/${randomToken(8)}.${DOC_TYPES[file.type]}`;
  await env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  docs.push({ key, name: str(form.get('label') || file.name, 120), type: file.type, size: file.size });
  await env.DB.prepare('UPDATE companies SET docs = ? WHERE id = ?').bind(JSON.stringify(docs), co.id).run();
  return json({ ok: true, docs: docs.map(({ name, type, size }) => ({ name, type, size })) });
}

