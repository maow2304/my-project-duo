// ============================================================================
// API ตะกร้าสินค้า (cart / cart_item)
// ดูแลทั้งการหาตะกร้าของผู้ซื้อ การอ่านรายการ และการแก้ไขจำนวน
// หมายเหตุ: โครงสร้าง FK ที่ซ่อนอยู่ (cart_item_product_id_fkey) ประกาศไว้ที่นี่ที่เดียว
// ============================================================================

import { supabase } from '@/lib/supabase'

/**
 * หา cart_id ของผู้ซื้อ หากยังไม่มีตะกร้าให้สร้างใหม่แล้วคืน id
 * (ตะกร้า 1 ผู้ซื้อมีได้แค่ 1 ใบ - สร้างตอนเพิ่มสินค้าครั้งแรก)
 */
export async function getOrCreateCart(buyerId) {
  const { data, error } = await supabase
    .from('cart')
    .select('cart_id')
    .eq('buyer_id', buyerId)
    .maybeSingle()
  if (error) throw error
  if (data) return data.cart_id

  const { data: created, error: createError } = await supabase
    .from('cart')
    .insert({ buyer_id: buyerId })
    .select('cart_id')
    .single()
  if (createError) throw createError
  return created.cart_id
}

/**
 * ดึงรายการในตะกร้า (พร้อมข้อมูลสินค้าเต็ม)
 * คืนค่าเป็น array ที่แบนรายการออกแล้ว เช่น price ถูกดึงออกจาก nested product
 */
export async function listCartItems(cartId) {
  const { data, error } = await supabase
    .from('cart_item')
    .select('cart_item_id, quantity, selected_color, selected_size, product_id, product:cart_item_product_id_fkey(*)')
    .eq('cart_id', cartId)
  if (error) throw error
  return (data || []).map((i) => ({
    cart_item_id: i.cart_item_id,
    quantity: i.quantity,
    selected_color: i.selected_color,
    selected_size: i.selected_size,
    product_id: i.product_id,
    product: i.product,
    price: i.product?.price ?? 0,
  }))
}

/** เพิ่มสินค้าใหม่เข้าตะกร้า (ถ้าซื้อสี/ไซส์เดิมอีก ให้เพิ่มบรรทัดใหม่ที่ layer store) */
export async function addCartItem({ cartId, productId, quantity, color, size }) {
  const { error } = await supabase.from('cart_item').insert({
    cart_id: cartId,
    product_id: productId,
    quantity,
    selected_color: color || null,
    selected_size: size || null,
  })
  if (error) throw error
}

/** อัปเดตจำนวนชิ้นของรายการในตะกร้า */
export async function updateCartItemQuantity(cartItemId, quantity) {
  const { error } = await supabase
    .from('cart_item')
    .update({ quantity })
    .eq('cart_item_id', cartItemId)
  if (error) throw error
}

/** ลบรายการสินค้าออกจากตะกร้า */
export async function removeCartItem(cartItemId) {
  const { error } = await supabase.from('cart_item').delete().eq('cart_item_id', cartItemId)
  if (error) throw error
}

/** ล้างตะกร้าทั้งใบ (ใช้หลังสั่งซื้อสำเร็จ) */
export async function clearCartItems(cartId) {
  const { error } = await supabase.from('cart_item').delete().eq('cart_id', cartId)
  if (error) throw error
}