# Learnie 开发进度记录

## 最后更新时间
2026-03-05

## 当前开发状态

### 已完成功能

#### 1. 核心功能
- ✅ 孩子登录/注册系统（PIN 码）
- ✅ 家长注册/登录系统
- ✅ 练习模式（英语口语）
- ✅ 爬塔模式（带排行榜）
- ✅ 闯关模式
- ✅ 成就系统（基础）
- ✅ 积分系统
- ✅ 奖品兑换系统
- ✅ Supabase 数据集成

#### 2. 最近优化 (2026-03-05)
- ✅ 练习模式 UX 优化
  - 修复自动跳转问题
  - 修复题目计数错误
  - 优化返回按钮 UI
- ✅ 智能题库系统
  - 修复只查询 difficulty=1 的问题
  - 客户端过滤题目
- ✅ 数据同步函数完善
- ✅ 公共题目池查询修复（移除 order("RANDOM()")）
- ✅ 产品品牌更新（英语冒险岛 → Learnie）

### 待办事项

#### 高优先级
1. **智能题库调试**
   - 答题历史记录到 Supabase 的验证
   - 确认 LLM 只在必要时调用
   - 测试完整的题目完成流程

2. **成就系统**
   - 自动检测功能
   - 成就徽章展示

3. **家长审批流程**
   - 奖品兑换需要家长审批
   - 审批通知系统

#### 中优先级
1. **数学乐园模块**
   - 题目生成
   - 口算练习
   - 逻辑思维

2. **语文天地模块**
   - 拼音练习
   - 识字训练
   - 阅读理解

3. **数据分析**
   - 周/月报告
   - 发音准确度追踪
   - 学习趋势可视化

#### 低优先级
1. **平台优化**
   - iPad Safari 支持
   - PWA 支持
   - 暗黑模式
   - 多语言界面

## 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand (with persist)
- **动画**: Framer Motion
- **语音识别**: Web Speech API
- **AI 评估**: OpenAI / Zhipu AI
- **数据库**: Supabase (PostgreSQL)
- **部署**: Vercel

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建
npm run build

# 代码检查
npm run lint
```

## 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 可选：AI 语音评估
OPENAI_API_KEY=your-openai-api-key
ZHIPU_API_KEY=your-zhipu-api-key
```

## 数据库迁移

需要在 Supabase SQL Editor 中执行以下迁移（按顺序）：

1. `supabase/migrations/001_initial_schema.sql` - 核心架构
2. `supabase/migrations/002_tower_mode.sql` - 爬塔模式
3. `supabase/migrations/003_answer_history.sql` - 答题历史

或使用 `supabase/quick_setup.sql` 一次性设置。

## GitHub 仓库

- **仓库地址**: https://github.com/willzhai-ai/Learnie
- **分支**: main

## 已知问题

1. **智能题库 LLM 调用优化**
   - 状态：代码已优化，需要实际测试验证
   - 问题：可能在不必要时仍调用 LLM
   - 调试端点：`/api/questions/debug-answer-history?childId=xxx&difficulty=1`

2. **iPad Safari 语音识别**
   - Web Speech API 在 iPad Safari 上支持有限
   - 需要考虑替代方案

## 下次开发计划

1. 测试智能题库是否正确记录答题历史
2. 验证 LLM 只在所有题目完成后才调用
3. 实现成就自动检测系统
4. 添加家长审批流程

## 项目结构

```
src/
├── app/
│   ├── child/           # 孩子界面
│   │   ├── world/       # 学科选择
│   │   ├── english/     # 英语冒险岛
│   │   ├── practice/    # 练习模式
│   │   ├── contest/     # 闯关模式
│   │   ├── tower/       # 爬塔模式
│   │   └── login/       # PIN 码登录
│   ├── parent/          # 家长后台
│   │   ├── dashboard/   # 数据看板
│   │   ├── prizes/      # 奖品管理
│   │   └── login/       # 家长登录
│   ├── api/             # API 路由
│   │   ├── questions/   # 题目相关
│   │   ├── speech/      # 语音评估
│   │   └── tower/       # 爬塔模式
│   └── page.tsx         # 首页
├── components/          # UI 组件
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具库
├── stores/              # Zustand 状态管理
└── types/               # TypeScript 类型
```

## 备注

- 产品已从 "英语冒险岛" 更名为 "Learnie"
- 定位为多学科智能学习平台（英语、数学、语文）
- 当前只有英语模块可用
- 目标用户：小学生（1-6年级）
