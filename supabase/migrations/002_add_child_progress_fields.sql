-- 添加孩子进度追踪所需的字段
ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS grade_level INTEGER DEFAULT 3 CHECK (grade_level BETWEEN 1 AND 6),
  ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT '上学期' CHECK (semester IN ('上学期', '下学期')),
  ADD COLUMN IF NOT EXISTS answer_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_practice_at TIMESTAMPTZ;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_child_profiles_parent_id ON child_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_child_profiles_grade_level ON child_profiles(grade_level);

-- 添加答题记录表（用于学习分析）
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

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_answer_history_child ON answer_history(child_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_created ON answer_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_history_difficulty ON answer_history(difficulty);

-- 启用 RLS
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Children can view their own answer history"
  ON answer_history FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "System can insert answer history"
  ON answer_history FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );
