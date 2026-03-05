"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trophy, Star, ShoppingBag } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SyncStatusCompact } from "@/components/SyncStatus";
import { CloudSyncButton } from "@/components/CloudSyncButton";

const WORLDS = [
  {
    id: "english",
    name: "英语世界",
    emoji: "🌍",
    description: "练习英语口语，获得积分！",
    color: "from-blue-400 to-blue-600",
    locked: false,
    path: "/child/english",
  },
  {
    id: "math",
    name: "数学世界",
    emoji: "🔢",
    description: "挑战数学题目，锻炼思维！",
    color: "from-purple-400 to-purple-600",
    locked: true,
    path: "#",
  },
  {
    id: "chinese",
    name: "语文世界",
    emoji: "📚",
    description: "学习拼音和汉字！",
    color: "from-red-400 to-red-600",
    locked: true,
    path: "#",
  },
];

export default function ChildWorldPage() {
  const router = useRouter();
  const { currentChild, logoutChild } = useGameStore();

  const handleLogout = () => {
    logoutChild();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-100 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{currentChild?.avatarUrl || "🧒"}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">{currentChild?.name}</h1>
                {/* 同步状态指示器 */}
                <SyncStatusCompact />
              </div>
              <p className="text-sm text-gray-600">Level {currentChild?.currentLevel || 1}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 云同步按钮 */}
            <CloudSyncButton />

            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-yellow-700">{currentChild?.currentPoints || 0}</span>
            </div>

            <Link href="/child/prizes">
              <Button variant="ghost" size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">奖品商店</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-display font-bold gradient-text mb-4">
            学习冒险世界
          </h1>
          <p className="text-xl text-gray-600">选择一个世界开始冒险！</p>
        </motion.div>

        {/* Worlds Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {WORLDS.map((world, index) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
            >
              {world.locked ? (
                // Locked World
                <Card className="relative overflow-hidden h-64">
                  <div className="absolute inset-0 bg-gray-200 opacity-50" />
                  <div className="relative h-full flex flex-col items-center justify-center p-6">
                    <div className="text-6xl mb-4 grayscale opacity-50">{world.emoji}</div>
                    <h2 className="text-2xl font-bold text-gray-400 mb-2">
                      {world.name}
                    </h2>
                    <Badge variant="default" size="md" className="mt-2">
                      🔒 需要解锁
                    </Badge>
                    <p className="text-sm text-gray-400 mt-4 text-center">
                      完成英语世界关卡后解锁
                    </p>
                  </div>
                </Card>
              ) : (
                // Unlocked World
                <Link href={world.path}>
                  <Card
                    variant="default"
                    hover
                    className={`relative overflow-hidden h-64 world-glow`}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${world.color} opacity-20`} />

                    {/* Content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-6">
                      <motion.div
                        className="text-7xl mb-4"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {world.emoji}
                      </motion.div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        {world.name}
                      </h2>
                      <p className="text-gray-600 text-center text-sm mb-4">
                        {world.description}
                      </p>
                      <Badge variant="success" size="md">
                        点击进入 →
                      </Badge>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/20 rounded-full" />
                  </Card>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 grid grid-cols-3 gap-4"
        >
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">
              {currentChild?.totalPointsEarned || 0}
            </p>
            <p className="text-sm text-gray-600">总积分</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-2xl font-bold text-gray-800">
              {useGameStore.getState().streak.currentStreak}
            </p>
            <p className="text-sm text-gray-600">当前连胜</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-4xl mb-2">🏅</div>
            <p className="text-2xl font-bold text-gray-800">
              {useGameStore.getState().contestMode.bestLevel}
            </p>
            <p className="text-sm text-gray-600">闯关最高</p>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
