// ============================================================================
// API คำสั่งซื้อ (orders / order_item)
// อ่าน-อัปเดตคำสั่งซื้อ รวมถึงเรียกฟังก์ชัน place_order ในฐานข้อมูล
// โครงสร้าง FK ที่ซ่อนอยู่ (order_item_product_id_fkey, orders_buyer_id_fkey ...)
// ประกาศไว้ที่นี่ที่เดียว เพื่อให้หน้าเว็บไม่ต้องรู้โครงสร้างตาราง
// ============================================================================

import { supabase } from '@/lib/supabase'

/**
 * สั่งซื้อสินค้า - เรียกฟังก์ชัน place_order ในฐานข้อมูล
 * (ฟังก์ชันนี้จะตรวจสต็อก + ตัดสต็อกทีละชิ้น บน RPC ที่ transaction ปลอดภัย)
 * @param {string} buyerId id ผู้ซื้อ
 * @param {Array} items [{ product_id, quantity, color, size }]
 * @returns {number} order_id ที่สร้างใหม่
 */
export async function placeOrder(buyerId, items) {
  const { data, error } = await supabase.rpc('place_order', {
    p_buyer_id: buyerId,
    p_items: items,
  })
  if (error) throw error
  return data
}

/** ดึงประวัติคำสั่งซื้อของผู้ซื้อ (แบบย่อสำหรับหน้า list) */
export async function listBuyerOrders(buyerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_date, total_amount, status')
    .eq('buyer_id', buyerId)
    .order('order_date', { ascending: false })
  if (error) throw error
  return data || []
}

/** ดึงคำสั่งซื้อ 1 รายการแบบเต็ม (หน้ารายละเอียด) */
export async function getOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** ดึงรายการสินค้าของคำสั่งซื้อ (พร้อมข้อมูลสินค้าเต็ม) */
export async function listOrderItems(orderId) {
  const { data, error } = await supabase
    .from('order_item')
    .select('*, product:order_item_product_id_fkey(*)')
    .eq('order_id', orderId)
  if (error) throw error
  return data || []
}

// join: order_item -> orders (ข้อมูลออเดอร์) -> buyer (ชื่อผู้ซื้อ)
// ใช้กับเลเยอร์ผู้ขายเพื่อดูออเดอร์ที่เกี่ยวข้องกับสินค้าตัวเอง
const ORDER_ITEM_WITH_ORDER = '*, product:order_item_product_id_fkey(*), orders:order_item_order_id_fkey(buyer:orders_buyer_id_fkey(name))'

/**
 * ดึง order_item ทุกแถวที่ผู้ใช้ปัจจุบันมองเห็น (ชั้น RLS กรองให้เฉพาะสินค้าของผู้ขายเอง)
 * ใช้ในหน้าออเดอร์และแพลตฟอร์มผู้ขาย
 */
export async function listSellerAccessibleOrderItems() {
  const { data, error } = await supabase.from('order_item').select(ORDER_ITEM_WITH_ORDER)
  if (error) throw error
  return data || []
}

/** ดึงคำสั่งซื้อตามรายการ id (ใช้ค้นซ้ำหลาย id ครั้งเดียว) */
export async function listOrdersByIds(orderIds) {
  if (!orderIds.length) return []
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_date, status, buyer:orders_buyer_id_fkey(name)')
    .in('order_id', orderIds)
    .order('order_date', { ascending: false })
  if (error) throw error
  return data || []
}

/** อัปเดตสถานะคำสั่งซื้อ เช่น Pending -> Paid (มี trigger แจ้งเตือนผู้ซื้ออัตโนมัติ) */
export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('order_id', orderId)
  if (error) throw error
}