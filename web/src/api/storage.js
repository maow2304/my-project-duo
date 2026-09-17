// ============================================================================
// API Storage (อัปโหลด/ลบรูปสินค้า)
// จัดการไฟล์รูปใน Supabase Storage bucket "product-images"
// ============================================================================

import { supabase } from '@/lib/supabase'
import { PRODUCT_IMAGE_BUCKET } from '@/lib/constants'

/**
 * อัปโหลดรูปสินค้าเข้าสู่ Storage และคืน URL สาธารณะของรูปนั้นกลับมา
 * เก็บใน path "<ownerId>/<timestamp>-<sanitized-filename>" เพื่อกันไฟล์บังกัน
 */
export async function uploadProductImage(file, ownerId) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${ownerId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * แปลง URL รูปให้เป็น path ภายใน bucket (สำหรับลบไฟล์ใน Storage)
 * เช่น ".../storage/v1/object/public/product-images/2/1234-a.png" -> "2/1234-a.png"
 */
export function toStoragePath(publicUrl) {
  const marker = `/${PRODUCT_IMAGE_BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  return idx >= 0 ? publicUrl.slice(idx + marker.length) : publicUrl.split('/').pop()
}

/**
 * ลบรูปเก่าเมื่ออัปโหลดรูปใหม่แทน (แบบเงียบ - ถ้าลบไม่ได้ก็ไม่พังการทำงาน)
 */
export async function removeProductImage(publicUrl) {
  const path = toStoragePath(publicUrl)
  if (!path) return
  await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([path])
    .catch(() => {})
}