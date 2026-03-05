/**
 * 题目生成器 - 调用智谱 GLM 生成个性化题库
 */

const ZHIPU_API_KEY = process.env.NEXT_PUBLIC_ZHIPU_API_KEY || "";
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/";

// 题目类型定义
export interface GeneratedQuestion {
  id: string;
  prompt: string;
  expectedAnswers: string[];
  emoji: string;
  hint: string;
  difficulty: number; // 1-5
  category: "word" | "phrase" | "sentence" | "question" | "scenario";
  gradeLevel: number; // 1-6
  focusArea?: string; // 针对的薄弱环节
}

export interface GenerateQuestionsRequest {
  gradeLevel: number;
  semester: "上学期" | "下学期";
  weakAreas?: string[]; // 薄弱环节
  wrongQuestions?: string[]; // 错题记录
  count: number;
  difficulty?: number; // 1-5，不指定则自动判断
  category?: "word" | "phrase" | "sentence" | "question" | "scenario";
}

export interface QuestionSeed {
  id: string;
  generatedAt: string;
  gradeLevel: number;
  semester: string;
  questions: GeneratedQuestion[];
  expiresAt: string; // 种子过期时间
}

// 分析用户薄弱环节
export function analyzeWeakAreas(
  history: Array<{ question: string; passed: boolean; score: number }>
): string[] {
  const weakAreas: string[] = [];

  // 统计各类题型的通过率
  const categoryStats: Record<string, { total: number; passed: number }> = {};

  history.forEach((record) => {
    const category = getCategoryFromPrompt(record.question);
    if (!categoryStats[category]) {
      categoryStats[category] = { total: 0, passed: 0 };
    }
    categoryStats[category].total++;
    if (record.passed) {
      categoryStats[category].passed++;
    }
  });

  // 找出通过率低于 60% 的类型
  Object.entries(categoryStats).forEach(([category, stats]) => {
    const passRate = stats.passed / stats.total;
    if (passRate < 0.6 && stats.total >= 3) {
      weakAreas.push(category);
    }
  });

  return weakAreas;
}

function getCategoryFromPrompt(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  // 单词
  if (/^[a-z]{3,10}$/.test(prompt.trim())) {
    return "单词认读";
  }

  // 短语
  if (/\s+(good morning|thank you|how are you|nice to meet|see you|good night|excuse me)/i.test(prompt)) {
    return "日常问候语";
  }

  // 句子
  if (/\s+i (like|have|want|am)\s/i.test(prompt)) {
    return "基础句型";
  }

  // 问答
  if (/\?/.test(prompt)) {
    return "问答句型";
  }

  return "综合表达";
}

// 生成题库种子
export async function generateQuestionSeed(request: GenerateQuestionsRequest): Promise<QuestionSeed> {
  const {
    gradeLevel,
    semester,
    weakAreas = [],
    wrongQuestions = [],
    count,
    difficulty,
    category,
  } = request;

  // 构建提示词
  const systemPrompt = `你是一个专业的小学英语题目生成助手。请根据学生的学龄和学习情况，生成个性化的英语口语练习题目。

要求：
1. 题目要符合小学${gradeLevel}年级${semester}的英语水平
2. 每道题包含：题目内容(prompt)、标准答案数组(expectedAnswers)、emoji图标、提示(hint)
3. 答案要考虑多种可能的表达方式
4. 难度要适中，循序渐进`;

  let userPrompt = `请生成 ${count} 道英语口语练习题目。\n\n`;

  if (difficulty) {
    userPrompt += `难度等级：${difficulty}/5\n`;
  }

  if (category) {
    const categoryNames = {
      word: "单词",
      phrase: "短语",
      sentence: "句子",
      question: "问答",
      scenario: "情景对话",
    };
    userPrompt += `题目类型：${categoryNames[category]}\n`;
  }

  if (weakAreas.length > 0) {
    userPrompt += `\n学生薄弱环节：${weakAreas.join("、")}。请重点针对这些方面设计练习题目。\n`;
  }

  if (wrongQuestions.length > 0) {
    userPrompt += `\n学生曾经做错的题目：\n${wrongQuestions.join("\n")}\n请生成类似但稍有变化的题目，帮助学生巩固。\n`;
  }

  userPrompt += `\n请以 JSON 格式返回，格式如下：
[
  {
    "prompt": "题目内容",
    "expectedAnswers": ["答案1", "答案2"],
    "emoji": "相关emoji",
    "hint": "中文提示",
    "difficulty": 1-5,
    "category": "word/phrase/sentence/question/scenario"
  }
]`;

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error("生成题库失败");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    let questions: GeneratedQuestion[] = [];

    if (Array.isArray(parsed.questions)) {
      questions = parsed.questions.map((q: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        prompt: q.prompt,
        expectedAnswers: q.expectedAnswers || [q.prompt],
        emoji: q.emoji || "📝",
        hint: q.hint || "",
        difficulty: q.difficulty || difficulty || 1,
        category: q.category || category || "word",
        gradeLevel,
        focusArea: weakAreas[0],
      }));
    } else if (Array.isArray(parsed)) {
      questions = parsed.map((q: any, index: number) => ({
        id: `gen-${Date.now()}-${index}`,
        prompt: q.prompt,
        expectedAnswers: q.expectedAnswers || [q.prompt],
        emoji: q.emoji || "📝",
        hint: q.hint || "",
        difficulty: q.difficulty || difficulty || 1,
        category: q.category || category || "word",
        gradeLevel,
        focusArea: weakAreas[0],
      }));
    }

    // 创建题库种子
    const seed: QuestionSeed = {
      id: `seed-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      gradeLevel,
      semester,
      questions,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
    };

    return seed;
  } catch (error) {
    console.error("生成题库失败:", error);
    throw error;
  }
}

// 从种子中获取题目（可以添加一些随机性）
export function getQuestionsFromSeed(
  seed: QuestionSeed,
  count: number,
  shuffle: boolean = true
): GeneratedQuestion[] {
  let questions = [...seed.questions];

  if (shuffle) {
    // Fisher-Yates 洗牌算法
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
  }

  return questions.slice(0, Math.min(count, questions.length));
}

// 检查种子是否过期
export function isSeedExpired(seed: QuestionSeed): boolean {
  return new Date(seed.expiresAt) < new Date();
}

// 获取默认种子（当没有生成种子时使用）
export function getDefaultSeed(gradeLevel: number, semester: string): QuestionSeed {
  return {
    id: `default-${gradeLevel}-${semester}`,
    generatedAt: new Date().toISOString(),
    gradeLevel,
    semester,
    questions: getDefaultQuestions(gradeLevel),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天过期
  };
}

function getDefaultQuestions(gradeLevel: number): GeneratedQuestion[] {
  // 根据年级返回默认题目（每个难度至少有2道题）
  const defaultQuestions: Record<number, GeneratedQuestion[]> = {
    1: [
      // Level 1: 单词
      { id: "1-w1", prompt: "apple", expectedAnswers: ["apple"], emoji: "🍎", hint: "红色的水果", difficulty: 1, category: "word", gradeLevel: 1 },
      { id: "1-w2", prompt: "cat", expectedAnswers: ["cat"], emoji: "🐱", hint: "可爱的宠物", difficulty: 1, category: "word", gradeLevel: 1 },
      { id: "1-w3", prompt: "dog", expectedAnswers: ["dog"], emoji: "🐕", hint: "忠诚的朋友", difficulty: 1, category: "word", gradeLevel: 1 },
      { id: "1-w4", prompt: "red", expectedAnswers: ["red"], emoji: "🔴", hint: "红色的颜色", difficulty: 1, category: "word", gradeLevel: 1 },
      // Level 2: 短语
      { id: "1-p1", prompt: "Good morning", expectedAnswers: ["Good morning"], emoji: "🌅", hint: "早上好", difficulty: 2, category: "phrase", gradeLevel: 1 },
      { id: "1-p2", prompt: "Thank you", expectedAnswers: ["Thank you"], emoji: "🙏", hint: "谢谢你", difficulty: 2, category: "phrase", gradeLevel: 1 },
      { id: "1-p3", prompt: "Hello", expectedAnswers: ["Hello"], emoji: "👋", hint: "你好", difficulty: 2, category: "phrase", gradeLevel: 1 },
      // Level 3: 句子
      { id: "1-s1", prompt: "I am happy", expectedAnswers: ["I am happy"], emoji: "😊", hint: "我很开心", difficulty: 3, category: "sentence", gradeLevel: 1 },
      { id: "1-s2", prompt: "It is a cat", expectedAnswers: ["It is a cat"], emoji: "🐱", hint: "这是一只猫", difficulty: 3, category: "sentence", gradeLevel: 1 },
      // Level 4: 问答
      { id: "1-q1", prompt: "How are you?", expectedAnswers: ["I am fine", "I am good"], emoji: "😊", hint: "回答你好吗", difficulty: 4, category: "question", gradeLevel: 1 },
      { id: "1-q2", prompt: "What is this?", expectedAnswers: ["It is a", "This is a"], emoji: "🤔", hint: "这是什么", difficulty: 4, category: "question", gradeLevel: 1 },
      // Level 5: 情景
      { id: "1-sc1", prompt: "See you tomorrow", expectedAnswers: ["See you"], emoji: "👋", hint: "明天见", difficulty: 5, category: "scenario", gradeLevel: 1 },
      { id: "1-sc2", prompt: "Goodbye teacher", expectedAnswers: ["Goodbye"], emoji: "👩‍🏫", hint: "和老师说再见", difficulty: 5, category: "scenario", gradeLevel: 1 },
    ],
    2: [
      // Level 1: 单词
      { id: "2-w1", prompt: "banana", expectedAnswers: ["banana"], emoji: "🍌", hint: "黄色水果", difficulty: 1, category: "word", gradeLevel: 2 },
      { id: "2-w2", prompt: "book", expectedAnswers: ["book"], emoji: "📖", hint: "读书用的", difficulty: 1, category: "word", gradeLevel: 2 },
      { id: "2-w3", prompt: "pencil", expectedAnswers: ["pencil"], emoji: "✏️", hint: "写字用的", difficulty: 1, category: "word", gradeLevel: 2 },
      { id: "2-w4", prompt: "blue", expectedAnswers: ["blue"], emoji: "🔵", hint: "蓝色的颜色", difficulty: 1, category: "word", gradeLevel: 2 },
      // Level 2: 短语
      { id: "2-p1", prompt: "Good night", expectedAnswers: ["Good night"], emoji: "🌙", hint: "晚安", difficulty: 2, category: "phrase", gradeLevel: 2 },
      { id: "2-p2", prompt: "Nice to meet you", expectedAnswers: ["Nice to meet you"], emoji: "🤝", hint: "很高兴认识你", difficulty: 2, category: "phrase", gradeLevel: 2 },
      { id: "2-p3", prompt: "Excuse me", expectedAnswers: ["Excuse me"], emoji: "🙋", hint: "打扰一下", difficulty: 2, category: "phrase", gradeLevel: 2 },
      // Level 3: 句子
      { id: "2-s1", prompt: "I like apples", expectedAnswers: ["I like apples"], emoji: "🍎", hint: "说我喜欢苹果", difficulty: 3, category: "sentence", gradeLevel: 2 },
      { id: "2-s2", prompt: "This is my pen", expectedAnswers: ["This is my pen"], emoji: "✏️", hint: "这是我的钢笔", difficulty: 3, category: "sentence", gradeLevel: 2 },
      // Level 4: 问答
      { id: "2-q1", prompt: "What color is it?", expectedAnswers: ["It is red", "It is blue"], emoji: "🎨", hint: "问颜色", difficulty: 4, category: "question", gradeLevel: 2 },
      { id: "2-q2", prompt: "Do you like cats?", expectedAnswers: ["Yes I do", "No I don't"], emoji: "🐱", hint: "问喜欢什么", difficulty: 4, category: "question", gradeLevel: 2 },
      // Level 5: 情景
      { id: "2-sc1", prompt: "Can I go to the bathroom?", expectedAnswers: ["Can I go"], emoji: "🚻", hint: "请求去洗手间", difficulty: 5, category: "scenario", gradeLevel: 2 },
      { id: "2-sc2", prompt: "Here you are", expectedAnswers: ["Here you are"], emoji: "🤲", hint: "给别人东西", difficulty: 5, category: "scenario", gradeLevel: 2 },
    ],
    3: [
      // Level 1: 单词
      { id: "3-w1", prompt: "elephant", expectedAnswers: ["elephant"], emoji: "🐘", hint: "大型动物", difficulty: 1, category: "word", gradeLevel: 3 },
      { id: "3-w2", prompt: "computer", expectedAnswers: ["computer"], emoji: "💻", hint: "电子设备", difficulty: 1, category: "word", gradeLevel: 3 },
      { id: "3-w3", prompt: "beautiful", expectedAnswers: ["beautiful"], emoji: "🌺", hint: "漂亮的", difficulty: 1, category: "word", gradeLevel: 3 },
      { id: "3-w4", prompt: "green", expectedAnswers: ["green"], emoji: "🟢", hint: "绿色的颜色", difficulty: 1, category: "word", gradeLevel: 3 },
      // Level 2: 短语
      { id: "3-p1", prompt: "You're welcome", expectedAnswers: ["You're welcome"], emoji: "😊", hint: "不客气", difficulty: 2, category: "phrase", gradeLevel: 3 },
      { id: "3-p2", prompt: "Happy birthday", expectedAnswers: ["Happy birthday"], emoji: "🎂", hint: "生日快乐", difficulty: 2, category: "phrase", gradeLevel: 3 },
      { id: "3-p3", prompt: "Good luck", expectedAnswers: ["Good luck"], emoji: "🍀", hint: "祝好运", difficulty: 2, category: "phrase", gradeLevel: 3 },
      // Level 3: 句子
      { id: "3-s1", prompt: "This is my book", expectedAnswers: ["This is my book"], emoji: "📖", hint: "这是我的书", difficulty: 3, category: "sentence", gradeLevel: 3 },
      { id: "3-s2", prompt: "I have a dog", expectedAnswers: ["I have a dog"], emoji: "🐕", hint: "我有一只狗", difficulty: 3, category: "sentence", gradeLevel: 3 },
      { id: "3-s3", prompt: "She is my sister", expectedAnswers: ["She is my sister"], emoji: "👧", hint: "她是我姐姐", difficulty: 3, category: "sentence", gradeLevel: 3 },
      // Level 4: 问答
      { id: "3-q1", prompt: "What is your name?", expectedAnswers: ["My name is", "I am"], emoji: "🤔", hint: "介绍你的名字", difficulty: 4, category: "question", gradeLevel: 3 },
      { id: "3-q2", prompt: "Where do you live?", expectedAnswers: ["I live in"], emoji: "🏠", hint: "问住在哪里", difficulty: 4, category: "question", gradeLevel: 3 },
      { id: "3-q3", prompt: "How old are you?", expectedAnswers: ["I am", "I'm"], emoji: "🎂", hint: "问年龄", difficulty: 4, category: "question", gradeLevel: 3 },
      // Level 5: 情景
      { id: "3-sc1", prompt: "May I come in?", expectedAnswers: ["May I come in"], emoji: "🚪", hint: "请求进入", difficulty: 5, category: "scenario", gradeLevel: 3 },
      { id: "3-sc2", prompt: "Let's play together!", expectedAnswers: ["Let's play"], emoji: "🎮", hint: "邀请一起玩", difficulty: 5, category: "scenario", gradeLevel: 3 },
    ],
    4: [
      // Level 1: 单词
      { id: "4-w1", prompt: "library", expectedAnswers: ["library"], emoji: "📚", hint: "借书的地方", difficulty: 1, category: "word", gradeLevel: 4 },
      { id: "4-w2", prompt: "science", expectedAnswers: ["science"], emoji: "🔬", hint: "科学课", difficulty: 1, category: "word", gradeLevel: 4 },
      { id: "4-w3", prompt: "yellow", expectedAnswers: ["yellow"], emoji: "🟡", hint: "黄色的颜色", difficulty: 1, category: "word", gradeLevel: 4 },
      { id: "4-w4", prompt: "orange", expectedAnswers: ["orange"], emoji: "🟠", hint: "橙色的颜色", difficulty: 1, category: "word", gradeLevel: 4 },
      // Level 2: 短语
      { id: "4-p1", prompt: "See you later", expectedAnswers: ["See you later"], emoji: "👋", hint: "回头见", difficulty: 2, category: "phrase", gradeLevel: 4 },
      { id: "4-p2", prompt: "Have a nice day", expectedAnswers: ["Have a nice day"], emoji: "☀️", hint: "祝你愉快", difficulty: 2, category: "phrase", gradeLevel: 4 },
      { id: "4-p3", prompt: "I don't know", expectedAnswers: ["I don't know"], emoji: "🤷", hint: "我不知道", difficulty: 2, category: "phrase", gradeLevel: 4 },
      // Level 3: 句子
      { id: "4-s1", prompt: "The sky is blue", expectedAnswers: ["The sky is blue"], emoji: "🌤️", hint: "天空是蓝色的", difficulty: 3, category: "sentence", gradeLevel: 4 },
      { id: "4-s2", prompt: "I can swim very well", expectedAnswers: ["I can swim"], emoji: "🏊", hint: "我会游泳", difficulty: 3, category: "sentence", gradeLevel: 4 },
      { id: "4-s3", prompt: "They are playing football", expectedAnswers: ["They are playing"], emoji: "⚽", hint: "他们在踢足球", difficulty: 3, category: "sentence", gradeLevel: 4 },
      // Level 4: 问答
      { id: "4-q1", prompt: "What time is it?", expectedAnswers: ["It is", "It's"], emoji: "⏰", hint: "问时间", difficulty: 4, category: "question", gradeLevel: 4 },
      { id: "4-q2", prompt: "What's your favorite food?", expectedAnswers: ["My favorite"], emoji: "🍕", hint: "问喜欢的食物", difficulty: 4, category: "question", gradeLevel: 4 },
      { id: "4-q3", prompt: "When do you get up?", expectedAnswers: ["I get up", "I wake up"], emoji: "🌅", hint: "问起床时间", difficulty: 4, category: "question", gradeLevel: 4 },
      // Level 5: 情景
      { id: "4-sc1", prompt: "Can I have a hamburger please?", expectedAnswers: ["Can I have"], emoji: "🍔", hint: "在餐厅点餐", difficulty: 5, category: "scenario", gradeLevel: 4 },
      { id: "4-sc2", prompt: "Could you help me please?", expectedAnswers: ["Could you help", "Can you help"], emoji: "🙏", hint: "请求帮助", difficulty: 5, category: "scenario", gradeLevel: 4 },
    ],
    5: [
      // Level 1: 单词
      { id: "5-w1", prompt: "restaurant", expectedAnswers: ["restaurant"], emoji: "🍽️", hint: "吃饭的地方", difficulty: 1, category: "word", gradeLevel: 5 },
      { id: "5-w2", prompt: "medicine", expectedAnswers: ["medicine"], emoji: "💊", hint: "生病时吃的", difficulty: 1, category: "word", gradeLevel: 5 },
      { id: "5-w3", prompt: "dangerous", expectedAnswers: ["dangerous"], emoji: "⚠️", hint: "危险的", difficulty: 1, category: "word", gradeLevel: 5 },
      { id: "5-w4", prompt: "weather", expectedAnswers: ["weather"], emoji: "🌦️", hint: "天气", difficulty: 1, category: "word", gradeLevel: 5 },
      // Level 2: 短语
      { id: "5-p1", prompt: "Of course", expectedAnswers: ["Of course"], emoji: "✅", hint: "当然可以", difficulty: 2, category: "phrase", gradeLevel: 5 },
      { id: "5-p2", prompt: "No problem", expectedAnswers: ["No problem"], emoji: "👌", hint: "没问题", difficulty: 2, category: "phrase", gradeLevel: 5 },
      { id: "5-p3", prompt: "Be careful", expectedAnswers: ["Be careful"], emoji: "⚠️", hint: "小心", difficulty: 2, category: "phrase", gradeLevel: 5 },
      // Level 3: 句子
      { id: "5-s1", prompt: "I would like some water please", expectedAnswers: ["I would like"], emoji: "💧", hint: "想要水", difficulty: 3, category: "sentence", gradeLevel: 5 },
      { id: "5-s2", prompt: "We should protect the environment", expectedAnswers: ["We should"], emoji: "🌍", hint: "保护环境", difficulty: 3, category: "sentence", gradeLevel: 5 },
      { id: "5-s3", prompt: "She has been studying English for three years", expectedAnswers: ["She has been"], emoji: "📚", hint: "她已经学英语三年了", difficulty: 3, category: "sentence", gradeLevel: 5 },
      // Level 4: 问答
      { id: "5-q1", prompt: "Why are you late?", expectedAnswers: ["Because"], emoji: "⏰", hint: "问原因", difficulty: 4, category: "question", gradeLevel: 5 },
      { id: "5-q2", prompt: "Which one do you prefer?", expectedAnswers: ["I prefer", "I like"], emoji: "🤔", hint: "问更喜欢哪个", difficulty: 4, category: "question", gradeLevel: 5 },
      { id: "5-q3", prompt: "How often do you exercise?", expectedAnswers: ["I exercise", "Three times a week"], emoji: "🏃", hint: "问频率", difficulty: 4, category: "question", gradeLevel: 5 },
      // Level 5: 情景
      { id: "5-sc1", prompt: "Nice to meet you!", expectedAnswers: ["Nice to meet you"], emoji: "🤝", hint: "第一次见面", difficulty: 5, category: "scenario", gradeLevel: 5 },
      { id: "5-sc2", prompt: "I'm sorry I'm late", expectedAnswers: ["I'm sorry"], emoji: "😔", hint: "为迟到道歉", difficulty: 5, category: "scenario", gradeLevel: 5 },
    ],
    6: [
      // Level 1: 单词
      { id: "6-w1", prompt: "volunteer", expectedAnswers: ["volunteer"], emoji: "🤝", hint: "志愿者", difficulty: 1, category: "word", gradeLevel: 6 },
      { id: "6-w2", prompt: "pollution", expectedAnswers: ["pollution"], emoji: "🏭", hint: "污染", difficulty: 1, category: "word", gradeLevel: 6 },
      { id: "6-w3", prompt: "technology", expectedAnswers: ["technology"], emoji: "💻", hint: "科技", difficulty: 1, category: "word", gradeLevel: 6 },
      { id: "6-w4", prompt: "purple", expectedAnswers: ["purple"], emoji: "🟣", hint: "紫色的颜色", difficulty: 1, category: "word", gradeLevel: 6 },
      // Level 2: 短语
      { id: "6-p1", prompt: "Never mind", expectedAnswers: ["Never mind"], emoji: "😊", hint: "没关系", difficulty: 2, category: "phrase", gradeLevel: 6 },
      { id: "6-p2", prompt: "Take care", expectedAnswers: ["Take care"], emoji: "💝", hint: "保重", difficulty: 2, category: "phrase", gradeLevel: 6 },
      { id: "6-p3", prompt: "Good idea", expectedAnswers: ["Good idea"], emoji: "💡", hint: "好主意", difficulty: 2, category: "phrase", gradeLevel: 6 },
      // Level 3: 句子
      { id: "6-s1", prompt: "I can speak English very well", expectedAnswers: ["I can speak"], emoji: "🗣️", hint: "我会说英语", difficulty: 3, category: "sentence", gradeLevel: 6 },
      { id: "6-s2", prompt: "We should take care of our planet", expectedAnswers: ["We should"], emoji: "🌍", hint: "我们应该爱护地球", difficulty: 3, category: "sentence", gradeLevel: 6 },
      { id: "6-s3", prompt: "Reading books is very important", expectedAnswers: ["Reading books"], emoji: "📖", hint: "读书很重要", difficulty: 3, category: "sentence", gradeLevel: 6 },
      // Level 4: 问答
      { id: "6-q1", prompt: "What would you do if you were rich?", expectedAnswers: ["I would", "I will"], emoji: "💰", hint: "假设性问题", difficulty: 4, category: "question", gradeLevel: 6 },
      { id: "6-q2", prompt: "What's the weather like today?", expectedAnswers: ["It's sunny", "It's rainy"], emoji: "🌦️", hint: "问天气", difficulty: 4, category: "question", gradeLevel: 6 },
      { id: "6-q3", prompt: "How long does it take?", expectedAnswers: ["It takes", "About"], emoji: "⏱️", hint: "问需要多长时间", difficulty: 4, category: "question", gradeLevel: 6 },
      // Level 5: 情景
      { id: "6-sc1", prompt: "You're welcome!", expectedAnswers: ["You're welcome"], emoji: "😊", hint: "回应谢谢", difficulty: 5, category: "scenario", gradeLevel: 6 },
      { id: "6-sc2", prompt: "I really appreciate your help", expectedAnswers: ["I appreciate"], emoji: "🙏", hint: "表达感激", difficulty: 5, category: "scenario", gradeLevel: 6 },
    ],
  };

  return defaultQuestions[gradeLevel] || defaultQuestions[3];
}
