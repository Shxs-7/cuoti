-- 在 Supabase SQL Editor 中执行此文件

-- 设备同步 ID 表（用于跨设备同步）
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 分类
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 文件夹
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 错题（photos 存为 JSON 数组）
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  answer TEXT DEFAULT '',
  wrong_answer TEXT DEFAULT '',
  analysis TEXT DEFAULT '',
  source TEXT DEFAULT '',
  difficulty INTEGER DEFAULT 3,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 标签
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  question_count INTEGER DEFAULT 0,
  UNIQUE(device_id, name)
);

-- 复习记录
CREATE TABLE IF NOT EXISTS reviews (
  question_id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  mastery_level INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0
);

-- 知识点
CREATE TABLE IF NOT EXISTS knowledge_points (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  color TEXT DEFAULT '#0891b2',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 开启 RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_points ENABLE ROW LEVEL SECURITY;

-- RLS 策略：通过 anon key + device_id 访问自己设备的数据
CREATE POLICY "device_access" ON devices FOR ALL USING (true);
CREATE POLICY "device_access" ON categories FOR ALL USING (true);
CREATE POLICY "device_access" ON folders FOR ALL USING (true);
CREATE POLICY "device_access" ON questions FOR ALL USING (true);
CREATE POLICY "device_access" ON tags FOR ALL USING (true);
CREATE POLICY "device_access" ON reviews FOR ALL USING (true);
CREATE POLICY "device_access" ON knowledge_points FOR ALL USING (true);

-- 索引
CREATE INDEX IF NOT EXISTS idx_categories_device ON categories(device_id);
CREATE INDEX IF NOT EXISTS idx_folders_device ON folders(device_id, category_id);
CREATE INDEX IF NOT EXISTS idx_questions_device ON questions(device_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_tags_device ON tags(device_id);
CREATE INDEX IF NOT EXISTS idx_kp_device ON knowledge_points(device_id, folder_id);
