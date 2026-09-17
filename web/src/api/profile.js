// ============================================================================
// API โปรไฟล์ผู้ใช้ (seller / buyer)
// ตัวช่วยในการอ่าน-สร้าง-อัปเดตโปรไฟล์ตามบทบาทของผู้ใช้
// ============================================================================

import { supabase } from '@/lib/supabase'

/** ดึงข้อมูลผู้ขายตาม id (คืน null ถ้าไม่มี) */
export async function getSellerProfile(uid) {
  const { data, error } = await supabase
    .from('seller')
    .select('*')
    .eq('seller_id', uid)
    .maybeSingle()
  if (error) throw error
  return data
}

/** ดึงข้อมูลผู้ซื้อตาม id (คืน null ถ้าไม่มี) */
export async function getBuyerProfile(uid) {
  const { data, error } = await supabase
    .from('buyer')
    .select('*')
    .eq('buyer_id', uid)
    .maybeSingle()
  if (error) throw error
  return data
}

/** สร้างโปรไฟล์ใหม่หลังสมัครสมาชิก (role = 'seller' | 'buyer') */
export async function createProfile(role, row) {
  const { error } = await supabase.from(role).insert(row)
  if (error) throw error
}

/** อัปเดตโปรไฟล์ตามบทบาท (fields คือคอลัมน์ที่จะแก้ เช่น name, phone) */
export async function updateProfile(role, uid, fields) {
  const table = role === 'seller' ? 'seller' : 'buyer'
  const idColumn = role === 'seller' ? 'seller_id' : 'buyer_id'
  const { error } = await supabase.from(table).update(fields).eq(idColumn, uid)
  if (error) throw error
}