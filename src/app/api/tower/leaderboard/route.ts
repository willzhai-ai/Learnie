/**
 * 爬塔模式 - 排行榜
 * GET /api/tower/leaderboard
 *
 * 获取所有孩子的爬塔排名
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const childId = searchParams.get("childId"); // 用于高亮当前孩子

    // 尝试从排名视图获取数据
    // 如果视图不存在，直接从 tower_progress 获取
    let rankings: any[] = [];

    try {
      const { data, error } = await supabase
        .from("tower_rankings")
        .select("*")
        .order("highest_level", { ascending: false })
        .order("updated_at", { ascending: true })
        .limit(limit);

      if (!error && data) {
        rankings = data;
      }
    } catch (viewError) {
      console.log("视图查询失败，尝试直接查询 tower_progress 表:", viewError);
    }

    // 如果视图查询失败，直接从 tower_progress 和 child_profiles 获取数据
    if (rankings.length === 0) {
      const { data: progressData } = await supabase
        .from("tower_progress")
        .select("*, child_profiles!inner(id, name, avatar_url, grade_level)")
        .order("highest_level", { ascending: false })
        .limit(limit);

      if (progressData) {
        rankings = progressData.map((item: any, index: number) => ({
          child_id: item.child_id,
          child_name: item.child_profiles?.name || "未知",
          avatar_url: item.child_profiles?.avatar_url,
          grade_level: item.child_profiles?.grade_level || 3,
          current_level: item.current_level,
          highest_level: item.highest_level,
          total_points: item.total_points,
          questions_completed: item.questions_completed,
          rank: index + 1,
        }));
      }
    }

    // 如果指定了 childId，找出该孩子的排名
    let myRank = null;
    if (childId) {
      const myEntry = rankings.find((r: any) => r.child_id === childId);
      if (myEntry) {
        myRank = myEntry.rank;
      } else {
        // 如果不在前列名中，查询该孩子的数据
        const { data: myProgress } = await supabase
          .from("tower_progress")
          .select("*")
          .eq("child_id", childId)
          .single();

        if (myProgress) {
          // 计算排名：统计有多少人比他高层
          const { count } = await supabase
            .from("tower_progress")
            .select("*", { count: "exact", head: true })
            .gt("highest_level", myProgress.highest_level);

          myRank = (count || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      rankings: rankings || [],
      myRank,
    });
  } catch (error) {
    console.error("获取排行榜失败:", error);
    return NextResponse.json(
      { error: "获取排行榜失败", details: String(error) },
      { status: 500 }
    );
  }
}
