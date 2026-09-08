<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notification'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const notif = useNotificationStore()
const router = useRouter()

const mobileOpen = ref(false)

const nav = [
  { label: 'แดชบอร์ด', name: 'seller-dashboard', icon: 'home' },
  { label: 'จัดการสินค้า', name: 'seller-products', icon: 'bag' },
  { label: 'คำสั่งซื้อ', name: 'seller-orders', icon: 'order' },
  { label: 'แชท', name: 'seller-chats', icon: 'chat' },
  { label: 'การแจ้งเตือน', name: 'seller-notifications', icon: 'bell', badge: true },
  { label: 'โปรไฟล์', name: 'seller-profile', icon: 'user' },
]

function go(name) {
  mobileOpen.value = false
  router.push({ name })
}

onMounted(() => {
  notif.load().catch(() => {})
  notif.subscribe()
})
onBeforeUnmount(() => {})
</script>

<template>
  <div class="flex min-h-screen bg-stone-100">
    <!-- sidebar (desktop) -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-stone-900 text-stone-300 lg:flex">
      <div class="flex items-center gap-2 px-6 py-5">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-sm font-bold text-white">UP</span>
        <div>
          <p class="font-bold text-white">Cloth<span class="text-brand-400">Market</span></p>
          <p class="text-[11px] text-stone-500">ร้านค้า · โหมดผู้ขาย</p>
        </div>
      </div>

      <nav class="mt-4 flex-1 space-y-1 px-3">
        <button
          v-for="n in nav"
          :key="n.name"
          class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition"
          :class="$route.name === n.name ? 'bg-brand-600 text-white font-medium' : 'hover:bg-stone-800 hover:text-white'"
          @click="go(n.name)"
        >
          <span class="relative">
            <Icon :name="n.icon" :size="18" />
            <span v-if="n.badge && notif.unreadCount > 0" class="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {{ notif.unreadCount > 9 ? '9+' : notif.unreadCount }}
            </span>
          </span>
          {{ n.label }}
        </button>
      </nav>

      <div class="border-t border-stone-800 p-4">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-stone-800 font-bold text-white">{{ auth.displayName?.charAt(0).toUpperCase() }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-white">{{ auth.displayName }}</p>
            <p class="text-xs text-stone-500">{{ auth.profile?.places }}</p>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <RouterLink :to="{ name: 'home' }" class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-xs text-stone-300 hover:bg-stone-700">
            <Icon name="store" :size="14" /> หน้าร้าน
          </RouterLink>
          <button class="grid w-10 place-items-center rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700" title="ออกจากระบบ"
            @click="auth.logout(); router.push({ name: 'home' })">
            <Icon name="logout" :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- mobile top bar -->
    <div class="fixed inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
      <button class="grid h-10 w-10 place-items-center rounded-full hover:bg-stone-100" @click="mobileOpen = !mobileOpen">
        <Icon :name="mobileOpen ? 'x' : 'menu'" />
      </button>
      <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">UP</span>
      <p class="font-bold">Cloth<span class="text-brand-600">Market</span> <span class="text-xs font-normal text-stone-400">· ผู้ขาย</span></p>
      <button class="ml-auto grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100" @click="router.push({ name: 'seller-notifications' })">
        <span class="relative">
          <Icon name="bell" />
          <span v-if="notif.unreadCount > 0" class="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{{ notif.unreadCount > 9 ? '9+' : notif.unreadCount }}</span>
        </span>
      </button>
    </div>

    <!-- mobile drawer -->
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity"
      leave-active-class="transition-opacity"
      leave-to-class="opacity-0"
    >
      <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="mobileOpen = false"></div>
    </Transition>
    <Transition
      enter-from-class="opacity-0 -translate-x-4"
      enter-active-class="transition"
      leave-active-class="transition"
      leave-to-class="opacity-0 -translate-x-4"
    >
      <aside v-if="mobileOpen" class="fixed inset-y-0 left-0 z-40 w-64 bg-stone-900 p-4 text-stone-300 lg:hidden">
        <div class="mb-4 flex items-center gap-2 px-2 pt-2">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-xs font-bold text-white">UP</span>
          <p class="font-bold text-white">Cloth<span class="text-brand-400">Market</span></p>
        </div>
        <nav class="space-y-1">
          <button
            v-for="n in nav"
            :key="n.name"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm"
            :class="$route.name === n.name ? 'bg-brand-600 font-medium text-white' : 'hover:bg-stone-800 hover:text-white'"
            @click="go(n.name)"
          >
            <Icon :name="n.icon" :size="18" />
            {{ n.label }}
            <span v-if="n.badge && notif.unreadCount > 0" class="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold">{{ notif.unreadCount }}</span>
          </button>
        </nav>
        <button class="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 hover:bg-stone-800"
          @click="auth.logout(); router.push({ name: 'home' })">
          <Icon name="logout" :size="18" /> ออกจากระบบ
        </button>
      </aside>
    </Transition>

    <!-- content -->
    <main class="flex-1 px-4 pb-10 pt-16 sm:px-6 lg:ml-64 lg:pt-8">
      <RouterView />
    </main>
  </div>
</template>