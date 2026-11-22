// API quản trị: chỉ trang admin GAS gọi, xác thực bằng khoá bí mật ADMIN_API_KEY
// (header Authorization: Bearer <key>). Không dùng cookie, không mở cho trình duyệt.
import { fail, json, now, DAY, body, str, sha256, slugify } from './lib.js';
import { markDirty, getKv, setKv, categories, publish, publishStatus, buildData } from './publish.js';

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

export async function adminApi(req, env, url, p) {
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
