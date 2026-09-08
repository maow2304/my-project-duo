<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useNotificationStore } from '../stores/notification'
import Icon from './Icon.vue'

const auth = useAuthStore()
const cart = useCartStore()
const notif = useNotificationStore()
const router = useRouter()
const route = useRoute()

const search = ref(route.query.q || '')
const mobileOpen = ref(false)

function submitSearch() {
  router.push({ name: 'home', query: search.value ? { q: search.value } : {} })
  mobileOpen.value = false
}

function goCart() {
  if (!auth.isBuyer) {
    router.push({ name: 'login', query: { redirect: '/cart' } })
    return
  }
  router.push({ name: 'cart' })
}

watch(
  () => route.query.q,
  (v) => (search.value = v || '')
)

onMounted(async () => {
  if (auth.isLoggedIn) {
    if (auth.isBuyer) cart.loadCart(auth.user.id).catch(() => {})
    notif.load().catch(() => {})
    notif.subscribe()
  }
})
onUnmounted(() => {})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2">
        <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-sm font-bold text-white">UP</span>
        <span class="hidden text-lg font-bold sm:block">
          Cloth<span class="text-brand-600">Market</span>
        </span>
      </RouterLink>

      <!-- search (desktop) -->
      <form class="relative hidden flex-1 md:block" @submit.prevent="submitSearch">
        <Icon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          v-model="search"
          type="search"
          placeholder="ค้นหาเสื้อผ้า..."
          class="w-full rounded-full border border-stone-200 bg-stone-100 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </form>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <!-- notifications -->
        <button
          v-if="auth.isLoggedIn"
          class="relative grid h-10 w-10 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
          :title="'แจ้งเตือน'"
          @click="router.push(auth.isSeller ? { name: 'seller-notifications' } : { name: 'notifications' })"
        >
          <Icon name="bell" />
          <span
            v-if="notif.unreadCount > 0"
            class="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >{{ notif.unreadCount > 9 ? '9+' : notif.unreadCount }}</span>
        </button>

        <!-- chat -->
        <button
          v-if="auth.isBuyer"
          class="relative grid h-10 w-10 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
          title="แชทกับผู้ขาย"
          @click="router.push({ name: 'buyer-chats' })"
        >
          <Icon name="chat" />
        </button>

        <!-- cart -->
        <button
          class="relative grid h-10 w-10 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
          title="ตะกร้าสินค้า"
          @click="goCart"
        >
          <Icon name="cart" />
          <span
            v-if="auth.isBuyer && cart.count > 0"
            class="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white"
          >{{ cart.count > 9 ? '9+' : cart.count }}</span>
        </button>

        <!-- user / auth -->
        <template v-if="auth.isLoggedIn">
          <div class="group relative">
            <button class="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-stone-100">
              <span class="grid h-8 w-8 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                {{ auth.displayName?.charAt(0).toUpperCase() }}
              </span>
              <span class="hidden max-w-24 truncate text-sm font-medium sm:block">{{ auth.displayName }}</span>
            </button>
            <div
              class="invisible absolute right-0 top-full z-50 w-56 translate-y-1 rounded-2xl border border-stone-100 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
            >
              <RouterLink
                v-if="auth.isBuyer"
                :to="{ name: 'orders' }"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Icon name="order" :size="16" /> ประวัติการสั่งซื้อ
              </RouterLink>
              <RouterLink
                :to="auth.isSeller ? { name: 'seller-profile' } : { name: 'profile' }"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Icon name="user" :size="16" /> โปรไฟล์
              </RouterLink>
              <RouterLink
                v-if="auth.isSeller"
                :to="{ name: 'seller-dashboard' }"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
              >
                <Icon name="store" :size="16" /> โหมดผู้ขาย
              </RouterLink>
              <button
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                @click="auth.logout(); router.push({ name: 'home' })"
              >
                <Icon name="logout" :size="16" /> ออกจากระบบ
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink
            :to="{ name: 'login' }"
            class="hidden rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 sm:block"
          >
            เข้าสู่ระบบ
          </RouterLink>
          <RouterLink
            :to="{ name: 'register' }"
            class="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            สมัครสมาชิก
          </RouterLink>
        </template>

        <!-- mobile menu toggle -->
        <button
          class="grid h-10 w-10 place-items-center rounded-full md:hidden"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :name="mobileOpen ? 'x' : 'menu'" />
        </button>
      </div>
    </div>

    <!-- mobile search -->
    <div v-if="mobileOpen" class="border-t border-stone-100 px-4 py-3 md:hidden">
      <form class="relative" @submit.prevent="submitSearch">
        <Icon name="search" :size="18" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          v-model="search"
          type="search"
          placeholder="ค้นหาเสื้อผ้า..."
          class="w-full rounded-full border border-stone-200 bg-stone-100 py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:bg-white"
        />
      </form>
    </div>
  </header>
</template>