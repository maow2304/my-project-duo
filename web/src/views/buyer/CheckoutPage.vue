<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCartStore } from '../../stores/cart'
import { supabase } from '../../lib/supabase'
import { formatTHB } from '../../lib/format'
import { toast } from '../../lib/toast'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import EmptyState from '../../components/EmptyState.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()

const submitting = ref(false)

const hasStockIssue = computed(() =>
  cart.items.some((i) => i.product && i.quantity > i.product.quantity)
)

const shippingAddress = computed(() => auth.profile?.address || '')

async function placeOrder() {
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

    const { data: orderId, error: orderError } = await supabase.rpc('place_order', {
      p_buyer_id: auth.user.id,
      p_items: itemsPayload,
    })
    if (orderError) throw orderError

    await supabase
      .from('cart_item')
      .delete()
      .eq('cart_id', cart.cartId)

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

          <aside class="h-fit rounded-2xl border border-stone-200 bg-white p-5">
            <h2 class="font-semibold text-stone-800">สรุปยอด</h2>
            <div class="mt-4 space-y-2 text-sm">
              <div class="flex justify-between text-stone-500">
                <span>จำนวนสินค้า</span><span>{{ cart.count }} รายการ</span>
              </div>
              <div class="flex justify-between text-stone-500">
                <span>ค่าส่ง</span><span>นัดรับในมหาวิทยาลัย</span>
              </div>
              <div class="flex justify-between border-t border-dashed border-stone-200 pt-3 text-lg font-bold text-stone-800">
                <span>ยอดรวม</span><span class="text-brand-700">{{ formatTHB(cart.total) }}</span>
              </div>
            </div>
            <p v-if="hasStockIssue" class="mt-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">สินค้าบางรายการเกินสต็อก กลับไปแก้ไขที่ตะกร้า</p>
            <button
              :disabled="submitting || !cart.items.length || hasStockIssue"
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              @click="placeOrder">
              <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ยืนยันการสั่งซื้อ
            </button>
            <RouterLink :to="{ name: 'cart' }" class="mt-3 block text-center text-sm text-stone-500 hover:text-brand-600">← กลับไปแก้ไขตะกร้า</RouterLink>
          </aside>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>