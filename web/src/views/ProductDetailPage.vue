<script setup>
// หน้ารายละเอียดสินค้า - โชว์รูป/ข้อมูล/เลือกจำนวน แล้วเพิ่มลงตะกร้าหรือเปิดแชทกับผู้ขาย
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatTHB, toNumber } from '@/lib/format'
import { getProductById } from '@/api/products'
import { listVariantsByProduct } from '@/api/variants'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useChatStore } from '@/stores/chat'
import { toast } from '@/lib/toast'
import SiteNavbar from '@/components/SiteNavbar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import Icon from '@/components/Icon.vue'
import Spinner from '@/components/Spinner.vue'
import QuantityStepper from '@/components/ui/QuantityStepper.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cart = useCartStore()
const chat = useChatStore()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const openChatBusy = ref(false)

// ตัวเลือกไซส์/สีของสินค้า (variants มีสต็อกแยกกันตามแต่ละแบบ)
const variants = ref([])
const selectedSize = ref('')
const selectedColor = ref('')

// ไซส์ทั้งหมดที่มีในสินค้านี้
const sizes = computed(() => [...new Set(variants.value.map((v) => v.size))])

// สีของไซส์ที่เลือก (แสดงทุกสีของไซส์นั้น สีที่หมดจะกดไม่ได้)
const colorsForSize = computed(() => {
  if (!selectedSize.value) return []
  return variants.value.filter((v) => v.size === selectedSize.value)
})

// variant ที่ผู้ซื้อเลือกอยู่ตอนนี้
const selectedVariant = computed(
  () => variants.value.find((v) => v.size === selectedSize.value && v.color === selectedColor.value) || null
)

// สต็อกสูงสุดที่สั่งได้ (ตาม variant ที่เลือก หรือยอดรวมกรณีสินค้าเก่าไม่มี variants)
const maxQty = computed(() =>
  selectedVariant.value ? toNumber(selectedVariant.value.quantity) : toNumber(product.value?.quantity)
)

// ราคารวมตามจำนวนที่เลือก (ราคาเพี้ยนให้เป็น 0 แทน NaN)
const totalPrice = computed(() => (product.value ? toNumber(product.value.price) * quantity.value : 0))

async function load() {
  loading.value = true
  try {
    product.value = await getProductById(route.params.id)
    quantity.value = 1
    selectedSize.value = ''
    selectedColor.value = ''
    variants.value = product.value
      ? await listVariantsByProduct(product.value.product_id).catch(() => [])
      : []
    // ถ้ามีแบบเดียวให้เลือกให้เลย ไม่ต้องกด
    if (variants.value.length === 1) {
      selectedSize.value = variants.value[0].size
      selectedColor.value = variants.value[0].color
    }
  } catch (e) {
    product.value = null
    variants.value = []
  } finally {
    loading.value = false
  }
}

// จำกัดจำนวน: ห้ามเกินสต็อกของ variant ที่เลือก และห้ามต่ำกว่า 1
function clampQty(n) {
  if (!product.value) return
  if (Number.isNaN(n)) return
  const max = Math.max(1, maxQty.value)
  if (n > max) quantity.value = max
  else if (n < 1) quantity.value = 1
  else quantity.value = n
}

// เพิ่มเข้าตะกร้า (ต้องล็อกอินเป็นผู้ซื้อ และเช็กสต็อกก่อน)
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
  // ถ้าสินค้ามีตัวเลือก ต้องเลือกไซส์/สีก่อน
  if (variants.value.length && !selectedVariant.value) {
    toast('กรุณาเลือกไซส์และสีก่อนเพิ่มลงตะกร้า', 'error')
    return
  }
  if (quantity.value > maxQty.value) {
    toast('จำนวนสินค้าคงเหลือไม่เพียงพอ', 'error')
    return
  }
  try {
    await cart.addItem(auth.user.id, {
      product_id: product.value.product_id,
      quantity: quantity.value,
      color: selectedVariant.value ? selectedVariant.value.color : product.value.color,
      size: selectedVariant.value ? selectedVariant.value.size : product.value.size,
      variant_id: selectedVariant.value ? selectedVariant.value.variant_id : null,
    })
    toast('เพิ่มสินค้าลงตะกร้าแล้ว')
  } catch (e) {
    toast('เพิ่มสินค้าไม่สำเร็จ กรุณาลองใหม่', 'error')
  }
}

// เปิดแชทสอบถามผู้ขาย (ผู้ซื้อเท่านั้น)
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
              <!-- สินค้ามีตัวเลือก: ให้ผู้ซื้อกดเลือกไซส์/สีก่อน (สต็อกแยกกันตามแบบ) -->
              <template v-if="variants.length">
                <div class="flex items-start gap-3">
                  <span class="w-20 shrink-0 pt-1.5 text-sm text-stone-500">ไซส์</span>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="s in sizes" :key="s" type="button"
                      class="rounded-full border px-4 py-1.5 text-sm transition"
                      :class="selectedSize === s ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700' : 'border-stone-200 text-stone-600 hover:border-brand-300'"
                      @click="selectedSize = s; selectedColor = ''; quantity = 1">
                      {{ s }}
                    </button>
                  </div>
                </div>
                <div v-if="selectedSize" class="flex items-start gap-3">
                  <span class="w-20 shrink-0 pt-1.5 text-sm text-stone-500">สี</span>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="v in colorsForSize" :key="v.variant_id" type="button"
                      :disabled="v.quantity === 0"
                      class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
                      :class="selectedColor === v.color ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700' : 'border-stone-200 text-stone-600 hover:border-brand-300'"
                      @click="selectedColor = v.color; quantity = 1">
                      <span class="h-3.5 w-3.5 rounded-full border border-stone-300" :style="{ backgroundColor: String(v.color || '').toLowerCase() }"></span>
                      {{ v.color }}{{ v.quantity === 0 ? ' (หมด)' : '' }}
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-20 text-sm text-stone-500">สต็อก</span>
                  <span v-if="selectedVariant && selectedVariant.quantity > 0" class="text-sm text-emerald-600">พร้อมส่ง ({{ selectedVariant.quantity }} ชิ้น)</span>
                  <span v-else-if="selectedVariant" class="text-sm text-red-500">แบบที่เลือกหมดชั่วคราว</span>
                  <span v-else class="text-sm text-stone-400">กรุณาเลือกไซส์และสีก่อน</span>
                </div>
              </template>
              <!-- สินค้าเก่าไม่มี variants: แสดงค่าเดียวแบบเดิม -->
              <template v-else>
                <div class="flex items-center gap-3">
                  <span class="w-20 text-sm text-stone-500">สี</span>
                  <span class="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700">
                    <span class="h-3.5 w-3.5 rounded-full border border-stone-300" :style="{ backgroundColor: String(product.color || '').toLowerCase() }"></span>
                    {{ product.color || 'ไม่ระบุ' }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="w-20 text-sm text-stone-500">ไซส์</span>
                  <span class="rounded-full bg-stone-100 px-3 py-1.5 text-sm text-stone-700">{{ product.size || 'ไม่ระบุ' }}</span>
                </div>
              </template>
              <div v-if="!variants.length" class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">สต็อก</span>
                <span v-if="product.quantity > 0" class="text-sm text-emerald-600">พร้อมส่ง ({{ product.quantity }} ชิ้น)</span>
                <span v-else class="text-sm text-red-500">หมดชั่วคราว</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-20 text-sm text-stone-500">จำนวน</span>
                <QuantityStepper
                  :model-value="quantity"
                  :disabled="variants.length ? (!selectedVariant || selectedVariant.quantity === 0) : product.quantity === 0"
                  @dec="clampQty(quantity - 1)"
                  @inc="clampQty(quantity + 1)"
                  @update:model-value="(v) => clampQty(Number(v))"
                />
                <span class="text-sm text-stone-400">= <b class="text-stone-600">{{ formatTHB(totalPrice) }}</b></span>
              </div>
            </div>

            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                :disabled="variants.length ? (!selectedVariant || selectedVariant.quantity === 0) : product.quantity === 0"
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