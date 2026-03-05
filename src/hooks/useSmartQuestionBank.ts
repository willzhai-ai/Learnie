/**
 * 智能题库管理 Hook
 * 优化策略：
 * 1. API 直接从 Supabase 查询答题历史
 * 2. 只在当前难度的所有题目都完成（score >= 80）时才生成新题目
 * 3. 优先使用未完成的已有题目
 * 4. 尽可能减少大模型调用次数
 */

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { apiFetch } from "@/lib/api";

interface SmartQuestionBankOptions {
  difficulty?: number;
  category?: "word" | "phrase" | "sentence" | "question" | "scenario";
  count?: number;
}

interface SmartQuestionBankResult {
  questions: any[];
  isLoading: boolean;
  isChecking: boolean;
  needsGeneration: boolean;
  completedCount: number;
  totalQuestions: number;
  refresh: () => Promise<void>;
  getRandomQuestion: () => any | null;
}

export function useSmartQuestionBank(
  options: SmartQuestionBankOptions = {}
): SmartQuestionBankResult {
  const {
    currentChild,
    questionSeed,
    isGeneratingSeed,
    setQuestionSeed,
  } = useGameStore();

  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  /**
   * 智能获取题目：
   * 1. API 直接从 Supabase 查询答题历史
   * 2. 返回未完成的题目
   * 3. 只在必要时才生成新题目
   */
  const checkAndFetchQuestions = useCallback(async () => {
    if (!currentChild) {
      // 没有登录用户，返回空
      setQuestions([]);
      setTotalQuestions(0);
      setCompletedCount(0);
      setNeedsGeneration(false);
      return;
    }

    setIsChecking(true);
    setIsLoading(true);

    try {
      const difficulty = options.difficulty || 1;

      // 调用智能检查生成API
      // 注意：不再传递 answerHistory，让 API 直接从 Supabase 查询
      const response = await apiFetch("/api/questions/check-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: currentChild.id,
          gradeLevel: currentChild.gradeLevel.grade,
          semester: currentChild.gradeLevel.semester,
          difficulty,
          category: options.category,
          count: options.count || 10,
          currentSeed: questionSeed,
          // 不再传递 answerHistory
        }),
      });

      if (!response.ok) {
        throw new Error("检查题目失败");
      }

      const data = await response.json();

      if (data.success) {
        console.log(`[智能题库] ${data.action}:`, {
          total: data.totalQuestions,
          completed: data.completedCount,
          incomplete: data.incompleteCount,
        });

        setQuestions(data.questions || []);
        setTotalQuestions(data.totalQuestions || 0);
        setCompletedCount(data.completedCount || 0);
        setNeedsGeneration(data.needsGeneration || false);

        // 如果生成了新种子，更新到 store
        if (data.newSeed) {
          setQuestionSeed(data.newSeed);
        }
      }
    } catch (error) {
      console.error("[智能题库] 获取题目失败:", error);

      // 降级：使用当前种子
      let seed = questionSeed;
      if (!seed) {
        setQuestions([]);
        setTotalQuestions(0);
        setCompletedCount(0);
        return;
      }

      let allQuestions = seed.questions || [];
      if (options.difficulty) {
        allQuestions = allQuestions.filter((q: any) => q.difficulty === options.difficulty);
      }
      if (options.category) {
        allQuestions = allQuestions.filter((q: any) => q.category === options.category);
      }

      setQuestions(allQuestions);
      setTotalQuestions(allQuestions.length);
      setCompletedCount(0);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  }, [
    currentChild,
    questionSeed,
    options.difficulty,
    options.category,
    options.count,
    setQuestionSeed,
  ]);

  // 初始化：获取题目
  useEffect(() => {
    checkAndFetchQuestions();
  }, [
    // 只在这些关键参数变化时重新检查
    currentChild?.id,
    options.difficulty,
    options.category,
  ]);

  // 获取随机题目
  const getRandomQuestion = useCallback((): any | null => {
    if (questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }, [questions]);

  // 手动刷新（用于用户主动请求新题目）
  const refresh = useCallback(async () => {
    await checkAndFetchQuestions();
  }, [checkAndFetchQuestions]);

  return {
    questions,
    isLoading,
    isChecking,
    needsGeneration,
    completedCount,
    totalQuestions,
    refresh,
    getRandomQuestion,
  };
}
