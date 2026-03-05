/**
 * API 路由：健康检查
 * 检查 FunASR 服务和智谱 API 状态
 */

import { NextResponse } from "next/server";

const FUNASR_SERVICE_URL = process.env.FUNASR_SERVICE_URL || "http://localhost:8000";

export async function GET() {
  const checks = {
    funasr: {
      status: "unknown",
      url: FUNASR_SERVICE_URL,
      modelLoaded: false,
      modelName: "",
    },
    zhipu: {
      configured: !!process.env.NEXT_PUBLIC_ZHIPU_API_KEY,
      keyPreview: process.env.NEXT_PUBLIC_ZHIPU_API_KEY
        ? `${process.env.NEXT_PUBLIC_ZHIPU_API_KEY.split(".")[0]}.***`
        : "未配置",
    },
    openai: {
      configured: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    },
  };

  // 检查 FunASR 服务
  try {
    const response = await fetch(`${FUNASR_SERVICE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (response.ok) {
      const data = await response.json();
      checks.funasr.status = "healthy";
      checks.funasr.modelLoaded = data.model_loaded;
      checks.funasr.modelName = data.model_name;
    } else {
      checks.funasr.status = "unhealthy";
    }
  } catch (error) {
    checks.funasr.status = "unreachable";
    checks.funasr.modelLoaded = false;
  }

  return NextResponse.json({
    status: checks.funasr.status === "healthy" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    services: checks,
  });
}
