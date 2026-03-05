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

    // 插入到 answer_history 表
    const { error: historyError } = await sb
      .from("answer_history")
      .insert({
        child_id: childId, // UUID type
        question_id: record.questionId || null,
        question: record.question,
        transcript: record.transcript,
        score: record.score,
        passed: record.passed,
        difficulty: record.difficulty,
        category: record.category,
        points_earned: record.pointsEarned,
      });

    if (historyError) {
      console.error("保存答题历史失败:", historyError);
      // 不抛出错误，允许继续
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
    console.error("保存答题历史失败:", error);
    // 不抛出错误，允许继续
  }
}

/**
 * 更新孩子积分到 Supabase
 */
export async function updateChildPointsInSupabase(
  childId: string,
  currentPoints: number,
  totalPoints: number
): Promise<void> {
  try {
    const sb = await getSupabaseWithAuth();

    const { error } = await sb
      .from("child_profiles")
      .update({
        current_points: currentPoints,
        total_points_earned: totalPoints,
      })
      .eq("id", childId);

    if (error) {
      console.error("更新积分失败:", error);
    }
  } catch (error) {
    console.error("更新积分失败:", error);
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
    }
  } catch (error) {
    console.error("更新连胜记录失败:", error);
  }
}

/**
 * 获取孩子的详细统计信息
 */
export async function getChildStats(childId: string) {
  try {
    const sb = await getSupabaseWithAuth();

    // 获取总练习次数
    const { count: totalAttempts } = await sb
      .from("answer_history")
      .select("*", { count: "exact", head: true })
      .eq("child_id", childId);

    // 获取通过次数
    const { count: passedAttempts } = await sb
      .from("answer_history")
      .select("*", { count: "exact", head: true })
      .eq("child_id", childId)
      .eq("passed", true);

    // 获取平均分数
    const { data: scoreData } = await sb
      .from("answer_history")
      .select("score")
      .eq("child_id", childId);

    const avgScore = scoreData && scoreData.length > 0
      ? scoreData.reduce((sum, r) => sum + (r.score || 0), 0) / scoreData.length
      : 0;

    // 获取各难度通过率
    const { data: difficultyData } = await sb
      .from("answer_history")
      .select("difficulty, passed")
      .eq("child_id", childId);

    const difficultyStats = { 1: { total: 0, passed: 0 }, 2: { total: 0, passed: 0 }, 3: { total: 0, passed: 0 }, 4: { total: 0, passed: 0 }, 5: { total: 0, passed: 0 } };

    difficultyData?.forEach((record) => {
      const diff = record.difficulty as keyof typeof difficultyStats;
      if (difficultyStats[diff]) {
        difficultyStats[diff].total++;
        if (record.passed) difficultyStats[diff].passed++;
      }
    });

    return {
      totalAttempts: totalAttempts || 0,
      passedAttempts: passedAttempts || 0,
      passRate: totalAttempts ? ((passedAttempts || 0) / totalAttempts * 100).toFixed(1) : "0",
      avgScore: avgScore.toFixed(1),
      difficultyStats,
    };
  } catch (error) {
    console.error("获取统计信息失败:", error);
    return null;
  }
}

// ============================================
// 数据转换函数
// ============================================

/**
 * 将 Supabase 的 child_profile 转换为本地 Child 类型
 */
function supabaseChildToLocal(profile: ChildProfile): Child {
  // 从 answer_history JSONB 中提取或使用空数组
  const answerHistory = profile.answer_history || [];

  // 构建 gradeLevel 对象
  const gradeLevel: GradeLevel = {
    grade: profile.grade_level || 3,
    semester: (profile.semester as "上学期" | "下学期") || "上学期",
    displayName: `小学${profile.grade_level || 3}年级${profile.semester || "上学期"}`,
  };

  return {
    id: profile.id,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    gradeLevel,
    currentPoints: profile.current_points,
    totalPointsEarned: profile.total_points_earned,
    currentLevel: profile.current_level,
    answerHistory: answerHistory.map((h: any) => ({
      questionId: h.question_id || h.questionId || "",
      question: h.question || "",
      passed: h.passed || false,
      score: h.score || 0,
      timestamp: h.timestamp || h.created_at || new Date().toISOString(),
      difficulty: h.difficulty || 1,
      category: h.category || "word",
    })),
  };
}

/**
 * 从 Supabase 加载家长的孩子列表
 */
export async function syncChildrenFromSupabase(parentId: string): Promise<Child[]> {
  try {
    const children = await loadChildrenFromSupabase(parentId);
    return children;
  } catch (error) {
    console.error("同步孩子数据失败:", error);
    return [];
  }
}

/**
 * 批量同步所有孩子的数据到 Supabase
 */
export async function syncAllChildrenToSupabase(children: Child[]): Promise<void> {
  try {
    await Promise.all(
      children.map((child) => saveChildToSupabase(child))
    );
  } catch (error) {
    console.error("批量同步失败:", error);
    throw error;
  }
}
