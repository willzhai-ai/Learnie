"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Trophy, Target, X } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RecordingButton, TranscriptDisplay, ResultDisplay } from "@/components/speech/RecordingButton";
import { useSpeechWithScoring } from "@/hooks/useSpeech";
import { calculatePoints } from "@/lib/utils";

// Contest tasks - increasing difficulty
const CONTEST_TASKS = [
  // Levels 1-4: Simple words and phrases
  { id: "c01", prompt: "hello", expectedAnswers: ["hello", "Hello"], emoji: "👋", difficulty: 1, basePoints: 15 },
  { id: "c02", prompt: "yes", expectedAnswers: ["yes", "Yes"], emoji: "✅", difficulty: 1, basePoints: 15 },
  { id: "c03", prompt: "no", expectedAnswers: ["no", "No"], emoji: "❌", difficulty: 1, basePoints: 15 },
  { id: "c04", prompt: "water", expectedAnswers: ["water", "Water"], emoji: "💧", difficulty: 1, basePoints: 15 },
  { id: "c05", prompt: "Good bye", expectedAnswers: ["Good bye", "goodbye", "Goodbye"], emoji: "👋", difficulty: 2, basePoints: 18 },
  { id: "c06", prompt: "I am happy", expectedAnswers: ["I am happy", "I'm happy"], emoji: "😊", difficulty: 2, basePoints: 18 },
  { id: "c07", prompt: "It is red", expectedAnswers: ["It is red", "it is red", "It's red"], emoji: "🔴", difficulty: 2, basePoints: 18 },
  { id: "c08", prompt: "Nice to meet you", expectedAnswers: ["Nice to meet you"], emoji: "🤝", difficulty: 2, basePoints: 18 },
  { id: "c09", prompt: "I like apples", expectedAnswers: ["I like apples", "I like apples."], emoji: "🍎", difficulty: 3, basePoints: 22 },
  { id: "c10", prompt: "I can swim", expectedAnswers: ["I can swim", "I can swim."], emoji: "🏊", difficulty: 3, basePoints: 22 },
  { id: "c11", prompt: "The cat is cute", expectedAnswers: ["The cat is", "cat is cute"], emoji: "🐱", difficulty: 3, basePoints: 22 },
  { id: "c12", prompt: "I want a book", expectedAnswers: ["I want", "I would like"], emoji: "📖", difficulty: 3, basePoints: 22 },
  { id: "c13", prompt: "Thank you very much", expectedAnswers: ["Thank you", "You're welcome"], emoji: "🙏", difficulty: 4, basePoints: 27 },
  { id: "c14", prompt: "Excuse me, where is the school?", expectedAnswers: ["Excuse me", "where is"], emoji: "🏫", difficulty: 4, basePoints: 27 },
  { id: "c15", prompt: "Good morning, teacher", expectedAnswers: ["Good morning", "morning"], emoji: "👩‍🏫", difficulty: 4, basePoints: 27 },
  { id: "c16", prompt: "See you later, my friend", expectedAnswers: ["See you", "later"], emoji: "👋", difficulty: 4, basePoints: 27 },
  { id: "c17", prompt: "I have a dog and a cat", expectedAnswers: ["I have", "dog and cat"], emoji: "🐕", difficulty: 5, basePoints: 33 },
  { id: "c18", prompt: "The sun is hot and the sky is blue", expectedAnswers: ["sun is", "sky is"], emoji: "☀️", difficulty: 5, basePoints: 33 },
  { id: "c19", prompt: "I would like some water please", expectedAnswers: ["I would like", "I want", "some water"], emoji: "💧", difficulty: 5, basePoints: 33 },
];

// Boss dialogue battles - comprehensive speaking tests
const BOSS_BATTLES: Record<number, {
  level: number;
  name: string;
  emoji: string;
  scenario: string;
  dialogue: Array<{
    speaker: "boss" | "child";
    text: string;
    expectedAnswers: string[];
    hint: string;
  }>;
}> = {
  5: {
    level: 5,
    name: "水果店老板",
    emoji: "👨‍🍳",
    scenario: "在水果店，你想买苹果",
    dialogue: [
      {
        speaker: "boss",
        text: "欢迎光临！你想买什么水果？",
        expectedAnswers: [],
        hint: "老板问你想要什么"
      },
      {
        speaker: "child",
        text: "我想要苹果 (I want apple)",
        expectedAnswers: ["I want", "I would like", "apple", "apples"],
        hint: "说出: I want apple"
      },
    ],
  },
  10: {
    level: 10,
    name: "学校老师",
    emoji: "👩‍🏫",
    scenario: "早上在学校遇到老师",
    dialogue: [
      {
        speaker: "boss",
        text: "早上好！你叫什么名字？",
        expectedAnswers: [],
        hint: "老师问你叫什么名字"
      },
      {
        speaker: "child",
        text: "我叫...，很高兴认识你",
        expectedAnswers: ["My name is", "I am", "Nice to meet you"],
        hint: "说出你的名字和问候"
      },
    ],
  },
  15: {
    level: 15,
    name: "图书馆管理员",
    emoji: "👩‍💼",
    scenario: "在图书馆找书",
    dialogue: [
      {
        speaker: "boss",
        text: "你好！请问需要帮忙吗？你想找什么书？",
        expectedAnswers: [],
        hint: "管理员想帮你找书"
      },
      {
        speaker: "child",
        text: "我想找一本关于猫的书",
        expectedAnswers: ["I am looking for", "I want", "book about", "cats"],
        hint: "说出你想找关于猫的书"
      },
    ],
  },
  20: {
    level: 20,
    name: "终极挑战 - 魔龙",
    emoji: "🐉",
    scenario: "击败魔龙，展示你的英语能力！",
    dialogue: [
      {
        speaker: "boss",
        text: "勇敢的冒险者！告诉我，你现在感觉怎么样？",
        expectedAnswers: [],
        hint: "魔龙问你感觉如何"
      },
      {
        speaker: "child",
        text: "我很开心，我可以说英语",
        expectedAnswers: ["I am happy", "I'm happy", "I can speak", "English"],
        hint: "说出你的感觉和英语能力"
      },
    ],
  },
};

type Step = "intro" | "instruction" | "recording" | "processing" | "result" | "gameover";

// Boss levels: every 5th level
const isBossLevel = (level: number) => level % 5 === 0;

// Boss rewards
const getBossReward = (level: number) => {
  // Level 5 boss: 100 points
  // Level 10 boss: 250 points
  // Level 15 boss: 500 points
  // Level 20 boss: 1000 points
  if (level === 5) return 100;
  if (level === 10) return 250;
  if (level === 15) return 500;
  if (level === 20) return 1000;
  return 50; // Default boss reward
};

export default function ContestPage() {
  const router = useRouter();
  const { startContest, nextContestLevel, endContest, contestMode, addPoints } = useGameStore();

  const [step, setStep] = useState<Step>("intro");
  const [currentLevel, setCurrentLevel] = useState(1);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    pointsEarned: number;
    isBoss: boolean;
  } | null>(null);

  const currentTask = CONTEST_TASKS[Math.min(currentLevel - 1, CONTEST_TASKS.length - 1)];
  const currentIsBoss = isBossLevel(currentLevel);
  const currentBoss = currentIsBoss ? BOSS_BATTLES[currentLevel] : null;

  // Get the expected answers based on whether it's a boss battle
  const getExpectedAnswers = () => {
    if (currentIsBoss && currentBoss) {
      // Get child's response from boss dialogue
      const childDialogue = currentBoss.dialogue.find(d => d.speaker === "child");
      return childDialogue?.expectedAnswers || [""];
    }
    return currentTask?.expectedAnswers || [""];
  };

  const {
    isRecording,
    transcript,
    hasResult,
    error,
    warning,
    recordingTime,
    startRecording,
    stopRecording,
    reset,
    retry,
  } = useSpeechWithScoring(getExpectedAnswers(), (data) => {
    setStep("processing");

    setTimeout(() => {
      const passed = data.passed;
      const isBoss = currentIsBoss;

      if (passed) {
        // Only give points for boss levels
        const pointsEarned = isBoss ? getBossReward(currentLevel) : 0;

        if (isBoss && pointsEarned > 0) {
          addPoints(pointsEarned);
        }

        nextContestLevel();
        setResult({
          score: data.score,
          passed: true,
          pointsEarned,
          isBoss,
        });
        setStep("result");
      } else {
        // Game over - failed
        endContest();
        setResult({
          score: data.score,
          passed: false,
          pointsEarned: 0,
          isBoss,
        });
        setStep("gameover");
      }
    }, 1000);
  });

  const handleStartContest = () => {
    startContest();
    setCurrentLevel(1);
    setStep("instruction");
  };

  const handleStartLevel = () => {
    startRecording();
    setStep("recording");
  };

  const handleNextLevel = () => {
    reset();
    setResult(null);
    setCurrentLevel((prev) => prev + 1);
    setStep("instruction");
  };

  const handleBackToHome = () => {
    reset();
    setResult(null);
    router.push("/child/english");
  };

  const handleRestart = () => {
    reset();
    setResult(null);
    setCurrentLevel(1);
    setStep("instruction");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-100 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToHome}
            >
              ←
            </Button>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              闯关模式
            </h1>
          </div>

          {step !== "intro" && (
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 px-4 py-1.5 rounded-full">
                <span className="font-bold text-purple-700">第 {currentLevel} 关</span>
              </div>
              <Link href="/child/english">
                <Button variant="ghost" size="sm">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center py-12"
            >
              <motion.div
                className="text-9xl mb-6"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🏆
              </motion.div>
              <h1 className="text-5xl font-display font-bold gradient-text mb-4">
                口语闯关挑战
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                挑战连续关卡，看你能闯到第几关！
              </p>

              <Card className="p-6 max-w-md mx-auto mb-8">
                <p className="text-gray-600 mb-2">历史最高纪录</p>
                <p className="text-6xl font-bold text-primary-600">
                  {contestMode.bestLevel || 0}
                </p>
                <p className="text-gray-500 mt-1">关</p>
              </Card>

              <div className="bg-accent-50 text-accent-700 p-4 rounded-xl max-w-md mx-auto mb-8">
                <p className="font-semibold mb-2">⚡ 闯关规则</p>
                <ul className="text-sm text-left space-y-1">
                  <li>• 每关难度逐渐增加</li>
                  <li>• 失败一次即挑战结束</li>
                  <li>• <strong>只有击败Boss（第5、10、15、20关）才能获得积分！</strong></li>
                  <li>• Boss奖励：100 → 250 → 500 → 1000 积分</li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="xl"
                onClick={handleStartContest}
                className="gap-2"
              >
                <Target className="w-5 h-5" />
                开始挑战
              </Button>
            </motion.div>
          )}

          {(step === "instruction" || step === "recording" || step === "processing") && (
            <motion.div
              key="game"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className={`p-8 mb-8 ${currentIsBoss ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400" : ""}`}>
                {/* Level indicator */}
                <div className="flex justify-center mb-6">
                  {currentIsBoss ? (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg">
                      <span className="text-2xl">👑</span>
                      <span>BOSS战 - 第 {currentLevel} 关</span>
                    </div>
                  ) : (
                    <div className="bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-bold">
                      第 {currentLevel} 关 / 共 {CONTEST_TASKS.length} 关
                    </div>
                  )}
                </div>

                {/* Boss reward indicator */}
                {currentIsBoss && currentBoss && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4"
                  >
                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
                      <span>🏆</span>
                      <span className="font-bold">奖励: {getBossReward(currentLevel)} 积分</span>
                    </div>
                  </motion.div>
                )}

                {/* Boss Dialogue Interface */}
                {currentIsBoss && currentBoss ? (
                  <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-yellow-300">
                    {/* Boss avatar and name */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-yellow-200">
                      <div className="text-6xl">{currentBoss.emoji}</div>
                      <div>
                        <p className="text-sm text-gray-500">Boss挑战</p>
                        <p className="text-xl font-bold text-gray-800">{currentBoss.name}</p>
                      </div>
                    </div>

                    {/* Scenario description */}
                    <div className="bg-yellow-50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-yellow-800 mb-1">📖 场景</p>
                      <p className="text-gray-700">{currentBoss.scenario}</p>
                    </div>

                    {/* Dialogue */}
                    <div className="space-y-4">
                      {currentBoss.dialogue.map((line, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: line.speaker === "boss" ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className={`flex items-start gap-3 ${
                            line.speaker === "boss" ? "" : "flex-row-reverse"
                          }`}
                        >
                          <div className={`text-4xl flex-shrink-0 ${
                            line.speaker === "boss" ? "order-1" : "order-2"
                          }`}>
                            {line.speaker === "boss" ? currentBoss.emoji : "🧒"}
                          </div>
                          <div className={`flex-1 p-4 rounded-2xl ${
                            line.speaker === "boss"
                              ? "bg-red-50 text-left"
                              : "bg-blue-50 text-right"
                          } ${line.speaker === "child" && line.expectedAnswers.length > 0 ? "ring-2 ring-blue-400" : ""}`}>
                            <p className="text-gray-700">
                              {line.speaker === "boss" ? currentBoss.name.split("-")[0] : "你"}: {line.text}
                            </p>
                            {line.speaker === "child" && line.expectedAnswers.length > 0 && (
                              <p className="text-xs text-blue-600 mt-2">
                                💬 请用英语回答
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Regular Task */
                  <>
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
                      <h2 className="text-5xl font-display font-bold text-gray-800 mb-3">
                        {currentTask.prompt}
                      </h2>
                      <p className="text-xl text-gray-600">
                        请用英语读出上面的内容
                      </p>
                      <p className="text-sm text-gray-400 mt-2">普通关卡不获得积分</p>
                    </div>
                  </>
                )}
              </Card>

              <TranscriptDisplay transcript={transcript} isRecording={isRecording} />

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
                  isProcessing={step === "processing"}
                  disabled={step === "processing"}
                  recordingTime={recordingTime}
                  warning={warning}
                  error={error}
                  onStart={handleStartLevel}
                  onStop={stopRecording}
                  onRetry={retry}
                  autoStop={true}
                />
              </div>
            </motion.div>
          )}

          {step === "result" && result && result.passed && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={`p-8 text-center border-2 ${result.isBoss ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400" : "bg-success-50 border-success-200"}`}>
                <motion.div
                  className="text-9xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  {result.isBoss ? "🏆" : "🎉"}
                </motion.div>
                <h2 className={`text-4xl font-bold mb-2 ${result.isBoss ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600" : "text-success-600"}`}>
                  {result.isBoss ? "击败Boss！" : "挑战成功！"}
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  {result.isBoss
                    ? `恭喜击败第 ${currentLevel} 关Boss！`
                    : `恭喜通过第 ${currentLevel} 关`
                  }
                </p>

                <div className={`rounded-2xl p-6 mb-6 ${result.isBoss ? "bg-yellow-100" : "bg-white"}`}>
                  <p className="text-gray-600 mb-1">本关得分</p>
                  <p className={`text-5xl font-bold ${result.isBoss ? "text-yellow-600" : "text-success-600"}`}>{result.score}</p>
                  {result.isBoss && result.pointsEarned > 0 ? (
                    <p className="text-yellow-700 mt-2 text-lg font-bold">🎁 获得 {result.pointsEarned} 积分！</p>
                  ) : !result.isBoss ? (
                    <p className="text-gray-500 mt-2">普通关卡不获得积分</p>
                  ) : null}
                </div>

                {result.isBoss && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center gap-2 mb-6"
                  >
                    {[...Array(10)].map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.4 + i * 0.05, type: "spring" }}
                        className="text-3xl"
                      >
                        ⭐
                      </motion.span>
                    ))}
                  </motion.div>
                )}

                <Button
                  variant="primary"
                  size="xl"
                  onClick={handleNextLevel}
                  className="gap-2"
                >
                  挑战下一关
                  <Target className="w-5 h-5" />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === "gameover" && result && !result.passed && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={`p-8 text-center border-2 ${result.isBoss ? "bg-red-50 border-red-300" : "bg-red-50 border-red-200"}`}>
                <motion.div
                  className="text-9xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {result.isBoss ? "🐉" : "💔"}
                </motion.div>
                <h2 className="text-4xl font-bold text-red-600 mb-2">
                  {result.isBoss ? "Boss战失败！" : "挑战失败"}
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  {result.isBoss
                    ? `很遗憾，未能击败第 ${currentLevel} 关Boss！`
                    : `止步于第 ${currentLevel} 关`
                  }
                </p>
                {result.isBoss && (
                  <p className="text-sm text-red-500 mb-6">
                    击败Boss无法获得积分奖励
                  </p>
                )}

                <div className="bg-white rounded-2xl p-6 mb-6">
                  <p className="text-gray-600 mb-1">本次挑战</p>
                  <p className="text-5xl font-bold text-primary-600">{currentLevel - 1}</p>
                  <p className="text-gray-500 mt-2">关</p>
                </div>

                <div className="bg-white rounded-2xl p-6 mb-6">
                  <p className="text-gray-600 mb-1">历史最高</p>
                  <p className="text-5xl font-bold text-yellow-600">
                    {Math.max(contestMode.bestLevel, currentLevel - 1)}
                  </p>
                  <p className="text-gray-500 mt-2">关</p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={handleBackToHome}
                  >
                    返回
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={handleRestart}
                  >
                    再来一次
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
