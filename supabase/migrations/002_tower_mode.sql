-- ==========================================
-- 爬塔模式数据库迁移
-- ==========================================

-- 1. 创建公共题目资源池
CREATE TABLE IF NOT EXISTS public_questions (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  expected_answers TEXT[] NOT NULL,
  emoji TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  category TEXT NOT NULL, -- word, phrase, sentence, question, scenario
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  semester TEXT NOT NULL CHECK (semester IN ('上学期', '下学期')),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为公共题目创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_public_questions_grade_difficulty ON public_questions(grade_level, difficulty);
CREATE INDEX IF NOT EXISTS idx_public_questions_category ON public_questions(category);
CREATE INDEX IF NOT EXISTS idx_public_questions_created_at ON public_questions(created_at DESC);

-- 2. 创建爬塔进度表
CREATE TABLE IF NOT EXISTS tower_progress (
  child_id TEXT PRIMARY KEY REFERENCES child_profiles(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1 NOT NULL,
  highest_level INTEGER DEFAULT 1 NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  total_play_time INTEGER DEFAULT 0, -- 总游戏时间（秒）
  questions_completed INTEGER DEFAULT 0 NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建爬塔答题记录表（记录每次爬塔答题）
CREATE TABLE IF NOT EXISTS tower_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  child_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  question_id TEXT NOT NULL REFERENCES public_questions(id),
  passed BOOLEAN NOT NULL,
  score INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tower_history_child ON tower_history(child_id, answered_at DESC);
CREATE INDEX IF NOT EXISTS idx_tower_history_question ON tower_history(question_id);

-- 4. 创建爬塔排名视图（包含孩子信息）
CREATE OR REPLACE VIEW tower_rankings AS
SELECT
  tp.child_id,
  cp.name AS child_name,
  cp.avatar_url,
  cp.grade_level,
  tp.current_level,
  tp.highest_level,
  tp.total_points,
  tp.questions_completed,
  ROW_NUMBER() OVER (ORDER BY tp.highest_level DESC, tp.updated_at ASC) AS rank
FROM tower_progress tp
JOIN child_profiles cp ON tp.child_id = cp.id
ORDER BY tp.highest_level DESC, tp.updated_at ASC;

-- 5. 更新公共题目的使用次数函数
CREATE OR REPLACE FUNCTION increment_question_usage(question_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public_questions
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 更新爬塔进度的函数
CREATE OR REPLACE FUNCTION update_tower_progress(
  p_child_id TEXT,
  p_passed BOOLEAN,
  p_points_earned INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_progress tower_progress%ROWTYPE;
BEGIN
  -- 先更新进度
  UPDATE tower_progress
  SET
    current_level = CASE WHEN p_passed THEN current_level + 1 ELSE current_level END,
    highest_level = GREATEST(highest_level,
      CASE WHEN p_passed THEN current_level + 1 ELSE current_level END
    ),
    total_points = total_points + p_points_earned,
    questions_completed = questions_completed + 1,
    last_played_at = NOW(),
    updated_at = NOW()
  WHERE child_id = p_child_id
  RETURNING * INTO v_progress;

  -- 如果记录不存在，创建新记录
  IF NOT FOUND THEN
    INSERT INTO tower_progress (child_id, current_level, highest_level, total_points, questions_completed)
    VALUES (
      p_child_id,
      CASE WHEN p_passed THEN 2 ELSE 1 END,
      CASE WHEN p_passed THEN 2 ELSE 1 END,
      p_points_earned,
      1
    )
    RETURNING * INTO v_progress;
  END IF;

  RETURN row_to_json(v_progress);
END;
$$ LANGUAGE plpgsql;

-- 7. 获取随机题目函数（根据学龄和随机难度）
CREATE OR REPLACE FUNCTION get_random_tower_question(
  p_grade_level INTEGER,
  p_difficulty INTEGER
)
RETURNS public_questions AS $$
DECLARE
  v_question public_questions%ROWTYPE;
BEGIN
  SELECT * INTO v_question
  FROM public_questions
  WHERE grade_level = p_grade_level
    AND difficulty = p_difficulty
  ORDER BY RANDOM()
  LIMIT 1;

  RETURN v_question;
END;
$$ LANGUAGE plpgsql;

-- 8. 启用RLS策略
ALTER TABLE public_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower_history ENABLE ROW LEVEL SECURITY;

-- 公共题目允许所有人读取（用于爬塔模式）
CREATE POLICY "allow_all_read_public_questions" ON public_questions
  FOR SELECT USING (true);

-- 公共题目允许所有人插入（用于保存生成的题目）
CREATE POLICY "allow_all_insert_public_questions" ON public_questions
  FOR INSERT WITH CHECK (true);

-- 公共题目允许所有人更新（用于更新使用次数）
CREATE POLICY "allow_all_update_public_questions" ON public_questions
  FOR UPDATE USING (true);

-- 爬塔进度允许所有人读取
CREATE POLICY "allow_all_read_tower_progress" ON tower_progress
  FOR SELECT USING (true);

-- 爬塔进度允许所有人插入和更新
CREATE POLICY "allow_all_write_tower_progress" ON tower_progress
  FOR ALL USING (true) WITH CHECK (true);

-- 爬塔历史允许所有人读取和写入
CREATE POLICY "allow_all_tower_history" ON tower_history
  FOR ALL USING (true) WITH CHECK (true);
