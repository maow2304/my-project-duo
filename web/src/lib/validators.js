// ============================================================================
// ชุดฟังก์ชันตรวจสอบรูปแบบข้อมูลที่ผู้ใช้กรอก (input validation)
// ใช้ในหน้าล็อกอิน/สมัครสมาชิก, หน้าโปรไฟล์ และหน้าเพิ่ม/แก้ไขสินค้าของผู้ขาย
// แต่ละฟังก์ชันคืน true/false ง่ายๆให้หน้าเรียกไปผูกกับข้อความ error ของตัวเอง
// ============================================================================

/** ตรวจว่ามีตัวเลข (0-9) ปะปนอยู่ในข้อความหรือไม่ เช่น "สมชาย1" */
export function hasDigit(value) {
  return /\d/.test(String(value ?? ''))
}

/** ตรวจว่ารูปแบบคล้ายอีเมล (ต้องมี @ และจุด ไม่มีช่องว่าง) */
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

/** ตรวจว่าเป็นตัวเลขที่ใช้คำนวณได้จริง (ไม่ใช่ NaN/Infinity/สตริงว่าง) */
export function isNumeric(value) {
  const s = String(value ?? '').trim()
  if (!s) return false
  return Number.isFinite(Number(s))
}

/** ตรวจว่าเป็นเลขจำนวนเต็มไม่ติดลบ (ใช้กับช่องจำนวน เช่น สต็อก) — ห้าม abc/ทศนิยม/ลบ */
export function isNonNegativeInt(value) {
  return /^\d+$/.test(String(value ?? '').trim())
}

/** ตรวจว่าเป็นราคาที่รับได้: ตัวเลข ไม่ติดลบ ทศนิยมไม่เกิน 2 ตำแหน่ง */
export function isValidPrice(value) {
  return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(value ?? '').trim())
}

/** ทำความสะอาดเบอร์โทร: ดึงเฉพาะตัวเลขออกมา (ตัด ขีด-เว้นวรรค-วงเล็บ) */
export function cleanDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** ตรวจชื่อ (ชื่อ-นามสกุล/ชื่อร้าน): ห้ามตัวเลขและอักขระพิเศษ อนุญาต ไทย/อังกฤษ/ช่องว่าง/. /
 *  ใช้ \u0E00-\u0E7F แทนช่วงของตัวอักษรไทย */
export function isValidName(value) {
  return /^[A-Za-z\u0E00-\u0E7F.\- ]+$/.test(String(value ?? '').trim())
}

/** ตรวจ username: ตัวอักษรไทย/อังกฤษ ตัวเลข และ _ เท่านั้น ห้ามช่องว่าง/อักขระพิเศษ */
export function isValidUsername(value) {
  return /^[A-Za-z\u0E00-\u0E7F0-9_]+$/.test(String(value ?? '').trim())
}

/** นับความยาวจริง (ตัดช่องว่างหัว-ท้าย) เพื่อใช้เช็ก min/max */
export function lengthOf(value) {
  return String(value ?? '').trim().length
}