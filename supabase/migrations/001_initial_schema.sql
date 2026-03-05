-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Child Profiles Table
-- ============================================
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  pin_code TEXT NOT NULL CHECK (length(pin_code) = 4),
  current_points INTEGER DEFAULT 0 CHECK (current_points >= 0),
  total_points_earned INTEGER DEFAULT 0 CHECK (total_points_earned >= 0),
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL CHECK (subject IN ('english', 'math', 'chinese')),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  category TEXT NOT NULL CHECK (category IN ('word', 'phrase', 'sentence', 'question', 'scenario', 'contest')),
  content JSONB NOT NULL,
  base_points INTEGER DEFAULT 10 CHECK (base_points > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for task queries
CREATE INDEX idx_tasks_subject ON tasks(subject);
CREATE INDEX idx_tasks_difficulty ON tasks(difficulty);
CREATE INDEX idx_tasks_category ON tasks(category);

-- ============================================
-- Task Attempts Table
-- ============================================
CREATE TABLE task_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX idx_task_attempts_child ON task_attempts(child_id);
CREATE INDEX idx_task_attempts_created ON task_attempts(created_at DESC);

-- ============================================
-- Prizes Table
-- ============================================
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  points_required INTEGER NOT NULL CHECK (points_required >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Redemptions Table
-- ============================================
CREATE TABLE redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL CHECK (points_spent > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Achievements Table
-- ============================================
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_bonus INTEGER DEFAULT 0 CHECK (points_bonus >= 0),
  condition JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Child Achievements Table
-- ============================================
CREATE TABLE child_achievements (
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (child_id, achievement_id)
);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_child_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at
  BEFORE UPDATE ON prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redemptions_updated_at
  BEFORE UPDATE ON redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_achievements ENABLE ROW LEVEL SECURITY;

-- Note: Tasks and Achievements are public/read-only for authenticated users

-- Child profiles policies
CREATE POLICY "Parents can view their children's profiles"
  ON child_profiles FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can insert child profiles"
  ON child_profiles FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their children's profiles"
  ON child_profiles FOR UPDATE
  USING (parent_id = auth.uid());

-- Task attempts policies
CREATE POLICY "Children can view their own attempts"
  ON task_attempts FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "System can insert attempts"
  ON task_attempts FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

-- Prizes policies
CREATE POLICY "Parents can manage their prizes"
  ON prizes FOR ALL
  USING (parent_id = auth.uid());

-- Redemptions policies
CREATE POLICY "Parents can view all redemptions"
  ON redemptions FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update redemptions"
  ON redemptions FOR UPDATE
  USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

-- Child achievements policies
CREATE POLICY "Children can view their achievements"
  ON child_achievements FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

-- ============================================
-- Initial Data: Achievements
-- ============================================
INSERT INTO achievements (id, name, description, icon, points_bonus, condition) VALUES
  ('first_task', '初出茅庐', '完成第一个口语任务', '🌱', 10, '{"type": "first_task"}'),
  ('streak_3', '三连胜', '连续完成3个任务', '🔥', 20, '{"type": "streak", "value": 3}'),
  ('streak_5', '五连胜', '连续完成5个任务', '⚡', 50, '{"type": "streak", "value": 5}'),
  ('streak_10', '十连绝世', '连续完成10个任务', '👑', 100, '{"type": "streak", "value": 10}'),
  ('points_100', '百分新手', '累计获得100积分', '💯', 20, '{"type": "total_points", "value": 100}'),
  ('points_500', '积分达人', '累计获得500积分', '🎖️', 50, '{"type": "total_points", "value": 500}'),
  ('points_1000', '积分王者', '累计获得1000积分', '🏆', 100, '{"type": "total_points", "value": 1000}'),
  ('perfect_10', '完美主义', '获得10次满分', '⭐', 30, '{"type": "perfect_score", "value": 10}'),
  ('tasks_50', '勤学苦练', '完成50个任务', '📚', 50, '{"type": "tasks_completed", "value": 50}'),
  ('tasks_100', '学习之星', '完成100个任务', '🌟', 100, '{"type": "tasks_completed", "value": 100}'),
  ('contest_5', '闯关新秀', '闯关模式到达第5关', '🎯', 30, '{"type": "contest_level", "value": 5}'),
  ('contest_10', '闯关高手', '闯关模式到达第10关', '🎪', 50, '{"type": "contest_level", "value": 10}'),
  ('contest_20', '闯关大师', '闯关模式到达第20关', '🏰', 100, '{"type": "contest_level", "value": 20}');

-- ============================================
-- Initial Data: Sample English Tasks
-- ============================================
INSERT INTO tasks (id, subject, difficulty, category, content, base_points) VALUES
  -- Level 1: Words
  ('eng_word_001', 'english', 1, 'word', '{"prompt": "apple", "expected_answers": ["apple", "Apple"], "emoji": "🍎", "hint": "红色的水果"}'::jsonb, 10),
  ('eng_word_002', 'english', 1, 'word', '{"prompt": "cat", "expected_answers": ["cat", "Cat"], "emoji": "🐱", "hint": "可爱的宠物"}'::jsonb, 10),
  ('eng_word_003', 'english', 1, 'word', '{"prompt": "dog", "expected_answers": ["dog", "Dog"], "emoji": "🐕", "hint": "人类最好的朋友"}'::jsonb, 10),
  ('eng_word_004', 'english', 1, 'word', '{"prompt": "book", "expected_answers": ["book", "Book"], "emoji": "📖", "hint": "用来阅读的"}'::jsonb, 10),
  ('eng_word_005', 'english', 1, 'word', '{"prompt": "sun", "expected_answers": ["sun", "Sun"], "emoji": "☀️", "hint": "天空中发光的"}'::jsonb, 10),

  -- Level 2: Phrases
  ('eng_phrase_001', 'english', 2, 'phrase', '{"prompt": "Good morning", "expected_answers": ["Good morning", "good morning"], "emoji": "🌅", "hint": "早上好"}'::jsonb, 15),
  ('eng_phrase_002', 'english', 2, 'phrase', '{"prompt": "Thank you", "expected_answers": ["Thank you", "thank you"], "emoji": "🙏", "hint": "表示感谢"}'::jsonb, 15),
  ('eng_phrase_003', 'english', 2, 'phrase', '{"prompt": "How are you", "expected_answers": ["How are you", "how are you"], "emoji": "👋", "hint": "问候别人"}'::jsonb, 15),
  ('eng_phrase_004', 'english', 2, 'phrase', '{"prompt": "Excuse me", "expected_answers": ["Excuse me", "excuse me"], "emoji": "🎯", "hint": "礼貌地引起注意"}'::jsonb, 15),
  ('eng_phrase_005', 'english', 2, 'phrase', '{"prompt": "See you later", "expected_answers": ["See you later", "see you later"], "emoji": "👋", "hint": "再见"}'::jsonb, 15),

  -- Level 3: Sentences
  ('eng_sent_001', 'english', 3, 'sentence', '{"prompt": "I like apples", "expected_answers": ["I like apples", "I like apples.", "I like apple"], "emoji": "🍎", "hint": "说我喜欢苹果"}'::jsonb, 20),
  ('eng_sent_002', 'english', 3, 'sentence', '{"prompt": "This is my book", "expected_answers": ["This is my book", "This is my book.", "this is my book"], "emoji": "📖", "hint": "这是我的书"}'::jsonb, 20),
  ('eng_sent_003', 'english', 3, 'sentence', '{"prompt": "The sky is blue", "expected_answers": ["The sky is blue", "The sky is blue.", "the sky is blue"], "emoji": "🌤️", "hint": "天空是蓝色的"}'::jsonb, 20),
  ('eng_sent_004', 'english', 3, 'sentence', '{"prompt": "I have a cat", "expected_answers": ["I have a cat", "I have a cat.", "i have a cat"], "emoji": "🐱", "hint": "我有一只猫"}'::jsonb, 20),
  ('eng_sent_005', 'english', 3, 'sentence', '{"prompt": "She is my friend", "expected_answers": ["She is my friend", "She is my friend.", "she is my friend"], "emoji": "👫", "hint": "她是我的朋友"}'::jsonb, 20),

  -- Level 4: Questions & Answers
  ('eng_qa_001', 'english', 4, 'question', '{"prompt": "What is your name?", "expected_answers": ["My name is", "I am", "I\'m"], "emoji": "🤔", "hint": "介绍你的名字"}'::jsonb, 25),
  ('eng_qa_002', 'english', 4, 'question', '{"prompt": "How old are you?", "expected_answers": ["I am", "I\'m"], "emoji": "🎂", "hint": "说你的年龄"}'::jsonb, 25),
  ('eng_qa_003', 'english', 4, 'question', '{"prompt": "What color do you like?", "expected_answers": ["I like", "I love"], "emoji": "🎨", "hint": "说你喜欢的颜色"}'::jsonb, 25),
  ('eng_qa_004', 'english', 4, 'question', '{"prompt": "What is this?", "expected_answers": ["This is", "It is", "It\'s"], "emoji": "❓", "hint": "这是什么"}'::jsonb, 25),
  ('eng_qa_005', 'english', 4, 'question', '{"prompt": "Where do you live?", "expected_answers": ["I live in", "I live at"], "emoji": "🏠", "hint": "说你住在哪里"}'::jsonb, 25),

  -- Level 5: Scenarios
  ('eng_scen_001', 'english', 5, 'scenario', '{"prompt": "Order food: Can I have a hamburger please?", "expected_answers": ["Can I have", "I want", "I would like"], "emoji": "🍔", "hint": "在餐厅点餐"}'::jsonb, 30),
  ('eng_scen_002', 'english', 5, 'scenario', '{"prompt": "Shopping: How much is this?", "expected_answers": ["How much is", "How much are", "What is the price"], "emoji": "🛒", "hint": "询问价格"}'::jsonb, 30),
  ('eng_scen_003', 'english', 5, 'scenario', '{"prompt": "School: May I go to the bathroom?", "expected_answers": ["May I go", "Can I go", "I need to go"], "emoji": "🏫", "hint": "在课堂上请求去洗手间"}'::jsonb, 30),
  ('eng_scen_004', 'english', 5, 'scenario', '{"prompt": "Greeting: Nice to meet you!", "expected_answers": ["Nice to meet you", "Nice meeting you"], "emoji": "🤝", "hint": "第一次见面时说"}'::jsonb, 30),
  ('eng_scen_005', 'english', 5, 'scenario', '{"prompt": "Apology: I am sorry for being late.", "expected_answers": ["I am sorry", "I\'m sorry", "Sorry for"], "emoji": "😅", "hint": "因为迟到而道歉"}'::jsonb, 30);

-- ============================================
-- Initial Data: Contest Tasks (Increasing Difficulty)
-- ============================================
INSERT INTO tasks (id, subject, difficulty, category, content, base_points) VALUES
  ('contest_01', 'english', 1, 'contest', '{"prompt": "hello", "expected_answers": ["hello", "Hello"], "emoji": "👋", "hint": "打招呼"}'::jsonb, 15),
  ('contest_02', 'english', 1, 'contest', '{"prompt": "yes", "expected_answers": ["yes", "Yes"], "emoji": "✅", "hint": "表示肯定"}'::jsonb, 15),
  ('contest_03', 'english', 1, 'contest', '{"prompt": "no", "expected_answers": ["no", "No"], "emoji": "❌", "hint": "表示否定"}'::jsonb, 15),
  ('contest_04', 'english', 1, 'contest', '{"prompt": "water", "expected_answers": ["water", "Water"], "emoji": "💧", "hint": "我们每天喝的"}'::jsonb, 15),
  ('contest_05', 'english', 2, 'contest', '{"prompt": "Good bye", "expected_answers": ["Good bye", "goodbye", "Goodbye"], "emoji": "👋", "hint": "再见"}'::jsonb, 18),
  ('contest_06', 'english', 2, 'contest', '{"prompt": "I am happy", "expected_answers": ["I am happy", "I\'m happy", "I\'m happy."], "emoji": "😊", "hint": "表达开心"}'::jsonb, 18),
  ('contest_07', 'english', 2, 'contest', '{"prompt": "It is red", "expected_answers": ["It is red", "it is red", "It\'s red"], "emoji": "🔴", "hint": "描述红色"}'::jsonb, 18),
  ('contest_08', 'english', 2, 'contest', '{"prompt": "Nice to meet you", "expected_answers": ["Nice to meet you", "nice to meet you"], "emoji": "🤝", "hint": "很高兴认识你"}'::jsonb, 18),
  ('contest_09', 'english', 3, 'contest', '{"prompt": "What is your favorite color?", "expected_answers": ["My favorite", "I like", "I love"], "emoji": "🌈", "hint": "回答喜欢的颜色"}'::jsonb, 22),
  ('contest_10', 'english', 3, 'contest', '{"prompt": "I can swim very well", "expected_answers": ["I can swim", "I can swim very well"], "emoji": "🏊", "hint": "说我擅长游泳"}'::jsonb, 22),
  ('contest_11', 'english', 3, 'contest', '{"prompt": "The weather is beautiful today", "expected_answers": ["The weather is", "weather is beautiful"], "emoji": "☀️", "hint": "描述好天气"}'::jsonb, 22),
  ('contest_12', 'english', 3, 'contest', '{"prompt": "What time is it now?", "expected_answers": ["It is", "It\'s"], "emoji": "⏰", "hint": "回答时间"}'::jsonb, 22),
  ('contest_13', 'english', 4, 'contest', '{"prompt": "Can you help me please?", "expected_answers": ["Sure", "Of course", "Yes I can"], "emoji": "🙋", "hint": "请求帮助"}'::jsonb, 27),
  ('contest_14', 'english', 4, 'contest', '{"prompt": "I would like to buy an ice cream", "expected_answers": ["I would like", "I want", "I\'d like"], "emoji": "🍦", "hint": "想买冰淇淋"}'::jsonb, 27),
  ('contest_15', 'english', 4, 'contest', '{"prompt": "How do you spell your name?", "expected_answers": ["My name is", "It is", "M-Y-N-A-M-E"], "emoji": "🔤", "hint": "拼写名字"}'::jsonb, 27),
  ('contest_16', 'english', 4, 'contest', '{"prompt": "Where is the library?", "expected_answers": ["It is", "Go straight", "Turn left"], "emoji": "📚", "hint": "问路"}'::jsonb, 27),
  ('contest_17', 'english', 5, 'contest', '{"prompt": "I usually wake up at seven in the morning", "expected_answers": ["wake up", "I wake up", "I usually"], "emoji": "⏰", "hint": "描述起床习惯"}'::jsonb, 33),
  ('contest_18', 'english', 5, 'contest', '{"prompt": "What did you do yesterday?", "expected_answers": ["I played", "I went", "I did"], "emoji": "📅", "hint": "回答昨天做了什么"}'::jsonb, 33),
  ('contest_19', 'english', 5, 'contest', '{"prompt": "If I were a bird, I would fly in the sky", "expected_answers": ["If I were", "I would fly", "were a bird"], "emoji": "🐦", "hint": "虚拟语气"}'::jsonb, 33),
  ('contest_20', 'english', 5, 'contest', '{"prompt": "I have always wanted to visit Disneyland", "expected_answers": ["wanted to visit", "want to visit", "dream of visiting"], "emoji": "🏰", "hint": "表达愿望"}'::jsonb, 33);
