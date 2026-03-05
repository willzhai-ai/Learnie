import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with commas for thousands
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("zh-CN").format(num);
}

/**
 * Calculate points earned from a task
 * @param basePoints - Base points for the task
 * @param difficulty - Difficulty level (1-5)
 * @param streak - Current streak count
 * @param isFirstTime - Whether this is the first time completing this task
 */
export function calculatePoints(
  basePoints: number,
  difficulty: number = 1,
  streak: number = 0,
  isFirstTime: boolean = false
): number {
  // Difficulty multiplier: 1.0, 1.25, 1.5, 1.75, 2.0
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.25;

  // Streak bonus: 3+ = 1.1x, 5+ = 1.2x, 10+ = 1.3x
  let streakMultiplier = 1;
  if (streak >= 10) {
    streakMultiplier = 1.3;
  } else if (streak >= 5) {
    streakMultiplier = 1.2;
  } else if (streak >= 3) {
    streakMultiplier = 1.1;
  }

  // First time completion bonus: 1.2x
  const firstTimeBonus = isFirstTime ? 1.2 : 1;

  return Math.round(basePoints * difficultyMultiplier * streakMultiplier * firstTimeBonus);
}

/**
 * Calculate score using Levenshtein distance (fuzzy matching)
 * @param expected - Expected phrases
 * @param actual - Actual spoken text
 */
export function calculateScore(expected: string[], actual: string): number {
  const normalized = actual.toLowerCase().trim();

  // Exact match
  if (expected.some((e) => e.toLowerCase() === normalized)) {
    return 100;
  }

  // Fuzzy match using Levenshtein distance
  const levenshtein = require("levenshtein");

  const bestMatch = Math.max(
    ...expected.map((e) => {
      const distance = levenshtein(e.toLowerCase(), normalized);
      const maxLength = Math.max(e.length, normalized.length);
      return 1 - distance / maxLength;
    })
  );

  // Require at least 60% similarity to pass
  const score = Math.round(bestMatch * 100);
  return score >= 60 ? score : 0;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Get difficulty label
 */
export function getDifficultyLabel(level: number): string {
  const labels = ["", "简单", "中等", "困难", "专家", "大师"];
  return labels[level] || "未知";
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(level: number): string {
  const colors = {
    1: "bg-success-500",
    2: "bg-secondary-400",
    3: "bg-accent-400",
    4: "bg-primary-500",
    5: "bg-purple-500",
  };
  return colors[level as keyof typeof colors] || "bg-gray-500";
}
