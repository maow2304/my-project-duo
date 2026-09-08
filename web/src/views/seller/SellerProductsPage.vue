<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'
import { formatTHB } from '../../lib/format'
import { toast } from '../../lib/toast'
import EmptyState from '../../components/EmptyState.vue'
import Spinner from '../../components/Spinner.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const products = ref([])
const loading = ref(true)
const deleting = ref(null)

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('seller_id', auth.user.id)
    .order('product_id', { ascending: false })
  if (!error) products.value = data || []
  loading.value = false
}

async function confirmDelete() {
  if (!deleting.value) return
  const id = deleting.value
  const { error } = await supabase.from('product').delete().eq('product_id', id)
  if (error) {
    toast('ลบสินค้าไม่สำเร็จ', 'error')
  } else {
    toast('ลบสินค้าแล้ว')
    products.value = products.value.filter((p) => p.product_id !== id)
  }
  deleting.value = null
}

onMounted(load)
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-stone-800">จัดการสินค้า</h1>
        <p class="text-sm text-stone-500">เพิ่ม แก้ไข หรือลบสินค้าของร้านคุณ</p>
      </div>
      <RouterLink :to="{ name: 'seller-product-new' }" class="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        <Icon name="plus" :size="16" /> เพิ่มสินค้า
      </RouterLink>
    </div>

    <Spinner v-if="loading" />
    <EmptyState v-else-if="!products.length" icon="bag" title="ยังไม่มีสินค้า" message="กดปุ่มเพิ่มสินค้าเพื่อนำสินค้าของคุณมาลงขาย">
      <RouterLink :to="{ name: 'seller-product-new' }" class="mt-2 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white">เพิ่มสินค้าชิ้นแรก</RouterLink>
    </EmptyState>

    <div v-else class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-stone-200 bg-stone-50 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
              <th class="px-4 py-3">สินค้า</th>
              <th class="px-4 py-3">หมวดหมู่</th>
              <th class="px-4 py-3">ราคา</th>
              <th class="px-4 py-3">สต็อก</th>
              <th class="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="p in products" :key="p.product_id">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    <img v-if="p.image" :src="p.image" class="h-full w-full object-cover" />
                    <div v-else class="grid h-full w-full place-items-center text-stone-300"><Icon name="image" :size="16" /></div>
                  </div>
                  <div>
                    <p class="font-medium text-stone-700">{{ p.product_name }}</p>
                    <p class="text-xs text-stone-400">{{ p.color || 'ไม่ระบุสี' }} · {{ p.size || 'ไม่ระบุไซส์' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-stone-500">{{ p.category || '-' }}</td>
              <td class="px-4 py-3 font-medium text-stone-700">{{ formatTHB(p.price) }}</td>
              <td class="px-4 py-3">
                <span v-if="p.quantity === 0" class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">หมด</span>
                <span v-else-if="p.quantity < 10" class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{{ p.quantity }}</span>
                <span v-else class="text-stone-500">{{ p.quantity }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <RouterLink :to="{ name: 'seller-product-edit', params: { id: p.product_id } }"
                    class="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-stone-500 hover:border-brand-300 hover:text-brand-600" title="แก้ไข">
                    <Icon name="edit" :size="16" />
                  </RouterLink>
                  <button class="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 text-stone-500 hover:border-red-300 hover:text-red-600" title="ลบ"
                    @click="deleting = p">
                    <Icon name="trash" :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- delete confirm -->
    <div v-if="deleting" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 class="text-lg font-bold text-stone-800">ลบสินค้า?</h3>
        <p class="mt-2 text-sm text-stone-500">
          ต้องการลบ "<b>{{ deleting.product_name }}</b>" ออกจากร้านหรือไม่? การลบไม่สามารถย้อนกลับได้
        </p>
        <div class="mt-5 flex justify-end gap-3">
          <button class="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 hover:bg-stone-50" @click="deleting = null">ยกเลิก</button>
          <button class="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700" @click="confirmDelete">ยืนยันการลบ</button>
        </div>
      </div>
    </div>
  </div>
</template>