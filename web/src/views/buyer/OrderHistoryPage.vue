<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { formatTHB, formatDate } from '../../lib/format'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import Spinner from '../../components/Spinner.vue'

const auth = useAuthStore()
const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('order_id, order_date, total_amount, status')
    .eq('buyer_id', auth.user.id)
    .order('order_date', { ascending: false })
  if (!error) orders.value = data || []
  loading.value = false
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 class="mb-6 text-2xl font-bold text-stone-800">ประวัติการสั่งซื้อ</h1>

        <Spinner v-if="loading" />
        <EmptyState v-else-if="!orders.length" icon="order" title="ยังไม่มีคำสั่งซื้อ" message="เมื่อคุณสั่งซื้อสินค้า รายการจะแสดงที่นี่">
          <RouterLink :to="{ name: 'home' }" class="mt-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white">เริ่มช้อป</RouterLink>
        </EmptyState>

        <div v-else class="space-y-3">
          <RouterLink
            v-for="o in orders"
            :key="o.order_id"
            :to="{ name: 'order-detail', params: { id: o.order_id } }"
            class="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div class="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">#{{ o.order_id }}</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-stone-700">คำสั่งซื้อ #{{ o.order_id }}</p>
              <p class="text-xs text-stone-400">{{ formatDate(o.order_date) }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-stone-800">{{ formatTHB(o.total_amount) }}</p>
              <div class="mt-1"><StatusBadge :status="o.status" /></div>
            </div>
          </RouterLink>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>