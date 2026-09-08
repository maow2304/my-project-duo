<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '../stores/notification'
import { formatDate } from '../lib/format'
import SiteNavbar from '../components/SiteNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import EmptyState from '../components/EmptyState.vue'
import Icon from '../components/Icon.vue'

const notif = useNotificationStore()
const router = useRouter()

const icons = {
  order: 'order',
  order_status: 'order',
  chat: 'chat',
  system: 'alert',
}

onMounted(async () => {
  await notif.load().catch(() => {})
  notif.subscribe()
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div class="mb-6 flex items-center justify-between">
          <h1 class="text-2xl font-bold text-stone-800">การแจ้งเตือน</h1>
          <button
            v-if="notif.unreadCount > 0"
            class="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
            @click="notif.markAllRead()"
          >
            อ่านทั้งหมด
          </button>
        </div>

        <EmptyState v-if="notif.loaded && !notif.items.length" icon="bell" title="ไม่มีการแจ้งเตือน" message="เมื่อมีคำสั่งซื้อหรือข้อความใหม่ จะแจ้งที่นี่" />

        <div v-else class="space-y-2">
          <button
            v-for="n in notif.items"
            :key="n.id"
            class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition"
            :class="n.is_read ? 'border-stone-200 bg-white' : 'border-brand-200 bg-brand-50/60'"
            @click="notif.markRead(n.id)"
          >
            <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full" :class="n.is_read ? 'bg-stone-100 text-stone-400' : 'bg-brand-600 text-white'">
              <Icon :name="icons[n.type] || 'alert'" :size="16" />
            </span>
            <span class="flex-1">
              <span class="flex items-center gap-2">
                <span class="text-sm font-semibold text-stone-800">{{ n.title }}</span>
                <span v-if="!n.is_read" class="h-2 w-2 rounded-full bg-brand-500"></span>
              </span>
              <span v-if="n.content" class="mt-1 block text-sm text-stone-500">{{ n.content }}</span>
              <span class="mt-1 block text-xs text-stone-400">{{ formatDate(n.created_at) }}</span>
            </span>
          </button>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>