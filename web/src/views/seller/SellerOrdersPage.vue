<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { formatTHB, formatDate, ORDER_STATUSES } from '../../lib/format'
import { toast } from '../../lib/toast'
import StatusBadge from '../../components/StatusBadge.vue'
import Spinner from '../../components/Spinner.vue'
import EmptyState from '../../components/EmptyState.vue'

const auth = useAuthStore()
const loading = ref(true)
const upgrading = ref(null)
const rawItems = ref([])

const orders = computed(() => {
  const mine = rawItems.value.filter((i) => i.product?.seller_id === auth.user.id)
  const map = new Map()
  for (const item of mine) {
    const o = item.orders
    if (!o) continue
    if (!map.has(o.order_id)) {
      map.set(o.order_id, { ...o, items: [], total: 0 })
    }
    map.get(o.order_id).items.push(item)
    map.get(o.order_id).total += Number(item.subtotal)
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.order_date ?? 0) - new Date(a.order_date ?? 0)
  )
})

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('order_item')
    .select('*, product:order_item_product_id_fkey(*), orders:order_item_order_id_fkey(buyer:orders_buyer_id_fkey(name))')
  if (!error) rawItems.value = data || []
  loading.value = false
}

async function updateStatus(orderId, nextStatus) {
  upgrading.value = orderId
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('order_id', orderId)
    if (error) throw error
    toast('อัปเดตสถานะเป็น ' + nextStatus + ' เรียบร้อย และแจ้งเตือนผู้ซื้อแล้ว')
    await load()
  } catch {
    toast('อัปเดตสถานะไม่สำเร็จ', 'error')
  } finally {
    upgrading.value = null
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-stone-800">คำสั่งซื้อ</h1>
      <p class="text-sm text-stone-500">ออเดอร์ที่เกี่ยวข้องกับสินค้าของคุณ และอัปเดตสถานะส่งมอบ</p>
    </div>

    <Spinner v-if="loading" />
    <EmptyState v-else-if="!orders.length" icon="order" title="ยังไม่มีคำสั่งซื้อ" message="เมื่อมีลูกค้าสั่งซื้อสินค้าของคุณ จะแสดงที่นี่" />

    <div v-else class="space-y-4">
      <section v-for="o in orders" :key="o.order_id" class="rounded-2xl border border-stone-200 bg-white p-5">
        <div class="flex flex-wrap items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">#{{ o.order_id }}</span>
          <div class="flex-1">
            <p class="font-medium text-stone-800">คำสั่งซื้อ #{{ o.order_id }}</p>
            <p class="text-xs text-stone-400">{{ formatDate(o.order_date) }} · โดย {{ o.buyer?.name || 'ผู้ซื้อ' }}</p>
          </div>
          <StatusBadge :status="o.status" />
        </div>

        <div class="mt-4 grid gap-2">
          <div v-for="it in o.items" :key="it.order_item_id" class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-2.5">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
              <img v-if="it.product?.image" :src="it.product.image" class="h-full w-full object-cover" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-stone-700">{{ it.product.product_name }}</p>
              <p class="text-xs text-stone-400">{{ it.color || 'ไม่ระบุสี' }} · {{ it.size || 'ไม่ระบุไซส์' }} · ×{{ it.quantity }}</p>
            </div>
            <p class="text-sm font-medium">{{ formatTHB(it.subtotal) }}</p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-stone-200 pt-4">
          <p class="text-sm text-stone-500">ยอดรวม (เฉพาะสินค้าคุณ): <b class="text-stone-700">{{ formatTHB(o.total) }}</b></p>
          <div v-if="o.status !== 'Delivered'" class="flex items-center gap-2">
            <select :value="o.status" class="rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
              @change="updateStatus(o.order_id, $event.target.value)">
              <option v-for="s in ORDER_STATUSES" :key="s" :value="s" :disabled="ORDER_STATUSES.indexOf(s) < ORDER_STATUSES.indexOf(o.status)">{{ s }}</option>
            </select>
            <button
              v-if="ORDER_STATUSES.indexOf(o.status) < ORDER_STATUSES.length - 1"
              :disabled="upgrading === o.order_id"
              class="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              @click="updateStatus(o.order_id, ORDER_STATUSES[ORDER_STATUSES.indexOf(o.status) + 1])"
            >
              {{ upgrading === o.order_id ? 'กำลังอัปเดต...' : 'อัปเดตเป็น ' + ORDER_STATUSES[ORDER_STATUSES.indexOf(o.status) + 1] }}
            </button>
          </div>
          <p v-else class="text-sm text-emerald-600">ส่งมอบเสร็จสิ้น ✓</p>
        </div>
      </section>
    </div>
  </div>
</template>