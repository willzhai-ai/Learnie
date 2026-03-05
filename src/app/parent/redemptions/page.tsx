"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Gift, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function RedemptionsPage() {
  const router = useRouter();
  const { children, selectedChildId } = useGameStore();

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // 获取兑换记录（从 answerHistory 中模拟）
  // 实际项目中应该从 Supabase 的 redemptions 表获取
  const getRedemptions = () => {
    if (!selectedChild) return [];

    // 暂时返回空数组，等 Supabase 集成完成后从数据库获取
    return [];
  };

  const redemptions = getRedemptions();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">兑换记录</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-yellow-700">{selectedChild?.currentPoints || 0}</span>
            </div>

            <Link href="/parent/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <Gift className="w-20 h-20 mx-auto mb-6 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">还没有兑换记录</h2>
          <p className="text-gray-600 mb-8">
            {selectedChild?.name} 还没有兑换过任何奖品
          </p>
          <Link href="/parent/prizes">
            <Button variant="primary" className="gap-2">
              <Gift className="w-4 h-4" />
              去管理奖品
            </Button>
          </Link>
        </motion.div>

        {/* 当有兑换记录时，显示列表
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <Card key={redemption.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {redemption.status === "delivered" ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : redemption.status === "approved" ? (
                    <Clock className="w-6 h-6 text-blue-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{redemption.prizeName}</p>
                    <p className="text-sm text-gray-600">{redemption.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500">-{redemption.pointsSpent}</p>
                  <p className="text-xs text-gray-500">
                    {redemption.status === "pending" && "待确认"}
                    {redemption.status === "approved" && "已批准"}
                    {redemption.status === "delivered" && "已发放"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        */}
      </div>
    </main>
  );
}
