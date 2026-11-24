// API quản trị: chỉ trang admin GAS gọi, xác thực bằng khoá bí mật ADMIN_API_KEY
// (header Authorization: Bearer <key>). Không dùng cookie, không mở cho trình duyệt.
import { fail, json, now, DAY, MAX_LIFE, body, str, sha256, slugify, hasLink, normPhone } from './lib.js';
import { createCompany, putImage, IMG_TYPES } from './api.js';
import { markDirty, getKv, setKv, categories, publish, publishStatus, buildData } from './publish.js';
import { crawl, statsText, logoFromPage, isOrg } from './crawl.js';

/* ---------- Nhập tin tổng hợp (dùng cho /import-jobs, /crawl và cron hằng ngày) ---------- */
export async function importJobs(env, items) {
  const t = now();
  const cats = await categories(env);
  const created = [], skipped = [];
  let provincesChanged = false;
  for (const it of items) {
    const why = (r) => skipped.push({ title: str(it.title, 90), source: str(it.sourceUrl, 300), reason: r });
    const pv = cats.provinces.find((x) => x.slug === it.province);
    if (!pv) { why('Tỉnh không hợp lệ'); continue; }
    if (!cats.targets.some((x) => x.id === it.target)) { why('Loại mục tiêu không hợp lệ'); continue; }
    const shiftId = cats.shifts.some((x) => x.id === it.shift) ? it.shift : '';
    const sMin = Number(it.salaryMin), sMax = Number(it.salaryMax) || Number(it.salaryMin);
    if (!(sMin >= 1 && sMin <= 100) || sMax < sMin) { why('Không có mức lương rõ ràng'); continue; }
    const title = str(it.title, 150), descr = str(it.desc, 3000), company = str(it.company, 150);
    if (!title || !company) { why('Thiếu tiêu đề hoặc tên công ty'); continue; }
    if ([title, descr, it.address, it.age, it.height].some(hasLink)) { why('Nội dung có đường link'); continue; }
    const url = str(it.sourceUrl, 500);
    if (!/^https?:\/\//.test(url)) { why('Thiếu link nguồn'); continue; }
    if (await env.DB.prepare('SELECT 1 FROM jobs WHERE source_url = ?').bind(url).first()) { why('Đã nhập trước đó'); continue; }
    const posted = Date.parse(it.postedAt) || t;
    const deadline = it.deadline ? Date.parse(it.deadline) + DAY - 1 : 0;
    const cap = Math.min(posted, t) + MAX_LIFE; // mỗi tin tồn tại tối đa 30 ngày kể từ ngày đăng gốc
    const expires = Math.min(cap, deadline || cap);
    if (expires <= t) { why('Tin gốc đã hết hạn'); continue; }
    // Quận/huyện chưa có trong danh mục: thêm vào tỉnh (giữ đúng địa danh của tin gốc)
    let district = str(it.district, 60) || pv.districts[0];
    if (!pv.districts.includes(district)) { pv.districts.push(district); provincesChanged = true; }
    const phone = normPhone(it.companyPhone) ? str(it.companyPhone, 20) : '';
    let co = await env.DB.prepare('SELECT * FROM companies WHERE name = ?').bind(company).first();
    if (!co) {
      co = await createCompany(env, company, phone);
      if (it.companyLogo) co.logo = await saveRemoteLogo(env, co, it.companyLogo);
      await env.DB.prepare('UPDATE companies SET aggregated = 1, about = ? WHERE id = ?').bind('Thông tin công ty được tổng hợp từ tin tuyển dụng công khai.', co.id).run();
    } else if (!co.logo && it.companyLogo) co.logo = await saveRemoteLogo(env, co, it.companyLogo); // công ty đã có nhưng chưa có logo
    const r = await env.DB.prepare(`INSERT INTO jobs (company_id, title, province, district, address, target, shift, qty, salary_min, salary_max, housing, meals,
        age, height, descr, contact_phone, status, weeks, posted_at, expires_at, source_name, source_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', 2, ?, ?, ?, ?, ?, ?) RETURNING id`)
      .bind(co.id, title, pv.slug, district, str(it.address, 200), it.target, shiftId, Math.max(1, Math.min(999, Number(it.qty) || 1)), sMin, sMax,
        it.housing ? 1 : 0, it.meals ? 1 : 0, str(it.age, 60), str(it.height, 60), descr, phone, Math.min(posted, t), expires,
        str(it.sourceName, 80) || new URL(url).hostname, url, t, t).first();
    created.push(r.id);
  }
  if (provincesChanged) await setKv(env, 'provinces', cats.provinces);
  if (created.length) await markDirty(env);
  return { created, skipped };
}

// Tải logo công ty từ link ảnh của tin gốc về kho ảnh của website (không dùng link ảnh ngoài). Lỗi thì bỏ qua (dùng chữ cái đầu).
export async function saveRemoteLogo(env, co, src) {
  try {
    if (co.logo) return co.logo;
    const r = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36', accept: 'image/*' }, signal: AbortSignal.timeout(15000) });
    const type = (r.headers.get('content-type') || '').split(';')[0].trim().replace('image/jpg', 'image/jpeg');
    if (!r.ok || !IMG_TYPES[type]) return '';
    const buf = await r.arrayBuffer();
    if (buf.byteLength < 800 || buf.byteLength > 2 * 1024 * 1024) return ''; // ảnh quá nhỏ (ảnh trống) hoặc quá lớn
    const name = `companies/${co.id}-${(await sha256(co.id + buf.byteLength + src)).slice(0, 8)}.${IMG_TYPES[type]}`;
    await env.FILES.put('img/' + name, buf, { httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000, immutable' } });
    await env.DB.prepare('UPDATE companies SET logo = ? WHERE id = ? AND (logo IS NULL OR logo = \'\')').bind('/images/' + name, co.id).run();
    return '/images/' + name;
  } catch { return ''; }
}

// Bổ sung logo cho công ty tin tổng hợp chưa có logo: đọc lại 1 tin gốc của công ty đó
export async function backfillLogos(env, limit = 40) {
  const rows = (await env.DB.prepare(`SELECT c.*, (SELECT j.source_url FROM jobs j WHERE j.company_id = c.id AND j.source_url IS NOT NULL ORDER BY j.id DESC LIMIT 1) AS src
    FROM companies c WHERE c.aggregated = 1 AND (c.logo IS NULL OR c.logo = '') LIMIT ?`).bind(limit).all()).results.filter((c) => c.src);
  let done = 0;
  for (const c of rows) {
    try {
      const html = await (await fetch(c.src, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36' }, signal: AbortSignal.timeout(20000) })).text();
      const logo = logoFromPage(html, c.src);
      if (logo && (await saveRemoteLogo(env, c, logo))) done++;
    } catch { /* bỏ qua */ }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (done) await markDirty(env);
  return { checked: rows.length, logos: done };
}

// Cào các trang việc làm công khai rồi nhập. Lưu link đã xử lý và kết quả lần chạy gần nhất.
export async function crawlDaily(env, opts = {}) {
  const started = now();
  const cats = await categories(env);
  const seen = await getKv(env, 'crawl_seen', {});
  const { items, stats } = await crawl({ provinces: cats.provinces, seen, pages: opts.pages || 2, max: opts.max || 40 });
  const { created, skipped } = items.length ? await importJobs(env, items) : { created: [], skipped: [] };
  await setKv(env, 'crawl_seen', seen);
  const why = {}; skipped.forEach((x) => (why[x.reason] = (why[x.reason] || 0) + 1));
  const result = { at: started, seconds: Math.round((now() - started) / 1000), found: items.length, created: created.length, skipped: why, sources: statsText(stats) };
  await setKv(env, 'crawl_last', result);
  return result;
}

const enc = new TextEncoder();
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sameSecret(a, b) {
  // So sánh qua băm để không lộ độ dài/thời gian
  const [x, y] = await Promise.all([sha256(String(a)), sha256(String(b))]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

export const adminApi = (req, env, url, p) => adminRoute(req, env, url, p);

async function adminRoute(req, env, url, p) {
  const m = req.method;

  // Link xem giấy tờ xác thực: ký HMAC, hết hạn sau 15 phút (mở được trong trình duyệt của quản trị)
  if (p === '/file' && m === 'GET') {
    const key = url.searchParams.get('key') || '', exp = Number(url.searchParams.get('exp'));
    if (!env.ADMIN_API_KEY || !(exp > now()) || !(await sameSecret(url.searchParams.get('sig'), await hmac(env.ADMIN_API_KEY, key + '|' + exp)))) fail(403, 'Link đã hết hạn.');
    const obj = await env.FILES.get(key);
    if (!obj) fail(404, 'Không tìm thấy file.');
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'application/octet-stream', 'cache-control': 'private, no-store', 'content-disposition': 'inline' } });
  }

  const auth = req.headers.get('authorization') || '';
  if (!env.ADMIN_API_KEY || !auth.startsWith('Bearer ') || !(await sameSecret(auth.slice(7), env.ADMIN_API_KEY))) fail(401, 'Sai khoá quản trị.');
  const t = now();

  /* ---------- Thống kê ---------- */
  if (p === '/stats' && m === 'GET') {
    const one = (sql, ...a) => env.DB.prepare(sql).bind(...a).first('n');
    const [live, pending, cand, emp, cos, verified, waitVerify, apps, reports, byProvince] = await Promise.all([
      one('SELECT COUNT(*) n FROM jobs WHERE status = \'live\' AND expires_at > ?', t),
      one('SELECT COUNT(*) n FROM jobs WHERE status = \'pending\''),
      one('SELECT COUNT(*) n FROM users WHERE role = \'candidate\''),
      one('SELECT COUNT(*) n FROM users WHERE role = \'employer\''),
      one('SELECT COUNT(*) n FROM companies'),
      one('SELECT COUNT(*) n FROM companies WHERE verified = 1'),
      one('SELECT COUNT(*) n FROM companies WHERE verify_status = \'pending\''),
      one('SELECT COUNT(*) n FROM applications WHERE created_at > ?', t - 30 * DAY),
      one('SELECT COUNT(DISTINCT job_id) n FROM reports WHERE status = \'open\''),
      env.DB.prepare('SELECT province, COUNT(*) n FROM jobs WHERE status = \'live\' AND expires_at > ? GROUP BY province ORDER BY n DESC').bind(t).all()
    ]);
    return json({ live, pending, candidates: cand, employers: emp, companies: cos, verified, waitVerify, applications30d: apps, openReports: reports, byProvince: byProvince.results, approveMode: await getKv(env, 'approve_mode', 'auto'), publish: await publishStatus(env) });
  }

  /* ---------- Duyệt tin ---------- */
  if (p === '/jobs' && m === 'GET') {
    const status = url.searchParams.get('status') || 'pending';
    const q = '%' + (url.searchParams.get('q') || '') + '%';
    const r = await env.DB.prepare(`SELECT j.*, c.name AS company_name, c.verified AS company_verified,
        (SELECT COUNT(*) FROM reports r WHERE r.job_id = j.id AND r.status = 'open') AS open_reports
      FROM jobs j JOIN companies c ON c.id = j.company_id
      WHERE (?1 = 'all' OR j.status = ?1) AND (j.title LIKE ?2 OR c.name LIKE ?2) ORDER BY j.updated_at DESC LIMIT 200`).bind(status, q).all();
    return json({ items: r.results.map((j) => ({ ...j, risks: JSON.parse(j.risks || '[]') })) });
  }
  const jm = p.match(/^\/jobs\/(\d+)\/(approve|reject|remove)$/);
  if (jm && m === 'POST') {
    const [, id, act] = jm;
    const j = await env.DB.prepare('SELECT * FROM jobs WHERE id = ?').bind(Number(id)).first();
    if (!j) fail(404, 'Không tìm thấy tin.');
    const b = await body(req);
    if (act === 'approve') {
      if (j.status !== 'pending') fail(400, 'Tin không ở trạng thái chờ duyệt.');
      // Lần đầu lên: hạn tính từ lúc duyệt. Tin bị báo cáo rồi được duyệt lại: giữ hạn cũ nếu còn
      const expires = j.expires_at && j.expires_at > t ? j.expires_at : t + j.weeks * 7 * DAY;
      await env.DB.batch([
        env.DB.prepare('UPDATE jobs SET status = \'live\', risks = \'[]\', reject_reason = NULL, posted_at = COALESCE(posted_at, ?), expires_at = ?, updated_at = ? WHERE id = ?').bind(t, expires, t, j.id),
        env.DB.prepare('UPDATE reports SET status = \'dismissed\' WHERE job_id = ? AND status = \'open\'').bind(j.id)
      ]);
    } else {
      const reason = str(b.reason, 300) || (act === 'remove' ? 'Vi phạm quy chế đăng tin' : 'Không đạt quy chế đăng tin');
      await env.DB.batch([
        env.DB.prepare('UPDATE jobs SET status = ?, reject_reason = ?, updated_at = ? WHERE id = ?').bind(act === 'remove' ? 'removed' : 'rejected', reason, t, j.id),
        env.DB.prepare('UPDATE reports SET status = \'removed\' WHERE job_id = ? AND status = \'open\'').bind(j.id)
      ]);
    }
    await markDirty(env);
    return json({ ok: true });
  }

  /* ---------- Báo cáo vi phạm ---------- */
  /* ---------- Hồ sơ ứng tuyển vào tin tổng hợp (công ty chưa có tài khoản): quản trị gọi lại / chuyển cho công ty ---------- */
  if (p === '/applications' && m === 'GET') {
    const r = await env.DB.prepare(`SELECT a.id, a.name, a.phone, a.year, a.height, a.status, a.created_at, j.id AS job_id, j.title, j.source_url, j.source_name, c.name AS company_name, c.phone AS company_phone
      FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
      WHERE c.aggregated = 1 ORDER BY a.created_at DESC LIMIT 500`).all();
    return json({ items: r.results });
  }
  const am = p.match(/^\/applications\/(\d+)$/);
  if (am && m === 'POST') {
    const b = await body(req);
    if (!['new', 'called', 'interview', 'hired', 'rejected'].includes(b.status)) fail(400, 'Trạng thái không hợp lệ.');
    await env.DB.prepare('UPDATE applications SET status = ? WHERE id = ?').bind(b.status, Number(am[1])).run();
    return json({ ok: true });
  }

  if (p === '/reports' && m === 'GET') {
    const r = await env.DB.prepare(`SELECT r.job_id, j.title, j.status AS job_status, c.name AS company_name, COUNT(*) AS n,
        GROUP_CONCAT(r.reason, ' | ') AS reasons, GROUP_CONCAT(NULLIF(r.note, ''), ' | ') AS notes, MAX(r.created_at) AS last_at
      FROM reports r JOIN jobs j ON j.id = r.job_id JOIN companies c ON c.id = j.company_id
      WHERE r.status = 'open' GROUP BY r.job_id ORDER BY n DESC, last_at DESC`).all();
    return json({ items: r.results });
  }
  const rm = p.match(/^\/reports\/(\d+)$/);
  if (rm && m === 'POST') {
    const b = await body(req);
    const id = Number(rm[1]);
    if (b.action === 'remove') {
      await env.DB.batch([
        env.DB.prepare('UPDATE jobs SET status = \'removed\', reject_reason = ?, updated_at = ? WHERE id = ?').bind(str(b.reason, 300) || 'Gỡ do bị báo cáo vi phạm', t, id),
        env.DB.prepare('UPDATE reports SET status = \'removed\' WHERE job_id = ? AND status = \'open\'').bind(id)
      ]);
    } else if (b.action === 'dismiss') {
      // Bỏ qua: nếu tin đang bị tự ẩn vì báo cáo thì cho hiển thị lại
      await env.DB.batch([
        env.DB.prepare('UPDATE reports SET status = \'dismissed\' WHERE job_id = ? AND status = \'open\'').bind(id),
        env.DB.prepare(`UPDATE jobs SET status = 'live', risks = '[]', updated_at = ? WHERE id = ? AND status = 'pending' AND risks LIKE '%Bị báo cáo%' AND expires_at > ?`).bind(t, id, t)
      ]);
    } else fail(400, 'Thao tác không hợp lệ.');
    await markDirty(env);
    return json({ ok: true });
  }

  /* ---------- Công ty ---------- */
  if (p === '/companies' && m === 'GET') {
    const r = await env.DB.prepare(`SELECT c.*, (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'live' AND j.expires_at > ?) AS live_jobs,
        (SELECT GROUP_CONCAT(email, ', ') FROM users u WHERE u.company_id = c.id) AS emails
      FROM companies c ORDER BY (c.verify_status = 'pending') DESC, c.created_at DESC LIMIT 500`).bind(t).all();
    const items = await Promise.all(r.results.map(async (c) => ({
      ...c, docs: await Promise.all(JSON.parse(c.docs || '[]').map(async (d) => ({ name: d.name, type: d.type, url: await signedUrl(env, url, d.key) })))
    })));
    return json({ items });
  }
  // Gắn logo cho công ty (vd công ty của tin tổng hợp, chưa có tài khoản)
  const lm = p.match(/^\/companies\/([a-z0-9-]+)\/logo$/);
  if (lm && m === 'POST') {
    const c = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(lm[1]).first();
    if (!c) fail(404, 'Không tìm thấy công ty.');
    const name = await putImage(env, req, `companies/${c.id}`);
    if (c.logo?.startsWith('/images/')) await env.FILES.delete('img/' + c.logo.slice(8));
    await env.DB.prepare('UPDATE companies SET logo = ? WHERE id = ?').bind('/images/' + name, c.id).run();
    await markDirty(env);
    return json({ ok: true, logo: '/images/' + name });
  }
  const cm = p.match(/^\/companies\/([a-z0-9-]+)$/);
  if (cm && m === 'POST') {
    const b = await body(req);
    const c = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(cm[1]).first();
    if (!c) fail(404, 'Không tìm thấy công ty.');
    if (b.verify === 'done' || b.verify === 'rejected') {
      await env.DB.prepare('UPDATE companies SET verify_status = ?, verified = ?, verify_note = ? WHERE id = ?')
        .bind(b.verify, b.verify === 'done' ? 1 : 0, str(b.note, 300) || null, c.id).run();
    }
    if (typeof b.locked === 'boolean') {
      await env.DB.batch([
        env.DB.prepare('UPDATE companies SET locked = ? WHERE id = ?').bind(b.locked ? 1 : 0, c.id),
        env.DB.prepare('UPDATE users SET locked = ? WHERE company_id = ?').bind(b.locked ? 1 : 0, c.id),
        ...(b.locked ? [env.DB.prepare('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE company_id = ?)').bind(c.id)] : [])
      ]);
    }
    await markDirty(env);
    return json({ ok: true });
  }

  /* ---------- Người dùng ---------- */
  if (p === '/users' && m === 'GET') {
    const role = url.searchParams.get('role') || 'all';
    const q = '%' + (url.searchParams.get('q') || '') + '%';
    const r = await env.DB.prepare(`SELECT u.id, u.role, u.name, u.phone, u.email, u.company_id, u.locked, u.created_at, (u.google_sub IS NOT NULL) AS google,
        (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) AS apps
      FROM users u WHERE (?1 = 'all' OR u.role = ?1) AND (u.name LIKE ?2 OR IFNULL(u.phone, '') LIKE ?2 OR IFNULL(u.email, '') LIKE ?2)
      ORDER BY u.created_at DESC LIMIT 300`).bind(role, q).all();
    return json({ items: r.results });
  }
  const um = p.match(/^\/users\/(\d+)$/);
  if (um && m === 'POST') {
    const b = await body(req);
    if (typeof b.locked !== 'boolean') fail(400, 'Thiếu trạng thái khoá.');
    const id = Number(um[1]);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET locked = ? WHERE id = ?').bind(b.locked ? 1 : 0, id),
      ...(b.locked ? [env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id)] : [])
    ]);
    return json({ ok: true });
  }

  /* ---------- Danh mục + cấu hình ---------- */
  if (p === '/settings' && m === 'GET') return json({ ...(await categories(env)), approveMode: await getKv(env, 'approve_mode', 'auto') });
  if (p === '/settings' && m === 'PUT') {
    const b = await body(req);
    if (b.approveMode !== undefined) {
      if (!['auto', 'manual'].includes(b.approveMode)) fail(400, 'Chế độ duyệt không hợp lệ.');
      await setKv(env, 'approve_mode', b.approveMode);
    }
    if (b.provinces !== undefined) await setKv(env, 'provinces', cleanProvinces(b.provinces));
    if (b.targets !== undefined) await setKv(env, 'targets', cleanList(b.targets, true));
    if (b.shifts !== undefined) await setKv(env, 'shifts', cleanList(b.shifts, false));
    await markDirty(env);
    return json({ ok: true, ...(await categories(env)), approveMode: await getKv(env, 'approve_mode', 'auto') });
  }

  /* ---------- Video YouTube ---------- */
  if (p === '/videos' && m === 'GET') {
    const r = await env.DB.prepare('SELECT * FROM videos ORDER BY created_at DESC').all();
    return json({ items: r.results });
  }
  const vm = p.match(/^\/videos(?:\/(\d+))?$/);
  if (vm && (m === 'POST' || m === 'PUT')) {
    const b = await body(req);
    const yt = youtubeId(b.url || b.youtubeId);
    if (!yt) fail(400, 'Link YouTube không hợp lệ. Ví dụ: https://www.youtube.com/watch?v=xxxxxxxxxxx');
    const title = str(b.title, 150);
    if (!title) fail(400, 'Vui lòng nhập tiêu đề video.');
    const descr = str(b.desc, 3000);
    const published = b.published === false ? 0 : 1;
    if (m === 'POST' && !vm[1]) {
      const base = slugify(title).slice(0, 70) || 'video';
      let slug = base;
      for (let i = 2; await env.DB.prepare('SELECT 1 FROM videos WHERE slug = ?').bind(slug).first(); i++) slug = `${base}-${i}`;
      const v = await env.DB.prepare('INSERT INTO videos (slug, youtube_id, title, descr, published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *').bind(slug, yt, title, descr, published, t, t).first();
      await markDirty(env);
      return json({ ok: true, item: v });
    }
    if (m === 'PUT' && vm[1]) {
      const r = await env.DB.prepare('UPDATE videos SET youtube_id = ?, title = ?, descr = ?, published = ?, updated_at = ? WHERE id = ?').bind(yt, title, descr, published, t, Number(vm[1])).run();
      if (!r.meta.changes) fail(404, 'Không tìm thấy video.');
      await markDirty(env);
      return json({ ok: true });
    }
  }
  if (vm && vm[1] && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM videos WHERE id = ?').bind(Number(vm[1])).run();
    await markDirty(env);
    return json({ ok: true });
  }

  /* ---------- Nhập tin tổng hợp từ nguồn công khai (seeding) ---------- */
  // Mỗi tin giữ đúng công ty/lương/liên hệ như tin gốc, ghi nguồn; hạn hiển thị = hạn tin gốc, tối đa 30 ngày kể từ ngày đăng gốc.
  if (p === '/import-jobs' && m === 'POST') {
    const b = await body(req);
    const items = Array.isArray(b.items) ? b.items.slice(0, 100) : fail(400, 'Thiếu danh sách tin.');
    const { created, skipped } = await importJobs(env, items);
    return json({ ok: true, created: created.length, ids: created, skipped });
  }

  /* ---------- Cào tin từ trang việc làm khác: cron 6h sáng tự chạy; quản trị xem kết quả / bấm chạy ngay ---------- */
  if (p === '/crawl' && m === 'GET') return json({ ok: true, last: await getKv(env, 'crawl_last') });
  if (p === '/crawl' && m === 'POST') return json({ ok: true, last: await crawlDaily(env) });
  if (p === '/crawl/logos' && m === 'POST') return json({ ok: true, ...(await backfillLogos(env)) });
  // Chuẩn hoá chữ cái đầu (1 ký tự) cho công ty chưa có logo; ẩn tin tổng hợp mà người đăng là cá nhân
  if (p === '/crawl/cleanup' && m === 'POST') {
    const cos = (await env.DB.prepare('SELECT id, name, initials, aggregated FROM companies').all()).results;
    let fixed = 0; const hidden = [];
    for (const c of cos) {
      const one = (c.name.replace(/^(công ty|cty)\s+((cổ phần|cp|tnhh|mtv|một thành viên)\s+)*((dịch vụ|dv)\s+)?((bảo vệ|an ninh|vệ sĩ)\s+)?/i, '').match(/\p{L}|\d/u) || ['?'])[0].toUpperCase();
      if (c.initials !== one) { await env.DB.prepare('UPDATE companies SET initials = ? WHERE id = ?').bind(one, c.id).run(); fixed++; }
      if (c.aggregated && !isOrg(c.name)) {
        const r = await env.DB.prepare("UPDATE jobs SET status = 'hidden', updated_at = ? WHERE company_id = ? AND status = 'live' AND source_url IS NOT NULL").bind(t, c.id).run();
        if (r.meta.changes) hidden.push(c.name);
      }
    }
    await markDirty(env);
    return json({ ok: true, initialsFixed: fixed, hiddenCompanies: hidden });
  }

  /* ---------- Hết hạn: GAS gọi mỗi ngày lúc 0h ---------- */
  if (p === '/expire' && m === 'POST') {
    const r = await env.DB.prepare('UPDATE jobs SET status = \'expired\', updated_at = ? WHERE status IN (\'live\', \'hidden\') AND expires_at <= ?').bind(t, t).run();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(t).run();
    await markDirty(env); // dựng lại dữ liệu trực tiếp + xuất bản (gỡ trang, ảnh của tin hết hạn)
    const pub = await publish(env, { force: true }).catch((e) => ({ ok: false, error: e.message }));
    return json({ ok: true, expired: r.meta.changes, publish: pub });
  }

  /* ---------- Xuất bản lên website tĩnh ---------- */
  if (p === '/publish' && m === 'GET') return json(await publishStatus(env));
  if (p === '/publish' && m === 'POST') { await markDirty(env); return json(await publish(env)); }
  // Dữ liệu công khai (để build site tĩnh ở máy: npm run data:pull)
  if (p === '/export' && m === 'GET') return json(await buildData(env));

  fail(404, 'Không tìm thấy.');
}

// Nhận mọi dạng link YouTube: watch?v=, youtu.be/, shorts/, embed/, live/ hoặc chỉ mã 11 ký tự
export function youtubeId(input) {
  const v = String(input ?? '').trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  let u;
  try { u = new URL(v); } catch { return null; }
  if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/.test(u.hostname)) return null;
  const id = u.hostname.endsWith('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v') || (u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/) || [])[1];
  return /^[\w-]{11}$/.test(id || '') ? id : null;
}

async function signedUrl(env, url, key) {
  const exp = now() + 15 * 60 * 1000;
  return `${url.origin}/api/admin/file?key=${encodeURIComponent(key)}&exp=${exp}&sig=${await hmac(env.ADMIN_API_KEY, key + '|' + exp)}`;
}

function cleanProvinces(list) {
  if (!Array.isArray(list) || !list.length) fail(400, 'Cần ít nhất 1 tỉnh/thành.');
  const seen = new Set();
  return list.map((x) => {
    const name = str(x.name, 60);
    const slug = str(x.slug, 40) || slugify(name);
    if (!name || !/^[a-z0-9-]+$/.test(slug) || seen.has(slug)) fail(400, `Tỉnh/thành "${name || slug}" thiếu tên hoặc trùng mã.`);
    seen.add(slug);
    const districts = [...new Set((Array.isArray(x.districts) ? x.districts : String(x.districts || '').split(',')).map((d) => str(d, 60)).filter(Boolean))];
    if (!districts.length) fail(400, `"${name}" cần ít nhất 1 quận/huyện.`);
    return { slug, name, short: str(x.short, 30) || name, districts };
  });
}
function cleanList(list, withIcon) {
  if (!Array.isArray(list) || !list.length) fail(400, 'Danh mục không được để trống.');
  const seen = new Set();
  return list.map((x) => {
    const name = str(x.name, 60);
    const id = str(x.id, 40) || slugify(name);
    if (!name || !/^[a-z0-9-]+$/.test(id) || seen.has(id)) fail(400, `Mục "${name || id}" thiếu tên hoặc trùng mã.`);
    seen.add(id);
    return withIcon ? { id, name, icon: str(x.icon, 20) || 'building' } : { id, name };
  });
}
