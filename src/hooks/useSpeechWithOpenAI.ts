/**
 * 语音识别和智能判题 Hook
 * 使用 Web Speech API (实时检测) + FunASR (最终识别) + 智谱 GLM-4 (智能判题)
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Safari doesn't support SpeechRecognition API natively
const SpeechRecognitionAPI =
  (typeof window !== "undefined" &&
    (window as any).SpeechRecognition) ||
  (typeof window !== "undefined" &&
    (window as any).webkitSpeechRecognition);

// 语音评价结果类型
export interface SpeechEvaluationResult {
  score: number;
  passed: boolean;
  feedback: string;
  corrections: {
    original: string;
    correct: string;
    explanation: string;
  }[];
  pronunciation: {
    rating: "excellent" | "good" | "fair" | "needs_improvement";
    details: string[];
  };
  pointsEarned: number;
}

export interface UseOpenAISpeechOptions {
  taskPrompt: string;
  expectedAnswers: string[];
  taskType: string;
  gradeLevel: number;
  onResult?: (result: {
    transcript: string;
    score: number;
    passed: boolean;
    feedback?: string;
    evaluation?: SpeechEvaluationResult;
  }) => void;
  maxDuration?: number;
  autoStop?: boolean; // 是否自动停止（检测到正确答案后）
}

export interface UseOpenAISpeechResult {
  // 状态
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  realtimeTranscript: string; // 实时识别的文字
  score: number | null;
  passed: boolean | null;
  error: string | null;
  warning: string | null;
  recordingTime: number;
  evaluation: SpeechEvaluationResult | null;

  // 方法
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
  retry: () => void;
}

// 计算语音分数（模糊匹配）
function calculateSpeechScore(
  expected: string[],
  actual: string
): { score: number; passed: boolean } {
  if (!actual || actual.trim().length === 0) {
    return { score: 0, passed: false };
  }

  const normalizedActual = actual.toLowerCase().trim();

  // 完全匹配
  const exactMatch = expected.find(
    (e) => e.toLowerCase() === normalizedActual
  );
  if (exactMatch) {
    return { score: 100, passed: true };
  }

  // 模糊匹配
  const levenshtein = require("levenshtein");

  const bestScore = Math.max(
    ...expected.map((expectedPhrase) => {
      const distance = levenshtein(
        expectedPhrase.toLowerCase(),
        normalizedActual
      );
      const maxLength = Math.max(expectedPhrase.length, normalizedActual.length);
      const similarity = 1 - distance / maxLength;

      const expectedWords = expectedPhrase.toLowerCase().split(/\s+/);
      const actualWords = normalizedActual.split(/\s+/);
      const matchedWords = expectedWords.filter((word) =>
        actualWords.some((actualWord) => actualWord.includes(word))
      );
      const wordMatchRatio = matchedWords.length / expectedWords.length;

      return Math.max(similarity, wordMatchRatio) * 100;
    })
  );

  const score = Math.round(bestScore);
  const passed = score >= 60;

  return { score, passed };
}

export function useSpeechWithOpenAI({
  taskPrompt,
  expectedAnswers,
  taskType,
  gradeLevel,
  onResult,
  maxDuration = 15,
  autoStop = true,
}: UseOpenAISpeechOptions): UseOpenAISpeechResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResult | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const autoStoppedRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const transcriptStableTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (transcriptStableTimerRef.current) {
      clearTimeout(transcriptStableTimerRef.current);
      transcriptStableTimerRef.current = null;
    }
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    setTranscript("");
    setRealtimeTranscript("");
    setScore(null);
    setPassed(null);
    setError(null);
    setWarning(null);
    setRecordingTime(0);
    setEvaluation(null);
    setIsProcessing(false);
    autoStoppedRef.current = false;
    lastTranscriptRef.current = "";
  }, []);

  // 计算动态等待延迟
  const getWaitDelay = useCallback(() => {
    const avgLength = expectedAnswers.reduce((sum, ans) => sum + ans.split(/\s+/).length, 0) / expectedAnswers.length;
    if (avgLength <= 3) return 1500;
    if (avgLength <= 6) return 2000;
    return 2500;
  }, [expectedAnswers]);

  // 处理音频上传到 FunASR
  const processAudioWithFunASR = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("taskPrompt", taskPrompt);
      formData.append("expectedAnswers", JSON.stringify(expectedAnswers));
      formData.append("taskType", taskType);
      formData.append("gradeLevel", gradeLevel.toString());

      const response = await fetch("/api/speech/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "处理失败");
      }

      const result = await response.json();

      if (result.success) {
        setTranscript(result.transcript);
        setScore(result.evaluation.score);
        setPassed(result.evaluation.passed);
        setEvaluation(result.evaluation);

        if (onResult) {
          onResult({
            transcript: result.transcript,
            score: result.evaluation.score,
            passed: result.evaluation.passed,
            feedback: result.evaluation.feedback,
            evaluation: result.evaluation,
          });
        }
      }
    } catch (err: any) {
      console.error("处理错误:", err);
      setError(err.message || "处理失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  }, [taskPrompt, expectedAnswers, taskType, gradeLevel, onResult]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 清理之前的状态
      reset();
      clearTimers();

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      // 检查支持的 MIME 类型
      let mimeType = "audio/webm";
      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
        "audio/wav",
      ];

      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      // 创建 MediaRecorder（用于 FunASR 最终识别）
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        clearTimers();

        // 停止语音识别
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }

        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          setError("没有录制到音频，请重试");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });

        await processAudioWithFunASR(audioBlob);
      };

      // 启动 Web Speech API 实时监听（用于自动停止检测）
      if (autoStop && SpeechRecognitionAPI) {
        try {
          const recognition = new SpeechRecognitionAPI();
          recognitionRef.current = recognition;
          recognition.lang = "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
              } else {
                interimTranscript += result[0].transcript;
              }
            }

            const currentTranscript = finalTranscript || interimTranscript;
            if (currentTranscript) {
              setRealtimeTranscript(currentTranscript);

              // 清除之前的定时器
              if (transcriptStableTimerRef.current) {
                clearTimeout(transcriptStableTimerRef.current);
              }

              lastTranscriptRef.current = currentTranscript;

              // 等待用户说完后检测
              const waitDelay = getWaitDelay();
              transcriptStableTimerRef.current = setTimeout(() => {
                if (!autoStoppedRef.current && lastTranscriptRef.current === currentTranscript) {
                  const result = calculateSpeechScore(expectedAnswers, currentTranscript);

                  if (result.score >= 70) {
                    autoStoppedRef.current = true;
                    stopRecording();
                  }
                }
              }, waitDelay);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition warning:", event.error);
          };

          recognition.start();
        } catch (e) {
          console.warn("Web Speech API not available:", e);
        }
      }

      // 开始录音
      mediaRecorder.start();
      setIsRecording(true);

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;

          if (newTime >= maxDuration - 3) {
            setWarning(`还剩 ${maxDuration - newTime} 秒`);
          }

          if (newTime >= maxDuration) {
            stopRecording();
            setError("录音时间过长，请重新录制");
          }

          return newTime;
        });
      }, 1000);

    } catch (err: any) {
      console.error("启动录音失败:", err);
      setError(err.message || "无法访问麦克风，请检查权限");
      setIsRecording(false);
    }
  }, [reset, clearTimers, processAudioWithFunASR, autoStop, getWaitDelay, expectedAnswers, maxDuration]);

  // 停止录音
  const stopRecording = useCallback(() => {
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setIsRecording(false);
  }, [clearTimers]);

  // 重试
  const retry = useCallback(() => {
    reset();
    startRecording();
  }, [reset, startRecording]);

  // 清理
  useEffect(() => {
    return () => {
      clearTimers();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [clearTimers]);

  return {
    isRecording,
    isProcessing,
    transcript,
    realtimeTranscript,
    score,
    passed,
    error,
    warning,
    recordingTime,
    evaluation,
    startRecording,
    stopRecording,
    reset,
    retry,
  };
}
