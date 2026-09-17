// ============================================================================
// ฟังก์ชันจัดรูปแบบข้อมูลสำหรับแสดงผล (ราคา วันที่)
// ค่าคงที่เช่นสถานะออเดอร์ย้ายไปอยู่ที่ lib/constants.js
// ============================================================================

/** จัดรูปแบบตัวเลขเป็นเงินบาทไทย เช่น 1,250.00 บาท */
export function formatTHB(value) {
  const n = Number(value || 0)
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท'
}

/** จัดรูปแบบวันที่/เวลาเป็นภาษาไทยแบบสั้น เช่น 17 ก.ย. 2569, 14:30 */
export function formatDate(value) {
  if (!value) return '-'
  const d = new Date(value)
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}