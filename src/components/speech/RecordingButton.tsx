"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export interface RecordingButtonProps {
  isRecording: boolean;
  isProcessing?: boolean;
  disabled?: boolean;
  recordingTime?: number;
  warning?: string | null;
  error?: string | null;
  onStart: () => void;
  onStop?: () => void; // Optional - if not provided, auto-stops when answer is correct
  onRetry?: () => void;
  autoStop?: boolean; // If true, automatically stops when correct answer is detected
  className?: string;
}

export function RecordingButton({
  isRecording,
  isProcessing = false,
  disabled = false,
  recordingTime = 0,
  warning = null,
  error = null,
  onStart,
  onStop,
  onRetry,
  autoStop = false,
  className,
}: RecordingButtonProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}`;
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* Recording timer */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center"
          >
            <span className="text-3xl font-mono font-bold text-gray-800">
              {formatTime(recordingTime)}
            </span>
            <span className="text-sm text-gray-400 ml-1">/ 15s</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning message */}
      <AnimatePresence>
        {warning && isRecording && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-sm text-amber-500 font-medium"
          >
            {warning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button - autoStop模式下录音时不可点击 */}
      <div className="flex items-center gap-4">
        <motion.div
          className="relative"
          whileHover={{ scale: disabled || isProcessing || (isRecording && autoStop) ? 1 : 1.05 }}
          whileTap={{ scale: disabled || isProcessing || (isRecording && autoStop) ? 1 : 0.95 }}
        >
          {/* 单层脉冲 */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
            )}
          </AnimatePresence>

          <Button
            variant={isRecording ? "danger" : "primary"}
            size="xl"
            disabled={disabled || isProcessing || (isRecording && autoStop)}
            onClick={isRecording ? (autoStop ? undefined : onStop) : onStart}
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center relative z-10",
              "shadow-xl transition-all duration-300",
              isRecording && autoStop && "cursor-default"
            )}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-10 h-10" />
            ) : (
              <Mic className="w-10 h-10" />
            )}
          </Button>
        </motion.div>

        {/* Manual stop button - shows during recording when autoStop is enabled */}
        <AnimatePresence>
          {isRecording && autoStop && onStop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={onStop}
                disabled={disabled || isProcessing}
                className="rounded-full px-5 py-3 text-sm font-medium shadow-lg border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                完成
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.p
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base font-medium text-red-500 flex items-center gap-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            {autoStop ? "正在聆听... 说出答案自动停止" : "正在录音..."}
          </motion.p>
        ) : isProcessing ? (
          <motion.p
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base font-medium text-gray-600"
          >
            识别中...
          </motion.p>
        ) : error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base font-medium text-red-500 flex items-center gap-1"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        ) : (
          <motion.p
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-base text-gray-500"
          >
            {autoStop ? "点击开始录音" : "点击开始录音"}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Retry button */}
      <AnimatePresence>
        {error && onRetry && !isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新录制
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 简化的波形 */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-1 h-6"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-500 rounded-full"
                animate={{
                  height: [4, 20, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Transcript display component
 */
export interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
}

export function TranscriptDisplay({ transcript, isRecording }: TranscriptDisplayProps) {
  return (
    <div className="w-full">
      <div className={cn(
        "rounded-xl p-5 border min-h-[100px] transition-all duration-300",
        isRecording ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
      )}>
        {transcript ? (
          <motion.p
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xl text-center text-gray-800 font-medium"
          >
            {transcript}
          </motion.p>
        ) : isRecording ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-3"
          >
            <p className="text-lg text-red-500 font-medium">正在聆听...</p>
            <p className="text-sm text-gray-400 mt-1">清晰读出答案，说对了会自动停止 ✓</p>
          </motion.div>
        ) : (
          <p className="text-lg text-center text-gray-400">
            您说的话会显示在这里
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Result display component with score
 */
export interface ResultDisplayProps {
  score: number;
  passed: boolean;
  pointsEarned: number;
  transcript: string;
  expected: string;
  onRetry?: () => void;
  showPoints?: boolean; // Whether to show points (default: true)
  mode?: "practice" | "contest"; // Display mode for different messages
}

export function ResultDisplay({
  score,
  passed,
  pointsEarned,
  transcript,
  expected,
  onRetry,
  showPoints = true,
  mode = "contest"
}: ResultDisplayProps) {
  const isPractice = mode === "practice";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card
        variant={passed ? "success" : "default"}
        className="overflow-hidden"
      >
        {/* Score header */}
        <div className={`p-6 text-center ${passed ? "bg-success-50" : "bg-gray-50"}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-6xl font-display font-bold mb-2"
          >
            {score}
            <span className="text-3xl text-gray-400">/100</span>
          </motion.div>

          {passed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-2xl font-bold text-success-600 mb-1">
                {isPractice ? "发音很棒！" : "太棒了！"}
              </p>
              {showPoints && !isPractice && pointsEarned > 0 ? (
                <p className="text-lg text-gray-600">获得 {pointsEarned} 积分</p>
              ) : isPractice ? (
                <p className="text-lg text-gray-600">继续加油，去闯关模式赢积分吧！</p>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-2xl font-bold text-accent-600 mb-1">再试一次！</p>
              <p className="text-lg text-gray-600">需要更清楚一些</p>
            </motion.div>
          )}
        </div>

        {/* Comparison */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">您说的:</p>
            <p className="text-lg font-medium text-gray-800">{transcript}</p>
          </div>
          <div className="bg-success-50 rounded-xl p-4">
            <p className="text-sm text-success-600 mb-1">期望的:</p>
            <p className="text-lg font-medium text-success-800">{expected}</p>
          </div>
        </div>

        {/* Retry button for failed attempts */}
        {!passed && onRetry && (
          <div className="p-6 pt-0">
            <Button
              variant="outline"
              size="lg"
              onClick={onRetry}
              className="w-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              重新录制
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
