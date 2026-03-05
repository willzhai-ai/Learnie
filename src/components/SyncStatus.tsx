/**
 * 同步状态指示器组件
 * 显示与 Supabase 的同步状态
 */

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";

export function SyncStatus() {
  const { isSyncing, lastSyncAt, syncEnabled, syncFromSupabase, syncToSupabase, setSyncEnabled } = useGameStore();
  const [showTooltip, setShowTooltip] = useState(false);

  // 检查是否配置了 Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = supabaseUrl && supabaseUrl !== "your_supabase_url_here";

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs">
        <CloudOff className="w-4 h-4" />
        <span>未配置云同步</span>
      </div>
    );
  }

  const formatLastSync = () => {
    if (!lastSyncAt) return "未同步";
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小时前`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} 天前`;
  };

  const handleSync = async () => {
    await syncFromSupabase();
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={isSyncing || !syncEnabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors ${
          isSyncing
            ? "bg-blue-50 text-blue-700"
            : syncEnabled
            ? "bg-green-50 text-green-700 hover:bg-green-100"
            : "bg-gray-50 text-gray-500"
        } ${!syncEnabled ? "opacity-60" : ""}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>同步中...</span>
          </>
        ) : syncEnabled ? (
          <>
            <Cloud className="w-4 h-4" />
            <CheckCircle className="w-3 h-3" />
            <span>云同步</span>
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4" />
            <span>同步已关闭</span>
          </>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border p-3 z-50">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">状态</span>
              <span className="font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {syncEnabled ? "已启用" : "已关闭"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">最后同步</span>
              <span className="font-medium">{formatLastSync()}</span>
            </div>
            <div className="pt-2 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSyncEnabled(!syncEnabled);
                }}
                className="w-full px-3 py-1.5 text-xs rounded-md border hover:bg-gray-50 transition-colors"
              >
                {syncEnabled ? "关闭同步" : "开启同步"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 简化版同步状态指示器（仅显示图标）
 */
export function SyncStatusCompact() {
  const { isSyncing, syncEnabled } = useGameStore();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = supabaseUrl && supabaseUrl !== "your_supabase_url_here";

  if (!isConfigured || !syncEnabled) {
    return null;
  }

  return (
    <div className={`w-2 h-2 rounded-full ${isSyncing ? "bg-blue-500 animate-pulse" : "bg-green-500"}`} />
  );
}
