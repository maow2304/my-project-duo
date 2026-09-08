<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { formatTHB } from '../lib/format'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useChatStore } from '../stores/chat'
import { toast } from '../lib/toast'
import SiteNavbar from '../components/SiteNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import Icon from '../components/Icon.vue'
import Spinner from '../components/Spinner.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const chat = useChatStore()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const openChatBusy = ref(false)

const selectedColor = computed({
  get: () => (product.value ? product.value.color || '' : ''),
  set: () => {},
})
const selectedSize = computed({
  get: () => (product.value ? product.value.size || '' : ''),
  set: () => {},
})

const totalPrice = computed(() => (product.value ? Number(product.value.price) * quantity.value : 0))

async function load() {
  loading.value = true
  const { data, error } = await supabase
    .from('product')
    .select('*, seller:product_seller_id_fkey(*)')
    .eq('product_id', route.params.id)
    .maybeSingle()
  if (error || !data) {
    product.value = null
  } else {
    product.value = data
    quantity.value = 1
  }
  loading.value = false
}

function clampQty(n) {
  if (!product.value) return
  const max = product.value.quantity
  if (n > max) quantity.value = max
  else if (n < 1) quantity.value = 1
}

async function addToCart() {
  if (!auth.isLoggedIn) {
    toast('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า', 'info')
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (auth.isSeller) {
    toast('บัญชีผู้ขายไม่สามารถซื้อสินค้าได้', 'error')
    return
  }
  if (product.value.quantity < quantity.value) {
    toast('จำนวนสินค้าคงเหลือไม่เพียงพอ', 'error')
    return
  }
  try {
    await cart.addItem(auth.user.id, {
      product_id: product.value.product_id,
      quantity: quantity.value,
      color: selectedColor.value,
      size: selectedSize.value,
    })
    toast('เพิ่มสินค้าลงตะกร้าแล้ว')
  } catch (e) {
    toast('เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่', 'error')
  }
}

async function openChat() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!auth.isBuyer) {
    toast('สิทธิ์ผู้ขายไม่สามารถเปิดห้องแชทเป็นผู้ซื้อได้', 'error')
    return
  }
  openChatBusy.value = true
  try {
    const convo = await chat.getOrCreate({
      buyerId: auth.user.id,
      sellerId: null,
      productSellerId: product.value.seller_id,
      productId: product.value.product_id,
    })
    router.push({ name: 'buyer-chat-room', params: { id: convo.id } })
  } catch (e) {
    toast('เปิดแชทไม่สำเร็จ', 'error')
  } finally {
    openChatBusy.value = false
  }
}

watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div v-if="loading" class="mx-auto max-w-7xl px-4 py-12 sm:px-6"><Spinner /></div>

      <div v-else-if="!product" class="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <p class="text-lg font-semibold text-stone-600">ไม่พบสินค้านี้</p>
        <RouterLink :to="{ name: 'home' }" class="mt-2 text-sm text-brand-600 hover:underline">กลับไปหน้าสินค้า</RouterLink>
      </div>

      <div v-else class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav class="mb-6 flex items-center gap-2 text-sm text-stone-400">
          <RouterLink :to="{ name: 'home' }" class="hover:text-brand-600">หน้าแรก</RouterLink>
          <span>/</span>
          <span>{{ product.product_name }}</span>
        </nav>

        <div class="grid gap-10 lg:grid-cols-2">
          <!-- image -->
          <div class="relative overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
            <div class="aspect-square">
              <img v-if="product.image" :src="product.image" :alt="product.product_name" class="h-full w-full object-cover" />
              <div v-else class="grid h-full w-full place-items-center text-stone-300">
                <Icon name="image" :size="96" />
              </div>
            </div>
            <span v-if="product.quantity === 0" class="absolute left-4 top-4 rounded-full bg-stone-800/80 px-4 py-1.5 text-sm text-white">สินค้าหมด</span>
          </div>

          <!-- info -->
          <div>
            <span v-if="product.category" class="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{{ product.category }}</span>
            <h1 class="mt-3 text-2xl font-bold text-stone-800 md:text-3xl">{{ product.product_name }}</h1>
            <p class="mt-3 text-3xl font-bold text-brand-600">{{ formatTHB(product.price) }}</p>

            <div class="mt-6 space-y-4">
              <div class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">สี</span>
                <span class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700">
                  <span class="h-3.5 w-3.5 rounded-full border border-stone-300" :style="{ backgroundColor: product.color?.toLowerCase() }"></span>
                  {{ product.color || 'ไม่ระบุ' }}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">ไซส์</span>
                <span class="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700">{{ product.size || 'ไม่ระบุ' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">สต็อก</span>
                <span v-if="product.quantity > 0" class="text-sm text-emerald-600">พร้อมส่ง ({{ product.quantity }} ชิ้น)</span>
                <span v-else class="text-sm text-red-500">หมดชั่วคราว</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">จำนวน</span>
                <div class="flex items-center rounded-full border border-stone-200">
                  <button class="grid h-9 w-9 place-items-center text-stone-500 hover:text-brand-600" :disabled="product.quantity === 0" @click="clampQty(quantity - 1)">
                    <Icon name="minus" :size="16" />
                  </button>
                  <input v-model.number="quantity" type="number" min="1" :max="product.quantity"
                    class="h-9 w-14 border-x border-stone-200 text-center text-sm outline-none"
                    @change="clampQty(quantity)" />
                  <button class="grid h-9 w-9 place-items-center text-stone-500 hover:text-brand-600" :disabled="product.quantity === 0" @click="clampQty(quantity + 1)">
                    <Icon name="plus" :size="16" />
                  </button>
                </div>
                <span class="text-sm text-stone-400">= <b class="text-stone-600">{{ formatTHB(totalPrice) }}</b></span>
              </div>
            </div>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                :disabled="product.quantity === 0"
                class="flex items-center justify-center gap-2 rounded-full bg-brand-600 px-8 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="addToCart">
                <Icon name="cart" /> เพิ่มลงตะกร้า
              </button>
              <button
                :disabled="openChatBusy"
                class="flex items-center justify-center gap-2 rounded-full border-2 border-brand-200 bg-white px-8 py-3.5 font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
                @click="openChat">
                <Icon name="chat" /> คุยกับผู้ขาย
              </button>
            </div>

            <div v-if="product.description" class="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
              <h3 class="mb-2 font-semibold text-stone-800">รายละเอียดสินค้า</h3>
              <p class="whitespace-pre-line text-sm leading-relaxed text-stone-600">{{ product.description }}</p>
            </div>

            <div class="mt-6 flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
              <span class="grid h-11 w-11 place-items-center rounded-full bg-white font-bold text-brand-700">
                {{ product.seller?.name?.charAt(0) || '?' }}
              </span>
              <div class="flex-1">
                <p class="font-medium">{{ product.seller?.name || 'ร้านค้า' }}</p>
                <p class="text-xs text-stone-500">{{ product.seller?.places }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>