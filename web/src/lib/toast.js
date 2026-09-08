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