"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ShoppingBag, Star, Check } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const MOCK_PRIZES = [
  {
    id: "p1",
    name: "冰淇淋",
    image: "🍦",
    pointsRequired: 200,
    available: true,
  },
  {
    id: "p2",
    name: "动画片30分钟",
    image: "📺",
    pointsRequired: 100,
    available: true,
  },
  {
    id: "p3",
    name: "乐高积木小套装",
    image: "🧱",
    pointsRequired: 500,
    available: true,
  },
  {
    id: "p4",
    name: "去游乐园",
    image: "🎢",
    pointsRequired: 1000,
    available: true,
  },
  {
    id: "p5",
    name: "新故事书",
    image: "📚",
    pointsRequired: 300,
    available: true,
  },
];

type Step = "browse" | "confirm" | "success";

export default function ChildPrizesPage() {
  const router = useRouter();
  const { currentChild, addPoints } = useGameStore();
  const [step, setStep] = useState<Step>("browse");
  const [selectedPrize, setSelectedPrize] = useState<typeof MOCK_PRIZES[0] | null>(null);

  const currentPoints = currentChild?.currentPoints || 0;

  const handleRedeem = (prize: typeof MOCK_PRIZES[0]) => {
    if (currentPoints < prize.pointsRequired) {
      alert("积分不够哦，继续加油完成任务吧！");
      return;
    }
    setSelectedPrize(prize);
    setStep("confirm");
  };

  const handleConfirmRedeem = () => {
    if (!selectedPrize) return;

    // Deduct points
    addPoints(-selectedPrize.pointsRequired);

    // In production, this would save to database
    // TODO: Create redemption record in Supabase

    setStep("success");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("browse");
      setSelectedPrize(null);
    } else {
      router.back();
    }
  };

  const handleContinueShopping = () => {
    setStep("browse");
    setSelectedPrize(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent-100 via-yellow-50 to-orange-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <ShoppingBag className="w-5 h-5 text-primary-500" />
            <h1 className="text-lg font-bold text-gray-800">奖品商店</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700">{currentPoints}</span>
            </div>

            <Link href="/child/world">
              <Button variant="ghost" size="sm">
                🏠
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Welcome message */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8"
              >
                <div className="text-6xl mb-4">🎁</div>
                <h1 className="text-4xl font-display font-bold gradient-text mb-2">
                  奖品商店
                </h1>
                <p className="text-xl text-gray-600">
                  用你的积分兑换喜欢的奖品吧！
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-yellow-100 px-6 py-3 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-yellow-700 text-lg">
                    {currentPoints} 积分
                  </span>
                </div>
              </motion.div>

              {/* Prizes Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                {MOCK_PRIZES.map((prize, index) => {
                  const canAfford = currentPoints >= prize.pointsRequired;

                  return (
                    <motion.div
                      key={prize.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className={`p-6 h-full ${
                          !canAfford ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex flex-col h-full">
                          {/* Prize image/emoji */}
                          <div className="text-center mb-4">
                            <motion.div
                              className="text-8xl"
                              animate={
                                canAfford
                                  ? { y: [0, -5, 0] }
                                  : {}
                              }
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            >
                              {prize.image}
                            </motion.div>
                          </div>

                          {/* Prize name */}
                          <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                            {prize.name}
                          </h3>

                          {/* Points required */}
                          <div className="text-center mb-4">
                            <Badge
                              variant={
                                canAfford ? "primary" : "default"
                              }
                              size="lg"
                            >
                              {prize.pointsRequired} 积分
                            </Badge>
                          </div>

                          {/* Redeem button */}
                          <div className="mt-auto">
                            <Button
                              variant={canAfford ? "primary" : "outline"}
                              size="lg"
                              className="w-full"
                              onClick={() => handleRedeem(prize)}
                              disabled={!canAfford}
                            >
                              {canAfford ? "兑换" : "积分不足"}
                            </Button>

                            {!canAfford && (
                              <p className="text-center text-sm text-gray-500 mt-2">
                                还需要 {prize.pointsRequired - currentPoints} 积分
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-blue-50 rounded-2xl p-6 text-center"
              >
                <p className="text-blue-800">
                  💡 完成口语任务可以获得积分，连续答对还有额外奖励哦！
                </p>
              </motion.div>
            </motion.div>
          )}

          {step === "confirm" && selectedPrize && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="max-w-md mx-auto p-8">
                <div className="text-center">
                  <div className="text-8xl mb-4">{selectedPrize.image}</div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    确认兑换
                  </h2>

                  <p className="text-gray-600 mb-6">
                    你确定要用 {selectedPrize.pointsRequired} 积分兑换
                    <strong> {selectedPrize.name}</strong> 吗？
                  </p>

                  <div className="bg-yellow-50 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-gray-600">兑换后剩余积分</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {currentPoints - selectedPrize.pointsRequired}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={() => setStep("browse")}
                    >
                      再想想
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={handleConfirmRedeem}
                    >
                      确认兑换
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {step === "success" && selectedPrize && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="max-w-md mx-auto p-8 bg-success-50 border-success-200">
                <div className="text-center">
                  <motion.div
                    className="text-9xl mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    🎉
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                    className="mb-4"
                  >
                    <Check className="w-20 h-20 text-success-500 mx-auto" />
                  </motion.div>

                  <h2 className="text-3xl font-bold text-success-600 mb-2">
                    兑换成功！
                  </h2>

                  <p className="text-gray-600 mb-6">
                    你已成功兑换 <strong>{selectedPrize.name}</strong>
                  </p>

                  <p className="text-sm text-gray-500 mb-6">
                    请告诉爸爸妈妈，他们会为你准备这个奖品！
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={handleContinueShopping}
                    >
                      继续浏览
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1"
                      onClick={() => router.push("/child/world")}
                    >
                      返回主页
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
