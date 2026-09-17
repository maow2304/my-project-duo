import { createClient } from '@supabase/supabase-js'

// สร้าง Supabase client ตัวเดียวใช้ทั้งแอป
// หน้าเว็บไม่ควรเรียก cleanup โดยตรง ควรผ่าน src/api/* แทน
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})