import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionSeed, GeneratedQuestion } from "@/lib/questionGenerator";
import * as dataSync from "@/lib/dataSync";
import { apiFetch } from "@/lib/api";

// Types
export type GradeLevel = {
  grade: number; // 1-6 for elementary school
  semester: "上学期" | "下学期";
  displayName: string; // e.g., "小学三年级 下学期"
};

export interface Child {
  id: string;
  name: string;
  avatarUrl: string | null;
  gradeLevel: GradeLevel;
  currentPoints: number;
  totalPointsEarned: number;
  currentLevel: number;
  // 答题历史记录（用于分析薄弱环节）
  answerHistory?: Array<{
    questionId: string; // 题目ID，用于跟踪完成情况
    question: string;
    passed: boolean;
    score: number;
    timestamp: string;
    difficulty: number;
    category: string;
  }>;
}

// 题目使用记录 - 跟踪每个难度剩余题目数量
export interface QuestionUsage {
  difficulty: number;
  total: number; // 总题目数
  used: number; // 已使用数量
  questionIds: string[]; // 已使用的题目ID
}

export interface TaskState {
  currentTask: {
    id: string;
    prompt: string;
    expectedAnswers: string[];
    emoji?: string;
    difficulty: number;
    basePoints: number;
  } | null;
  transcript: string;
  isRecording: boolean;
  score: number | null;
  passed: boolean | null;
  pointsEarned: number | null;
}

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastCompletedAt: string | null;
}

// Tower mode state
export interface TowerProgress {
  currentLevel: number;
  highestLevel: number;
  totalPoints: number;
  questionsCompleted: number;
}

export interface TowerRanking {
  child_id: string;
  child_name: string;
  avatar_url: string | null;
  grade_level: number;
  current_level: number;
  highest_level: number;
  total_points: number;
  questions_completed: number;
  rank: number;
}

// Game Store
interface GameStore {
  // Parent state
  parentId: string | null;
  children: Child[];
  selectedChildId: string | null;

  // Child session state
  currentChild: Child | null;
  isLoggedIn: boolean;

  // Task state
  task: TaskState;
  streak: StreakState;

  // Question seed state
  questionSeed: QuestionSeed | null;
  isGeneratingSeed: boolean;
  seedLastGenerated: string | null;
  questionUsage: Record<number, QuestionUsage>; // Keyed by difficulty (1-5)

  // Contest mode state
  contestMode: {
    isActive: boolean;
    currentLevel: number;
    bestLevel: number;
  };

  // Tower mode state
  towerMode: {
    isActive: boolean;
    currentLevel: number;
    highestLevel: number;
    totalPoints: number;
    questionsCompleted: number;
    leaderboard: TowerRanking[];
    myRank: number | null;
    isLoading: boolean;
  };

  // Sync state
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncEnabled: boolean;

  // Actions
  setParentId: (id: string) => void;
  addChild: (child: Child) => void;
  deleteChild: (childId: string) => Promise<void>;
  selectChild: (id: string) => void;
  logoutChild: () => void;
  logoutParent: () => void;

  // Task actions
  setCurrentTask: (task: TaskState["currentTask"]) => void;
  setTranscript: (transcript: string) => void;
  setRecording: (isRecording: boolean) => void;
  setScore: (score: number, passed: boolean, pointsEarned: number) => void;
  resetTask: () => void;

  // Question seed actions
  setQuestionSeed: (seed: QuestionSeed) => void;
  generateQuestionSeed: (options?: {
    count?: number;
    difficulty?: number;
    category?: string;
  }) => Promise<void>;
  clearQuestionSeed: () => void;
  addAnswerHistory: (record: {
    questionId: string;
    question: string;
    passed: boolean;
    score: number;
    difficulty: number;
    category: string;
  }) => void;
  updateQuestionUsage: (difficulty: number, questionId: string) => void;
  getRemainingQuestions: (difficulty: number) => number;
  shouldRegenerateQuestions: (difficulty: number) => boolean;

  // Streak actions
  incrementStreak: () => void;
  resetStreak: () => void;

  // Contest actions
  startContest: () => void;
  nextContestLevel: () => void;
  endContest: () => void;

  // Tower actions
  startTower: () => Promise<void>;
  getTowerProgress: () => Promise<void>;
  completeTowerLevel: (level: number, questionId: string, passed: boolean, score: number) => Promise<void>;
  getTowerLeaderboard: () => Promise<void>;
  resetTower: () => void;

  // Points actions
  addPoints: (points: number) => void;

  // Supabase sync actions
  syncFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
  setSyncEnabled: (enabled: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      parentId: null,
      children: [],
      selectedChildId: null,
      currentChild: null,
      isLoggedIn: false,

      task: {
        currentTask: null,
        transcript: "",
        isRecording: false,
        score: null,
        passed: null,
        pointsEarned: null,
      },

      streak: {
        currentStreak: 0,
        bestStreak: 0,
        lastCompletedAt: null,
      },

      // Question seed state
      questionSeed: null,
      isGeneratingSeed: false,
      seedLastGenerated: null,
      questionUsage: {
        1: { difficulty: 1, total: 10, used: 0, questionIds: [] },
        2: { difficulty: 2, total: 10, used: 0, questionIds: [] },
        3: { difficulty: 3, total: 10, used: 0, questionIds: [] },
        4: { difficulty: 4, total: 10, used: 0, questionIds: [] },
        5: { difficulty: 5, total: 10, used: 0, questionIds: [] },
      },

      contestMode: {
        isActive: false,
        currentLevel: 1,
        bestLevel: 0,
      },

      // Tower mode state
      towerMode: {
        isActive: false,
        currentLevel: 1,
        highestLevel: 1,
        totalPoints: 0,
        questionsCompleted: 0,
        leaderboard: [],
        myRank: null,
        isLoading: false,
      },

      // Sync state
      isSyncing: false,
      lastSyncAt: null,
      syncEnabled: true, // 默认开启同步

      // Actions
      setParentId: (id) => set({ parentId: id }),

      addChild: (child) => set((state) => {
        // 自动同步到 Supabase
        if (state.syncEnabled && state.parentId) {
          dataSync.saveChildToSupabase(child).catch(console.error);
        }
        return { children: [...state.children, child] };
      }),

      deleteChild: async (childId: string) => {
        const state = get();

        // 从本地 state 中删除
        const updatedChildren = state.children.filter((c) => c.id !== childId);

        // 如果删除的是当前选中的孩子，清除选中状态
        const updates: any = {
          children: updatedChildren,
        };

        if (state.selectedChildId === childId) {
          updates.selectedChildId = null;
          updates.currentChild = null;
          updates.isLoggedIn = false;
        }

        set(updates);

        // 从 Supabase 删除
        try {
          const sb = await dataSync.getSupabaseWithAuth();
          await sb.from("child_profiles").delete().eq("id", childId);
          console.log("✅ 已从 Supabase 删除孩子:", childId);
        } catch (error) {
          console.error("从 Supabase 删除失败:", error);
        }
      },

      selectChild: (id) => {
        const child = get().children.find((c) => c.id === id);
        if (child) {
          set({
            selectedChildId: id,
            currentChild: child,
            isLoggedIn: true,
          });
        }
      },

      logoutChild: () =>
        set({
          currentChild: null,
          isLoggedIn: false,
          task: {
            currentTask: null,
            transcript: "",
            isRecording: false,
            score: null,
            passed: null,
            pointsEarned: null,
          },
          towerMode: {
            isActive: false,
            currentLevel: 1,
            highestLevel: 1,
            totalPoints: 0,
            questionsCompleted: 0,
            leaderboard: [],
            myRank: null,
            isLoading: false,
          },
        }),

      logoutParent: () =>
        set({
          parentId: null,
          children: [],
          selectedChildId: null,
          currentChild: null,
          isLoggedIn: false,
        }),

      // Task actions
      setCurrentTask: (task) =>
        set((state) => ({
          task: { ...state.task, currentTask: task },
        })),

      setTranscript: (transcript) =>
        set((state) => ({
          task: { ...state.task, transcript },
        })),

      setRecording: (isRecording) =>
        set((state) => ({
          task: { ...state.task, isRecording },
        })),

      setScore: (score, passed, pointsEarned) =>
        set((state) => ({
          task: { ...state.task, score, passed, pointsEarned },
        })),

      resetTask: () =>
        set({
          task: {
            currentTask: null,
            transcript: "",
            isRecording: false,
            score: null,
            passed: null,
            pointsEarned: null,
          },
        }),

      // Question seed actions
      setQuestionSeed: (seed) =>
        set({
          questionSeed: seed,
          seedLastGenerated: new Date().toISOString(),
        }),

      generateQuestionSeed: async (options = {}) => {
        const state = get();
        if (!state.currentChild || state.isGeneratingSeed) return;

        set({ isGeneratingSeed: true });

        try {
          const child = state.currentChild;
          const history = child.answerHistory || [];

          // 分析薄弱环节
          const wrongQuestions = history
            .filter((h) => !h.passed)
            .map((h) => h.question)
            .slice(0, 5); // 最多取最近5个错题

          // 默认生成10道题目（如果没有指定难度，则生成全部5个难度各10道）
          const defaultCount = options.difficulty ? 10 : 50;

          // 调用 API 生成题库
          const response = await apiFetch("/api/questions/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gradeLevel: child.gradeLevel.grade,
              semester: child.gradeLevel.semester,
              weakAreas: [], // 可以通过分析 history 得到
              wrongQuestions,
              count: options.count || defaultCount,
              difficulty: options.difficulty,
              category: options.category,
            }),
          });

          if (!response.ok) {
            throw new Error("生成题库失败");
          }

          const data = await response.json();

          if (data.success) {
            const updateState: any = {
              seedLastGenerated: new Date().toISOString(),
              isGeneratingSeed: false,
            };

            // 如果指定了难度，并且已有种子，则追加题目而不是替换
            if (options.difficulty && state.questionSeed) {
              // 追加模式：合并新题目到现有种子
              const existingQuestions = state.questionSeed.questions || [];
              const newQuestions = data.seed.questions || [];

              // 合并题目（去除重复ID）
              const existingIds = new Set(existingQuestions.map(q => q.id));
              const uniqueNewQuestions = newQuestions.filter(q => !existingIds.has(q.id));

              const mergedSeed = {
                ...state.questionSeed,
                questions: [...existingQuestions, ...uniqueNewQuestions],
                generatedAt: new Date().toISOString(), // 更新生成时间
              };

              updateState.questionSeed = mergedSeed;
            } else {
              // 替换模式：完全替换种子
              updateState.questionSeed = data.seed;
            }

            // 更新题目使用记录
            if (options.difficulty) {
              // 计算该难度的题目总数
              const difficultyQuestions = (updateState.questionSeed?.questions || [])
                .filter(q => q.difficulty === options.difficulty);

              updateState.questionUsage = {
                ...state.questionUsage,
                [options.difficulty]: {
                  difficulty: options.difficulty,
                  total: difficultyQuestions.length,
                  used: 0,
                  questionIds: [],
                },
              };
            }

            set(updateState);
          }
        } catch (error) {
          console.error("生成题库失败:", error);
          set({ isGeneratingSeed: false });
        }
      },

      clearQuestionSeed: () =>
        set({
          questionSeed: null,
          seedLastGenerated: null,
        }),

      addAnswerHistory: (record) =>
        set((state) => {
          if (!state.currentChild) return state;

          const newRecord = { ...record, timestamp: new Date().toISOString() };
          const updatedHistory = [
            ...(state.currentChild.answerHistory || []).slice(-49), // 保留最近50条
            newRecord,
          ];

          const updatedChild = {
            ...state.currentChild,
            answerHistory: updatedHistory,
          };

          const updatedChildren = state.children.map((c) =>
            c.id === updatedChild.id ? updatedChild : c
          );

          // 同步到 Supabase
          if (state.syncEnabled) {
            dataSync.saveAnswerHistoryToSupabase(updatedChild.id, {
              questionId: record.questionId,
              question: record.question,
              transcript: "", // 如果有 transcript 数据，从 task 中获取
              score: record.score,
              passed: record.passed,
              difficulty: record.difficulty,
              category: record.category,
              pointsEarned: 0, // 可以从 passed 计算
            }).catch(console.error);

            // 更新连胜记录到 Supabase
            dataSync.updateStreakInSupabase(
              updatedChild.id,
              state.streak.currentStreak,
              state.streak.bestStreak
            ).catch(console.error);

            // 更新积分到 Supabase
            dataSync.updateChildPointsInSupabase(
              updatedChild.id,
              updatedChild.currentPoints,
              updatedChild.totalPointsEarned
            ).catch(console.error);
          }

          return {
            currentChild: updatedChild,
            children: updatedChildren,
          };
        }),

      // Streak actions
      incrementStreak: () =>
        set((state) => {
          const newStreak = state.streak.currentStreak + 1;
          const newStreakState = {
            streak: {
              currentStreak: newStreak,
              bestStreak: Math.max(state.streak.bestStreak, newStreak),
              lastCompletedAt: new Date().toISOString(),
            },
          };

          // 同步到 Supabase
          if (state.syncEnabled && state.currentChild) {
            dataSync.updateStreakInSupabase(
              state.currentChild.id,
              newStreak,
              Math.max(state.streak.bestStreak, newStreak)
            ).catch(console.error);
          }

          return newStreakState;
        }),

      resetStreak: () =>
        set((state) => {
          const newStreakState = {
            streak: {
              ...state.streak,
              currentStreak: 0,
            },
          };

          // 同步到 Supabase
          if (state.syncEnabled && state.currentChild) {
            dataSync.updateStreakInSupabase(
              state.currentChild.id,
              0,
              state.streak.bestStreak
            ).catch(console.error);
          }

          return newStreakState;
        }),

      // Contest actions
      startContest: () =>
        set({
          contestMode: {
            isActive: true,
            currentLevel: 1,
            bestLevel: get().contestMode.bestLevel,
          },
        }),

      nextContestLevel: () =>
        set((state) => ({
          contestMode: {
            ...state.contestMode,
            currentLevel: state.contestMode.currentLevel + 1,
          },
        })),

      endContest: () =>
        set((state) => {
          const newBestLevel = Math.max(
            state.contestMode.bestLevel,
            state.contestMode.currentLevel
          );
          const newContestMode = {
            contestMode: {
              isActive: false,
              currentLevel: 1,
              bestLevel: newBestLevel,
            },
          };

          // 同步到 Supabase
          if (state.syncEnabled && state.currentChild) {
            dataSync.saveChildToSupabase({
              ...state.currentChild,
              currentLevel: newBestLevel,
            }).catch(console.error);
          }

          return newContestMode;
        }),

      // Tower actions
      startTower: async () => {
        const state = get();
        if (!state.currentChild) return;

        set({ towerMode: { ...state.towerMode, isLoading: true } });

        try {
          const response = await apiFetch(`/api/tower/start?childId=${state.currentChild.id}`);

          if (!response.ok) throw new Error("启动爬塔失败");

          const data = await response.json();

          if (data.success && data.progress) {
            set({
              towerMode: {
                ...state.towerMode,
                isActive: true,
                currentLevel: data.progress.current_level,
                highestLevel: data.progress.highest_level,
                totalPoints: data.progress.total_points,
                questionsCompleted: data.progress.questions_completed,
                isLoading: false,
              },
            });
          }
        } catch (error) {
          console.error("启动爬塔失败:", error);
          set({ towerMode: { ...state.towerMode, isLoading: false } });
        }
      },

      getTowerProgress: async () => {
        const state = get();
        if (!state.currentChild) return;

        try {
          const response = await apiFetch(`/api/tower/start?childId=${state.currentChild.id}`);

          if (!response.ok) throw new Error("获取爬塔进度失败");

          const data = await response.json();

          if (data.success && data.progress) {
            set({
              towerMode: {
                ...state.towerMode,
                currentLevel: data.progress.current_level,
                highestLevel: data.progress.highest_level,
                totalPoints: data.progress.total_points,
                questionsCompleted: data.progress.questions_completed,
              },
            });
          }
        } catch (error) {
          console.error("获取爬塔进度失败:", error);
        }
      },

      completeTowerLevel: async (level, questionId, passed, score) => {
        const state = get();
        if (!state.currentChild) return;

        try {
          const response = await apiFetch("/api/tower/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              childId: state.currentChild.id,
              level,
              questionId,
              passed,
              score,
              pointsEarned: 1, // 每层固定1积分
            }),
          });

          if (!response.ok) throw new Error("完成层级失败");

          const data = await response.json();

          if (data.success) {
            set({
              towerMode: {
                ...state.towerMode,
                currentLevel: data.nextLevel,
                highestLevel: data.progress?.highest_level || state.towerMode.highestLevel,
                totalPoints: data.progress?.total_points || state.towerMode.totalPoints,
                questionsCompleted: state.towerMode.questionsCompleted + 1,
              },
            });

            // 刷新排行榜
            get().getTowerLeaderboard();
          }
        } catch (error) {
          console.error("完成层级失败:", error);
        }
      },

      getTowerLeaderboard: async () => {
        const state = get();
        if (!state.currentChild) return;

        try {
          const response = await apiFetch(`/api/tower/leaderboard?childId=${state.currentChild.id}`);

          if (!response.ok) throw new Error("获取排行榜失败");

          const data = await response.json();

          if (data.success) {
            set({
              towerMode: {
                ...state.towerMode,
                leaderboard: data.rankings || [],
                myRank: data.myRank,
              },
            });
          }
        } catch (error) {
          console.error("获取排行榜失败:", error);
        }
      },

      resetTower: () =>
        set({
          towerMode: {
            isActive: false,
            currentLevel: 1,
            highestLevel: 1,
            totalPoints: 0,
            questionsCompleted: 0,
            leaderboard: [],
            myRank: null,
            isLoading: false,
          },
        }),

      // Points actions
      addPoints: (points) =>
        set((state) => {
          if (!state.currentChild) return state;
          const newPoints = state.currentChild.currentPoints + points;
          const totalPoints = state.currentChild.totalPointsEarned + points;
          const updatedChild = {
            ...state.currentChild,
            currentPoints: newPoints,
            totalPointsEarned: totalPoints,
          };
          const updatedChildren = state.children.map((c) =>
            c.id === updatedChild.id ? updatedChild : c
          );

          // 同步到 Supabase
          if (state.syncEnabled) {
            dataSync.updateChildPointsInSupabase(
              updatedChild.id,
              newPoints,
              totalPoints
            ).catch(console.error);
          }

          return {
            currentChild: updatedChild,
            children: updatedChildren,
          };
        }),

      // Question usage actions
      updateQuestionUsage: (difficulty, questionId) =>
        set((state) => {
          const usage = state.questionUsage[difficulty];
          if (!usage) return state;

          // Don't count if already used
          if (usage.questionIds.includes(questionId)) return state;

          return {
            questionUsage: {
              ...state.questionUsage,
              [difficulty]: {
                ...usage,
                used: usage.used + 1,
                questionIds: [...usage.questionIds, questionId],
              },
            },
          };
        }),

      getRemainingQuestions: (difficulty) => {
        const usage = get().questionUsage[difficulty];
        if (!usage) return 0;
        return Math.max(0, usage.total - usage.used);
      },

      shouldRegenerateQuestions: (difficulty) => {
        const usage = get().questionUsage[difficulty];
        if (!usage) return true;
        return usage.used >= usage.total;
      },

      // Supabase sync actions
      syncFromSupabase: async () => {
        const state = get();
        if (!state.parentId || state.isSyncing) return;

        set({ isSyncing: true });

        try {
          const children = await dataSync.syncChildrenFromSupabase(state.parentId);

          // 保持当前选中的孩子
          let currentChild = state.currentChild;
          if (state.selectedChildId) {
            const updatedChild = children.find(c => c.id === state.selectedChildId);
            if (updatedChild) {
              currentChild = updatedChild;
            }
          }

          set({
            children,
            currentChild,
            lastSyncAt: new Date().toISOString(),
            isSyncing: false,
          });
        } catch (error) {
          console.error("从 Supabase 同步失败:", error);
          set({ isSyncing: false });
        }
      },

      syncToSupabase: async () => {
        const state = get();
        if (!state.syncEnabled || state.isSyncing) return;

        set({ isSyncing: true });

        try {
          // 同步所有孩子数据
          await dataSync.syncAllChildrenToSupabase(state.children);

          set({
            lastSyncAt: new Date().toISOString(),
            isSyncing: false,
          });
        } catch (error) {
          console.error("同步到 Supabase 失败:", error);
          set({ isSyncing: false });
        }
      },

      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
    }),
    {
      name: "english-game-storage",
      partialize: (state) => ({
        parentId: state.parentId,
        children: state.children,
        selectedChildId: state.selectedChildId,
        currentChild: state.currentChild,
        streak: state.streak,
        contestMode: state.contestMode,
        towerMode: {
          isActive: state.towerMode.isActive,
          currentLevel: state.towerMode.currentLevel,
          highestLevel: state.towerMode.highestLevel,
          totalPoints: state.towerMode.totalPoints,
          questionsCompleted: state.towerMode.questionsCompleted,
        },
        // 排除 questionSeed（数据太大），只保留最后生成时间
        seedLastGenerated: state.seedLastGenerated,
        questionUsage: state.questionUsage,
        syncEnabled: state.syncEnabled,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
