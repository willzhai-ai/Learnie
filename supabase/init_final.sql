-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 孩子档案表
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  pin_code TEXT DEFAULT '0000',
  grade_level INTEGER DEFAULT 3 CHECK (grade_level BETWEEN 1 AND 6),
  semester TEXT DEFAULT '上学期' CHECK (semester IN ('上学期', '下学期')),
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  answer_history JSONB DEFAULT '[]',
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_practice_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 答题记录表
CREATE TABLE IF NOT EXISTS answer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  transcript TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('word', 'phrase', 'sentence', 'question', 'scenario')),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_child_profiles_updated_at ON child_profiles;
CREATE TRIGGER update_child_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_child ON answer_history(child_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_created ON answer_history(created_at DESC);

-- 5. 启用 RLS
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略
DROP POLICY IF EXISTS "allow_all_child_profiles" ON child_profiles;
DROP POLICY IF EXISTS "allow_all_answer_history" ON answer_history;

-- 创建策略
CREATE POLICY "allow_all_child_profiles" ON child_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_answer_history" ON answer_history FOR ALL USING (true) WITH CHECK (true);

-- 完成
SELECT 'Database setup completed!' as status;
