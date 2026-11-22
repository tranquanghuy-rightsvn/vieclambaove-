-- Ảnh đại diện của tin (tối đa 3): JSON mảng tên file, vd ["jobs/116-a1b2c3d4.jpg"]
-- File gốc ở R2 "img/<tên>", khi tin lên website được chép sang GitHub html/images/<tên>
ALTER TABLE jobs ADD COLUMN images TEXT NOT NULL DEFAULT '[]';
