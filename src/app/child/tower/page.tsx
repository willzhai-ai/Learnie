"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Trophy,
  TrendingUp,
  Target,
  Play,
  ArrowLeft,
  Crown,
  Medal,
  Star,
  Zap,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { useSpeechWithScoring } from "@/hooks/useSpeech";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Step = "home" | "playing" | "result";

export default function TowerPage() {
  const { currentChild, towerMode, startTower, completeTowerLevel, getTowerLeaderboard, resetTower } = useGameStore();

  // 使用带评分的 speech hook
  const {
    transcript,
    isRecording,
    score,
    passed,
    hasResult,
    isSupported,
    error: speechError,
    startRecording,
    stopRecording,
    reset,
  } = useSpeechWithScoring(
    [], // 预期答案会在 startRecording 时传入
    {
      maxDuration: 15,
      noSpeechTimeout: 8,
    }
  );

  const [step, setStep] = useState<Step>("home");
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; score: number; pointsEarned: number } | null>(null);
  const [leaderboardError, setLeaderboardError] = useState(false);

  // 安全获取 leaderboard 和其他属性
  const leaderboard = towerMode?.leaderboard || [];
  const myRank = towerMode?.myRank || null;

  // 初始化爬塔模式
  useEffect(() => {
    let isMounted = true;

    const initTower = async () => {
      if (!isMounted) return;

      if (currentChild && !towerMode.isActive) {
        // 先启动爬塔（初始化进度）
        try {
          await startTower();
        } catch (err) {
          if (isMounted) console.error("启动爬塔失败:", err);
        }

        // 然后获取排行榜（允许失败）
        try {
          await getTowerLeaderboard();
        } catch (err) {
          if (isMounted) {
            console.warn("获取排行榜失败，但不影响使用:", err);
            setLeaderboardError(true);
          }
        }
      }
    };

    initTower();

    return () => {
      isMounted = false;
    };
  }, [currentChild?.id]);

  // 获取下一题
  const fetchNextQuestion = useCallback(async () => {
    if (!currentChild) return;

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/tower/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: currentChild.id,
          gradeLevel: currentChild.gradeLevel.grade,
          currentLevel: towerMode.currentLevel || 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "未知错误" }));
        throw new Error(errorData.error || "获取题目失败");
      }

      const data = await response.json();
      if (data.success) {
        setCurrentTask(data.question);
      } else {
        throw new Error(data.error || "获取题目失败");
      }
    } catch (error) {
      console.error("获取题目失败:", error);
      alert(`获取题目失败: ${error instanceof Error ? error.message : "请重试"}`);
      setStep("home");
    } finally {
      setIsLoading(false);
    }
  }, [currentChild, towerMode.currentLevel]);

  // 开始挑战
  const handleStart = async () => {
    await fetchNextQuestion();
    setStep("playing");
  };

  // 开始录音
  const handleStartRecording = () => {
    if (!currentTask) return;
    // 传入预期答案
    startRecording(currentTask.expectedAnswers);
  };

  // 停止录音并评分
  const handleStopRecording = () => {
    stopRecording();
  };

  // 监听评分完成
  useEffect(() => {
    if (hasResult && score !== null && passed !== null && step === "playing") {
      setResult({ passed, score, pointsEarned: passed ? 1 : 0 });
      setStep("result");
    }
  }, [hasResult, score, passed, step]);

  // 继续挑战
  const handleContinue = async () => {
    if (!currentTask || !currentChild) return;

    // 记录完成
    await completeTowerLevel(
      towerMode.currentLevel || 1,
      currentTask.id,
      result!.passed,
      result!.score
    );

    // 重置状态
    setResult(null);
    reset();
    setCurrentTask(null);

    // 获取下一题
    if (result!.passed) {
      await fetchNextQuestion();
      setStep("playing");
    } else {
      // 失败返回首页
      setStep("home");
    }
  };

  // 返回首页
  const handleBackHome = () => {
    resetTower();
    setResult(null);
    reset();
    setCurrentTask(null);
    setStep("home");
    setLeaderboardError(false);
  };

  // 刷新排行榜
  const handleRefreshLeaderboard = useCallback(async () => {
    setLeaderboardError(false);
    try {
      await getTowerLeaderboard();
    } catch (err) {
      console.warn("刷新排行榜失败:", err);
      setLeaderboardError(true);
    }
  }, [getTowerLeaderboard]);

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>;
  };

  // 获取难度颜色
  const getDifficultyColor = (difficulty: number) => {
    const colors = ["", "bg-green-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-red-500"];
    return colors[difficulty] || "bg-gray-500";
  };

  if (!currentChild) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-8 text-center">
            <p className="text-gray-500">请先登录</p>
            <Link href="/child/login">
              <Button variant="primary" className="mt-4">去登录</Button>
            </Link>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "home" ? (
              <button onClick={handleBackHome} className="text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link href="/child/english">
                <Home className="w-5 h-5 text-white" />
              </Link>
            )}
            <h1 className="text-xl font-bold text-white">🏔️ 爬塔挑战</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Target className="w-4 h-4 text-yellow-300" />
              <span className="font-bold text-white">第 {towerMode.currentLevel || 1} 层</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span className="font-bold text-white">{towerMode.highestLevel || 1} 层</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* 首页 */}
          {step === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 我的战绩 */}
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  我的战绩
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-indigo-600">{towerMode.highestLevel || 1}</p>
                    <p className="text-sm text-gray-600">最高层数</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{towerMode.totalPoints || 0}</p>
                    <p className="text-sm text-gray-600">获得积分</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{towerMode.questionsCompleted || 0}</p>
                    <p className="text-sm text-gray-600">完成题目</p>
                  </div>
                </div>
              </Card>

              {/* 开始挑战按钮 */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl font-bold py-8 rounded-2xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <Play className="w-8 h-8" />
                  {isLoading ? "加载中..." : "开始挑战"}
                </button>
              </motion.div>

              {/* 排行榜 */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    排行榜
                  </h2>
                  <button
                    onClick={handleRefreshLeaderboard}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title="刷新排行榜"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {leaderboardError ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>排行榜暂时无法加载</p>
                    <p className="text-sm mt-2">完成挑战后即可看到排名</p>
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>还没有人参与挑战</p>
                    <p className="text-sm">成为第一个挑战者吧！</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.child_id}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                          entry.child_id === currentChild.id
                            ? "bg-indigo-100 border-2 border-indigo-500"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(entry.rank)}
                        </div>
                        <span className="text-2xl">{entry.avatar_url || "🧒"}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {entry.child_name}
                            {entry.child_id === currentChild.id && (
                              <span className="ml-2 text-xs text-indigo-600">(你)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {entry.grade_level}年级 · {entry.questions_completed}题
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{entry.highest_level}</p>
                          <p className="text-xs text-gray-500">层</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {myRank && myRank > 10 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-sm text-blue-600">
                      你的排名: 第 <span className="font-bold">{myRank}</span> 名
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* 游戏中 */}
          {step === "playing" && currentTask && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="p-8">
                {/* 语音识别支持提示 */}
                {!isSupported && (
                  <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-xl text-center">
                    <p>请使用 Chrome 浏览器以获得最佳体验</p>
                  </div>
                )}

                {/* 难度和分类 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{currentTask.emoji || "📝"}</span>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getDifficultyColor(currentTask.difficulty)}`}>
                      Level {currentTask.difficulty}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    第 <span className="font-bold text-indigo-600">{towerMode.currentLevel || 1}</span> 层
                  </div>
                </div>

                {/* 题目 */}
                <div className="mb-8">
                  <p className="text-2xl font-bold text-center text-gray-800 mb-4">
                    请说出：
                  </p>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl">
                    <p className="text-3xl font-bold text-center text-indigo-600">
                      {currentTask.prompt}
                    </p>
                  </div>
                </div>

                {/* 录音按钮 */}
                <div className="flex justify-center">
                  {!isRecording ? (
                    <button
                      onClick={handleStartRecording}
                      disabled={!!speechError}
                      className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform disabled:opacity-50"
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                        <Zap className="w-10 h-10" />
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopRecording}
                      className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white animate-pulse"
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">停止</span>
                      </div>
                    </button>
                  )}
                </div>

                {/* 提示 */}
                <p className="text-center text-gray-500 mt-6">
                  {!isRecording ? "点击开始录音" : "正在录音中..."}
                </p>

                {/* 错误提示 */}
                {speechError && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-center">
                    {speechError}
                  </div>
                )}

                {/* 实时转录 */}
                {transcript && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">你说的：</p>
                    <p className="text-lg text-gray-800">{transcript}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* 结果 */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className={`p-8 ${result.passed ? "bg-gradient-to-br from-green-50 to-emerald-50" : "bg-gradient-to-br from-red-50 to-orange-50"}`}>
                {/* 结果图标 */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      result.passed ? "bg-green-500" : "bg-red-500"
                    }`}
                  >
                    {result.passed ? (
                      <Trophy className="w-12 h-12 text-white" />
                    ) : (
                      <span className="text-4xl text-white">😢</span>
                    )}
                  </motion.div>
                </div>

                {/* 结果文字 */}
                <h2 className={`text-2xl font-bold text-center mb-2 ${result.passed ? "text-green-600" : "text-red-600"}`}>
                  {result.passed ? "挑战成功！" : "再接再厉！"}
                </h2>

                {/* 分数 */}
                <div className="text-center mb-6">
                  <p className="text-5xl font-bold text-gray-800">{result.score}</p>
                  <p className="text-gray-600">分</p>
                </div>

                {/* 积分奖励 */}
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-2 bg-yellow-100 px-6 py-3 rounded-full">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-yellow-700">+{result.pointsEarned} 积分</span>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-4">
                  {result.passed ? (
                    <button
                      onClick={handleContinue}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-5 h-5" />
                      继续挑战
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setResult(null);
                          reset();
                          setStep("playing");
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-4 rounded-xl"
                      >
                        再试一次
                      </button>
                      <button
                        onClick={handleBackHome}
                        className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl"
                      >
                        返回首页
                      </button>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
