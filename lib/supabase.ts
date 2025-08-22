import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for TypeScript
export interface UserVault {
  id: string
  user_id: string
  encrypted_vault: string
  salt: string
  created_at?: string
  updated_at?: string
}