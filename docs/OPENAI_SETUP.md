# 大模型语音识别集成指南

## 概述

系统现已集成 OpenAI API 来实现：
1. **语音识别** - 使用 Whisper API 将录音转为文字
2. **智能判题** - 使用 GPT-4 评估发音并给出详细反馈
3. **动态出题** - 可根据孩子年级生成个性化题目

## 架构图

```
┌──────────────────────────────────────────────────────────────┐
│                       用户录音                                 │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  API 路由: /api/speech/evaluate                               │
│  ├─ Step 1: Whisper API → 语音转文字                          │
│  └─ Step 2: GPT-4 → 智能判题                                  │
└──────────────────────────┬───────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│  返回结果                                                     │
│  { transcript, score, passed, feedback, corrections, ... }    │
└──────────────────────────────────────────────────────────────┘
```

## 配置步骤

### 1. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账号
3. 进入 API Keys 页面: https://platform.openai.com/api-keys
4. 点击 "Create new secret key"
5. 复制生成的 API Key

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

然后在 `.env.local` 中填入你的 API Key:

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. 重启开发服务器

```bash
npm run dev
```

## API 详解

### 1. 语音识别和判题 API

**端点**: `POST /api/speech/evaluate`

**请求参数** (FormData):
- `audio`: 录音文件 (Blob/File)
- `taskPrompt`: 题目内容
- `expectedAnswers`: 期望答案数组 (JSON字符串)
- `taskType`: 题目类型
- `gradeLevel`: 年级

**响应示例**:
```json
{
  "success": true,
  "transcript": "apple",
  "evaluation": {
    "score": 95,
    "passed": true,
    "feedback": "发音非常准确！继续保持！",
    "corrections": [],
    "pronunciation": {
      "rating": "excellent",
      "details": ["元音发音饱满", "语调自然"]
    },
    "pointsEarned": 10
  }
}
```

### 2. 动态生成题目

```typescript
import { generateTask } from '@/lib/openai';

const tasks = await generateTask({
  gradeLevel: 3,
  semester: "下学期",
  difficulty: 2,
  type: "phrase",
  count: 5
});
```

### 3. Boss 战对话生成

```typescript
import { generateBossDialogue } from '@/lib/openai';

const dialogue = await generateBossDialogue(3, "下学期", 5);
```

## Hook 使用

### useSpeechWithOpenAI

```typescript
const {
  isRecording,      // 是否正在录音
  isProcessing,     // 是否正在处理
  transcript,       // 识别的文字
  score,            // 分数 (0-100)
  passed,           // 是否通过
  error,            // 错误信息
  warning,          // 警告信息
  recordingTime,    // 录音时长
  evaluation,       // AI详细评价
  startRecording,   // 开始录音
  stopRecording,    // 停止录音
  reset,            // 重置状态
  retry,            // 重试
} = useSpeechWithOpenAI({
  taskPrompt: "apple",
  expectedAnswers: ["apple", "Apple"],
  taskType: "单词",
  gradeLevel: 3,
  onResult: (result) => {
    console.log('得分:', result.score);
    console.log('反馈:', result.feedback);
  }
});
```

## 新增功能

### 1. AI 评价面板

完成练习后，会显示：
- 🤖 AI 老师的评语
- 发音评分 (优秀/良好/及格/需要改进)
- 详细改进建议
- 错误纠正示例

### 2. 音频播放按钮

题目旁边新增播放按钮 🔊，点击可以听标准发音。

### 3. 自动降级

如果 OpenAI API 不可用，系统会自动使用简单的字符串匹配作为降级方案。

## 成本估算

OpenAI API 定价 (2024年):

| API | 价格 |
|-----|------|
| Whisper | $0.006 / 分钟 |
| GPT-4o-mini | $0.15 / 1M 输入 tokens, $0.60 / 1M 输出 tokens |

**单次练习成本估算**:
- 语音识别: ~15秒 ≈ $0.0015
- 判题评估: ~500 tokens ≈ $0.0003
- **总计**: 每次练习约 $0.002 (约 ¥0.014)

**每月估算** (假设每天练习30次):
- 30次 × 30天 × $0.002 = **$1.8/月**

## 文件清单

新增/修改的文件:

```
src/
├── lib/
│   └── openai.ts                    # OpenAI API 集成
├── hooks/
│   └── useSpeechWithOpenAI.ts       # 新 Hook
├── app/
│   ├── api/
│   │   └── speech/
│   │       └── evaluate/
│   │           └── route.ts         # API 路由
│   └── child/
│       └── practice/
│           └── page.tsx             # 更新使用新 Hook
└── .env.example                     # 环境变量模板
```

## 故障排查

### 问题: "OpenAI API Key 未配置"

**解决**: 确保 `.env.local` 文件中有正确的 API Key，并重启服务器。

### 问题: 录音没有声音

**解决**:
1. 检查浏览器麦克风权限
2. 确保设备有可用的麦克风
3. 尝试使用 Chrome 浏览器

### 问题: API 调用失败

**解决**:
1. 检查 API Key 是否有效
2. 确认 OpenAI 账户有余额
3. 查看 Network 标签中的错误详情

## 国内替代方案

如果 OpenAI API 不可用，可以考虑：

1. **Azure OpenAI** - 微软提供的 OpenAI 服务，国内可访问
2. **通义千问** - 阿里云的大模型服务
3. **讯飞星火** - 科大讯飞的语音服务
4. **本地 Whisper** - 使用本地运行的 Whisper 模型

如需切换到其他服务，只需修改 `src/lib/openai.ts` 中的 API 调用部分。
