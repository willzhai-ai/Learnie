/**
 * 题目生成加载页面
 * 显示AI生成题库的进度
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Book, CheckCircle } from "lucide-react";

export interface QuestionGenerationLoadingProps {
  onComplete: () => void;
  gradeLevel: number;
  semester: string;
}

type GenerationStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "done";
  progress: number;
};

export function QuestionGenerationLoading({
  onComplete,
  gradeLevel,
  semester,
}: QuestionGenerationLoadingProps) {
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: "analyze", label: "分析学习情况", status: "pending", progress: 0 },
    { id: "generate", label: "AI 正在出题", status: "pending", progress: 0 },
    { id: "validate", label: "检查题目质量", status: "pending", progress: 0 },
  ]);

  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    let currentStep = 0;

    const simulateGeneration = async () => {
      // Step 1: 分析学习情况
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[0].status = "processing";
        return newSteps;
      });

      await simulateStep(0, 30, 1000);

      // Step 2: AI生成题目
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[0].status = "done";
        newSteps[1].status = "processing";
        return newSteps;
      });

      await simulateStep(1, 60, 3000);

      // Step 3: 检查题目质量
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[1].status = "done";
        newSteps[2].status = "processing";
        return newSteps;
      });

      await simulateStep(2, 100, 800);

      // 完成
      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[2].status = "done";
        return newSteps;
      });

      // 延迟一下再显示完成动画
      setTimeout(() => {
        onComplete();
      }, 500);
    };

    simulateGeneration();
  }, []);

  const simulateStep = async (
    stepIndex: number,
    targetProgress: number,
    duration: number
  ) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(targetProgress, (elapsed / duration) * 100);

      setSteps((prev) => {
        const newSteps = [...prev];
        newSteps[stepIndex].progress = progress;
        return newSteps;
      });

      const overallProgressValue =
        (stepIndex * 33 + progress * 0.33);
      setOverallProgress(overallProgressValue);

      if (progress >= targetProgress) {
        clearInterval(interval);
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* 主卡片 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* 标题 */}
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              <Sparkles className="w-16 h-16 mx-auto text-purple-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              AI 正在为你准备题目
            </h1>
            <p className="text-gray-600">
              {gradeLevel}年级{semester} · 每种难度10道题目
            </p>
          </motion.div>

          {/* 进度条 */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">准备进度</span>
              <span className="text-sm font-bold text-purple-600">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>

          {/* 步骤列表 */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="flex-shrink-0">
                  {step.status === "pending" && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    </div>
                  )}
                  {step.status === "processing" && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"
                      />
                    </div>
                  )}
                  {step.status === "done" && (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === "done" ? "text-green-600" :
                    step.status === "processing" ? "text-purple-600" :
                    "text-gray-400"
                  }`}>
                    {step.label}
                  </p>
                  {step.status === "processing" && (
                    <motion.div
                      className="h-1 bg-purple-200 rounded-full mt-1"
                      initial={{ width: 0 }}
                      animate={{ width: `${step.progress}%` }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* 提示信息 */}
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 bg-purple-50 rounded-xl text-center"
          >
            <p className="text-sm text-purple-800 flex items-center justify-center gap-2">
              <Book className="w-4 h-4" />
              题目会根据你的学习情况智能生成
            </p>
          </motion.div>
        </div>

        {/* 装饰性动画 */}
        <motion.div
          className="absolute -top-20 -right-20 text-6xl opacity-20"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          📚
        </motion.div>
      </motion.div>
    </div>
  );
}
