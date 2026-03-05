"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Gift,
  Settings,
  Plus,
  TrendingUp,
  Calendar,
  Trophy,
  Target,
  Trash2,
  X,
  AlertTriangle,
  Mountain,
} from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ParentDashboardPage() {
  const router = useRouter();
  const { children, logoutParent, deleteChild } = useGameStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    children.length > 0 ? children[0].id : null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    childId: string;
    childName: string;
  }>({ show: false, childId: "", childName: "" });

  const handleLogout = () => {
    logoutParent();
    router.push("/");
  };

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  // 计算统计数据
  const calculateStats = () => {
    if (!selectedChild) {
      return {
        todayPoints: 0,
        weekPoints: 0,
        totalTasks: 0,
        perfectScores: 0,
        currentStreak: 0,
        bestStreak: 0,
        contestLevel: 0,
      };
    }

    const history = selectedChild.answerHistory || [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    let todayPoints = 0;
    let weekPoints = 0;
    let perfectScores = 0;
    let totalTasks = history.length;

    history.forEach((record) => {
      const recordDate = new Date(record.timestamp);
      const score = record.score || 0;

      // 统计今日积分
      if (recordDate >= todayStart) {
        // 计算积分（简单算法：通过得10分，满分额外5分）
        if (record.passed) {
          todayPoints += 10;
          if (score >= 100) perfectScores++;
          if (score >= 95) todayPoints += 5;
        }
      }

      // 统计本周积分
      if (recordDate >= weekStart) {
        if (record.passed) {
          weekPoints += 10;
          if (score >= 95) weekPoints += 5;
        }
      }

      // 统计满分次数
      if (score >= 100) perfectScores++;
    });

    return {
      todayPoints,
      weekPoints,
      totalTasks,
      perfectScores,
      currentStreak: 0, // 需要从 streak state 获取
      bestStreak: 0, // 需要从 streak state 获取
      contestLevel: selectedChild.currentLevel || 1,
    };
  };

  // 获取最近活动
  const getRecentActivity = () => {
    if (!selectedChild) return [];

    const history = selectedChild.answerHistory || [];
    const now = new Date();

    // 按时间排序，取最近10条
    return history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((record) => {
        const recordDate = new Date(record.timestamp);
        const timeDiff = now.getTime() - recordDate.getTime();
        const minutesAgo = Math.floor(timeDiff / (1000 * 60));
        const hoursAgo = Math.floor(minutesAgo / 60);
        const daysAgo = Math.floor(hoursAgo / 24);

        let timeText = "";
        if (minutesAgo < 60) {
          timeText = `${minutesAgo}分钟前`;
        } else if (hoursAgo < 24) {
          timeText = `${hoursAgo}小时前`;
        } else {
          timeText = `${daysAgo}天前`;
        }

        // 计算获得的积分
        let pointsEarned = 0;
        if (record.passed) {
          pointsEarned = 10;
          if (record.score >= 95) pointsEarned += 5;
        }

        return {
          id: record.timestamp,
          type: "task_completed",
          task: record.question,
          score: record.score,
          passed: record.passed,
          points: pointsEarned,
          time: timeText,
          difficulty: record.difficulty,
          category: record.category,
        };
      });
  };

  const stats = calculateStats();
  const recentActivities = getRecentActivity();

  // 格式化难度显示
  const getDifficultyLabel = (difficulty: number) => {
    const labels = ["", "单词", "短语", "句子", "问答", "情景"];
    return labels[difficulty] || "未知";
  };

  // 格式化类别图标
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      word: "🔤",
      phrase: "💬",
      sentence: "📝",
      question: "❓",
      scenario: "🎭",
    };
    return icons[category] || "📝";
  };

  // 处理删除孩子
  const handleDeleteClick = (childId: string, childName: string) => {
    setShowDeleteConfirm({
      show: true,
      childId,
      childName,
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteChild(showDeleteConfirm.childId);

      // 如果删除的是当前选中的孩子，重置选中状态
      if (showDeleteConfirm.childId === selectedChildId) {
        setSelectedChildId(children.length > 1 ? children[0].id : null);
      }

      setShowDeleteConfirm({ show: false, childId: "", childName: "" });

      // 如果没有孩子了，跳转到创建孩子页面
      if (children.length <= 1) {
        router.push("/parent/create-child");
      }
    } catch (error) {
      console.error("删除孩子失败:", error);
      alert("删除失败，请重试");
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm({ show: false, childId: "", childName: "" });
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 删除确认对话框 */}
      <AnimatePresence>
        {showDeleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">确认删除</h2>
              </div>

              <p className="text-gray-600 mb-6">
                确定要删除 <span className="font-bold text-gray-800">"{showDeleteConfirm.childName}"</span> 吗？
              </p>

              <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-xl">
                ⚠️ 删除后，该孩子的所有数据（积分、答题记录等）都将被永久删除，无法恢复。
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={cancelDelete}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1"
                  onClick={confirmDelete}
                >
                  确认删除
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <h1 className="text-2xl font-display font-bold gradient-text">
                英语冒险岛
              </h1>
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">家长后台</span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Child Selector */}
        {children.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-700">选择孩子</h2>
              <Link href="/parent/create-child">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加孩子
                </Button>
              </Link>
            </div>
            <div className="flex gap-4 flex-wrap">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`relative group ${
                    selectedChildId === child.id ? "ring-2 ring-primary-500" : ""
                  }`}
                >
                  <button
                    onClick={() => setSelectedChildId(child.id)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${
                      selectedChildId === child.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="text-3xl">{child.avatarUrl || "🧒"}</span>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{child.name}</p>
                      <p className="text-sm text-gray-600">{child.gradeLevel?.displayName || "未设置年级"} · {child.currentPoints} 积分</p>
                    </div>
                  </button>

                  {/* 删除按钮 */}
                  {children.length > 1 && (
                    <button
                      onClick={() => handleDeleteClick(child.id, child.name)}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                      title="删除孩子"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!selectedChild && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">还没有添加孩子</p>
            <Link href="/parent/create-child">
              <Button variant="primary">添加第一个孩子</Button>
            </Link>
          </Card>
        )}

        {selectedChild && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span className="text-xs text-gray-500">今日</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.todayPoints}</p>
                  <p className="text-sm text-gray-600">今日积分</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <span className="text-xs text-gray-500">本周</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.weekPoints}</p>
                  <p className="text-sm text-gray-600">本周积分</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalTasks}</p>
                  <p className="text-sm text-gray-600">完成任务</p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-800">{stats.contestLevel}</p>
                  <p className="text-sm text-gray-600">闯关最高</p>
                </Card>
              </motion.div>

              {/* 爬塔统计 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <Mountain className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-bold text-indigo-600">
                    {useGameStore.getState().towerMode.highestLevel || 1}
                  </p>
                  <p className="text-sm text-gray-600">爬塔层数</p>
                </Card>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Actions */}
              <div className="md:col-span-2 space-y-6">
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">快捷操作</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/parent/prizes">
                      <Card hover className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                            <Gift className="w-6 h-6 text-accent-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">奖品管理</p>
                            <p className="text-sm text-gray-600">添加和管理奖品</p>
                          </div>
                        </div>
                      </Card>
                    </Link>

                    <Link href="/parent/redemptions">
                      <Card hover className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-success-600" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">兑换记录</p>
                            <p className="text-sm text-gray-600">查看兑换历史</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">最近活动</h2>
                    <span className="text-sm text-gray-500">
                      {recentActivities.length > 0 ? `共 ${selectedChild.answerHistory?.length || 0} 条记录` : "暂无记录"}
                    </span>
                  </div>
                  <Card className="divide-y divide-gray-100">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100">
                              <Target className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                <span className="mr-2">{getCategoryIcon(activity.category)}</span>
                                <span className="mr-2">[{getDifficultyLabel(activity.difficulty)}]</span>
                                <span className={activity.passed ? "text-green-600" : "text-red-600"}>
                                  {activity.passed ? "✓" : "✗"} {activity.score}分
                                </span>
                              </p>
                              <p className="text-sm text-gray-500 truncate max-w-md">
                                {activity.task}
                              </p>
                              <p className="text-xs text-gray-400">{activity.time}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${activity.passed ? "text-green-500" : "text-gray-400"}`}>
                            {activity.passed ? `+${activity.points}` : "0"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>还没有练习记录</p>
                        <p className="text-sm">让孩子开始练习后会显示活动记录</p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              </div>

              {/* Side Panel */}
              <div className="space-y-6">
                {/* Child Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">学习统计</h2>
                  <Card className="p-6 space-y-4">
                    {/* Grade Level Info */}
                    <div className="bg-blue-50 rounded-xl p-3 -mx-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">当前年级</p>
                          <p className="font-bold text-blue-800">{selectedChild.gradeLevel?.displayName || "未设置"}</p>
                        </div>
                        <span className="text-2xl">📚</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">当前积分</span>
                      <span className="font-bold text-xl text-primary-600">
                        {selectedChild.currentPoints}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">累计积分</span>
                      <span className="font-bold text-gray-800">
                        {selectedChild.totalPointsEarned}
                      </span>
                    </div>
                    <div className="h-px bg-gray-200" />

                    {/* 通过率统计 */}
                    {selectedChild.answerHistory && selectedChild.answerHistory.length > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">总练习次数</span>
                          <span className="font-bold text-gray-800">
                            {selectedChild.answerHistory.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">通过次数</span>
                          <span className="font-bold text-green-600">
                            {selectedChild.answerHistory.filter(h => h.passed).length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">通过率</span>
                          <span className="font-bold text-gray-800">
                            {((selectedChild.answerHistory.filter(h => h.passed).length / selectedChild.answerHistory.length) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">平均分</span>
                          <span className="font-bold text-gray-800">
                            {(selectedChild.answerHistory.reduce((sum, h) => sum + (h.score || 0), 0) / selectedChild.answerHistory.length).toFixed(0)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200" />
                      </>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">满分次数</span>
                      <span className="font-bold text-gray-800">
                        {selectedChild.answerHistory?.filter(h => (h.score || 0) >= 100).length || 0}
                      </span>
                    </div>
                  </Card>
                </motion.div>

                {/* 爬塔统计卡片 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 }}
                >
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">爬塔统计</h2>
                  <Card className="p-6 space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                          <Mountain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-indigo-600">
                            {useGameStore.getState().towerMode.highestLevel || 1}
                          </p>
                          <p className="text-sm text-gray-600">最高层数</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">当前层数</span>
                      <span className="font-bold text-gray-800">
                        {useGameStore.getState().towerMode.currentLevel || 1} 层
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">爬塔积分</span>
                      <span className="font-bold text-indigo-600">
                        {useGameStore.getState().towerMode.totalPoints || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">完成题目</span>
                      <span className="font-bold text-gray-800">
                        {useGameStore.getState().towerMode.questionsCompleted || 0} 题
                      </span>
                    </div>

                    {useGameStore.getState().towerMode.myRank && (
                      <>
                        <div className="h-px bg-indigo-200" />
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">当前排名</span>
                          <span className="font-bold text-indigo-600">
                            第 {useGameStore.getState().towerMode.myRank} 名
                          </span>
                        </div>
                      </>
                    )}
                  </Card>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">更多功能</h2>
                  <Card className="divide-y divide-gray-100">
                    <Link href="/parent/settings" className="p-4 flex items-center gap-3 hover:bg-gray-50">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-800">设置</span>
                    </Link>
                    <Link href="/parent/reports" className="p-4 flex items-center gap-3 hover:bg-gray-50">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-800">学习报告</span>
                    </Link>
                    <Link href="/" className="p-4 flex items-center gap-3 hover:bg-gray-50">
                      <Home className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-800">返回首页</span>
                    </Link>
                  </Card>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
