# 智谱 GLM-4 智能判题集成指南

## 概述

系统现已集成智谱 AI 的 GLM-4 模型进行智能判题，替代 OpenAI GPT-4。

### 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 语音识别 | FunASR (本地) | 离线运行，高精度 |
| 智能判题 | 智谱 GLM-4-Flash | 国内服务，快速响应 |
| 后端框架 | Next.js API Routes | 服务端集成 |

## 配置步骤

### 1. 获取智谱 API Key

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册或登录账号
3. 进入 API Keys 页面: https://open.bigmodel.cn/usercenter/apikeys
4. 点击 "新建 API Key"
5. 复制生成的 API Key（格式：`id.secret`）

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入你的 API Key：

```env
# 智谱 AI GLM-4 配置
NEXT_PUBLIC_ZHIPU_API_KEY=8576ec70a1aa447c8a7b8e38c7ab1ce3.UE6eqvSEnm7ZhO17
```

### 3. 重启开发服务器

```bash
npm run dev
```

## API 使用

### 智能判题

```typescript
import { evaluateSpeechWithGLM } from '@/lib/zhipu';

const result = await evaluateSpeechWithGLM({
  taskPrompt: "apple",
  expectedAnswers: ["apple", "Apple"],
  userTranscript: "apple",
  taskType: "单词",
  gradeLevel: 3,
});

console.log(result.score);      // 0-100 分数
console.log(result.passed);     // 是否通过
console.log(result.feedback);   // 详细反馈
```

### 生成题目

```typescript
import { generateTaskWithGLM } from '@/lib/zhipu';

const tasks = await generateTaskWithGLM({
  gradeLevel: 3,
  semester: "下学期",
  difficulty: 2,
  type: "phrase",
  count: 5,
});
```

### Boss 战对话

```typescript
import { generateBossDialogueWithGLM } from '@/lib/zhipu';

const dialogue = await generateBossDialogueWithGLM(3, "下学期", 5);
```

## 模型对比

| 特性 | 智谱 GLM-4-Flash | OpenAI GPT-4 |
|------|-------------------|--------------|
| 响应速度 | 🚀 快 | 较慢 |
| 国内访问 | ✅ 无需代理 | ❌ 需要代理 |
| 定价 | ¥0.1/1M tokens | $0.15/1M tokens |
| 中文支持 | 🇨🇳 优秀 | 良好 |
| JSON 模式 | ✅ 支持 | ✅ 支持 |

## 成本估算

智谱 GLM-4-Flash 定价：

- 输入: ¥0.1 / 1M tokens
- 输出: ¥0.1 / 1M tokens

**单次判题成本估算**:
- 输入: ~500 tokens ≈ ¥0.00005
- 输出: ~500 tokens ≈ ¥0.00005
- **总计**: 每次判题约 ¥0.0001

**每月估算** (假设每天练习30次):
- 30次 × 30天 × ¥0.0001 = **¥0.09/月**

几乎可以忽略不计！

## 文件清单

新增/修改的文件:

```
src/
├── lib/
│   └── zhipu.ts                     # 智谱 API 集成
├── app/
│   └── api/
│       └── speech/
│           └── evaluate/
│               └── route.ts         # 更新使用智谱
└── hooks/
    └── useSpeechWithOpenAI.ts      # 更新类型定义
```

## 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端录音                               │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js API (/api/speech/evaluate)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Step 1: 本地 FunASR → 语音转文字                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Step 2: 智谱 GLM-4 → 智能判题                          │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      返回评价结果                              │
│  { score, passed, feedback, corrections, ... }             │
└─────────────────────────────────────────────────────────────┘
```

## 故障排查

### 问题: "智谱 API Key 未配置"

**解决**: 确保 `.env.local` 文件中有正确的 API Key

```env
NEXT_PUBLIC_ZHIPU_API_KEY=your_id.your_secret
```

### 问题: API 调用失败

**解决**: 检查 API Key 格式是否正确，应为 `id.secret` 格式

### 问题: 评价结果不准确

**解决**:
1. 确保语音识别准确（FunASR 服务正常运行）
2. 调整提示词模板（在 `src/lib/zhipu.ts` 中）

### 问题: 响应速度慢

**解决**:
1. GLM-4-Flash 已是快速模型
2. 检查网络连接
3. 考虑使用本地规则匹配作为降级方案

## 降级方案

如果智谱 API 不可用，系统会自动降级到本地规则匹配：

```typescript
// 自动降级逻辑
if (useAI && process.env.NEXT_PUBLIC_ZHIPU_API_KEY) {
  evaluation = await evaluateSpeechWithGLM(...);
} else {
  // 使用规则匹配
  evaluation = calculateScore(...);
}
```

## 更多资源

- [智谱 AI 开放平台](https://open.bigmodel.cn/)
- [GLM-4 API 文档](https://open.bigmodel.cn/dev/api)
- [定价说明](https://open.bigmodel.cn/pricing)
