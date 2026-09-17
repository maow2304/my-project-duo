// ============================================================================
// API ข้อมูลสินค้า (product)
// รวมคำสั่งอ่าน/เขียนตาราง product ไว้ที่จุดเดียว
// หน้าเว็บและ store เรียกผ่านไฟล์นี้ ไม่ต้องรู้โครงสร้าง FK ของฐานข้อมูล
// ทุกฟังก์ชันคืนค่า data หรือ throw error (ให้เพจ catch แสดง toast เอง)
// ============================================================================

import { supabase } from '@/lib/supabase'

// join สินค้ากับร้านค้าแบบครบ (ใช้ในหน้ารายละเอียดสินค้า)
const PRODUCT_WITH_SELLER = '*, seller:product_seller_id_fkey(*)'
// join แบบย่อ - เอาเฉพาะชื่อ/ที่ตั้งร้าน (ใช้ในการ์ดสินค้าในหน้าหลัก)
const PRODUCT_WITH_SELLER_LIGHT = '*, seller:product_seller_id_fkey(name, places)'

/** ดึงสินค้าทั้งหมด + ข้อมูลร้านค้า (สำหรับหน้าหลัก) */
export async function listProducts() {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_WITH_SELLER_LIGHT)
    .order('product_id', { ascending: true })
  if (error) throw error
  return data || []
}

/** ดึงสินค้า 1 รายการตาม id พร้อมข้อมูลร้านค้า (สำหรับหน้ารายละเอียด) */
export async function getProductById(productId) {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_WITH_SELLER)
    .eq('product_id', productId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** ดึงสินค้าทั้งหมดของผู้ขายรายเดียว (สำหรับหน้าจัดการสินค้า) */
export async function listProductsBySeller(sellerId) {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('seller_id', sellerId)
    .order('product_id', { ascending: false })
  if (error) throw error
  return data || []
}

/** ดึงสินค้า 1 รายการที่แน่ใจว่าเป็นของผู้ขายรายนั้น (หน้าก่อนแก้ไข) */
export async function getProductBySeller(productId, sellerId) {
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('product_id', productId)
    .eq('seller_id', sellerId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** สร้างสินค้าใหม่ (payload ต้องมี seller_id) */
export async function createProduct(payload) {
  const { error } = await supabase.from('product').insert(payload)
  if (error) throw error
}

/** อัปเดตสินค้า (ต้องเป็นของผู้ขายปัจจุบันเท่านั้น ชั้น RLS บังคับ) */
export async function updateProduct(productId, payload) {
  const { error } = await supabase.from('product').update(payload).eq('product_id', productId)
  if (error) throw error
}

/** ลบสินค้า (ชั้น RLS บังคับว่าเจ้าของเท่านั้นจึงจะลบได้) */
export async function deleteProduct(productId) {
  const { error } = await supabase.from('product').delete().eq('product_id', productId)
  if (error) throw error
}