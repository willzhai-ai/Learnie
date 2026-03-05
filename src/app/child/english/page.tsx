"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Home, Trophy, Zap, Shuffle, Sparkles, Mountain } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QuestionGenerationLoading } from "@/components/QuestionGenerationLoading";
import { isSeedExpired } from "@/lib/questionGenerator";

// 防止 Hydration 不匹配的 Hook
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

const DIFFICULTY_LEVELS = [
  { level: 1, name: "单词", color: "from-green-400 to-green-600", icon: "🔤", description: "学习基础单词" },
  { level: 2, name: "短语", color: "from-blue-400 to-blue-600", icon: "💬", description: "练习常用短语" },
  { level: 3, name: "句子", color: "from-yellow-400 to-yellow-600", icon: "📝", description: "学说完整句子" },
  { level: 4, name: "问答", color: "from-orange-400 to-orange-600", icon: "❓", description: "回答简单问题" },
  { level: 5, name: "情景", color: "from-purple-400 to-purple-600", icon: "🎭", description: "模拟真实对话" },
];

type Tab = "practice" | "contest" | "tower" | "achievements";

export default function EnglishWorldPage() {
  const router = useRouter();
  const mounted = useMounted();
  const {
    currentChild,
    questionSeed,
    isGeneratingSeed,
    generateQuestionSeed,
    getRemainingQuestions,
    contestMode,
    towerMode,
  } = useGameStore();
  const [activeTab, setActiveTab] = useState<Tab>("tower");
  const [showLoading, setShowLoading] = useState(false);
  const [needsGeneration, setNeedsGeneration] = useState(false);

  // 检查是否需要生成题库
  useEffect(() => {
    if (!currentChild) return;

    // 检查种子是否过期或不存在
    const needNewSeed = !questionSeed ||
      isSeedExpired(questionSeed) ||
      questionSeed.gradeLevel !== currentChild.gradeLevel.grade ||
      questionSeed.semester !== currentChild.gradeLevel.semester;

    if (needNewSeed && !isGeneratingSeed) {
      setNeedsGeneration(true);
      setShowLoading(true);

      // 优化：先生成 Level 1，让用户可以快速开始练习
      generateQuestionSeed({ difficulty: 1, count: 10 }).then(() => {
        // Level 1 生成完成，隐藏加载页面，让用户可以开始
        setTimeout(() => {
          setShowLoading(false);
        }, 300);

        // 在后台继续生成其他难度 (2-5)
        const generateRemainingDifficulties = async () => {
          for (let difficulty = 2; difficulty <= 5; difficulty++) {
            try {
              await generateQuestionSeed({ difficulty, count: 10 });
              // 每生成完一个难度，更新状态（可选：显示进度）
            } catch (error) {
              console.error(`生成 Level ${difficulty} 题目失败:`, error);
            }
          }
          // 全部完成后
          setNeedsGeneration(false);
        };

        // 启动后台生成
        generateRemainingDifficulties();
      }).catch(() => {
        // 生成失败也隐藏加载页面
        setShowLoading(false);
        setNeedsGeneration(false);
      });
    }
  }, [currentChild, questionSeed, isGeneratingSeed, generateQuestionSeed]);

  const handleBack = () => {
    router.push("/child/world");
  };

  const handleStartPractice = (difficulty: number) => {
    // 检查该难度是否需要重新生成题目
    const remaining = getRemainingQuestions(difficulty);
    if (remaining === 0 && !isGeneratingSeed) {
      // 题目用完了，重新生成该难度的题目
      setNeedsGeneration(true);
      setShowLoading(true);
      generateQuestionSeed({ difficulty, count: 10 }).then(() => {
        setTimeout(() => {
          setShowLoading(false);
          setNeedsGeneration(false);
          router.push(`/child/practice?difficulty=${difficulty}`);
        }, 500);
      }).catch(() => {
        setShowLoading(false);
        setNeedsGeneration(false);
      });
      return;
    }

    // Navigate to practice page with difficulty
    router.push(`/child/practice?difficulty=${difficulty}`);
  };

  // 显示加载页面
  if (showLoading && currentChild) {
    return (
      <QuestionGenerationLoading
        onComplete={() => {
          setShowLoading(false);
          setNeedsGeneration(false);
        }}
        gradeLevel={currentChild.gradeLevel.grade}
        semester={currentChild.gradeLevel.semester}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-100 via-indigo-100 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="text-3xl">🌍</div>
            <h1 className="text-xl font-bold text-gray-800">英语世界</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-yellow-700">{currentChild?.currentPoints || 0}</span>
            </div>

            <Link href="/child/world">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <Button
            variant={activeTab === "tower" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("tower")}
            className="gap-2"
          >
            <Mountain className="w-4 h-4" />
            爬塔模式
          </Button>
          <Button
            variant={activeTab === "contest" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("contest")}
            className="gap-2"
          >
            <Trophy className="w-4 h-4" />
            闯关模式
          </Button>
          <Button
            variant={activeTab === "practice" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("practice")}
            className="gap-2"
          >
            <span>📚</span>
            练习模式
          </Button>
          <Button
            variant={activeTab === "achievements" ? "primary" : "ghost"}
            size="md"
            onClick={() => setActiveTab("achievements")}
            className="gap-2"
          >
            <span>🏅</span>
            成就
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "tower" && (
            <motion.div
              key="tower"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="text-8xl mb-6">🏔️</div>
              <h2 className="text-4xl font-display font-bold gradient-text mb-4">
                爬塔挑战
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                和全国小朋友一起爬塔，看谁爬得更高！
              </p>

              <div className="bg-white rounded-2xl p-6 max-w-md mx-auto mb-8">
                <p className="text-gray-600 mb-2">我的最高层数</p>
                <p className="text-6xl font-bold text-indigo-600">
                  {mounted ? (towerMode.highestLevel || 1) : 1}
                </p>
                <p className="text-gray-500 mt-1">层</p>
              </div>

              <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl max-w-md mx-auto mb-8">
                <p className="font-semibold mb-2">🏔️ 爬塔规则</p>
                <ul className="text-sm text-left space-y-1">
                  <li>• 每层获得 <strong>1 积分</strong>，无上限</li>
                  <li>• 难度随层数逐渐增加</li>
                  <li>• 失败可以重试，不影响进度</li>
                  <li>• 爬得越高，排名越靠前！</li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="xl"
                onClick={() => router.push("/child/tower")}
                className="gap-2"
              >
                <Mountain className="w-5 h-5" />
                开始爬塔
              </Button>
            </motion.div>
          )}

          {activeTab === "contest" && (
            <motion.div
              key="contest"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="text-8xl mb-6">🏆</div>
              <h2 className="text-4xl font-display font-bold gradient-text mb-4">
                口语闯关挑战
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                挑战连续关卡，击败Boss获得积分！
              </p>

              <div className="bg-white rounded-2xl p-6 max-w-md mx-auto mb-8">
                <p className="text-gray-600 mb-2">历史最高</p>
                <p className="text-6xl font-bold text-primary-600">
                  {mounted ? contestMode.bestLevel || 0 : 0}
                </p>
                <p className="text-gray-500 mt-1">关</p>
              </div>

              <div className="bg-accent-50 text-accent-700 p-4 rounded-xl max-w-md mx-auto mb-8">
                <p className="font-semibold mb-2">⚡ 闯关规则</p>
                <ul className="text-sm text-left space-y-1">
                  <li>• 连续通过20关挑战</li>
                  <li>• 第5、10、15、20关是Boss战</li>
                  <li>• <strong>只有击败Boss才能获得积分！</strong></li>
                  <li>• Boss奖励：100 → 250 → 500 → 1000 积分</li>
                </ul>
              </div>

              <Button
                variant="primary"
                size="xl"
                onClick={() => router.push("/child/contest")}
                className="gap-2"
              >
                <Zap className="w-5 h-5" />
                开始闯关
              </Button>
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Practice mode header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">选择难度开始练习</h2>
                <p className="text-gray-600">每次点击都会随机抽取题目</p>
              </div>

              {/* Difficulty cards with start buttons */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DIFFICULTY_LEVELS.map((level, index) => {
                  const remaining = mounted ? getRemainingQuestions(level.level) : 10;
                  return (
                    <motion.button
                      key={level.level}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleStartPractice(level.level)}
                      className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-gray-200 text-left relative"
                    >
                      {mounted && isGeneratingSeed && (
                        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-5xl">{level.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">
                            Level {level.level}
                          </h3>
                          <p className="text-gray-600">{level.name}</p>
                        </div>
                        <Shuffle className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{level.description}</p>
                      <div className={`h-2 rounded-full bg-gradient-to-r ${level.color}`} />
                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                        <span>🎲 随机出题</span>
                        <span>•</span>
                        <span>不获得积分</span>
                        <span>•</span>
                        <span className={remaining === 0 ? "text-red-500" : "text-green-600"}>
                          剩余 {remaining} 题
                        </span>
                      </div>
                      {mounted && remaining === 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                          <Sparkles className="w-3 h-3" />
                          <span>点击生成新题目</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Info card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 mt-6"
              >
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-center">
                  💡 练习模式用于熟悉内容，不获得积分。去闯关模式击败Boss才能获得积分奖励！
                </div>
                {mounted && currentChild && questionSeed && !isGeneratingSeed && (
                  <div className="bg-purple-50 text-purple-800 p-3 rounded-xl text-center text-sm">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    AI 题库：{currentChild.gradeLevel.displayName}
                    <span className="ml-2 text-green-600">✓ 已生成个性化题目</span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                我的成就
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Sample achievements */}
                {[
                  { id: "first_task", name: "初出茅庐", desc: "完成第一个口语任务", icon: "🌱", unlocked: true },
                  { id: "boss_5", name: "Boss杀手", desc: "击败第1个Boss", icon: "🏆", unlocked: false },
                  { id: "boss_10", name: "Boss猎人", desc: "击败第2个Boss", icon: "🎯", unlocked: false },
                  { id: "boss_20", name: "Boss终结者", desc: "击败最终Boss", icon: "👑", unlocked: false },
                ].map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`p-4 ${!achievement.unlocked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-4xl ${!achievement.unlocked ? "grayscale" : ""}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{achievement.name}</h3>
                        <p className="text-sm text-gray-600">{achievement.desc}</p>
                      </div>
                      {achievement.unlocked && (
                        <Badge variant="success" size="sm">✓</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
