/**
 * 爬塔模式 - 完成一层
 * POST /api/tower/complete
 *
 * 记录答题结果，更新爬塔进度和排名
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      childId,
      level,
      questionId,
      passed,
      score,
      pointsEarned = 1, // 每层固定获得1积分
    } = body;

    if (!childId || !level || !questionId || passed === undefined || score === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 记录答题历史
    const { error: historyError } = await supabase
      .from("tower_history")
      .insert({
        child_id: childId,
        level,
        question_id: questionId,
        passed,
        score,
        points_earned: pointsEarned,
      });

    if (historyError) {
      console.error("记录答题历史失败:", historyError);
    }

    // 更新爬塔进度
    const { data: progress, error: progressError } = await supabase.rpc(
      "update_tower_progress",
      {
        p_child_id: childId,
        p_passed: passed,
        p_points_earned: pointsEarned,
      }
    );

    if (progressError) {
      console.error("更新爬塔进度失败:", progressError);
      throw progressError;
    }

    return NextResponse.json({
      success: true,
      progress,
      nextLevel: passed ? level + 1 : level,
    });
  } catch (error) {
    console.error("完成爬塔层级失败:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
