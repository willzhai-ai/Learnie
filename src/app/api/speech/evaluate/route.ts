/**
 * API 路由：语音识别和智能判题
 * 使用本地 FunASR 服务进行语音识别
 * 使用智谱 GLM-4 进行智能判题
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateSpeechWithGLM } from "@/lib/zhipu";

// FunASR 服务地址
const FUNASR_SERVICE_URL = process.env.FUNASR_SERVICE_URL || "http://localhost:8000";

/**
 * 调用本地 FunASR 服务进行语音识别
 */
async function transcribeWithFunASR(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  formData.append("language", "auto");
  formData.append("vad", "true");

  const response = await fetch(`${FUNASR_SERVICE_URL}/transcribe`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`FunASR 错误: ${error.detail || response.statusText}`);
  }

  const result = await response.json();
  return result.transcript || result.text || "";
}

/**
 * 智能评分（不使用 AI，基于规则）
 */
function calculateScore(
  expectedAnswers: string[],
  transcript: string
): { score: number; passed: boolean; feedback: string } {
  const normalizedTranscript = transcript.toLowerCase().trim();

  // 完全匹配
  const exactMatch = expectedAnswers.find(
    (e) => e.toLowerCase() === normalizedTranscript
  );
  if (exactMatch) {
    return {
      score: 100,
      passed: true,
      feedback: "完美！发音非常准确！🎉",
    };
  }

  // 模糊匹配
  const transcriptWords = normalizedTranscript.split(/\s+/);
  let bestScore = 0;
  let bestMatch = "";

  for (const expected of expectedAnswers) {
    const expectedWords = expected.toLowerCase().split(/\s+/);
    let matchCount = 0;

    for (const expectedWord of expectedWords) {
      if (
        transcriptWords.some(
          (tw) => tw === expectedWord || tw.includes(expectedWord) || expectedWord.includes(tw)
        )
      ) {
        matchCount++;
      }
    }

    const score = Math.round((matchCount / expectedWords.length) * 100);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = expected;
    }
  }

  const passed = bestScore >= 60;
  let feedback = "";

  if (bestScore >= 90) {
    feedback = "很棒！发音非常准确！👏";
  } else if (bestScore >= 75) {
    feedback = "做得好！继续加油！💪";
  } else if (bestScore >= 60) {
    feedback = "及格了！多练习会更好！🎯";
  } else {
    feedback = "再试一次，注意清晰发音！😊";
  }

  return {
    score: bestScore,
    passed,
    feedback,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 获取音频文件
    const audioFile = formData.get("audio") as File;
    if (!audioFile) {
      return NextResponse.json({ error: "缺少音频文件" }, { status: 400 });
    }

    // 获取题目信息
    const taskPrompt = formData.get("taskPrompt") as string;
    const expectedAnswers = formData.get("expectedAnswers") as string;
    const taskType = formData.get("taskType") as string;
    const gradeLevel = parseInt(formData.get("gradeLevel") as string);
    const useAI = formData.get("useAI") !== "false"; // 默认使用 AI

    if (!taskPrompt || !expectedAnswers || !taskType || !gradeLevel) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // Step 1: 使用 FunASR 识别语音
    let transcript: string;
    try {
      transcript = await transcribeWithFunASR(audioFile);
    } catch (error: any) {
      console.error("FunASR 错误:", error);

      // 检查 FunASR 服务是否可用
      try {
        const healthCheck = await fetch(`${FUNASR_SERVICE_URL}/health`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!healthCheck.ok) {
          return NextResponse.json(
            {
              error: "语音识别服务不可用",
              details: "FunASR 服务未运行，请先启动 python server/main.py",
            },
            { status: 503 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          {
            error: "语音识别服务不可用",
            details: `无法连接到 FunASR 服务 (${FUNASR_SERVICE_URL})，请先启动 python server/main.py`,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "语音识别失败",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Step 2: 判题 (优先使用智谱 GLM，否则使用规则匹配)
    let evaluation;
    const expectedArray = JSON.parse(expectedAnswers);

    if (useAI && process.env.NEXT_PUBLIC_ZHIPU_API_KEY) {
      // 使用智谱 GLM-4 智能判题
      try {
        evaluation = await evaluateSpeechWithGLM({
          taskPrompt,
          expectedAnswers: expectedArray,
          userTranscript: transcript,
          taskType,
          gradeLevel,
        });
      } catch (error: any) {
        console.error("智谱 GLM 判题错误，降级到规则匹配:", error);
        const scoreResult = calculateScore(expectedArray, transcript);
        evaluation = {
          ...scoreResult,
          corrections: [],
          pronunciation: {
            rating: (scoreResult.score >= 90 ? "excellent" : scoreResult.score >= 75 ? "good" : scoreResult.score >= 60 ? "fair" : "needs_improvement") as "excellent" | "good" | "fair" | "needs_improvement",
            details: [],
          },
          pointsEarned: 0,
        };
      }
    } else {
      // 使用规则匹配
      const scoreResult = calculateScore(expectedArray, transcript);
      evaluation = {
        ...scoreResult,
        corrections: [],
        pronunciation: {
          rating: (scoreResult.score >= 90 ? "excellent" : scoreResult.score >= 75 ? "good" : scoreResult.score >= 60 ? "fair" : "needs_improvement") as "excellent" | "good" | "fair" | "needs_improvement",
          details: scoreResult.score >= 60
            ? ["发音清晰", "语调自然"]
            : ["建议放慢语速", "注意单词发音"],
        },
        pointsEarned: 0,
      };
    }

    return NextResponse.json({
      success: true,
      transcript,
      evaluation,
      usingFunASR: true,
      usingGLM: !!process.env.NEXT_PUBLIC_ZHIPU_API_KEY,
    });
  } catch (error: any) {
    console.error("API 错误:", error);
    return NextResponse.json(
      {
        error: "处理失败",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// 配置 API 路由
export const config = {
  api: {
    bodyParser: false,
  },
};
