-- ==========================================
-- 答题历史记录表
-- 用于记录练习模式的答题历史，支持智能题库判断
-- ==========================================

-- 创建答题历史表（child_id 使用 TEXT 类型，与实际的 child_profiles 表匹配）
CREATE TABLE IF NOT EXISTS answer_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id TEXT NOT NULL, -- 匹配 child_profiles.id 的 TEXT 类型
  question_id TEXT, -- 题目ID（如果有的话）
  question TEXT NOT NULL, -- 题目内容（用于匹配）
  transcript TEXT DEFAULT '', -- 用户说的内容
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('word', 'phrase', 'sentence', 'question', 'scenario')),
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_answer_history_child ON answer_history(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_history_child_question ON answer_history(child_id, question_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_child_difficulty ON answer_history(child_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_answer_history_score ON answer_history(child_id, score DESC);

-- 启用RLS
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（用于统计）
CREATE POLICY "allow_all_read_answer_history" ON answer_history
  FOR SELECT USING (true);

-- 允许所有人插入（孩子练习时记录）
CREATE POLICY "allow_all_insert_answer_history" ON answer_history
  FOR INSERT WITH CHECK (true);

-- 允许家长更新自己孩子的记录
CREATE POLICY "allow_update_own_answer_history" ON answer_history
  FOR UPDATE USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

-- ==========================================
-- 辅助函数：获取孩子在某难度下的最佳成绩
-- ==========================================
CREATE OR REPLACE FUNCTION get_best_scores(
  p_child_id TEXT,
  p_difficulty INTEGER
)
RETURNS TABLE (
  question_id TEXT,
  question TEXT,
  best_score INTEGER,
  attempts INTEGER,
  completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ah.question_id, ah.question) AS question_id,
    ah.question,
    MAX(ah.score) AS best_score,
    COUNT(*) AS attempts,
    MAX(ah.score) >= 80 AS completed
  FROM answer_history ah
  WHERE ah.child_id = p_child_id
    AND ah.difficulty = p_difficulty
  GROUP BY COALESCE(ah.question_id, ah.question), ah.question;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 辅助函数：获取孩子在某难度下已完成的题目ID列表
-- ==========================================
CREATE OR REPLACE FUNCTION get_completed_questions(
  p_child_id TEXT,
  p_difficulty INTEGER
)
RETURNS TABLE (question_id TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT COALESCE(ah.question_id, ah.question) AS question_id
  FROM answer_history ah
  WHERE ah.child_id = p_child_id
    AND ah.difficulty = p_difficulty
  GROUP BY COALESCE(ah.question_id, ah.question)
  HAVING MAX(ah.score) >= 80;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 辅助函数：获取孩子的答题统计
-- ==========================================
CREATE OR REPLACE FUNCTION get_answer_stats(
  p_child_id TEXT,
  p_difficulty INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_avg_score NUMERIC;
  v_result JSON;
BEGIN
  IF p_difficulty IS NOT NULL THEN
    SELECT
      COUNT(DISTINCT COALESCE(question_id, question)),
      COUNT(DISTINCT CASE WHEN max_score >= 80 THEN COALESCE(question_id, question) END),
      AVG(avg_score)
    INTO v_total, v_completed, v_avg_score
    FROM (
      SELECT
        COALESCE(question_id, question) AS qid,
        MAX(score) AS max_score,
        AVG(score) AS avg_score
      FROM answer_history
      WHERE child_id = p_child_id AND difficulty = p_difficulty
      GROUP BY COALESCE(question_id, question)
    ) t;
  ELSE
    SELECT
      COUNT(DISTINCT COALESCE(question_id, question)),
      COUNT(DISTINCT CASE WHEN max_score >= 80 THEN COALESCE(question_id, question) END),
      AVG(avg_score)
    INTO v_total, v_completed, v_avg_score
    FROM (
      SELECT
        COALESCE(question_id, question) AS qid,
        MAX(score) AS max_score,
        AVG(score) AS avg_score
      FROM answer_history
      WHERE child_id = p_child_id
      GROUP BY COALESCE(question_id, question)
    ) t;
  END IF;

  v_result := json_build_object(
    'total_questions', v_total,
    'completed_questions', v_completed,
    'completion_rate', CASE WHEN v_total > 0 THEN (v_completed::NUMERIC / v_total * 100)::INTEGER ELSE 0 END,
    'avg_score', COALESCE(v_avg_score, 0)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
