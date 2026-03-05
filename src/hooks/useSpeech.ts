"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  maxDuration?: number; // Maximum recording duration in seconds (default: 15)
  noSpeechTimeout?: number; // Timeout for no speech detected in seconds (default: 8)
}

export interface UseSpeechResult {
  isRecording: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  warning: string | null;
  recordingTime: number; // Current recording time in seconds
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  retry: () => void; // Quick retry function
}

// Safari doesn't support SpeechRecognition API natively
const SpeechRecognitionAPI =
  (typeof window !== "undefined" &&
    (window as any).SpeechRecognition) ||
  (typeof window !== "undefined" &&
    (window as any).webkitSpeechRecognition);

export function useSpeech(options: SpeechRecognitionOptions = {}): UseSpeechResult {
  const {
    lang = "en-US",
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    maxDuration = 15, // 15 seconds max
    noSpeechTimeout = 8, // 8 seconds of no speech
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noSpeechRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenRef = useRef(false);

  // Check if Speech Recognition is supported
  const isSupported = typeof SpeechRecognitionAPI !== "undefined";

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (noSpeechRef.current) {
      clearTimeout(noSpeechRef.current);
      noSpeechRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }
    setIsRecording(false);
    setRecordingTime(0);
    hasSpokenRef.current = false;
  }, [clearTimers]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
    setWarning(null);
    setRecordingTime(0);
  }, []);

  const retry = useCallback(() => {
    resetTranscript();
    startRecording();
  }, [resetTranscript]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError("您的浏览器不支持语音识别功能，请使用Chrome浏览器。");
      return;
    }

    // Reset state
    resetTranscript();
    hasSpokenRef.current = false;
    setIsRecording(true);

    try {
      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        setWarning(null);
        setRecordingTime(0);

        // Start recording timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => {
            const newTime = prev + 1;
            // Show warning when approaching max duration
            if (newTime >= maxDuration - 3) {
              setWarning(`还剩 ${maxDuration - newTime} 秒`);
            }
            // Auto-stop at max duration
            if (newTime >= maxDuration) {
              stopRecording();
              setError("录音时间过长，请重新录制");
            }
            return newTime;
          });
        }, 1000);

        // Set no-speech timeout
        noSpeechRef.current = setTimeout(() => {
          if (!hasSpokenRef.current) {
            stopRecording();
            setError("没有检测到语音，请检查麦克风后再试");
          }
        }, noSpeechTimeout * 1000);
      };

      recognition.onresult = (event: any) => {
        // Mark that speech has been detected
        if (!hasSpokenRef.current) {
          hasSpokenRef.current = true;
          // Clear the no-speech timeout
          if (noSpeechRef.current) {
            clearTimeout(noSpeechRef.current);
            noSpeechRef.current = null;
          }
        }

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }

        // Use final transcript if available, otherwise use interim
        const newTranscript = finalTranscript || interimTranscript;
        if (newTranscript) {
          setTranscript(newTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);

        const errorMessages: Record<string, string> = {
          "no-speech": "没有检测到语音，请再试一次",
          "audio-capture": "无法访问麦克风，请检查麦克风权限",
          "not-allowed": "请允许麦克风权限",
          "network": "网络连接失败，请检查网络",
          "aborted": "语音识别已中止",
        };

        setError(errorMessages[event.error] || `语音识别错误: ${event.error}`);
        stopRecording();
      };

      recognition.onend = () => {
        clearTimers();
        setIsRecording(false);

        // Check if we got any transcript
        if (!transcript && !hasSpokenRef.current && !error) {
          setError("没有检测到语音，请再试一次");
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("启动语音识别失败，请刷新页面重试");
      setIsRecording(false);
      clearTimers();
    }
  }, [
    isSupported,
    lang,
    continuous,
    interimResults,
    maxAlternatives,
    maxDuration,
    noSpeechTimeout,
    resetTranscript,
    stopRecording,
    clearTimers,
    transcript,
    error,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [clearTimers]);

  return {
    isRecording,
    transcript,
    isSupported,
    error,
    warning,
    recordingTime,
    startRecording,
    stopRecording,
    resetTranscript,
    retry,
  };
}

/**
 * Calculate speech score using fuzzy matching
 */
export function calculateSpeechScore(
  expected: string[],
  actual: string
): { score: number; passed: boolean } {
  if (!actual || actual.trim().length === 0) {
    return { score: 0, passed: false };
  }

  const normalizedActual = actual.toLowerCase().trim();

  // Exact match
  const exactMatch = expected.find(
    (e) => e.toLowerCase() === normalizedActual
  );
  if (exactMatch) {
    return { score: 100, passed: true };
  }

  // Fuzzy match using Levenshtein distance
  const levenshtein = require("levenshtein");

  const bestScore = Math.max(
    ...expected.map((expectedPhrase) => {
      const distance = levenshtein(
        expectedPhrase.toLowerCase(),
        normalizedActual
      );
      const maxLength = Math.max(expectedPhrase.length, normalizedActual.length);
      const similarity = 1 - distance / maxLength;

      // Check if the actual contains key words from expected
      const expectedWords = expectedPhrase.toLowerCase().split(/\s+/);
      const actualWords = normalizedActual.split(/\s+/);
      const matchedWords = expectedWords.filter((word) =>
        actualWords.some((actualWord) => actualWord.includes(word))
      );
      const wordMatchRatio = matchedWords.length / expectedWords.length;

      // Combine similarity and word match ratio
      return Math.max(similarity, wordMatchRatio) * 100;
    })
  );

  const score = Math.round(bestScore);
  const passed = score >= 60; // Require at least 60% similarity

  return { score, passed };
}

/**
 * Hook for speech recognition with automatic scoring and real-time detection
 * When correct answer is detected, automatically stops recording
 */
export function useSpeechWithScoring(
  expectedAnswers: string[] = [],
  options?: SpeechRecognitionOptions
) {
  const dynamicExpectedAnswersRef = useRef<string[]>(expectedAnswers);
  const {
    isRecording,
    transcript,
    isSupported,
    error,
    warning,
    recordingTime,
    startRecording: baseStartRecording,
    stopRecording: baseStopRecording,
    resetTranscript,
    retry: baseRetry,
  } = useSpeech({
    ...options,
    continuous: true, // Keep listening for continuous results
    interimResults: true, // Get interim results for real-time detection
  });

  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const autoStoppedRef = useRef(false);
  const lastTranscriptRef = useRef("");
  const transcriptStableTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate dynamic delay based on expected answer length
  const getWaitDelay = useCallback(() => {
    const answers = dynamicExpectedAnswersRef.current;
    if (answers.length === 0) return 1500;

    // Get the average length of expected answers
    const avgLength = answers.reduce((sum, ans) => sum + ans.split(/\s+/).length, 0) / answers.length;

    // Base delay + extra time for longer sentences
    // 1-3 words: 1500ms, 4-6 words: 2000ms, 7+ words: 2500ms
    if (avgLength <= 3) return 1500;
    if (avgLength <= 6) return 2000;
    return 2500;
  }, []);

  // Real-time transcript display and detection
  useEffect(() => {
    if (isRecording && !hasResult) {
      setRealtimeTranscript(transcript);

      // Clear any existing timer when transcript changes
      if (transcriptStableTimerRef.current) {
        clearTimeout(transcriptStableTimerRef.current);
        transcriptStableTimerRef.current = null;
      }

      // Only check for answer if transcript has content AND user has stopped speaking
      if (transcript && transcript.trim().length > 0) {
        // Store the current transcript
        lastTranscriptRef.current = transcript;

        // Get dynamic wait time based on expected answer length
        const waitDelay = getWaitDelay();

        // Wait for user to finish speaking
        transcriptStableTimerRef.current = setTimeout(() => {
          if (!autoStoppedRef.current && lastTranscriptRef.current === transcript) {
            // User has stopped speaking, check the answer
            const result = calculateSpeechScore(dynamicExpectedAnswersRef.current, transcript);

            // Auto-stop if we got a good match (70% threshold)
            if (result.score >= 70) {
              autoStoppedRef.current = true;
              setHasResult(true);
              baseStopRecording();
              setScore(result.score);
              setPassed(result.passed);
            }
          }
        }, waitDelay);
      }
    }
  }, [transcript, isRecording, hasResult, getWaitDelay]);

  // Clear timer when recording stops
  useEffect(() => {
    if (!isRecording && transcriptStableTimerRef.current) {
      clearTimeout(transcriptStableTimerRef.current);
      transcriptStableTimerRef.current = null;
    }
  }, [isRecording]);

  // When recording stops naturally (timeout, manual stop) without auto-stop
  useEffect(() => {
    if (!isRecording && !autoStoppedRef.current && transcript && !hasResult && !error) {
      const result = calculateSpeechScore(dynamicExpectedAnswersRef.current, transcript);
      setScore(result.score);
      setPassed(result.passed);
      setHasResult(true);
    }
  }, [isRecording, transcript, hasResult, error]);

  // Handle no transcript case (user didn't speak)
  useEffect(() => {
    if (!isRecording && !transcript && !hasResult && !error && !autoStoppedRef.current && recordingTime > 0) {
      // Recording stopped but no transcript
      setScore(0);
      setPassed(false);
      setHasResult(true);
    }
  }, [isRecording, transcript, hasResult, error, recordingTime]);

  const reset = useCallback(() => {
    resetTranscript();
    setScore(null);
    setPassed(null);
    setHasResult(false);
    setRealtimeTranscript("");
    autoStoppedRef.current = false;
    lastTranscriptRef.current = "";
    if (transcriptStableTimerRef.current) {
      clearTimeout(transcriptStableTimerRef.current);
      transcriptStableTimerRef.current = null;
    }
  }, [resetTranscript]);

  const startRecording = useCallback((newExpectedAnswers?: string[]) => {
    reset();
    if (newExpectedAnswers && newExpectedAnswers.length > 0) {
      dynamicExpectedAnswersRef.current = newExpectedAnswers;
    }
    baseStartRecording();
  }, [reset, baseStartRecording]);

  const stopRecording = useCallback(() => {
    baseStopRecording();
  }, [baseStopRecording]);

  const retry = useCallback(() => {
    reset();
    baseStartRecording();
  }, [reset, baseStartRecording]);

  return {
    isRecording,
    transcript: realtimeTranscript || transcript,
    score,
    passed,
    isSupported,
    error,
    warning,
    recordingTime,
    hasResult,
    startRecording,
    stopRecording,
    reset,
    retry,
  };
}

export interface UseSpeechWithScoringResult extends UseSpeechResult {
  score: number | null;
  passed: boolean | null;
  hasResult: boolean;
  reset: () => void;
}
