// ============================================================================
// API แชท (conversations / messages)
// รวมคำสั่งอ่าน-เขียนห้องแชทและข้อความ
// การ subscribe แบบ realtime อยู่ที่ store/chat.js เพราะต้องผูกกับ state
// ============================================================================

import { supabase } from '@/lib/supabase'

// คอลัมน์ที่ต้องการ join ระหว่าง buyer/seller/product กับชื่อ table ที่ชัดเจน
const CONVERSATION_SELECT =
  '*, buyer:conversations_buyer_id_fkey(username, name, phone), seller:conversations_seller_id_fkey(username, name, places), product:conversations_product_id_fkey(product_id, product_name, price, image, color), last_message:messages(id, content, sent_at, sender_id) order by sent_at desc limit 1'

/**
 * หาหรือสร้างห้องแชทระหว่างผู้ซื้อ-ผู้ขาย
 * - หากแชทเดิม (ผู้ซื้อ/ผู้ขาย/สินค้าเดียวกัน) มีอยู่แล้วให้คืนค่านั้น
 * - ถ้าไม่มีให้สร้างใหม่ (ต่อสินค้าหรือถามเรื่องทั่วไป ขึ้นกับ productId)
 * @returns {object} ข้อมูล conversation
 */
export async function getOrCreateConversation({ buyerId, sellerId, productId, productSellerId }) {
  const effectiveSeller = sellerId || productSellerId
  if (buyerId === effectiveSeller) return null // คนเดียวกันไม่ต้องแชทกับตัวเอง

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('buyer_id', buyerId)
    .eq('seller_id', effectiveSeller)
  query = productId ? query.eq('product_id', productId) : query.is('product_id', null)

  const { data: existing } = await query.maybeSingle()
  if (existing) return existing

  const { data, error } = await supabase
    .from('conversations')
    .insert({ buyer_id: buyerId, seller_id: effectiveSeller, product_id: productId || null })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** ดึงห้องแชท 1 ห้องพร้อมข้อมูลคู่สนทนาและสินค้า (เปิดหน้าแชท) */
export async function getConversationById(conversationId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .eq('id', conversationId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** ดึงรายการห้องแชททั้งหมดของผู้ใช้ (เป็นผู้ซื้อหรือผู้ขายก็ได้) */
export async function listConversations(uid) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/** ดึงข้อความทั้งหมดของห้องแชท (เรียงตามเวลาเก่าไปใหม่) */
export async function listMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: true })
  if (error) throw error
  return data || []
}

/** บันทึกข้อความใหม่ในห้องแชท */
export async function sendMessage(conversationId, senderId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('*')
    .single()
  if (error) throw error
  return data
}