"use client";

import { motion } from "framer-motion";
import { Volume2, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getDifficultyLabel, getDifficultyColor } from "@/lib/utils";

export interface TaskCardProps {
  prompt: string;
  emoji?: string;
  difficulty: number;
  basePoints: number;
  hint?: string;
  isCurrent?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
}

export function TaskCard({
  prompt,
  emoji,
  difficulty,
  basePoints,
  hint,
  isCurrent = false,
  isCompleted = false,
  onClick,
}: TaskCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card
        variant={isCurrent ? "primary" : "default"}
        hover={!!onClick}
        onClick={onClick}
        className={`relative overflow-hidden transition-all duration-300 ${
          isCurrent ? "ring-4 ring-primary-400" : ""
        } ${isCompleted ? "opacity-60" : ""}`}
      >
        {/* Difficulty indicator */}
        <div className="absolute top-3 right-3">
          <Badge variant={difficulty >= 4 ? "danger" : difficulty >= 3 ? "warning" : "success"} size="sm">
            Level {difficulty}
          </Badge>
        </div>

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 left-3">
            <Badge variant="success" size="sm">✓ 完成</Badge>
          </div>
        )}

        <div className="p-6">
          {/* Emoji */}
          {emoji && (
            <div className="text-6xl mb-4 text-center animate-float">
              {emoji}
            </div>
          )}

          {/* Prompt text */}
          <div className="text-center mb-4">
            <p className="text-3xl font-display font-bold text-gray-800 mb-2">
              {prompt}
            </p>
            <p className="text-sm text-gray-500">
              请用英语回答上面的内容
            </p>
          </div>

          {/* Info row */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Volume2 className="w-4 h-4" />
              <span>{getDifficultyLabel(difficulty)}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="text-accent-600 font-semibold">{basePoints}</span>
              <span>积分</span>
            </div>
            {hint && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1" title={hint}>
                  <Lightbulb className="w-4 h-4 text-accent-500" />
                  <span>有提示</span>
                </div>
              </>
            )}
          </div>

          {/* Hint (show on hover) */}
          {hint && isCurrent && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <p className="text-center text-sm text-gray-600">
                <Lightbulb className="w-4 h-4 inline mr-1 text-accent-500" />
                提示: {hint}
              </p>
            </motion.div>
          )}
        </div>

        {/* Difficulty colored bottom bar */}
        <div className={`h-2 ${getDifficultyColor(difficulty)}`} />
      </Card>
    </motion.div>
  );
}
