/**
 * 智谱 AI GLM-4 集成
 * 用于智能判题和生成口语练习题目
 */

// 智谱 API 配置
const ZHIPU_API_KEY = process.env.NEXT_PUBLIC_ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/";

/**
 * 智谱 GLM 智能判题
 */
export interface GLMEvaluationRequest {
  taskPrompt: string; // 题目
  expectedAnswers: string[]; // 期望答案
  userTranscript: string; // 用户说的内容
  taskType: string; // 题目类型
  gradeLevel: number; // 年级
}

export interface GLMEvaluationResult {
  score: number; // 0-100 分数
  passed: boolean; // 是否通过
  feedback: string; // 详细反馈
  corrections: {
    original: string; // 用户说的
    correct: string; // 正确说法
    explanation: string; // 解释
  }[];
  pronunciation: {
    rating: "excellent" | "good" | "fair" | "needs_improvement";
    details: string[];
  };
  pointsEarned: number; // 建议积分
}

/**
 * 生成 JWT Token（智谱 API 需要）
 */
async function generateToken(apiKey: string): Promise<string> {
  try {
    // 智谱 API key 格式: id.secret
    const [id, secret] = apiKey.split(".");

    if (!id || !secret) {
      throw new Error("无效的 API Key 格式");
    }

    // 简单实现：直接使用 API key（智谱新版 SDK 支持）
    return apiKey;
  } catch (error) {
    console.error("生成 Token 失败:", error);
    throw error;
  }
}

/**
 * 调用智谱 GLM-4 进行智能判题
 */
export async function evaluateSpeechWithGLM(
  request: GLMEvaluationRequest
): Promise<GLMEvaluationResult> {
  if (!ZHIPU_API_KEY) {
    throw new Error("智谱 API Key 未配置，请在 .env.local 中设置 NEXT_PUBLIC_ZHIPU_API_KEY");
  }

  const systemPrompt = `你是一个专业的小学英语口语评测助手。请根据学生的回答给出公正的评价和建设性的反馈。

评价标准：
1. 准确性：发音是否准确，语法是否正确
2. 完整性：是否完整说出内容
3. 流利度：表达是否流畅自然

评分标准：
- 90-100分：优秀，发音准确，表达流畅
- 75-89分：良好，基本正确，有小瑕疵
- 60-74分：及格，意思表达清楚，但有明显错误
- 60分以下：需要改进

请返回JSON格式，包含以下字段：
- score: 0-100的分数
- passed: boolean，是否通过（60分以上）
- feedback: 给学生的鼓励性评语（中文，适合小学生）
- corrections: 需要纠正的地方数组，每个包含 original, correct, explanation
- pronunciation: 发音评价，包含 rating (excellent/good/fair/needs_improvement) 和 details
- pointsEarned: 建议的积分（基础10分 × 难度系数，练习模式为0）

注意：评语要积极鼓励，适合小学生。`;

  const userPrompt = `请评价以下口语回答：

题目：${request.taskPrompt}
类型：${request.taskType}
期望答案：${request.expectedAnswers.join(", ")}
学生回答：${request.userTranscript}
年级：${request.gradeLevel}年级

请给出评分和反馈。`;

  try {
    const response = await fetch(`${ZHIPU_API_URL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash", // 使用 GLM-4-Flash (快速且经济)
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `智谱 API 错误: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("智谱 API 返回数据格式错误");
    }

    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return parsed as GLMEvaluationResult;
    } catch (parseError) {
      console.error("解析 AI 返回结果失败:", content);
      throw new Error("解析 AI 评价结果失败");
    }
  } catch (error: any) {
    console.error("智谱 GLM 判题错误:", error);
    throw error;
  }
}

/**
 * 使用智谱 GLM 生成口语练习题目
 */
export interface GLMTaskGenerationOptions {
  gradeLevel: number; // 1-6 年级
  semester: "上学期" | "下学期";
  difficulty: number; // 1-5 难度级别
  type: "word" | "phrase" | "sentence" | "question" | "scenario";
  count?: number; // 生成题目数量，默认 1
}

export interface GLMGeneratedTask {
  id: string;
  prompt: string;
  type: string;
  expectedAnswers: string[];
  emoji: string;
  hint: string;
  difficulty: number;
  explanation?: string;
}

export async function generateTaskWithGLM(
  options: GLMTaskGenerationOptions
): Promise<GLMGeneratedTask[]> {
  if (!ZHIPU_API_KEY) {
    throw new Error("智谱 API Key 未配置");
  }

  const typeNames = {
    word: "单词跟读",
    phrase: "短语跟读",
    sentence: "句子跟读",
    question: "问答对话",
    scenario: "情景对话",
  };

  const systemPrompt = `你是一个小学英语口语练习题目的生成助手。请根据要求生成适合的英语口语练习题目。

要求：
1. 题目要符合${options.gradeLevel}年级${options.semester}的英语水平
2. 难度级别为 ${options.difficulty}/5
3. 题目类型为：${typeNames[options.type]}
4. 输出JSON格式，包含以下字段：
   - tasks: 题目数组，每个题目包含：
     - id: 题目唯一标识
     - prompt: 题目内容（英语）
     - type: 题目类型
     - expectedAnswers: 期望的答案数组（可包含变体）
     - emoji: 相关的emoji表情
     - hint: 中文提示
     - explanation: 题目解析（可选）

难度参考：
- Level 1: 简单的基础词汇（如 apple, cat, dog）
- Level 2: 常用短语（如 Good morning, Thank you）
- Level 3: 简单句子（如 I like apples, This is my book）
- Level 4: 问答对话（如 What is your name? How are you?）
- Level 5: 情景对话（如购物、学校场景中的对话）

请返回 ${options.count || 1} 个题目，以JSON格式返回。`;

  try {
    const response = await fetch(`${ZHIPU_API_URL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `请生成${options.count || 1}个适合${options.gradeLevel}年级${options.semester}学生的${typeNames[options.type]}题目，难度${options.difficulty}。`,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`智谱 API 错误: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return parsed.tasks || [];
    } catch (e) {
      throw new Error("解析AI生成的题目失败");
    }
  } catch (error: any) {
    console.error("智谱 GLM 出题错误:", error);
    throw error;
  }
}

/**
 * Boss 战对话生成（使用智谱 GLM）
 */
export interface GLMBossDialogue {
  level: number;
  bossName: string;
  bossEmoji: string;
  scenario: string;
  dialogue: {
    role: "boss" | "player";
    text: string;
    expectedResponse?: string[];
  }[];
  rewards: {
    points: number;
    badge?: string;
  };
}

export async function generateBossDialogueWithGLM(
  gradeLevel: number,
  semester: "上学期" | "下学期",
  level: number
): Promise<GLMBossDialogue> {
  if (!ZHIPU_API_KEY) {
    throw new Error("智谱 API Key 未配置");
  }

  const bossLevels = {
    5: { name: "水果店老板", emoji: "👨‍🍼", rewards: 100 },
    10: { name: "学校老师", emoji: "👩‍🏫", rewards: 250 },
    15: { name: "图书管理员", emoji: "👵", rewards: 500 },
    20: { name: "英语龙", emoji: "🐉", rewards: 1000 },
  };

  const bossInfo = bossLevels[level as keyof typeof bossLevels] || bossLevels[5];

  const systemPrompt = `你是一个小学英语口语游戏的Boss战对话设计助手。

请设计一个有趣的英语对话挑战，让${gradeLevel}年级${semester}的学生与Boss进行对话。

要求：
1. 对话要自然有趣，符合学生水平
2. 包含3-5轮对话
3. Boss先说话，然后学生回应
4. 返回JSON格式，包含：
   - level: Boss关卡数
   - bossName: Boss名称
   - bossEmoji: Boss表情
   - scenario: 场景描述
   - dialogue: 对话数组，每个包含 role (boss/player), text, expectedResponse (仅player需要)
   - rewards: 奖励信息

注意：这是第${level}关的Boss战，奖励${bossInfo.rewards}积分。`;

  try {
    const response = await fetch(`${ZHIPU_API_URL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `请设计第${level}关的Boss战对话，Boss是${bossInfo.name}。`,
          },
        ],
        temperature: 0.9,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`智谱 API 错误: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return {
        ...parsed,
        rewards: {
          points: bossInfo.rewards,
        },
      };
    } catch (e) {
      throw new Error("解析Boss对话失败");
    }
  } catch (error: any) {
    console.error("智谱 GLM Boss对话生成错误:", error);
    throw error;
  }
}
