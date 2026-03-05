/**
 * 智能题库管理 Hook
 * 优化策略：
 * 1. 优先使用现有 questionSeed 中的题目（客户端按 difficulty 过滤）
 * 2. 只有在没有种子时才调用 API
 * 3. 客户端负责按 difficulty 过滤题目
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
  const [hasInitialized, setHasInitialized] = useState(false);

  /**
   * 智能获取题目：
   * 1. 优先使用现有 questionSeed（不调用 API）
   * 2. 只有在没有种子时才调用 API
   * 3. 客户端按 difficulty 过滤
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
      // 优先使用现有种子中的所有题目
      if (questionSeed && questionSeed.questions && questionSeed.questions.length > 0) {
        console.log(`[智能题库] 使用现有种子，共 ${questionSeed.questions.length} 道题目`);
        setQuestions(questionSeed.questions);
        setTotalQuestions(questionSeed.questions.length);
        setCompletedCount(0);
        setNeedsGeneration(false);
        setHasInitialized(true);
      } else {
        // 没有种子，需要调用 API 获取
        console.log(`[智能题库] 没有种子，调用 API 获取题目`);

        // 调用生成题目 API（不使用 check-generate，因为那是针对特定难度的）
        const response = await apiFetch("/api/questions/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gradeLevel: currentChild.gradeLevel.grade,
            semester: currentChild.gradeLevel.semester,
            weakAreas: [],
            wrongQuestions: [],
            count: 50, // 获取足够多的题目覆盖所有难度
            // 不指定 difficulty，让 API 生成所有难度
          }),
        });

        if (!response.ok) {
          throw new Error("生成题目失败");
        }

        const data = await response.json();

        if (data.success && data.seed) {
          console.log(`[智能题库] API 返回 ${data.seed.questions?.length || 0} 道题目`);
          setQuestionSeed(data.seed);
          setQuestions(data.seed.questions || []);
          setTotalQuestions(data.seed.questions?.length || 0);
          setCompletedCount(0);
          setNeedsGeneration(false);
        } else {
          // API 失败，使用默认种子
          console.log(`[智能题库] API 失败，使用默认题目`);
          const { getDefaultSeed } = await import("@/lib/questionGenerator");
          const defaultSeed = getDefaultSeed(currentChild.gradeLevel.grade, currentChild.gradeLevel.semester);
          setQuestionSeed(defaultSeed);
          setQuestions(defaultSeed.questions || []);
          setTotalQuestions(defaultSeed.questions?.length || 0);
          setCompletedCount(0);
          setNeedsGeneration(false);
        }
        setHasInitialized(true);
      }
    } catch (error) {
      console.error("[智能题库] 获取题目失败:", error);

      // 降级：使用默认种子
      try {
        const { getDefaultSeed } = require("@/lib/questionGenerator");
        const defaultSeed = getDefaultSeed(currentChild.gradeLevel.grade, currentChild.gradeLevel.semester);
        setQuestionSeed(defaultSeed);
        setQuestions(defaultSeed.questions || []);
        setTotalQuestions(defaultSeed.questions?.length || 0);
        setCompletedCount(0);
      } catch (e) {
        setQuestions([]);
        setTotalQuestions(0);
        setCompletedCount(0);
      }
      setNeedsGeneration(false);
      setHasInitialized(true);
    } finally {
      setIsChecking(false);
      setIsLoading(false);
    }
  }, [
    currentChild,
    questionSeed,
    setQuestionSeed,
  ]);

  // 初始化：只在第一次加载时获取题目
  useEffect(() => {
    if (!hasInitialized && !isChecking) {
      checkAndFetchQuestions();
    }
  }, [hasInitialized, isChecking, checkAndFetchQuestions]);

  // 当 questionSeed 变化时，更新 questions
  useEffect(() => {
    if (questionSeed && questionSeed.questions) {
      setQuestions(questionSeed.questions);
      setTotalQuestions(questionSeed.questions.length);
    }
  }, [questionSeed]);

  // 获取随机题目
  const getRandomQuestion = useCallback((): any | null => {
    if (questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }, [questions]);

  // 手动刷新
  const refresh = useCallback(async () => {
    setHasInitialized(false);
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
