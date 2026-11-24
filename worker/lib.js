// Tiện ích dùng chung cho Worker: phản hồi JSON, mật khẩu, phiên đăng nhập, kiểm tra dữ liệu

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const fail = (status, message) => { throw new HttpError(status, message); };

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

export const now = () => Date.now();
export const DAY = 86400000;
export const MAX_LIFE = 30 * DAY; // mỗi tin tồn tại tối đa 30 ngày (kể cả gia hạn)

/* ---------- Đọc body: chỉ nhận JSON (chặn form chéo trang) ---------- */
export async function body(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) fail(415, 'Yêu cầu không hợp lệ.');
  try { return (await req.json()) || {}; } catch { fail(400, 'Dữ liệu gửi lên không đọc được.'); }
}

/* ---------- Kiểm tra dữ liệu ---------- */
export const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
export function normPhone(v) {
  const d = String(v ?? '').replace(/\D/g, '').replace(/^84/, '').replace(/^0/, '');
  return d.length === 9 ? '0' + d : null;
}
export const normEmail = (v) => {
  const e = String(v ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120 ? e : null;
};
export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Băm ---------- */
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
export const randomToken = (bytes = 32) => hex(crypto.getRandomValues(new Uint8Array(bytes)));

// PBKDF2-SHA256, 100.000 vòng (mức tối đa Workers cho phép)
const ITER = 100000;
async function pbkdf2(password, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, key, 256);
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await pbkdf2(password, salt))}`;
}
export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [, , salt, hash] = stored.split('$');
  const got = b64(await pbkdf2(password, unb64(salt)));
  // so sánh thời gian cố định
  if (got.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}
export const checkPassword = (p) => {
  const s = String(p ?? '');
  if (s.length < 6) fail(400, 'Mật khẩu cần ít nhất 6 ký tự.');
  if (s.length > 100) fail(400, 'Mật khẩu quá dài.');
  return s;
};

/* ---------- Cookie + phiên ---------- */
const SESSION_DAYS = 30;
export function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
export const cookie = (name, value, maxAge, secure = true) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
const isSecure = (req) => new URL(req.url).protocol === 'https:';

export async function createSession(env, req, userId) {
  const token = randomToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(await sha256(token), userId, now() + SESSION_DAYS * DAY).run();
  return cookie('sid', token, SESSION_DAYS * 86400, isSecure(req));
}
export async function destroySession(env, req) {
  const t = getCookie(req, 'sid');
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(t)).run();
  return cookie('sid', '', 0, isSecure(req));
}
export async function currentUser(env, req) {
  const t = getCookie(req, 'sid');
  if (!t) return null;
  const u = await env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'
  ).bind(await sha256(t), now()).first();
  return u && !u.locked ? u : null;
}

/* ---------- Thông tin công khai của người dùng (gửi về trình duyệt) ---------- */
export const publicUser = (u, company) => u && ({
  id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email,
  company: company ? { id: company.id, name: company.name, short: company.short, verified: !!company.verified, verifyStatus: company.verify_status } : null,
  hasPassword: !!u.password_hash, google: !!u.google_sub
});

/* ---------- Không cho người dùng đưa link vào nội dung công khai ---------- */
// Chặn: http(s)://, www., tên miền (abc.com, abc.vn/...), rút gọn (bit.ly, zalo.me...). Email và SĐT vẫn được.
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]{0,62}\.(com|vn|net|org|info|biz|me|io|co|xyz|top|online|site|store|shop|link|ly|app|page|asia|club|live|pro|tv|cc|ws|to|gl|gg)\b(\.vn)?(\/|\b))/i;
export const hasLink = (text) => LINK_RE.test(String(text ?? '').replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, ' '));
export function noLinks(fields) {
  for (const [label, value] of Object.entries(fields)) if (hasLink(value)) fail(400, `${label} không được chứa đường link (website, Zalo, Facebook…). Vui lòng xoá link rồi lưu lại.`);
}

/* ---------- Kiểm tra rủi ro tin đăng (theo quy tắc, không dùng AI) ---------- */
export function riskCheck(f) {
  const text = `${f.title || ''} ${f.descr || ''}`.toLowerCase();
  const out = [];
  if (/(phí|đóng tiền|nộp tiền|thu tiền).{0,20}(đồng phục|hồ sơ|đào tạo)|đồng phục.{0,12}(phí|\d+ ?k|\d{3}\.?000)/.test(text)) out.push('Có nội dung thu phí đồng phục hoặc hồ sơ.');
  if (/(đặt )?cọc|giữ (bằng|cccd|căn cước)/.test(text)) out.push('Có nội dung đặt cọc hoặc giữ giấy tờ gốc.');
  if (Number(f.salary_max) > 25) out.push(`Lương ${f.salary_max} triệu cao bất thường.`);
  if (!f.address || f.address.length < 8) out.push('Thiếu địa chỉ mục tiêu cụ thể.');
  return out;
}

/* ---------- Giới hạn tần suất đơn giản theo IP (dùng Cache API) ---------- */
export async function rateLimit(req, key, limit, windowSec) {
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const url = `https://rl.local/${key}/${await sha256(ip)}/${bucket}`;
  const cache = caches.default;
  const hit = await cache.match(url);
  const n = hit ? Number(await hit.text()) + 1 : 1;
  if (n > limit) fail(429, 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.');
  await cache.put(url, new Response(String(n), { headers: { 'cache-control': `max-age=${windowSec}` } }));
}
export const ipHash = async (req) => sha256(req.headers.get('cf-connecting-ip') || 'local');
