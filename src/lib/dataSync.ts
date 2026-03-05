/**
 * 数据同步服务 - 在 Supabase 后端和本地 zustand store 之间同步数据
 */

import { supabase, type ChildProfile } from "./supabase";
import type { Child, GradeLevel } from "@/stores/gameStore";

// Supabase 客户端（带认证）
export async function getSupabaseWithAuth() {
  return supabase;
}

/**
 * 从 Supabase 加载所有孩子数据
 */
export async function loadChildrenFromSupabase(parentId: string): Promise<Child[]> {
  try {
    const sb = await getSupabaseWithAuth();

    const { data, error } = await sb
      .from("child_profiles")
      .select("*")
      .eq("parent_id", parentId);

    if (error) throw error;

    return (data || []).map((profile) => supabaseChildToLocal(profile));
  } catch (error) {
    console.error("加载孩子数据失败:", error);
    return [];
  }
}

/**
 * 保存孩子数据到 Supabase
 */
export async function saveChildToSupabase(child: Child): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    // 先检查这个孩子是否已存在于 Supabase
    const { data: existing } = await sb
      .from("child_profiles")
      .select("parent_id")
      .eq("id", child.id)
      .single();

    // 如果已存在，获取其 parent_id；否则让数据库自动生成
    const parentId = existing?.parent_id || null;

    const profileData: any = {
      id: child.id,
      name: child.name,
      avatar_url: child.avatarUrl,
      grade_level: child.gradeLevel.grade,
      semester: child.gradeLevel.semester,
      current_points: child.currentPoints,
      total_points_earned: child.totalPointsEarned,
      current_level: child.currentLevel,
      answer_history: child.answerHistory || [],
      current_streak: 0, // 可以从 store 获取
      best_streak: 0, // 可以从 store 获取
    };

    // 只有在已有 parent_id 时才设置
    if (parentId) {
      profileData.parent_id = parentId;
    }

    const { error } = await sb
      .from("child_profiles")
      .upsert(profileData, {
        onConflict: "id",
      });

    if (error) {
      console.error("保存到 Supabase 失败:", error);
      throw error;
    }

    console.log("✅ 数据已同步到 Supabase:", child.name);
  } catch (error) {
    console.error("保存孩子数据失败:", error);
    throw error;
  }
}

/**
 * 记录答题历史到 Supabase
 */
export async function saveAnswerHistoryToSupabase(
  childId: string,
  record: {
    questionId?: string;
    question: string;
    transcript: string;
    score: number;
    passed: boolean;
    difficulty: number;
    category: string;
    pointsEarned: number;
  }
): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    const insertData: any = {
      child_id: childId,
      question_id: record.questionId || null,
      question: record.question,
      transcript: record.transcript,
      score: record.score,
      passed: record.passed,
      difficulty: record.difficulty,
      category: record.category,
      points_earned: record.pointsEarned,
    };

    // 详细日志：记录保存的答题历史
    console.log("[保存答题历史] Supabase:", {
      childId,
      questionId: record.questionId,
      question: record.question.substring(0, 30) + "...",
      score: record.score,
      passed: record.passed,
      difficulty: record.difficulty,
    });

    // 插入到 answer_history 表
    const { error: historyError, data } = await sb
      .from("answer_history")
      .insert(insertData)
      .select();

    if (historyError) {
      console.error("❌ [保存答题历史] 失败:", historyError);
    } else {
      console.log("✅ [保存答题历史] 成功:", data?.[0]);
    }

    // 更新 child_profiles 中的 last_practice_at
    const { error: updateError } = await sb
      .from("child_profiles")
      .update({
        last_practice_at: new Date().toISOString(),
      })
      .eq("id", childId);

    if (updateError) {
      console.error("更新最后练习时间失败:", updateError);
    }
  } catch (error) {
    console.error("❌ [保存答题历史] 异常]:", error);
  }
}

/**
 * 更新连胜记录到 Supabase
 */
export async function updateStreakInSupabase(
  childId: string,
  currentStreak: number,
  bestStreak: number
): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    const { error } = await sb
      .from("child_profiles")
      .update({
        current_streak: currentStreak,
        best_streak: bestStreak,
      })
      .eq("id", childId);

    if (error) {
      console.error("更新连胜记录失败:", error);
    } else {
      console.log("✅ 连胜记录已更新:", { currentStreak, bestStreak });
    }
  } catch (error) {
    console.error("更新连胜记录异常:", error);
  }
}

/**
 * 更新孩子积分到 Supabase
 */
export async function updateChildPointsInSupabase(
  childId: string,
  currentPoints: number,
  totalPointsEarned: number
): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    const { error } = await sb
      .from("child_profiles")
      .update({
        current_points: currentPoints,
        total_points_earned: totalPointsEarned,
      })
      .eq("id", childId);

    if (error) {
      console.error("更新积分失败:", error);
    } else {
      console.log("✅ 积分已更新:", { currentPoints, totalPointsEarned });
    }
  } catch (error) {
    console.error("更新积分异常:", error);
  }
}

/**
 * 同步所有孩子数据到 Supabase
 */
export async function syncAllChildrenToSupabase(children: Child[]): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    for (const child of children) {
      await saveChildToSupabase(child);
    }

    console.log("✅ 所有孩子数据已同步到 Supabase");
  } catch (error) {
    console.error("同步所有孩子数据失败:", error);
    throw error;
  }
}

/**
 * 从 Supabase 同步孩子数据（别名函数）
 */
export async function syncChildrenFromSupabase(parentId: string): Promise<Child[]> {
  return loadChildrenFromSupabase(parentId);
}

/**
 * 转换 Supabase 数据到本地格式
 */
function supabaseChildToLocal(profile: any): Child {
  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    gradeLevel: {
      grade: profile.grade_level,
      semester: profile.semester || "上学期",
      displayName: `小学${profile.grade_level}年级${profile.semester || "上学期"}`,
    },
    currentPoints: profile.current_points || 0,
    totalPointsEarned: profile.total_points_earned || 0,
    currentLevel: profile.current_level || 1,
    answerHistory: profile.answer_history || [],
  };
}
