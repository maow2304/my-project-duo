// ============================================================================
// API แจ้งเตือน (notifications)
// การ subscribe แบบ realtime อยู่ที่ store/notification.js
// เนื่องจากผูกกับ state ของ Pinia store
// ============================================================================

import { supabase } from '@/lib/supabase'

/** ดึงการแจ้งเตือนทั้งหมดของผู้ใช้ (เรียงใหม่สุดก่อน) */
export async function listNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** เปลี่ยนการแจ้งเตือน 1 รายการให้เป็น "อ่านแล้ว" */
export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}

/** เปลี่ยนการแจ้งเตือนเป็น "อ่านแล้ว" ทีละหลายรายการ (ตาม id) */
export async function markNotificationsRead(ids) {
  if (!ids.length) return
  const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', ids)
  if (error) throw error
}