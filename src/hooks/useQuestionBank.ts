/**
 * 题库管理 Hook
 * 用于从种子获取题目，并自动检查是否需要生成新的种子
 */

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { getQuestionsFromSeed, isSeedExpired, getDefaultSeed, type GeneratedQuestion } from "@/lib/questionGenerator";

export function useQuestionBank(options?: {
  difficulty?: number;
  category?: "word" | "phrase" | "sentence" | "question" | "scenario";
  count?: number;
}) {
  const {
    currentChild,
    questionSeed,
    isGeneratingSeed,
    generateQuestionSeed,
  } = useGameStore();

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [needsNewSeed, setNeedsNewSeed] = useState(false);

  // 检查是否需要生成新种子
  const checkAndGenerateSeed = useCallback(async () => {
    if (!currentChild) return;
    if (isGeneratingSeed) return;

    // 检查当前种子是否过期或不存在
    const needNewSeed = !questionSeed ||
      isSeedExpired(questionSeed) ||
      questionSeed.gradeLevel !== currentChild.gradeLevel.grade ||
      questionSeed.semester !== currentChild.gradeLevel.semester;

    if (needNewSeed) {
      await generateQuestionSeed({
        count: 30,
        difficulty: options?.difficulty,
        category: options?.category,
      });
    }
  }, [currentChild, questionSeed, isGeneratingSeed, generateQuestionSeed, options]);

  // 初始化：获取题目
  useEffect(() => {
    if (!currentChild) return;

    let seed = questionSeed;

    // 如果没有种子或种子过期，使用默认种子并触发生成
    if (!seed || isSeedExpired(seed)) {
      seed = getDefaultSeed(
        currentChild.gradeLevel.grade,
        currentChild.gradeLevel.semester
      );

      // 从默认种子先设置题目（同步）
      let allQuestions = getQuestionsFromSeed(seed, 50, true);

      // 如果指定了难度或类型，进行过滤
      if (options?.difficulty) {
        allQuestions = allQuestions.filter((q) => q.difficulty === options.difficulty);
      }
      if (options?.category) {
        allQuestions = allQuestions.filter((q) => q.category === options.category);
      }

      setQuestions(allQuestions);
      setCurrentIndex(0);

      // 异步生成新种子（在后台）
      checkAndGenerateSeed();
      return;
    }

    // 从种子获取题目
    if (seed) {
      let allQuestions = getQuestionsFromSeed(seed, 50, true);

      // 如果指定了难度或类型，进行过滤
      if (options?.difficulty) {
        allQuestions = allQuestions.filter((q) => q.difficulty === options.difficulty);
      }
      if (options?.category) {
        allQuestions = allQuestions.filter((q) => q.category === options.category);
      }

      setQuestions(allQuestions);
      setCurrentIndex(0);
    }
  }, [currentChild, questionSeed, options, checkAndGenerateSeed]);

  // 获取当前题目
  const getCurrentQuestion = useCallback((): GeneratedQuestion | null => {
    if (questions.length === 0) return null;
    return questions[currentIndex];
  }, [questions, currentIndex]);

  // 获取下一题
  const getNextQuestion = useCallback((): GeneratedQuestion | null => {
    if (questions.length === 0) return null;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      // 题目用完了，重新洗牌
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentIndex(0);
      return shuffled[0];
    }

    setCurrentIndex(nextIndex);
    return questions[nextIndex];
  }, [questions, currentIndex]);

  // 随机获取题目
  const getRandomQuestion = useCallback((): GeneratedQuestion | null => {
    if (questions.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentIndex(randomIndex);
    return questions[randomIndex];
  }, [questions]);

  // 重置索引
  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return {
    questions,
    currentIndex,
    getCurrentQuestion,
    getNextQuestion,
    getRandomQuestion,
    reset,
    isGeneratingSeed,
    needsNewSeed,
    generateNewSeed: checkAndGenerateSeed,
  };
}
