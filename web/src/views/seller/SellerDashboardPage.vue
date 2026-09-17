<script setup>
// หน้าสรุปภาพรวมร้านค้าของผู้ขาย - สถิติ + ออเดอร์ล่าสุด + เมนูด่วน
import { ref, computed, onMounted } from 'vue'
import { listProductsBySeller } from '@/api/products'
import { listSellerAccessibleOrderItems, listOrdersByIds } from '@/api/orders'
import { useAuthStore } from '@/stores/auth'
import { formatTHB, formatDate } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge.vue'
import Spinner from '@/components/Spinner.vue'
import Icon from '@/components/Icon.vue'
import StatCard from '@/components/ui/StatCard.vue'

const auth = useAuthStore()
const loading = ref(true)

const stats = ref({ products: 0, outOfStock: 0, sales: 0, orderCount: 0 })
const recentOrders = ref([])

// โหลดข้อมูล 3 ส่วนพร้อมกัน: สินค้าของเรา, order_item ที่มองเห็น, คำสังซื้อที่เกี่ยวข้อง
async function load() {
  loading.value = true
  try {
    const [products, orderItems] = await Promise.all([
      listProductsBySeller(auth.user.id),
      listSellerAccessibleOrderItems(),
    ])

    const myItems = orderItems.filter((i) => i.product?.seller_id === auth.user.id)

    stats.value.products = products.length
    stats.value.outOfStock = products.filter((p) => p.quantity === 0).length
    stats.value.sales = myItems.reduce((s, i) => s + Number(i.subtotal), 0)
    stats.value.orderCount = new Set(myItems.map((i) => i.order_id)).size

    const orderIds = [...new Set(myItems.map((i) => i.order_id))]
    recentOrders.value = await listOrdersByIds(orderIds)
  } catch (e) {
    // ปล่อยให้ค่าเริ่มต้นเป็น 0
  } finally {
    loading.value = false
  }
}

// คำทักทายตามช่วงเวลา
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
        <StatCard icon="bag" icon-class="bg-brand-50 text-brand-600" :value="stats.products" label="สินค้าทั้งหมด" />
        <StatCard icon="order" icon-class="bg-sky-50 text-sky-600" :value="stats.orderCount" label="คำสั่งซื้อที่เกี่ยวข้อง" />
        <StatCard icon="chart" icon-class="bg-emerald-50 text-emerald-600" value-class="text-brand-700" :value="formatTHB(stats.sales)" label="ยอดขายรวม" />
        <StatCard icon="alert" icon-class="bg-red-50 text-red-500" :value="stats.outOfStock" label="สินค้าหมดสต็อก" />
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