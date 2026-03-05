/**
 * 爬塔模式 - 开始/获取进度
 * GET /api/tower/start?childId=xxx
 * POST /api/tower/start
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "缺少 childId 参数" },
        { status: 400 }
      );
    }

    // 获取孩子的爬塔进度
    const { data: progress, error } = await supabase
      .from("tower_progress")
      .select("*")
      .eq("child_id", childId)
      .single();

    if (error) {
      console.log("获取爬塔进度，未找到记录，返回初始状态:", error.code);
      // 如果没有记录，返回初始状态
      if (error.code === "PGRST116" || error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          progress: {
            child_id: childId,
            current_level: 1,
            highest_level: 1,
            total_points: 0,
            questions_completed: 0,
            started_at: null,
          },
        });
      }
      // 其他错误也要返回初始状态，让用户可以开始
      console.warn("获取进度出错，返回初始状态:", error);
      return NextResponse.json({
        success: true,
        progress: {
          child_id: childId,
          current_level: 1,
          highest_level: 1,
          total_points: 0,
          questions_completed: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("获取爬塔进度失败:", error);
    return NextResponse.json(
      { error: "获取进度失败", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 初始化爬塔模式（首次进入）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { childId } = body;

    if (!childId) {
      return NextResponse.json(
        { error: "缺少 childId" },
        { status: 400 }
      );
    }

    // 检查是否已有进度
    const { data: existing } = await supabase
      .from("tower_progress")
      .select("*")
      .eq("child_id", childId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        progress: existing,
      });
    }

    // 创建新的爬塔进度
    const { data: progress, error } = await supabase
      .from("tower_progress")
      .insert({
        child_id: childId,
        current_level: 1,
        highest_level: 1,
        total_points: 0,
        questions_completed: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("创建爬塔进度失败:", error);
      throw error;
    }

    console.log("✅ 创建爬塔进度成功:", childId);
    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("初始化爬塔模式失败:", error);
    return NextResponse.json(
      { error: "初始化失败", details: String(error) },
      { status: 500 }
    );
  }
}
