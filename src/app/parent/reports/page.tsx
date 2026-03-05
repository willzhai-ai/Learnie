"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, TrendingUp, BarChart3, Calendar, Trophy, Target } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ReportsPage() {
  const router = useRouter();
  const { children, selectedChildId } = useGameStore();

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // 计算学习报告数据
  const calculateReportData = () => {
    if (!selectedChild || !selectedChild.answerHistory) {
      return null;
    }

    const history = selectedChild.answerHistory;
    const totalTasks = history.length;
    const passedTasks = history.filter(h => h.passed).length;
    const passRate = totalTasks > 0 ? (passedTasks / totalTasks * 100).toFixed(1) : "0";
    const avgScore = totalTasks > 0
      ? (history.reduce((sum, h) => sum + (h.score || 0), 0) / totalTasks).toFixed(1)
      : "0";
    const perfectScores = history.filter(h => (h.score || 0) >= 100).length;

    // 按难度统计
    const difficultyStats = {
      1: { total: 0, passed: 0, avgScore: 0 },
      2: { total: 0, passed: 0, avgScore: 0 },
      3: { total: 0, passed: 0, avgScore: 0 },
      4: { total: 0, passed: 0, avgScore: 0 },
      5: { total: 0, passed: 0, avgScore: 0 },
    };

    history.forEach((h) => {
      const diff = h.difficulty;
      if (difficultyStats[diff]) {
        difficultyStats[diff].total++;
        if (h.passed) difficultyStats[diff].passed++;
        difficultyStats[diff].avgScore += h.score || 0;
      }
    });

    // 计算平均分
    Object.keys(difficultyStats).forEach((key) => {
      const stat = difficultyStats[key as keyof typeof difficultyStats];
      if (stat.total > 0) {
        stat.avgScore = stat.avgScore / stat.total;
      }
    });

    return {
      totalTasks,
      passedTasks,
      passRate,
      avgScore,
      perfectScores,
      difficultyStats,
    };
  };

  const reportData = calculateReportData();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">学习报告</h1>
          </div>

          <Link href="/parent/dashboard">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!selectedChild ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">请先选择一个孩子</p>
          </Card>
        ) : !reportData || reportData.totalTasks === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">暂无学习数据</h2>
            <p className="text-gray-600">
              {selectedChild.name} 还没有开始练习，完成练习后会显示学习报告
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 总览统计 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-6">学习总览</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{reportData.totalTasks}</p>
                  <p className="text-sm text-gray-600">总任务数</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{reportData.passedTasks}</p>
                  <p className="text-sm text-gray-600">通过任务</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{reportData.passRate}%</p>
                  <p className="text-sm text-gray-600">通过率</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <div className="text-2xl">⭐</div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{reportData.avgScore}</p>
                  <p className="text-sm text-gray-600">平均分</p>
                </div>
              </div>
            </Card>

            {/* 按难度统计 */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">按难度统计</h2>
              <div className="space-y-3">
                {[
                  { level: 1, name: "单词", emoji: "🔤" },
                  { level: 2, name: "短语", emoji: "💬" },
                  { level: 3, name: "句子", emoji: "📝" },
                  { level: 4, name: "问答", emoji: "❓" },
                  { level: 5, name: "情景", emoji: "🎭" },
                ].map((item) => {
                  const stats = reportData.difficultyStats[item.level as keyof typeof reportData.difficultyStats];
                  const passRate = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(0) : "0";

                  return (
                    <div key={item.level} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-800">Level {item.level} - {item.name}</p>
                          <p className="text-sm text-gray-600">{stats.total} 次练习</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-600">通过率 {passRate}%</p>
                          <p className="text-xs text-gray-600">平均分 {stats.avgScore.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 学习建议 */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">💡 学习建议</h2>
              <div className="space-y-3">
                {parseFloat(reportData.passRate) < 60 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">📚</span>
                    <div>
                      <p className="font-medium text-gray-800">加强基础练习</p>
                      <p className="text-sm text-gray-600">当前通过率较低，建议从 Level 1 单词开始多练习</p>
                    </div>
                  </div>
                )}
                {parseFloat(reportData.avgScore) < 80 && parseFloat(reportData.passRate) >= 60 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="font-medium text-gray-800">提高发音准确度</p>
                      <p className="text-sm text-gray-600">可以通过模仿录音和多练习来提高发音质量</p>
                    </div>
                  </div>
                )}
                {parseFloat(reportData.passRate) >= 80 && parseFloat(reportData.avgScore) >= 85 && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                    <span className="text-xl">🌟</span>
                    <div>
                      <p className="font-medium text-gray-800">表现优秀！</p>
                      <p className="text-sm text-gray-600">可以尝试更高难度的挑战，继续保持！</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
