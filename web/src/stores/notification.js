import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useNotificationStore = defineStore('notification', () => {
  const items = ref([])
  const loaded = ref(false)
  let channel = null

  const unreadCount = computed(() => items.value.filter((n) => !n.is_read).length)

  async function load() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    items.value = data || []
    loaded.value = true
  }

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

  async function markRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (!error) {
      const n = items.value.find((x) => x.id === id)
      if (n) n.is_read = true
    }
  }

  async function markAllRead() {
    const ids = items.value.filter((n) => !n.is_read).map((n) => n.id)
    if (!ids.length) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids)
    if (!error) items.value.forEach((n) => (n.is_read = true))
  }

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