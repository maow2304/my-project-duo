// ============================================================================
// API ตัวเลือกสินค้า (product_variant: ไซส์/สี + สต็อกแยกตามตัวเลือก)
// การอ่านเปิด public (เหมือนสินค้า) ส่วนการเขียนบังคับด้วย RLS:
// เฉพาะเจ้าของสินค้า (product.seller_id = auth.uid()) เท่านั้น
// ============================================================================

import { supabase } from '@/lib/supabase'

/** ดึง variants ของสินค้า 1 ชิ้น (เรียงตามไซส์/สี) */
export async function listVariantsByProduct(productId) {
  const { data, error } = await supabase
    .from('product_variant')
    .select('*')
    .eq('product_id', Number(productId))
    .order('size', { ascending: true })
    .order('color', { ascending: true })
  if (error) throw error
  return data || []
}

/** สร้าง variant ใหม่ (ต้องเป็นสินค้าของผู้ขายปัจจุบันเท่านั้น ชั้น RLS บังคับ) */
export async function createVariant({ productId, size, color, quantity }) {
  const { data, error } = await supabase
    .from('product_variant')
    .insert({
      product_id: Number(productId),
      size: String(size).trim(),
      color: String(color).trim(),
      quantity: Number(quantity),
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** อัปเดตสต็อกของ variant (เจ้าของเท่านั้น) */
export async function updateVariantQuantity(variantId, quantity) {
  const { error } = await supabase
    .from('product_variant')
    .update({ quantity: Number(quantity) })
    .eq('variant_id', Number(variantId))
  if (error) throw error
}

/** อัปเดตไซส์/สี/สต็อกของ variant (เจ้าของเท่านั้น ออเดอร์เก่ายังเก็บ snapshot ไว้) */
export async function updateVariant(variantId, { size, color, quantity }) {
  const { error } = await supabase
    .from('product_variant')
    .update({
      size: String(size).trim(),
      color: String(color).trim(),
      quantity: Number(quantity),
    })
    .eq('variant_id', Number(variantId))
  if (error) throw error
}

/** ลบ variant (เจ้าของเท่านั้น ถ้าถูกลบ ออเดอร์เก่ายังเก็บ snapshot ไว้) */
export async function deleteVariant(variantId) {
  const { error } = await supabase
    .from('product_variant')
    .delete()
    .eq('variant_id', Number(variantId))
  if (error) throw error
}
