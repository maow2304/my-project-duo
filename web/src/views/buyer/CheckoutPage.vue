<script setup>
// หน้า checkout - ยืนยันคำสั่งซื้อจากตะกร้า
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { placeOrder } from '@/api/orders'
import { clearCartItems } from '@/api/cart'
import { formatTHB } from '@/lib/format'
import { toast } from '@/lib/toast'
import SiteNavbar from '@/components/SiteNavbar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import Icon from '@/components/Icon.vue'
import CartSummaryCard from '@/components/ui/CartSummaryCard.vue'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const submitting = ref(false)

// มีสินค้าชิ้นใดในตะกร้าเกินสต็อกหรือไม่
const hasStockIssue = computed(() =>
  cart.items.some((i) => i.product && i.quantity > i.product.quantity)
)

// ที่อยู่จัดส่งดึงจากโปรไฟล์ผู้ซื้อ (แก้ไขได้ที่หน้าโปรไฟล์)
const shippingAddress = computed(() => auth.profile?.address || '')

// ยืนยันการสั่งซื้อ: เรียก RPC place_order แล้วล้างตะกร้า
async function placeOrderHandler() {
  if (!cart.items.length || hasStockIssue.value) {
    toast('กรุณาตรวจสอบรายการในตะกร้า', 'error')
    return
  }
  submitting.value = true
  try {
    for (const item of cart.items) {
      if (item.quantity > item.product.quantity) throw new Error('สินค้าบางรายการเกินสต็อก')
    }

    const itemsPayload = cart.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      color: i.selected_color || null,
      size: i.selected_size || null,
    }))

    const orderId = await placeOrder(auth.user.id, itemsPayload)
    await clearCartItems(cart.cartId)

    cart.items = []
    toast('สั่งซื้อสำเร็จ! ระบบแจ้งเตือนผู้ขายแล้ว')
    router.push({ name: 'order-detail', params: { id: orderId } })
  } catch (e) {
    toast(e?.message || 'สั่งซื้อไม่สำเร็จ กรุณาลองใหม่', 'error')
  } finally {
    submitting.value = false
  }
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
        <h1 class="mb-6 text-2xl font-bold text-stone-800">ยืนยันคำสั่งซื้อ</h1>

        <EmptyState v-if="cart.loaded && !cart.items.length" icon="cart" title="ตะกร้าของคุณว่างเปล่า" message="กลับไปเลือกสินค้าก่อนทำการสั่งซื้อ">
          <RouterLink :to="{ name: 'home' }" class="mt-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white">ดูสินค้า</RouterLink>
        </EmptyState>

        <div v-else class="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div class="space-y-6">
            <section class="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 class="mb-3 flex items-center gap-2 font-semibold text-stone-800"><Icon name="bag" :size="18" /> รายการสินค้า</h2>
              <div class="divide-y divide-stone-100">
                <div v-for="item in cart.items" :key="item.cart_item_id" class="flex gap-3 py-3">
                  <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <img v-if="item.product?.image" :src="item.product.image" class="h-full w-full object-cover" />
                    <div v-else class="grid h-full w-full place-items-center text-stone-300"><Icon name="image" /></div>
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-stone-700">{{ item.product?.product_name }}</p>
                    <p class="text-xs text-stone-400">{{ item.selected_color || 'ไม่ระบุสี' }} · {{ item.selected_size || 'ไม่ระบุไซส์' }} · ×{{ item.quantity }}</p>
                  </div>
                  <p class="text-sm font-semibold text-stone-700">{{ formatTHB(item.price * item.quantity) }}</p>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 class="mb-3 flex items-center gap-2 font-semibold text-stone-800"><Icon name="order" :size="18" /> ข้อมูลการรับสินค้า</h2>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">ที่อยู่ / จุดนัดรับ</label>
              <textarea v-model="shippingAddress" rows="2" disabled
                class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none"
                placeholder="ยังไม่ได้ระบุที่อยู่ในโปรไฟล์"></textarea>
              <RouterLink :to="{ name: 'profile' }" class="text-xs text-brand-600 hover:underline">แก้ไขที่อยู่ในโปรไฟล์</RouterLink>
            </section>
          </div>

          <CartSummaryCard
            :count="cart.count"
            :total="cart.total"
            :submitting="submitting"
            :show-stock-issue="hasStockIssue"
            :disabled="!cart.items.length || hasStockIssue"
            submit-label="ยืนยันการสั่งซื้อ"
            back-to="cart"
            back-label="← กลับไปแก้ไขตะกร้า"
            @submit="placeOrderHandler"
          />
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>