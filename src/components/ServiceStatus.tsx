/**
 * 服务状态监控组件
 * 显示 FunASR 语音识别服务的运行状态
 */

"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ServiceHealth {
  status: "ok" | "degraded";
  timestamp: string;
  services: {
    funasr: {
      status: string;
      url: string;
      modelLoaded: boolean;
      modelName: string;
    };
    zhipu: {
      configured: boolean;
      keyPreview: string;
    };
    openai: {
      configured: boolean;
    };
  };
}

export function ServiceStatus() {
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health");
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      setHealth({
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: {
          funasr: {
            status: "error",
            url: "http://localhost:8000",
            modelLoaded: false,
            modelName: "",
          },
          zhipu: {
            configured: false,
            keyPreview: "未配置",
          },
          openai: { configured: false },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // 每30秒检查一次
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm">检查服务状态...</span>
      </div>
    );
  }

  const funasrStatus = health?.services.funasr.status;
  const modelLoaded = health?.services.funasr.modelLoaded;
  const zhipuConfigured = health?.services.zhipu?.configured;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* FunASR 状态 */}
      <div className="flex items-center gap-2">
        {funasrStatus === "healthy" && modelLoaded ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : funasrStatus === "unreachable" ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
        <div className="text-sm">
          <span className="font-medium">FunASR:</span>
          <span className={`ml-1 ${
            funasrStatus === "healthy" && modelLoaded
              ? "text-green-600"
              : "text-red-600"
          }`}>
            {funasrStatus === "healthy" && modelLoaded
              ? "运行中"
              : funasrStatus === "unreachable"
              ? "未启动"
              : "异常"}
          </span>
        </div>
      </div>

      {/* 智谱 API 状态 */}
      <div className="flex items-center gap-2">
        {zhipuConfigured ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
        <div className="text-sm">
          <span className="font-medium">智谱 GLM:</span>
          <span className={`ml-1 ${
            zhipuConfigured
              ? "text-green-600"
              : "text-yellow-600"
          }`}>
            {zhipuConfigured ? "已配置" : "未配置"}
          </span>
        </div>
      </div>

      {/* 刷新按钮 */}
      <button
        onClick={checkHealth}
        className="p-1 hover:bg-gray-100 rounded"
        title="刷新状态"
      >
        <Activity className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
