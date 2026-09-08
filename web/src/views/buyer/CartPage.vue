<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { formatTHB } from '../../lib/format'
import { toast } from '../../lib/toast'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import EmptyState from '../../components/EmptyState.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const hasStockIssue = computed(() =>
  cart.items.some((i) => i.product && i.quantity > i.product.quantity)
)

async function changeQty(item, delta) {
  const next = item.quantity + delta
  if (next < 1) return
  if (item.product && next > item.product.quantity) {
    toast('เกินสต็อกสินค้าที่มีอยู่', 'error')
    return
  }
  try {
    await cart.updateQty(item.cart_item_id, next)
  } catch {
    toast('อัปเดตไม่สำเร็จ', 'error')
  }
}

async function remove(item) {
  await cart.removeItem(item.cart_item_id)
  toast('ลบสินค้าออกจากตะกร้าแล้ว', 'info')
}

onMounted(() => {
  if (auth.isBuyer) cart.loadCart(auth.user.id).catch(() => {})
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 class="mb-6 text-2xl font-bold text-stone-800">ตะกร้าสินค้า</h1>

        <EmptyState v-if="cart.loaded && !cart.items.length" icon="cart" title="ตะกร้าของคุณว่างเปล่า" message="ไปเลือกซื้อสินค้าก่อนได้เลย!">
          <template #default>
            <RouterLink :to="{ name: 'home' }" class="mt-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              ดูสินค้า
            </RouterLink>
          </template>
        </EmptyState>

        <div v-else class="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div class="space-y-3">
            <div
              v-for="item in cart.items"
              :key="item.cart_item_id"
              class="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <RouterLink :to="{ name: 'product-detail', params: { id: item.product_id } }" class="block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                <img v-if="item.product?.image" :src="item.product.image" class="h-full w-full object-cover" />
                <div v-else class="grid h-full w-full place-items-center text-stone-300"><Icon name="image" /></div>
              </RouterLink>
              <div class="flex flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <RouterLink :to="{ name: 'product-detail', params: { id: item.product_id } }" class="font-medium text-stone-800 hover:text-brand-600">
                      {{ item.product?.product_name || 'สินค้า' }}
                    </RouterLink>
                    <p class="mt-0.5 text-xs text-stone-400">
                      {{ item.selected_color || 'ไม่ระบุสี' }} · {{ item.selected_size || 'ไม่ระบุไซส์' }}
                    </p>
                  </div>
                  <p class="shrink-0 font-semibold text-stone-800">{{ formatTHB(item.price * item.quantity) }}</p>
                </div>
                <div class="mt-auto flex items-center justify-between pt-2">
                  <div class="flex items-center rounded-full border border-stone-200">
                    <button class="grid h-8 w-8 place-items-center text-stone-500 hover:text-brand-600" @click="changeQty(item, -1)"><Icon name="minus" :size="14" /></button>
                    <span class="w-10 text-center text-sm font-medium">{{ item.quantity }}</span>
                    <button class="grid h-8 w-8 place-items-center text-stone-500 hover:text-brand-600" @click="changeQty(item, 1)"><Icon name="plus" :size="14" /></button>
                  </div>
                  <button class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700" @click="remove(item)">
                    <Icon name="trash" :size="14" /> ลบ
                  </button>
                </div>
              </div>
            </div>
            <p v-if="hasStockIssue" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
              บางรายการเกินสต็อกสินค้าที่มีอยู่ กรุณาลดจำนวนก่อนสั่งซื้อ
            </p>
          </div>

          <!-- summary -->
          <aside class="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 class="font-semibold text-stone-800">สรุปยอด</h2>
            <div class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between text-stone-500">
                <span>จำนวนสินค้า</span><span>{{ cart.count }} รายการ</span>
              </div>
              <div class="flex justify-between text-stone-500">
                <span>ค่าส่ง</span><span>นัดรับในมหาวิทยาลัย</span>
              </div>
              <div class="flex justify-between border-t border-dashed border-stone-200 pt-3 text-base font-bold text-stone-800">
                <span>ยอดรวม</span><span class="text-brand-700">{{ formatTHB(cart.total) }}</span>
              </div>
            </div>
            <button
              :disabled="!cart.items.length || hasStockIssue"
              class="mt-5 w-full rounded-full bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              @click="router.push({ name: 'checkout' })"
            >
              ดำเนินการสั่งซื้อ
            </button>
            <RouterLink :to="{ name: 'home' }" class="mt-3 block text-center text-sm text-stone-500 hover:text-brand-600">
              ← กลับไปเลือกสินค้าต่อ
            </RouterLink>
          </aside>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>