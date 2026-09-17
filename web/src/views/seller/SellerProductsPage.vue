<script setup>
// หน้าจัดการสินค้าของผู้ขาย - แสดงตารางสินค้า + ลบสินค้าได้ (ยืนยันผ่าน ConfirmDialog)
import { ref, computed, onMounted } from 'vue'
import { listProductsBySeller, deleteProduct } from '@/api/products'
import { useAuthStore } from '@/stores/auth'
import { formatTHB } from '@/lib/format'
import { toast } from '@/lib/toast'
import EmptyState from '@/components/EmptyState.vue'
import Spinner from '@/components/Spinner.vue'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const auth = useAuthStore()
const products = ref([])
const loading = ref(true)
const deleting = ref(null) // เก็บสินค้าที่กำลังจะลบ (เปิด dialog ยืนยัน)

// ข้อความยืนยันการลบ (แยกเป็น computed เพื่อไม่ให้ escape quotes ใน template)
const deleteMessage = computed(() =>
  deleting.value
    ? `ต้องการลบ "${deleting.value.product_name}" ออกจากร้านหรือไม่? การลบไม่สามารถย้อนกลับได้`
    : ''
)

async function load() {
  loading.value = true
  try {
    products.value = await listProductsBySeller(auth.user.id)
  } catch (e) {
    products.value = []
  } finally {
    loading.value = false
  }
}

// ยืนยันลบสินค้า แล้วเอาออกจากตารางทันทีเมื่อสำเร็จ
async function confirmDelete() {
  if (!deleting.value) return
  const id = deleting.value.product_id
  try {
    await deleteProduct(id)
    toast('ลบสินค้าแล้ว')
    products.value = products.value.filter((p) => p.product_id !== id)
  } catch (e) {
    toast('ลบสินค้าไม่สำเร็จ', 'error')
  } finally {
    deleting.value = null
  }
}

onMounted(load)
</script>

<template>
  <div>
    <PageHeader title="จัดการสินค้า" subtitle="เพิ่ม แก้ไข หรือลบสินค้าของร้านคุณ">
      <RouterLink :to="{ name: 'seller-product-new' }" class="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        <Icon name="plus" :size="16" /> เพิ่มสินค้า
      </RouterLink>
    </PageHeader>

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

    <ConfirmDialog
      :open="!!deleting"
      title="ลบสินค้า?"
      confirm-text="ยืนยันการลบ"
      :message="deleteMessage"
      @confirm="confirmDelete"
      @cancel="deleting = null"
    />
  </div>
</template>