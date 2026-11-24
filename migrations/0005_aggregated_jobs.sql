-- Tin tổng hợp từ nguồn công khai (seeding lúc ra mắt): ghi rõ nguồn, công ty chưa có tài khoản
ALTER TABLE jobs ADD COLUMN source_name TEXT;
ALTER TABLE jobs ADD COLUMN source_url TEXT;
ALTER TABLE companies ADD COLUMN aggregated INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX idx_jobs_source_url ON jobs(source_url) WHERE source_url IS NOT NULL;
