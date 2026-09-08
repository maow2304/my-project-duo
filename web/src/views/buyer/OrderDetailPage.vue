<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { formatTHB, formatDate } from '../../lib/format'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import Spinner from '../../components/Spinner.vue'
import Icon from '../../components/Icon.vue'

const route = useRoute()
const order = ref(null)
const items = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  const { data: o, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', route.params.id)
    .maybeSingle()
  if (!error && o) {
    order.value = o
    const { data: it } = await supabase
      .from('order_item')
      .select('*, product:order_item_product_id_fkey(*)')
      .eq('order_id', o.order_id)
    items.value = it || []
  }
  loading.value = false
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
              <div v-for="it in items" :key="it.order_item_id" class="flex gap-3 py-3">
                <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                  <img v-if="it.product?.image" :src="it.product.image" class="h-full w-full object-cover" />
                  <div v-else class="grid h-full w-full place-items-center text-stone-300"><Icon name="image" /></div>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-stone-700">{{ it.product?.product_name || 'สินค้า' }}</p>
                  <p class="text-xs text-stone-400">{{ it.color || 'ไม่ระบุสี' }} · {{ it.size || 'ไม่ระบุไซส์' }} · ×{{ it.quantity }}</p>
                  <p class="mt-1 text-xs text-stone-500">ชิ้นละ {{ formatTHB(it.price) }}</p>
                </div>
                <p class="text-sm font-semibold">{{ formatTHB(it.subtotal) }}</p>
              </div>
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