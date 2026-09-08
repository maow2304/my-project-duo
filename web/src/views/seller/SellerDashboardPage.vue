<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { formatTHB, formatDate } from '../../lib/format'
import StatusBadge from '../../components/StatusBadge.vue'
import Spinner from '../../components/Spinner.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const loading = ref(true)

const stats = ref({ products: 0, outOfStock: 0, sales: 0, orderCount: 0 })
const recentOrders = ref([])

async function load() {
  loading.value = true
  const [{ data: products }, { data: orderItems }] = await Promise.all([
    supabase.from('product').select('product_id, quantity, product_name, price').eq('seller_id', auth.user.id),
    supabase.from('order_item').select('*, product:order_item_product_id_fkey(seller_id)'),
  ])

  const myItems = (orderItems || []).filter((i) => i.product?.seller_id === auth.user.id)

  stats.value.products = (products || []).length
  stats.value.outOfStock = (products || []).filter((p) => p.quantity === 0).length
  stats.value.sales = myItems.reduce((s, i) => s + Number(i.subtotal), 0)
  stats.value.orderCount = new Set(myItems.map((i) => i.order_id)).size

  const orderIds = [...new Set(myItems.map((i) => i.order_id))]
  if (orderIds.length) {
    const { data } = await supabase
      .from('orders')
      .select('order_id, order_date, status, buyer:orders_buyer_id_fkey(name)')
      .in('order_id', orderIds)
      .order('order_date', { ascending: false })
    recentOrders.value = data || []
  }
  loading.value = false
}

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'สวัสดีตอนเช้า'
  if (h < 18) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-stone-800">{{ greeting }}, {{ auth.displayName }} 👋</h1>
      <p class="text-sm text-stone-500">ภาพรวมร้านค้าของคุณในวันนี้</p>
    </div>

    <Spinner v-if="loading" />

    <template v-else>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="rounded-2xl border border-stone-200 bg-white p-5">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon name="bag" /></span>
          <p class="mt-3 text-2xl font-bold text-stone-800">{{ stats.products }}</p>
          <p class="text-sm text-stone-500">สินค้าทั้งหมด</p>
        </div>
        <div class="rounded-2xl border border-stone-200 bg-white p-5">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600"><Icon name="order" /></span>
          <p class="mt-3 text-2xl font-bold text-stone-800">{{ stats.orderCount }}</p>
          <p class="text-sm text-stone-500">คำสั่งซื้อที่เกี่ยวข้อง</p>
        </div>
        <div class="rounded-2xl border border-stone-200 bg-white p-5">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Icon name="chart" /></span>
          <p class="mt-3 text-2xl font-bold text-brand-700">{{ formatTHB(stats.sales) }}</p>
          <p class="text-sm text-stone-500">ยอดขายรวม</p>
        </div>
        <div class="rounded-2xl border border-stone-200 bg-white p-5">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-500"><Icon name="alert" /></span>
          <p class="mt-3 text-2xl font-bold text-stone-800">{{ stats.outOfStock }}</p>
          <p class="text-sm text-stone-500">สินค้าหมดสต็อก</p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section class="rounded-2xl border border-stone-200 bg-white p-5 lg:col-span-2">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-semibold text-stone-800">ออเดอร์ล่าสุด</h2>
            <RouterLink :to="{ name: 'seller-orders' }" class="text-sm text-brand-600 hover:underline">ดูทั้งหมด</RouterLink>
          </div>
          <div v-if="!recentOrders.length" class="text-sm text-stone-400">ยังไม่มีคำสั่งซื้อ</div>
          <div v-else class="divide-y divide-stone-100">
            <RouterLink v-for="o in recentOrders.slice(0, 5)" :key="o.order_id" :to="{ name: 'seller-orders' }"
              class="flex items-center gap-3 py-3">
              <span class="grid h-9 w-9 place-items-center rounded-lg bg-stone-100 text-xs font-bold text-stone-600">#{{ o.order_id }}</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-stone-700">โดย {{ o.buyer?.name }}</p>
                <p class="text-xs text-stone-400">{{ formatDate(o.order_date) }}</p>
              </div>
              <StatusBadge :status="o.status" />
            </RouterLink>
          </div>
        </section>

        <section class="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 class="mb-4 font-semibold text-stone-800">เมนูด่วน</h2>
          <div class="space-y-2">
            <RouterLink :to="{ name: 'seller-product-new' }" class="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300 hover:text-brand-600">
              <Icon name="plus" :size="16" /> เพิ่มสินค้าใหม่
            </RouterLink>
            <RouterLink :to="{ name: 'seller-products' }" class="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300 hover:text-brand-600">
              <Icon name="bag" :size="16" /> จัดการสินค้า
            </RouterLink>
            <RouterLink :to="{ name: 'seller-orders' }" class="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300 hover:text-brand-600">
              <Icon name="order" :size="16" /> จัดการคำสั่งซื้อ
            </RouterLink>
            <RouterLink :to="{ name: 'seller-chats' }" class="flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300 hover:text-brand-600">
              <Icon name="chat" :size="16" /> แชทกับลูกค้า
            </RouterLink>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>