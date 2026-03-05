-- 修复 child_profiles 表的 id 字段类型
-- 将 UUID 改为 TEXT，支持任意字符串ID

-- 1. 先删除外键约束
ALTER TABLE answer_history DROP CONSTRAINT IF EXISTS answer_history_child_id_fkey;

-- 2. 修改 id 列类型为 TEXT
ALTER TABLE child_profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- 3. 修改 child_id 列类型为 TEXT
ALTER TABLE answer_history ALTER COLUMN child_id TYPE TEXT USING child_id::TEXT;

-- 4. 重新创建外键约束
ALTER TABLE answer_history ADD CONSTRAINT answer_history_child_id_fkey
  FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE;

-- 完成
SELECT 'Table structure updated successfully!' as status;
