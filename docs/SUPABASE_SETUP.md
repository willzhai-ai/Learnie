# Supabase 集成设置指南

本项目已集成 Supabase 作为后端数据库，实现数据持久化和跨设备同步。

## 功能特性

- ✅ 自动同步孩子数据（积分、等级、答题历史）
- ✅ 云端存储答题记录
- ✅ 跨设备访问（手机、平板、电脑）
- ✅ 离线支持（localStorage 本地缓存）
- ✅ 自动同步（无需手动操作）

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 选择区域（推荐选择距离较近的区域）
5. 设置密码（请保存好密码）
6. 等待项目创建完成（约 2 分钟）

### 2. 获取 API 密钥

1. 进入项目 Dashboard
2. 点击左侧 "Settings" → "API"
3. 复制以下信息：
   - **Project URL**（类似 `https://xxxxx.supabase.co`）
   - **anon public** key（公开密钥）

### 3. 配置环境变量

在 `.env.local` 文件中添加：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. 运行数据库迁移

在 Supabase Dashboard 中：

1. 点击左侧 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
4. 粘贴到编辑器
5. 点击 "Run" 执行

然后执行第二个迁移文件：

6. 再次点击 "New Query"
7. 复制 `supabase/migrations/002_add_child_progress_fields.sql` 的内容
8. 粘贴到编辑器
9. 点击 "Run" 执行

### 5. 启用 Row Level Security (RLS)

数据库迁移已自动配置 RLS 策略，确保数据安全：
- 家长只能访问自己孩子的数据
- 孩子只能查看自己的答题记录
- 所有操作都需要身份验证

## 数据同步说明

### 自动同步时机

以下操作会自动同步到 Supabase：

| 操作 | 同步内容 |
|------|----------|
| 添加孩子 | 孩子基本信息 |
| 完成练习 | 答题历史、分数 |
| 获得积分 | 当前积分、总积分 |
| 连胜/重置 | 连胜记录 |
| 闯关模式 | 最高关卡 |

### 手动同步

```typescript
// 从 Supabase 拉取最新数据
useGameStore.getState().syncFromSupabase();

// 上传本地数据到 Supabase
useGameStore.getState().syncToSupabase();

// 关闭自动同步
useGameStore.getState().setSyncEnabled(false);
```

### 离线支持

- 数据优先保存在 localStorage
- 有网络时自动同步到 Supabase
- 离线时数据不会丢失

## 数据表结构

### child_profiles（孩子档案）
- `id`: UUID 主键
- `parent_id`: 家长 UUID
- `name`: 孩子姓名
- `grade_level`: 年级 (1-6)
- `semester`: 学期（上学期/下学期）
- `current_points`: 当前积分
- `total_points_earned`: 累计获得积分
- `current_level`: 当前等级
- `answer_history`: 答题历史 (JSONB)
- `current_streak`: 当前连胜
- `best_streak`: 最佳连胜

### answer_history（答题记录）
- `id`: UUID 主键
- `child_id`: 孩子 UUID
- `question`: 题目内容
- `transcript`: 孩子回答
- `score`: 分数 (0-100)
- `passed`: 是否通过
- `difficulty`: 难度 (1-5)
- `category`: 类型 (word/phrase/sentence/question/scenario)
- `points_earned`: 获得积分
- `created_at`: 答题时间

## 常见问题

### Q: 数据没有同步？

**A:** 检查以下几点：
1. 确认 `.env.local` 中的 Supabase 配置正确
2. 打开浏览器控制台查看错误信息
3. 确认 Supabase 项目状态正常
4. 确认已运行数据库迁移

### Q: 如何查看 Supabase 中的数据？

**A:**
1. 进入 Supabase Dashboard
2. 点击左侧 "Table Editor"
3. 选择对应的表查看数据

### Q: 如何重置数据？

**A:**
```typescript
// 清除本地数据
localStorage.removeItem('english-game-storage');
location.reload();

// 或清除 Supabase 数据（在 SQL Editor 中执行）
DELETE FROM child_profiles WHERE parent_id = 'your-parent-id';
```

### Q: 多个家长可以使用同一个 Supabase 项目吗？

**A:** 可以！每个家长有独立的 `parent_id`，数据完全隔离。

### Q: 数据安全吗？

**A:** 是的，Supabase 使用 Row Level Security (RLS) 确保数据隔离：
- 家长只能访问自己的数据
- 使用 `anon key` 不会暴露其他用户数据
- 生产环境建议启用额外的认证层

## 进阶功能

### 获取统计信息

```typescript
import { getChildStats } from '@/lib/dataSync';

const stats = await getChildStats(childId);
console.log(stats);
// {
//   totalAttempts: 100,
//   passedAttempts: 85,
//   passRate: "85.0",
//   avgScore: "78.5",
//   difficultyStats: { ... }
// }
```

### 备份和恢复

```typescript
// 导出所有孩子数据
const children = useGameStore.getState().children;
const json = JSON.stringify(children, null, 2);

// 下载为文件
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `backup-${new Date().toISOString()}.json`;
a.click();
```

## 生产环境部署

1. **环境变量**：在生产环境中设置真实的 Supabase URL 和密钥
2. **RLS 策略**：确保所有表都启用了 RLS
3. **认证**：建议使用 Supabase Auth 实现完整的用户认证
4. **备份**：定期备份 Supabase 数据库

## 支持

如有问题，请查阅：
- [Supabase 官方文档](https://supabase.com/docs)
- [项目 GitHub Issues](https://github.com/your-repo/issues)
