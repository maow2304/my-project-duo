// ============================================================================
// Notification store (Pinia) - การแจ้งเตือน + ฟังการแจ้งเตือนใหม่แบบ realtime
// งานอ่าน/เขียนผ่าน src/api/notifications.js ยกเว้น subscribe channel
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { listNotifications, markNotificationRead, markNotificationsRead } from '@/api/notifications'

export const useNotificationStore = defineStore('notification', () => {
  const items = ref([])
  const loaded = ref(false)
  let channel = null

  /** จำนวนที่ยังไม่ได้อ่าน (ใช้คิด badge ที่ Navbar) */
  const unreadCount = computed(() => items.value.filter((n) => !n.is_read).length)

  /** โหลดการแจ้งเตือนทั้งหมดครั้งแรก */
  async function load() {
    items.value = await listNotifications()
    loaded.value = true
  }

  /** สมัครฟัง INSERT/UPDATE การแจ้งเตือนแบบ realtime */
  function subscribe() {
    if (channel) return
    channel = supabase
      .channel('notifications-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          items.value = [payload.new, ...items.value]
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          const idx = items.value.findIndex((n) => n.id === payload.new.id)
          if (idx >= 0) items.value[idx] = payload.new
        }
      )
      .subscribe()
  }

  /** อ่านการแจ้งเตือน 1 รายการ (อัปเดต state ให้เป็นอ่านแล้วทันที) */
  async function markRead(id) {
    await markNotificationRead(id).catch(() => {})
    const n = items.value.find((x) => x.id === id)
    if (n) n.is_read = true
  }

  /** อ่านการแจ้งเตือนทุกอันที่ยังไม่ได้อ่าน */
  async function markAllRead() {
    const ids = items.value.filter((n) => !n.is_read).map((n) => n.id)
    if (!ids.length) return
    await markNotificationsRead(ids).catch(() => {})
    items.value.forEach((n) => (n.is_read = true))
  }

  /** ล้าง state + ยกเลิก subscribe เมื่อออกจากระบบ */
  function reset() {
    items.value = []
    loaded.value = false
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
  }

  return { items, loaded, unreadCount, load, subscribe, markRead, markAllRead, reset }
})