/**
 * 题库生成 API
 * POST /api/questions/generate
 *
 * 同时保存题目到公共题目资源池
 */

import { NextRequest, NextResponse } from "next/server";
import { generateQuestionSeed, getDefaultSeed } from "@/lib/questionGenerator";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 将题目保存到公共题目资源池
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

    // 使用 upsert 避免重复
    const { error } = await supabase
      .from("public_questions")
      .upsert(publicQuestions, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("保存题目到公共池失败:", error);
    } else {
      console.log(`✅ 已保存 ${publicQuestions.length} 道题目到公共池`);
    }
  } catch (error) {
    console.error("保存题目到公共池时出错:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      gradeLevel,
      semester,
      weakAreas,
      wrongQuestions,
      count = 20,
      difficulty,
      category,
    } = body;

    // 验证参数
    if (!gradeLevel || gradeLevel < 1 || gradeLevel > 6) {
      return NextResponse.json(
        { error: "无效的年级" },
        { status: 400 }
      );
    }

    if (!semester || !["上学期", "下学期"].includes(semester)) {
      return NextResponse.json(
        { error: "无效的学期" },
        { status: 400 }
      );
    }

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "题目数量必须在 1-50 之间" },
        { status: 400 }
      );
    }

    // 尝试生成个性化题库
    try {
      const seed = await generateQuestionSeed({
        gradeLevel,
        semester,
        weakAreas: weakAreas || [],
        wrongQuestions: wrongQuestions || [],
        count,
        difficulty,
        category,
      });

      // 异步保存到公共池（不阻塞响应）
      if (seed.questions && seed.questions.length > 0) {
        saveQuestionsToPublicPool(seed.questions, gradeLevel, semester).catch(
          console.error
        );
      }

      return NextResponse.json({
        success: true,
        seed,
      });
    } catch (error) {
      console.error("AI 生成题库失败，使用默认题库:", error);

      // AI 生成失败时，使用默认题库
      const defaultSeed = getDefaultSeed(gradeLevel, semester);

      // 保存默认题目到公共池
      if (defaultSeed.questions && defaultSeed.questions.length > 0) {
        saveQuestionsToPublicPool(defaultSeed.questions, gradeLevel, semester).catch(
          console.error
        );
      }

      return NextResponse.json({
        success: true,
        seed: defaultSeed,
        usingDefault: true,
      });
    }
  } catch (error) {
    console.error("题库生成错误:", error);
    return NextResponse.json(
      { error: "题库生成失败" },
      { status: 500 }
    );
  }
}
