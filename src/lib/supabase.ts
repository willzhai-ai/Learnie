import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types - 简化版，只包含项目实际使用的表
export type Database = {
  public: {
    Tables: {
      child_profiles: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          avatar_url: string | null;
          pin_code: string;
          grade_level: number;
          semester: string;
          current_points: number;
          total_points_earned: number;
          current_level: number;
          answer_history: any;
          current_streak: number;
          best_streak: number;
          last_practice_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string;
          name: string;
          avatar_url?: string | null;
          pin_code?: string;
          grade_level?: number;
          semester?: string;
          current_points?: number;
          total_points_earned?: number;
          current_level?: number;
          answer_history?: any;
          current_streak?: number;
          best_streak?: number;
          last_practice_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          name?: string;
          avatar_url?: string | null;
          pin_code?: string;
          grade_level?: number;
          semester?: string;
          current_points?: number;
          total_points_earned?: number;
          current_level?: number;
          answer_history?: any;
          current_streak?: number;
          best_streak?: number;
          last_practice_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      answer_history: {
        Row: {
          id: string;
          child_id: string;
          question_id: string | null;
          question: string;
          transcript: string;
          score: number;
          passed: boolean;
          difficulty: number;
          category: string;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          question_id?: string | null;
          question: string;
          transcript: string;
          score: number;
          passed: boolean;
          difficulty: number;
          category: string;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          question_id?: string | null;
          question?: string;
          transcript?: string;
          score?: number;
          passed?: boolean;
          difficulty?: number;
          category?: string;
          points_earned?: number;
          created_at?: string;
        };
      };
    };
  };
};

// Type helpers
export type ChildProfile = Database["public"]["Tables"]["child_profiles"]["Row"];
export type ChildProfileInsert = Database["public"]["Tables"]["child_profiles"]["Insert"];
export type AnswerHistory = Database["public"]["Tables"]["answer_history"]["Row"];
export type AnswerHistoryInsert = Database["public"]["Tables"]["answer_history"]["Insert"];
