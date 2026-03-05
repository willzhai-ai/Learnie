/**
 * 云同步按钮组件
 * 用于手动触发数据同步到 Supabase
 */

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import * as dataSync from "@/lib/dataSync";

export function CloudSyncButton() {
  const { children, isSyncing, syncToSupabase } = useGameStore();
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    if (children.length === 0) {
      setStatus("error");
      setMessage("没有数据可同步");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    setStatus("syncing");
    setMessage("正在同步到云端...");

    try {
      // 同步所有孩子数据
      await Promise.all(
        children.map((child) => dataSync.saveChildToSupabase(child))
      );

      setStatus("success");
      setMessage(`成功同步 ${children.length} 个孩子的数据`);

      // 更新最后同步时间
      useGameStore.getState().setLastSyncAt?.(new Date().toISOString());

      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("同步失败:", error);
      setStatus("error");
      setMessage("同步失败，请检查网络连接");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured = supabaseUrl && supabaseUrl !== "your_supabase_url_here";

  if (!isConfigured) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-xs">
        <CloudOff className="w-4 h-4" />
        <span>未配置云同步</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={status === "syncing" || isSyncing}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all ${
          status === "syncing" || isSyncing
            ? "bg-blue-100 text-blue-700"
            : status === "success"
            ? "bg-green-100 text-green-700"
            : status === "error"
            ? "bg-red-100 text-red-700"
            : "bg-green-50 text-green-700 hover:bg-green-100"
        }`}
      >
        {status === "syncing" || isSyncing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>同步中...</span>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>同步成功</span>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>同步失败</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4" />
            <span>同步到云端</span>
          </>
        )}
      </button>

      {/* 状态消息 */}
      {message && status !== "idle" && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border p-2 text-xs text-center whitespace-nowrap z-50">
          {message}
        </div>
      )}
    </div>
  );
}
