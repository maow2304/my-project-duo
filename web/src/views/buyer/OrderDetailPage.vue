<script setup>
// หน้ารายละเอียดคำสั่งซื้อของผู้ซื้อ - แสดงสินค้าในออเดอร์และยอดรวม
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderById, listOrderItems } from '@/api/orders'
import { formatTHB, formatDate } from '@/lib/format'
import SiteNavbar from '@/components/SiteNavbar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import Spinner from '@/components/Spinner.vue'
import Icon from '@/components/Icon.vue'
import OrderItemRow from '@/components/OrderItemRow.vue'

const route = useRoute()
const order = ref(null)
const items = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    order.value = await getOrderById(route.params.id)
    items.value = order.value ? await listOrderItems(order.value.order_id) : []
  } catch (e) {
    order.value = null
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <RouterLink :to="{ name: 'orders' }" class="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-brand-600">
          <Icon name="arrow-left" :size="16" /> กลับไปประวัติการสั่งซื้อ
        </RouterLink>

        <Spinner v-if="loading" />

        <div v-else-if="order" class="space-y-5">
          <section class="rounded-2xl border border-stone-200 bg-white p-5">
            <div class="flex items-center justify-between gap-3">
              <h1 class="text-xl font-bold text-stone-800">คำสั่งซื้อ #{{ order.order_id }}</h1>
              <StatusBadge :status="order.status" />
            </div>
            <p class="mt-1 text-sm text-stone-400">สั่งซื้อเมื่อ {{ formatDate(order.order_date) }}</p>
          </section>

          <section class="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 class="mb-3 flex items-center gap-2 font-semibold text-stone-800"><Icon name="bag" :size="18" /> รายการสินค้า</h2>
            <div class="divide-y divide-stone-100">
              <OrderItemRow v-for="it in items" :key="it.order_item_id" :item="it" show-unit-price />
            </div>
          </section>

          <section class="rounded-2xl border border-stone-200 bg-stone-50 p-5">
            <div class="flex justify-between text-sm text-stone-600">
              <span>ยอดรวมทั้งหมด</span>
              <span class="text-xl font-bold text-brand-700">{{ formatTHB(order.total_amount) }}</span>
            </div>
            <RouterLink :to="{ name: 'home' }" class="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              ซื้อสินค้าต่อ
            </RouterLink>
          </section>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>