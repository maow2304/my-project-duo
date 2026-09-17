// ============================================================================
// ระบบแจ้งเตือนแบบ toast (ข้อความสั้นมุมจอ) ใช้ได้ทุกหน้าโดย import { toast } มาเรียก
// state เก็บใน reactive array; ToastHost.vue เป็นคนวาด UI ให้
// ============================================================================

import { reactive } from 'vue'

export const toasts = reactive([])

let nextId = 1

export function toast(message, type = 'success') {
  const id = nextId++
  toasts.push({ id, message, type })
  setTimeout(() => removeToast(id), 4000)
}

export function removeToast(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}