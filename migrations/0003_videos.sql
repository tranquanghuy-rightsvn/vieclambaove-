-- Mục Video: quản trị dán link YouTube, website hiển thị danh sách + trang xem
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,       -- URL /video/<slug>
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  descr TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_videos_pub ON videos(published, created_at);
