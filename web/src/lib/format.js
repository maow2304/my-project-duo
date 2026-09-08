export function formatTHB(value) {
  const n = Number(value || 0)
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท'
}

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

export const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered']

export const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Paid: 'bg-blue-50 text-blue-700 ring-blue-200',
  Shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  Delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export const STATUS_LABEL = {
  Pending: 'รอการยืนยัน',
  Paid: 'ชำระแล้ว',
  Shipped: 'จัดส่งแล้ว',
  Delivered: 'ส่งมอบแล้ว',
}