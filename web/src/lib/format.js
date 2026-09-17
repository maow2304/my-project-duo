// ============================================================================
// ฟังก์ชันจัดรูปแบบข้อมูลสำหรับแสดงผล (ราคา วันที่)
// ค่าคงที่เช่นสถานะออเดอร์ย้ายไปอยู่ที่ lib/constants.js
// ============================================================================

/** แปลงค่าเป็นตัวเลขที่ใช้คำนวณได้จริง (คืน 0 เมื่อไม่ใช่ตัวเลข เช่น ว่าง/ข้อความเพี้ยน)
 *  ใช้แทน Number() ในจุดรวมยอด เพื่อกัน "NaN" กระจายทั่วแอป */
export function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** จัดรูปแบบตัวเลขเป็นเงินบาทไทย เช่น 1,250.00 บาท (ข้อมูลเพี้ยนให้แสดง 0.00 บาท แทน NaN) */
export function formatTHB(value) {
  const n = toNumber(value)
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท'
}

/** จัดรูปแบบวันที่/เวลาเป็นภาษาไทยแบบสั้น เช่น 17 ก.ย. 2569, 14:30
 *  ข้อมูลว่างหรือวันที่เสีย (Invalid Date) ให้แสดง "-" แทนการพังทั้งหน้า */
export function formatDate(value) {
  if (value === null || value === undefined || value === '') return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}