<script setup>
// หน้า checkout - ยืนยันคำสั่งซื้อจากตะกร้า
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { placeOrder } from '@/api/orders'
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

// มีสินค้าชิ้นใดในรายการที่เลือกเกินสต็อกหรือไม่ (ใช้สต็อกของ variant ถ้ามี)
const hasStockIssue = computed(() =>
  cart.selectedItems.some((i) =>
    i.variant_id ? i.variant && i.quantity > i.variant.quantity : i.product && i.quantity > i.product.quantity
  )
)

// ที่อยู่จัดส่งดึงจากโปรไฟล์ผู้ซื้อ (แก้ไขได้ที่หน้าโปรไฟล์)
const shippingAddress = computed(() => auth.profile?.address || '')
// สมัครไม่บังคับที่อยู่ แต่ตอนสั่งซื้อต้องมีที่อยู่ก่อน
const hasAddress = computed(() => !!shippingAddress.value.trim())

// ยืนยันการสั่งซื้อ: เรียก RPC place_order แล้วลบเฉพาะรายการที่สั่งออกจากตะกร้า
async function placeOrderHandler() {
  if (!cart.selectedItems.length) {
    toast('กรุณาติ๊กเลือกรายการที่ต้องการสั่งซื้อ', 'error')
    return
  }
  if (!hasAddress.value) {
    toast('กรุณาเพิ่มที่อยู่ในโปรไฟล์ก่อนสั่งซื้อ', 'error')
    return
  }
  if (hasStockIssue.value) {
    toast('กรุณาตรวจสอบรายการในตะกร้า', 'error')
    return
  }
  submitting.value = true
  try {
    for (const item of cart.selectedItems) {
      // กันสินค้าถูกลบไปแล้ว (product เป็น null) ซึ่งปกติจะ TypeError ตรงนี้
      if (!item.product) throw new Error('สินค้าบางรายการอาจถูกลบไปแล้ว กรุณากลับไปจัดการตะกร้า')
      if (item.variant_id) {
        // กันตัวเลือกถูกลบ/เปลี่ยนจนสต็อกไม่พอ
        if (!item.variant) throw new Error('ตัวเลือกสินค้าบางรายการอาจถูกลบไปแล้ว กรุณากลับไปจัดการตะกร้า')
        if (item.quantity > item.variant.quantity) throw new Error('สินค้าบางรายการเกินสต็อก')
      } else if (item.quantity > item.product.quantity) {
        throw new Error('สินค้าบางรายการเกินสต็อก')
      }
    }

    const itemsPayload = cart.selectedItems.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      color: i.selected_color || null,
      size: i.selected_size || null,
      variant_id: i.variant_id || null,
    }))

    const orderId = await placeOrder(auth.user.id, itemsPayload, shippingAddress.value.trim())
    // ลบเฉพาะรายการที่สั่งสำเร็จ ที่เหลือคงไว้ในตะกร้า
    await cart.removeItems(cart.selectedItems.map((i) => i.cart_item_id))

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

        <div v-else-if="cart.loaded && !cart.selectedItems.length" class="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p class="font-semibold text-stone-700">ยังไม่ได้เลือกรายการที่จะสั่งซื้อ</p>
          <p class="mt-1 text-sm text-stone-500">กลับไปติ๊กรายการที่ต้องการในตะกร้าก่อน</p>
          <RouterLink :to="{ name: 'cart' }" class="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white">กลับไปตะกร้า</RouterLink>
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div class="space-y-6">
            <section class="rounded-2xl border border-stone-200 bg-white p-5">
              <h2 class="mb-3 flex items-center gap-2 font-semibold text-stone-800"><Icon name="bag" :size="18" /> รายการสินค้า</h2>
              <div class="divide-y divide-stone-100">
                <div v-for="item in cart.selectedItems" :key="item.cart_item_id" class="flex gap-3 py-3">
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
              <label class="mb-1.5 block text-sm font-medium text-stone-600">
                ที่อยู่ / จุดนัดรับ <span class="text-red-500">*</span>
              </label>
              <textarea v-model="shippingAddress" rows="2" disabled
                class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none"
                placeholder="ยังไม่ได้ระบุที่อยู่"></textarea>
              <p v-if="!hasAddress" class="mt-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                ต้องมีที่อยู่ก่อนสั่งซื้อ กรุณา<RouterLink :to="{ name: 'profile' }" class="font-semibold text-brand-600 hover:underline">เพิ่มที่อยู่ในโปรไฟล์</RouterLink>ก่อน
              </p>
              <RouterLink v-else :to="{ name: 'profile' }" class="text-xs text-brand-600 hover:underline">แก้ไขที่อยู่ในโปรไฟล์</RouterLink>
            </section>
          </div>

          <CartSummaryCard
            :count="cart.selectedCount"
            :total="cart.selectedTotal"
            :submitting="submitting"
            :show-stock-issue="hasStockIssue"
            :disabled="!cart.selectedItems.length || hasStockIssue || !hasAddress"
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