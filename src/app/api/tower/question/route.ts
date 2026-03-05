/**
 * 爬塔模式 - 获取题目
 * POST /api/tower/question
 *
 * 根据孩子学龄和当前层数，从公共题目池随机获取题目
 * 难度会随着层数增加而随机变化
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDefaultSeed } from "@/lib/questionGenerator";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 根据层数计算难度
 * 层数越高，难度越高，但也保持随机性
 */
function calculateDifficulty(level: number): number {
  // 基础难度：每5层提升一次基础难度
  const baseDifficulty = Math.floor((level - 1) / 5) + 1;

  // 随机波动：±1难度，但保持在1-5之间
  const variance = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  const difficulty = Math.max(1, Math.min(5, baseDifficulty + variance));

  return difficulty;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId, gradeLevel, currentLevel } = body;

    if (!childId || !gradeLevel || !currentLevel) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 计算本次题目难度
    const difficulty = calculateDifficulty(currentLevel);

    console.log(`[爬塔] 获取题目: gradeLevel=${gradeLevel}, currentLevel=${currentLevel}, difficulty=${difficulty}`);

    // 从公共题目池随机获取题目
    const { data: question, error } = await supabase
      .from("public_questions")
      .select("*")
      .eq("grade_level", gradeLevel)
      .eq("difficulty", difficulty)
      .order("RANDOM()")
      .limit(1)
      .single();

    if (error) {
      console.log("[爬塔] 公共题目池查询失败，尝试默认题目:", error.message);
    }

    let finalQuestion = question;

    // 如果公共题目池没有找到或查询失败，使用默认题目
    if (!finalQuestion) {
      console.log("[爬塔] 使用默认题目作为后备");

      // 获取默认题库
      const defaultSeed = getDefaultSeed(gradeLevel, "上学期");
      const matchingQuestions = defaultSeed.questions.filter(
        q => q.difficulty === difficulty
      );

      // 如果没有该难度的题目，取任意难度的题目
      const fallbackQuestions = matchingQuestions.length > 0
        ? matchingQuestions
        : defaultSeed.questions;

      if (fallbackQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackQuestions.length);
        finalQuestion = fallbackQuestions[randomIndex];

        // 异步保存到公共题目池（不阻塞响应）
        supabase
          .from("public_questions")
          .upsert({
            id: finalQuestion.id,
            prompt: finalQuestion.prompt,
            expected_answers: finalQuestion.expectedAnswers,
            emoji: finalQuestion.emoji || null,
            difficulty: finalQuestion.difficulty,
            category: finalQuestion.category,
            grade_level: gradeLevel,
            semester: "上学期",
            usage_count: 0,
          })
          .then(() => console.log("[爬塔] 已保存默认题目到公共池"))
          .catch(err => console.error("[爬塔] 保存题目失败:", err));
      }
    }

    if (!finalQuestion) {
      return NextResponse.json(
        { error: "暂无可用题目，请联系管理员" },
        { status: 404 }
      );
    }

    // 更新使用次数（如果题目来自公共池）
    if (question) {
      try {
        await supabase.rpc("increment_question_usage", {
          question_id: finalQuestion.id,
        });
      } catch (err) {
        console.warn("[爬塔] 更新使用次数失败:", err);
      }
    }

    return NextResponse.json({
      success: true,
      question: {
        id: finalQuestion.id,
        prompt: finalQuestion.prompt,
        expectedAnswers: finalQuestion.expectedAnswers,
        emoji: finalQuestion.emoji,
        difficulty: finalQuestion.difficulty,
        category: finalQuestion.category,
        basePoints: 10 + finalQuestion.difficulty * 5,
      },
      calculatedDifficulty: difficulty,
    });
  } catch (error) {
    console.error("获取爬塔题目失败:", error);
    return NextResponse.json(
      { error: "获取题目失败", details: String(error) },
      { status: 500 }
    );
  }
}
