/**
 * 智能检查并生成题目
 * POST /api/questions/check-generate
 *
 * 优化策略：
 * 1. 直接从 Supabase 查询答题历史（不依赖客户端传递）
 * 2. 检查题目的完成情况（score >= 80）
 * 3. 只有当前难度的所有题目都完成后，才调用大模型生成新题目
 * 4. 最大化节约大模型调用次数
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateQuestionSeed, getDefaultSeed } from "@/lib/questionGenerator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CheckGenerateRequest {
  childId: string;
  gradeLevel: number;
  semester: string;
  difficulty: number;
  category?: string;
  count?: number;
  currentSeed?: any;
}

interface QuestionCompletion {
  questionId: string;
  prompt: string;
  bestScore: number;
  attempts: number;
  completed: boolean;
}

/**
 * 从 Supabase 获取孩子在某难度下的答题历史
 * 返回每个题目的最佳成绩和完成状态
 */
async function getQuestionCompletionFromSupabase(
  childId: string, // UUID string
  difficulty: number
): Promise<QuestionCompletion[]> {
  try {
    console.log(`[智能生成] 查询 Supabase - childId: ${childId}, difficulty: ${difficulty}`);

    const { data, error } = await supabase
      .from("answer_history")
      .select("question_id, question, score")
      .eq("child_id", childId)
      .eq("difficulty", difficulty)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("[智能生成] 查询答题历史失败:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log(`[智能生成] Supabase 返回空结果 - data: ${JSON.stringify(data)}, error: ${error}`);
      return [];
    }

    console.log(`[智能生成] 从 Supabase 查询到 ${data.length} 条答题历史记录`);
    console.log(`[智能生成] 原始数据:`, JSON.stringify(data, null, 2));

    // 按题目分组，计算每个题目的最佳成绩和尝试次数
    const questionMap = new Map<string, QuestionCompletion>();

    for (const record of data) {
      const questionId = record.question_id || record.question;
      const existing = questionMap.get(questionId);

      if (existing) {
        if (record.score > existing.bestScore) {
          existing.bestScore = record.score;
          existing.completed = record.score >= 80;
        }
        existing.attempts++;
      } else {
        questionMap.set(questionId, {
          questionId,
          prompt: record.question,
          bestScore: record.score,
          attempts: 1,
          completed: record.score >= 80,
        });
      }
    }

    const result = Array.from(questionMap.values());
    console.log(`[智能生成] 汇总后: ${result.length} 道题目，已完成: ${result.filter(c => c.completed).length}`);
    return result;
  } catch (error) {
    console.error("[智能生成] 获取答题历史出错:", error);
    return [];
  }
}

/**
 * 从当前种子中获取所有题目，并标记哪些已完成
 */
function getQuestionCompletionStatus(
  questions: any[],
  completionData: QuestionCompletion[]
): {
  all: any[];
  completed: any[];
  incomplete: any[];
  completedIds: Set<string>;
} {
  const completedMap = new Map(
    completionData.map((c) => [c.questionId, c.completed])
  );

  const completedIds = new Set<string>();
  const completed: any[] = [];
  const incomplete: any[] = [];

  for (const q of questions) {
    const isCompleted = completedMap.get(q.id) || false;
    const questionWithStatus = {
      ...q,
      _completed: isCompleted,
      _bestScore: completionData.find((c) => c.questionId === q.id)?.bestScore || null,
    };

    if (isCompleted) {
      completed.push(questionWithStatus);
      completedIds.add(q.id);
    } else {
      incomplete.push(questionWithStatus);
    }
  }

  return {
    all: questions,
    completed,
    incomplete,
    completedIds,
  };
}

/**
 * 保存新题目到公共池
 */
async function saveQuestionsToPublicPool(
  questions: any[],
  gradeLevel: number,
  semester: string
): Promise<void> {
  try {
    const publicQuestions = questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      expected_answers: q.expectedAnswers,
      emoji: q.emoji || null,
      difficulty: q.difficulty,
      category: q.category,
      grade_level: gradeLevel,
      semester: semester,
      usage_count: 0,
    }));

    await supabase
      .from("public_questions")
      .upsert(publicQuestions, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    console.log(`✅ 已保存 ${publicQuestions.length} 道题目到公共池`);
  } catch (error) {
    console.error("保存题目到公共池失败:", error);
  }
}

/**
 * 从公共题目池获取题目（作为补充）
 */
async function getQuestionsFromPublicPool(
  gradeLevel: number,
  difficulty: number,
  excludeIds: Set<string>,
  count: number
): Promise<any[]> {
  try {
    // 获取所有符合条件的题目（注意：Supabase 客户端不支持 order("RANDOM()")）
    const { data, error } = await supabase
      .from("public_questions")
      .select("*")
      .eq("grade_level", gradeLevel)
      .eq("difficulty", difficulty)
      .limit(count * 2); // 获取更多以便筛选

    if (error || !data) {
      console.log("[智能生成] 公共池查询失败或为空:", error);
      return [];
    }

    // 客户端随机排序
    const shuffled = [...data].sort(() => Math.random() - 0.5);

    // 过滤掉已完成的题目
    return shuffled
      .filter((q) => !excludeIds.has(q.id))
      .slice(0, count)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        expectedAnswers: q.expected_answers,
        emoji: q.emoji,
        difficulty: q.difficulty,
        category: q.category,
      }));
  } catch (error) {
    console.error("[智能生成] 从公共池获取题目失败:", error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckGenerateRequest = await request.json();

    const {
      childId,
      gradeLevel,
      semester,
      difficulty,
      category,
      count = 10,
      currentSeed,
    } = body;

    // 验证参数
    if (!childId || !gradeLevel || !semester || !difficulty) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    console.log(`[智能生成] childId=${childId}, difficulty=${difficulty}`);

    // 1. 从 Supabase 获取答题历史（直接查询，不依赖客户端传递）
    const completionData = await getQuestionCompletionFromSupabase(
      childId,
      difficulty
    );

    const completedCount = completionData.filter((c) => c.completed).length;
    console.log(`[智能生成] 已完成题目数: ${completedCount}/${completionData.length}`);

    // 2. 获取当前题库中的题目
    const currentQuestions = (currentSeed?.questions || []).filter(
      (q: any) => q.difficulty === difficulty
    );

    console.log(`[智能生成] 当前题库中有 ${currentQuestions.length} 道该难度的题目`);
    if (currentQuestions.length > 0) {
      console.log(`[智能生成] 当前题库题目IDs:`, currentQuestions.map((q: any) => q.id));
    }

    // 3. 分析完成情况
    const { completed, incomplete, completedIds } = getQuestionCompletionStatus(
      currentQuestions,
      completionData
    );

    console.log(`[智能生成] 未完成题目数: ${incomplete.length}`);

    // 4. 如果有未完成的题目，直接返回
    if (incomplete.length > 0) {
      console.log(`[智能生成] 返回 ${incomplete.length} 道未完成题目，不调用大模型`);
      return NextResponse.json({
        success: true,
        action: "use_existing",
        questions: incomplete,
        totalQuestions: currentQuestions.length,
        completedCount,
        incompleteCount: incomplete.length,
        needsGeneration: false,
      });
    }

    // 5. 所有题目都完成了，尝试从公共池获取
    console.log(`[智能生成] 当前题库的所有题目已完成，尝试从公共池获取`);
    const publicPoolQuestions = await getQuestionsFromPublicPool(
      gradeLevel,
      difficulty,
      completedIds,
      count
    );

    if (publicPoolQuestions.length > 0) {
      console.log(`[智能生成] 从公共池获取到 ${publicPoolQuestions.length} 道题目，不调用大模型`);
      return NextResponse.json({
        success: true,
        action: "use_public_pool",
        questions: publicPoolQuestions,
        totalQuestions: currentQuestions.length,
        completedCount,
        incompleteCount: publicPoolQuestions.length,
        needsGeneration: false,
      });
    }

    // 6. 公共池也没有了，必须生成新题目
    console.log(`[智能生成] 公共池已空，必须调用大模型生成新题目`);

    try {
      // 调用大模型生成新题目
      const newSeed = await generateQuestionSeed({
        gradeLevel,
        semester,
        weakAreas: [],
        wrongQuestions: completionData
          .filter((c) => c.bestScore < 60)
          .map((c) => c.prompt)
          .slice(0, 5),
        count,
        difficulty,
        category,
      });

      const newDifficultyQuestions = newSeed.questions.filter(
        (q: any) => q.difficulty === difficulty
      );

      // 异步保存到公共池
      if (newSeed.questions && newSeed.questions.length > 0) {
        saveQuestionsToPublicPool(newSeed.questions, gradeLevel, semester).catch(
          console.error
        );
      }

      // 排除已完成的题目ID
      const newIncompleteQuestions = newDifficultyQuestions.filter(
        (q: any) => !completedIds.has(q.id)
      );

      console.log(`[智能生成] 大模型生成完成，获得 ${newIncompleteQuestions.length} 道新题目`);

      return NextResponse.json({
        success: true,
        action: "generated_new",
        questions: newIncompleteQuestions,
        newSeed: newSeed,
        totalQuestions: newDifficultyQuestions.length,
        completedCount,
        incompleteCount: newIncompleteQuestions.length,
        needsGeneration: false,
      });
    } catch (error) {
      console.error("[智能生成] AI生成失败，使用默认题目:", error);

      // AI生成失败，使用默认题目
      const defaultSeed = getDefaultSeed(gradeLevel, semester);
      const defaultQuestions = defaultSeed.questions.filter(
        (q: any) => q.difficulty === difficulty
      );

      // 排除已完成的题目
      const defaultIncompleteQuestions = defaultQuestions.filter(
        (q: any) => !completedIds.has(q.id)
      );

      // 保存默认题目到公共池
      saveQuestionsToPublicPool(defaultSeed.questions, gradeLevel, semester).catch(
        console.error
      );

      return NextResponse.json({
        success: true,
        action: "using_default",
        questions: defaultIncompleteQuestions,
        defaultSeed: defaultSeed,
        totalQuestions: defaultQuestions.length,
        completedCount,
        incompleteCount: defaultIncompleteQuestions.length,
        needsGeneration: false,
      });
    }
  } catch (error) {
    console.error("[智能生成] 错误:", error);
    return NextResponse.json(
      { error: "智能生成题目失败", details: String(error) },
      { status: 500 }
    );
  }
}
