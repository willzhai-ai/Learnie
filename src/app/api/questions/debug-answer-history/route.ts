/**
 * 调试端点：查询答题历史
 * GET /api/questions/debug-answer-history?childId=xxx&difficulty=1
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const childId = searchParams.get("childId");
    const difficulty = searchParams.get("difficulty");

    if (!childId) {
      return NextResponse.json(
        { error: "缺少 childId 参数" },
        { status: 400 }
      );
    }

    // 查询所有答题历史
    let query = supabase
      .from("answer_history")
      .select("*")
      .eq("child_id", childId);

    if (difficulty) {
      query = query.eq("difficulty", parseInt(difficulty));
    }

    query = query.order("created_at", { ascending: false }).limit(50);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "查询失败", details: error },
        { status: 500 }
      );
    }

    // 统计信息
    const stats = {
      total: data?.length || 0,
      byDifficulty: [1, 2, 3, 4, 5].map((d) => ({
        difficulty: d,
        count: data?.filter((r) => r.difficulty === d).length || 0,
        completed: data?.filter((r) => r.difficulty === d && r.score >= 80).length || 0,
      })),
    };

    return NextResponse.json({
      success: true,
      childId,
      difficulty: difficulty ? parseInt(difficulty) : "all",
      stats,
      records: data || [],
    });
  } catch (error) {
    console.error("[调试] 查询答题历史出错:", error);
    return NextResponse.json(
      { error: "服务器错误", details: String(error) },
      { status: 500 }
    );
  }
}
