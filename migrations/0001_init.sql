-- Phase 1: tài khoản, công ty, tin tuyển dụng, ứng tuyển, báo cáo, danh mục
-- Thời gian lưu dạng mili-giây (Date.now())

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'employer')),
  phone TEXT UNIQUE,              -- ứng viên đăng nhập bằng SĐT
  email TEXT UNIQUE,              -- nhà tuyển dụng đăng nhập bằng email / Google
  password_hash TEXT,             -- NULL nếu chỉ đăng nhập Google
  google_sub TEXT UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  company_id TEXT,                -- nhà tuyển dụng thuộc công ty nào
  locked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE companies (
  id TEXT PRIMARY KEY,            -- slug, dùng cho URL /cong-ty/<id>
  name TEXT NOT NULL,
  short TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT NOT NULL,
  logo TEXT,
  phone TEXT,
  about TEXT,
  size TEXT,
  founded INTEGER,
  rating REAL,
  reviews INTEGER NOT NULL DEFAULT 0,
  mst TEXT,
  license TEXT,
  rep_name TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verify_status TEXT NOT NULL DEFAULT 'none' CHECK (verify_status IN ('none', 'pending', 'done', 'rejected')),
  verify_note TEXT,
  docs TEXT NOT NULL DEFAULT '[]', -- JSON: [{key, name, type}] file trên R2
  locked INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id TEXT NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  target TEXT NOT NULL,
  shift TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  salary_min REAL NOT NULL,
  salary_max REAL NOT NULL,
  housing INTEGER NOT NULL DEFAULT 0,
  meals INTEGER NOT NULL DEFAULT 0,
  urgent INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'normal',
  age TEXT NOT NULL DEFAULT '',
  height TEXT NOT NULL DEFAULT '',
  descr TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  -- draft: nháp · pending: chờ duyệt · live: đang hiển thị · hidden: NTD tạm ẩn
  -- rejected: bị từ chối · removed: quản trị gỡ · expired: hết hạn (đã xoá khỏi web)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'live', 'hidden', 'rejected', 'removed', 'expired')),
  risks TEXT NOT NULL DEFAULT '[]',
  reject_reason TEXT,
  weeks INTEGER NOT NULL DEFAULT 4 CHECK (weeks BETWEEN 1 AND 4),
  views INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  zalos INTEGER NOT NULL DEFAULT 0,
  posted_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_jobs_status ON jobs(status, expires_at);
CREATE INDEX idx_jobs_company ON jobs(company_id);

CREATE TABLE applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT '',
  height TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'called', 'interview', 'hired', 'rejected')),
  created_at INTEGER NOT NULL,
  UNIQUE (job_id, phone)
);
CREATE INDEX idx_apps_job ON applications(job_id);
CREATE INDEX idx_apps_user ON applications(user_id);

-- Hồ sơ nhanh, gắn theo số điện thoại (kể cả khi chưa có tài khoản)
CREATE TABLE profiles (
  phone TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL
);

CREATE TABLE saved (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  reason TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  user_id INTEGER,
  ip_hash TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'removed', 'dismissed')),
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_reports_job ON reports(job_id, status);

-- Cấu hình + danh mục (JSON): provinces, targets, shifts, approve_mode
-- và bản snapshot dữ liệu công khai (file tĩnh /data/site.js)
CREATE TABLE kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
