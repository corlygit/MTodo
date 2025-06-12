import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          text: string
          tags: {
            todo?: boolean
            person?: string
            time?: string
            product?: string
          }
          is_expanded: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          text: string
          tags?: {
            todo?: boolean
            person?: string
            time?: string
            product?: string
          }
          is_expanded?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          text?: string
          tags?: {
            todo?: boolean
            person?: string
            time?: string
            product?: string
          }
          is_expanded?: boolean
          updated_at?: string
          deleted_at?: string | null
        }
      }
    }
  }
}
