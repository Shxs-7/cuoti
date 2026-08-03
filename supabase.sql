-- 在 Supabase SQL Editor 中执行此文件（可重复执行，幂等）

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
  pinned_at TIMESTAMPTZ,
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

-- 复习记录（主键是 question_id）
CREATE TABLE IF NOT EXISTS reviews (
  question_id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  mastery_level INTEGER DEFAULT 0,
  consecutive_correct INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
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
  rating INTEGER DEFAULT 3,
  pinned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 学习日记
CREATE TABLE IF NOT EXISTS journal (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  category TEXT DEFAULT '',
  content TEXT DEFAULT '',
  wrong_reasons TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 删除墓碑（同步删除到其他设备）
CREATE TABLE IF NOT EXISTS deletions (
  id TEXT PRIMARY KEY,             -- `${table}:${recordId}`
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,        -- 远程表名，如 questions / reviews
  record_id TEXT NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT now()
);

-- 兼容旧库：给已存在的表补列（可重复执行）
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE knowledge_points ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 3;
ALTER TABLE knowledge_points ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ;

-- 授权：让 anon / authenticated / service_role 能读写所有表（关键！漏了会导致云同步全部失败）
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 开启 RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：通过 anon key + device_id 访问自己设备的数据（幂等创建，可重复执行）
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'devices', 'categories', 'folders', 'questions', 'tags',
    'reviews', 'knowledge_points', 'journal', 'deletions'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'device_access'
    ) THEN
      EXECUTE format('CREATE POLICY "device_access" ON %I FOR ALL USING (true)', tbl);
    END IF;
  END LOOP;
END $$;

-- 索引
CREATE INDEX IF NOT EXISTS idx_categories_device ON categories(device_id);
CREATE INDEX IF NOT EXISTS idx_folders_device ON folders(device_id, category_id);
CREATE INDEX IF NOT EXISTS idx_questions_device ON questions(device_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_tags_device ON tags(device_id);
CREATE INDEX IF NOT EXISTS idx_kp_device ON knowledge_points(device_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_journal_device ON journal(device_id, date);
CREATE INDEX IF NOT EXISTS idx_deletions_table ON deletions(table_name, record_id);
