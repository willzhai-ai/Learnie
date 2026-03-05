"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const router = useRouter();
  const { children, selectedChildId } = useGameStore();

  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">设置</h1>
          </div>

          <Link href="/parent/dashboard">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 当前选中孩子的设置 */}
          {selectedChild && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                孩子设置 - {selectedChild.name}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">当前年级</p>
                    <p className="text-sm text-gray-600">{selectedChild.gradeLevel?.displayName || "未设置"}</p>
                  </div>
                  <button className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
                    修改
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">PIN 码</p>
                    <p className="text-sm text-gray-600">用于孩子登录验证</p>
                  </div>
                  <button className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
                    修改
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">头像</p>
                    <p className="text-sm text-gray-600">{selectedChild.avatarUrl || "默认头像"}</p>
                  </div>
                  <button className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
                    修改
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* 通用设置 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">通用设置</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">推送通知</p>
                  <p className="text-sm text-gray-600">接收孩子学习进度通知</p>
                </div>
                <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">每日学习目标</p>
                  <p className="text-sm text-gray-600">设置每日学习任务目标</p>
                </div>
                <span className="text-sm text-gray-600">20 分钟</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-800">数据同步</p>
                  <p className="text-sm text-gray-600">与云端同步学习进度</p>
                </div>
                <span className="text-sm text-green-600">已启用</span>
              </div>
            </div>
          </Card>

          {/* 账户设置 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">账户设置</h2>
            <div className="space-y-4">
              <Link
                href="/parent/logout"
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100"
              >
                <div>
                  <p className="font-medium text-gray-800">退出登录</p>
                  <p className="text-sm text-gray-600">退出当前账号</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </Card>

          {/* 关于 */}
          <Card className="p-6 bg-blue-50">
            <h2 className="text-lg font-semibold text-blue-700 mb-2">关于英语冒险岛</h2>
            <p className="text-sm text-blue-600">
              版本 1.0.0 · 通过 AI 技术为孩子提供个性化的英语口语练习体验
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
