// ============================================================================
// ค่าคงที่กลางของโปรเจค (constants)
// ใช้ร่วมกันทั้งโปรเจค แก้ที่นี่ที่เดียวทั้งระบบ เช่น
//   - สถานะ/สีของออเดอร์
//   - รายการตัวเลือกในฟอร์ม (หมวดหมู่ สี ไซส์)
//   - ชื่อ bucket ใน Supabase Storage
// ============================================================================

/** ชื่อ bucket ที่เก็บรูปสินค้า (สร้างจาก supabase/migrations/0003_storage.sql) */
export const PRODUCT_IMAGE_BUCKET = 'product-images'

/** สถานะทั้งหมดของคำสั่งซื้อ (เรียงตามขั้นตอนจากแรกไปสุดท้าย) */
export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered']

/** ข้อความภาษาไทยที่แสดงแทนสถานะ (key ตรงกับค่า status ในตาราง orders) */
export const STATUS_LABEL = {
  Pending: 'รอการยืนยัน',
  Paid: 'ชำระแล้ว',
  Shipped: 'จัดส่งแล้ว',
  Delivered: 'ส่งมอบแล้ว',
}

/** คลาส Tailwind สีของแต่ละสถานะ (ใช้ใน component StatusBadge) */
export const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Paid: 'bg-blue-50 text-blue-700 ring-blue-200',
  Shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

/** หมวดหมู่สินค้าที่แนะนำ (แสดงใน datalist ของฟอร์มสินค้า) */
export const PRODUCT_CATEGORIES = ['เสื้อผ้า', 'รองเท้า', 'กระเป๋า', 'เครื่องประดับ', 'กีฬา']

/** ไซส์ที่แนะนำ (แสดงใน datalist ของฟอร์มสินค้า) */
export const PRODUCT_SIZES = ['S', 'M', 'L', 'XL', '42', 'Free']

/** สีที่แนะนำ (แสดงใน datalist ของฟอร์มสินค้า) */
export const PRODUCT_COLORS = ['Black', 'White', 'Blue', 'Gray', 'Khaki', 'Navy']