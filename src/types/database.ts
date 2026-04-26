export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          model1_type: string
          model1_version: string
          model1_temperature: number
          model1_max_tokens: number
          model2_type: string
          model2_version: string
          model2_temperature: number
          model2_max_tokens: number
          interaction_limit: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          model1_type: string
          model1_version: string
          model1_temperature: number
          model1_max_tokens: number
          model2_type: string
          model2_version: string
          model2_temperature: number
          model2_max_tokens: number
          interaction_limit: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          model1_type?: string
          model1_version?: string
          model1_temperature?: number
          model1_max_tokens?: number
          model2_type?: string
          model2_version?: string
          model2_temperature?: number
          model2_max_tokens?: number
          interaction_limit?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: string
          model: string
          content: string
          word_count: number
          time_taken: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role?: string
          model?: string
          content: string
          word_count?: number
          time_taken?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: string
          model?: string
          content?: string
          word_count?: number
          time_taken?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
