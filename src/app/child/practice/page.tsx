"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Shuffle, Target, Volume2, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RecordingButton, TranscriptDisplay, ResultDisplay } from "@/components/speech/RecordingButton";
import { useSpeechWithOpenAI } from "@/hooks/useSpeechWithOpenAI";
import { useSmartQuestionBank } from "@/hooks/useSmartQuestionBank";
import { ServiceStatus } from "@/components/ServiceStatus";

const DIFFICULTY_INFO = {
  1: { name: "单词", emoji: "🔤", color: "from-green-400 to-green-600", bgColor: "bg-green-100" },
  2: { name: "短语", emoji: "💬", color: "from-blue-400 to-blue-600", bgColor: "bg-blue-100" },
  3: { name: "句子", emoji: "📝", color: "from-yellow-400 to-yellow-600", bgColor: "bg-yellow-100" },
  4: { name: "问答", emoji: "❓", color: "from-orange-400 to-orange-600", bgColor: "bg-orange-100" },
  5: { name: "情景", emoji: "🎭", color: "from-purple-400 to-purple-600", bgColor: "bg-purple-100" },
};

const CATEGORY_MAP: Record<number, "word" | "phrase" | "sentence" | "question" | "scenario"> = {
  1: "word",
  2: "phrase",
  3: "sentence",
  4: "question",
  5: "scenario",
};

type Step = "select-difficulty" | "instruction" | "recording" | "processing" | "result";

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentChild, addAnswerHistory, updateQuestionUsage } = useGameStore();

  const difficultyParam = searchParams.get("difficulty");

  const [step, setStep] = useState<Step>("select-difficulty");
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);

  // 使用智能题库（会自动检查完成情况，只在必要时生成新题目）
  const questionBank = useSmartQuestionBank();

  // 根据难度获取题目 (使用useCallback避免重复创建)
  const getQuestionsByDifficulty = useCallback((difficulty: number) => {
    return questionBank.questions.filter(q => q.difficulty === difficulty);
  }, [questionBank.questions]);

  // Auto-start practice when difficulty is passed via URL
  useEffect(() => {
    // 如果已经有 currentTask，说明已经初始化过了，不需要重复执行
    if (currentTask) return;

    // 如果正在检查或生成题目，等待完成
    if (questionBank.isChecking || questionBank.isLoading) return;

    if (difficultyParam && step === "select-difficulty") {
      const difficulty = parseInt(difficultyParam);
      if (difficulty >= 1 && difficulty <= 5) {
        const questions = getQuestionsByDifficulty(difficulty);
        if (questions.length > 0) {
          const randomIndex = Math.floor(Math.random() * questions.length);
          const selectedQuestion = questions[randomIndex];
          setSelectedDifficulty(difficulty);
          setCurrentTask(selectedQuestion);
          // 更新题目使用记录
          updateQuestionUsage(difficulty, selectedQuestion.id);
          setStep("instruction");
        }
      }
    }
  }, [difficultyParam, step, currentTask, questionBank.isChecking, questionBank.isLoading, questionBank.questions, getQuestionsByDifficulty, updateQuestionUsage]);

  // Get task type string
  const getTaskType = (difficulty: number): string => {
    const types = ["", "单词", "短语", "句子", "问答", "情景"];
    return types[difficulty] || "单词";
  };

  const {
    isRecording,
    isProcessing,
    transcript,
    realtimeTranscript,
    score: aiScore,
    passed: aiPassed,
    error,
    warning,
    recordingTime,
    evaluation,
    startRecording,
    stopRecording,
    reset,
    retry,
  } = useSpeechWithOpenAI({
    taskPrompt: currentTask?.prompt || "",
    expectedAnswers: currentTask?.expectedAnswers || [],
    taskType: getTaskType(selectedDifficulty || 1),
    gradeLevel: currentChild?.gradeLevel?.grade || 3,
    autoStop: true,
    onResult: (data) => {
      setResult({
        score: data.score,
        passed: data.passed,
      });

      // 记录答题历史
      if (currentTask && currentChild) {
        addAnswerHistory({
          questionId: currentTask.id,
          question: currentTask.prompt,
          passed: data.passed,
          score: data.score,
          difficulty: currentTask.difficulty || selectedDifficulty || 1,
          category: currentTask.category || CATEGORY_MAP[selectedDifficulty || 1],
        });
      }

      setStep("result");
    },
  });

  const handleSelectDifficulty = async (difficulty: number) => {
    setSelectedDifficulty(difficulty);

    // 从题库获取指定难度的题目
    let questions = getQuestionsByDifficulty(difficulty);
    if (questions.length === 0) {
      // 如果没有题目了，刷新获取新题目
      await questionBank.refresh();
      questions = getQuestionsByDifficulty(difficulty);
    }

    if (questions.length > 0) {
      // 随机选择一个题目
      const randomIndex = Math.floor(Math.random() * questions.length);
      const selectedQuestion = questions[randomIndex];
      setCurrentTask(selectedQuestion);
      // 更新题目使用记录
      updateQuestionUsage(difficulty, selectedQuestion.id);
      setStep("instruction");
    }
  };

  const handleStart = () => {
    startRecording();
    setStep("recording");
  };

  // Text-to-speech for the task prompt
  const speakTask = () => {
    if (currentTask && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentTask.prompt);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleRetry = () => {
    reset();
    setResult(null);
    setStep("instruction");
  };

  const handleNext = () => {
    // 从题库获取新的随机题目
    if (selectedDifficulty) {
      const questions = getQuestionsByDifficulty(selectedDifficulty);
      if (questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        const nextQuestion = questions[randomIndex];
        setCurrentTask(nextQuestion);
        // 更新题目使用记录
        updateQuestionUsage(selectedDifficulty, nextQuestion.id);
        reset();
        setResult(null);
        setStep("instruction");
      } else {
        // 没有更多题目了，刷新获取新题目
        questionBank.refresh().then(() => {
          const newQuestions = getQuestionsByDifficulty(selectedDifficulty!);
          if (newQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * newQuestions.length);
            const nextQuestion = newQuestions[randomIndex];
            setCurrentTask(nextQuestion);
            updateQuestionUsage(selectedDifficulty!, nextQuestion.id);
            reset();
            setResult(null);
            setStep("instruction");
          }
        });
      }
    }
  };

  const handleBack = () => {
    // 如果已经在难度选择页面，返回到英语世界页面
    if (step === "select-difficulty") {
      router.push("/child/english");
      return;
    }

    // 如果是在练习中（instruction、recording、processing、result），返回难度选择
    if (step === "instruction" || step === "recording" || step === "processing" || step === "result") {
      setSelectedDifficulty(null);
      setCurrentTask(null);
      setResult(null);
      reset();
      setStep("select-difficulty");
      // 清除 URL 中的 difficulty 参数，避免重新触发自动开始
      router.replace("/child/practice");
    }
  };

  const handleBackToEnglish = () => {
    router.push("/child/english");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 via-indigo-100 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                ←
              </Button>
              <h1 className="text-lg font-bold text-gray-800">
                {selectedDifficulty ? `${DIFFICULTY_INFO[selectedDifficulty as keyof typeof DIFFICULTY_INFO].name}练习` : "练习模式"}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded-full">
                <span>⭐</span>
                <span className="font-bold text-yellow-700">{currentChild?.currentPoints || 0}</span>
              </div>
              <Link href="/child/world">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 服务状态指示器 */}
          <ServiceStatus />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Difficulty */}
          {step === "select-difficulty" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">选择难度</h2>
                <p className="text-gray-600">点击难度开始随机练习</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((level) => {
                  const info = DIFFICULTY_INFO[level as keyof typeof DIFFICULTY_INFO];
                  const count = getQuestionsByDifficulty(level).length;
                  return (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectDifficulty(level)}
                      className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-gray-200 relative"
                    >
                      {questionBank.isChecking && (
                        <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      <div className="text-5xl mb-3">{info.emoji}</div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        Level {level}
                      </h3>
                      <p className="text-gray-600">{info.name}</p>
                      <div className={`mt-3 h-2 rounded-full bg-gradient-to-r ${info.color}`} />
                      <p className="text-xs text-gray-400 mt-2">{count} 道题目</p>
                    </motion.button>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 mt-6"
              >
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center flex items-center justify-center gap-2">
                  <Shuffle className="w-5 h-5" />
                  <span>每次点击都会随机抽取题目，练习模式不获得积分</span>
                </div>
                {currentChild && (
                  <div className="bg-purple-50 text-purple-800 p-3 rounded-xl text-center text-sm">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    AI 题库：{currentChild.gradeLevel.displayName}
                    {questionBank.completedCount > 0 && (
                      <span className="ml-2 text-green-600">✓ 已完成 {questionBank.completedCount} 题</span>
                    )}
                  </div>
                )}
                {questionBank.needsGeneration && (
                  <div className="bg-orange-50 text-orange-800 p-3 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>当前难度题目已完成，系统将自动生成新题目</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Step 2-5: Practice flow */}
          {currentTask && (
            <>
              {step !== "result" && (
                <motion.div
                  key="practice"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                >
                  <Card className="p-8 mb-8">
                    {/* Difficulty badge */}
                    <div className="flex justify-center mb-4">
                      <div className={`px-4 py-1 rounded-full ${DIFFICULTY_INFO[selectedDifficulty! as keyof typeof DIFFICULTY_INFO].bgColor} text-gray-700 font-semibold text-sm`}>
                        {DIFFICULTY_INFO[selectedDifficulty! as keyof typeof DIFFICULTY_INFO].emoji} {DIFFICULTY_INFO[selectedDifficulty! as keyof typeof DIFFICULTY_INFO].name}
                      </div>
                    </div>

                    {/* Task emoji */}
                    <motion.div
                      className="text-9xl text-center mb-6"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {currentTask.emoji}
                    </motion.div>

                    {/* Task prompt */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <h2 className="text-5xl font-display font-bold text-gray-800">
                          {currentTask.prompt}
                        </h2>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={speakTask}
                          className="p-3 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="播放发音"
                        >
                          <Volume2 className="w-6 h-6 text-blue-600" />
                        </motion.button>
                      </div>
                      <p className="text-xl text-gray-600">
                        请用英语读出上面的内容
                      </p>
                    </div>

                    {/* Info bar */}
                    <div className="flex items-center justify-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4" />
                        <span className="text-sm">随机练习</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>💡 不获得积分</span>
                      </div>
                    </div>
                  </Card>

                  <TranscriptDisplay
                    transcript={isRecording ? realtimeTranscript : transcript}
                    isRecording={isRecording}
                  />

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-6"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-center my-8">
                    <RecordingButton
                      isRecording={isRecording}
                      isProcessing={isProcessing}
                      disabled={isProcessing}
                      recordingTime={recordingTime}
                      warning={warning}
                      error={error}
                      onStart={handleStart}
                      onStop={stopRecording}
                      onRetry={retry}
                      autoStop={true}
                    />
                  </div>

                  {/* Hint */}
                  {step === "instruction" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-accent-50 text-accent-700 p-4 rounded-xl text-center"
                    >
                      💡 提示: {currentTask.hint}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Result */}
              {step === "result" && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <ResultDisplay
                    score={result.score}
                    passed={result.passed}
                    pointsEarned={0}
                    transcript={transcript}
                    expected={currentTask.expectedAnswers[0]}
                    onRetry={handleRetry}
                    showPoints={false}
                    mode="practice"
                  />

                  {/* AI Evaluation Feedback */}
                  {evaluation && (
                    <Card className="mt-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <h3 className="font-bold text-lg text-purple-800 mb-3 flex items-center gap-2">
                        <span>🤖</span> AI 老师的评价
                      </h3>

                      {evaluation.feedback && (
                        <div className="bg-white rounded-xl p-4 mb-4">
                          <p className="text-gray-700">{evaluation.feedback}</p>
                        </div>
                      )}

                      {/* Pronunciation Rating */}
                      {evaluation.pronunciation && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-600">发音评分:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              evaluation.pronunciation.rating === "excellent" ? "bg-green-100 text-green-700" :
                              evaluation.pronunciation.rating === "good" ? "bg-blue-100 text-blue-700" :
                              evaluation.pronunciation.rating === "fair" ? "bg-yellow-100 text-yellow-700" :
                              "bg-orange-100 text-orange-700"
                            }`}>
                              {evaluation.pronunciation.rating === "excellent" ? "优秀" :
                               evaluation.pronunciation.rating === "good" ? "良好" :
                               evaluation.pronunciation.rating === "fair" ? "及格" : "需要改进"}
                            </span>
                          </div>
                          {evaluation.pronunciation.details && Array.isArray(evaluation.pronunciation.details) && evaluation.pronunciation.details.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {evaluation.pronunciation.details.map((detail, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Corrections */}
                      {evaluation.corrections && Array.isArray(evaluation.corrections) && evaluation.corrections.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">💡 改进建议:</h4>
                          <div className="space-y-2">
                            {evaluation.corrections.map((correction, i) => (
                              <div key={i} className="bg-white rounded-lg p-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-red-500 line-through">{correction.original}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-green-600 font-medium">{correction.correct}</span>
                                </div>
                                {correction.explanation && (
                                  <p className="text-xs text-gray-500 mt-1">{correction.explanation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleRetry}
                    >
                      再练一次
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={handleNext}
                    >
                      <Shuffle className="w-4 h-4" />
                      下一题
                    </Button>
                  </div>

                  {/* Back to difficulty */}
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        setSelectedDifficulty(null);
                        setCurrentTask(null);
                        setResult(null);
                        reset();
                        setStep("select-difficulty");
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      ← 返回难度选择
                    </button>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
