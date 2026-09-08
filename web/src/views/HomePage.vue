<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import SiteNavbar from '../components/SiteNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import ProductCard from '../components/ProductCard.vue'
import EmptyState from '../components/EmptyState.vue'
import Spinner from '../components/Spinner.vue'
import Icon from '../components/Icon.vue'

const route = useRoute()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const maxPrice = ref(0)

const search = ref('')
const category = ref('ทั้งหมด')
const sort = ref('newest')
const maxPriceFilter = ref(null)

const filtered = computed(() => {
  let list = [...products.value]
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((p) =>
      (p.product_name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  }
  if (category.value !== 'ทั้งหมด') list = list.filter((p) => p.category === category.value)
  if (maxPriceFilter.value != null && maxPriceFilter.value > 0) {
    list = list.filter((p) => Number(p.price) <= maxPriceFilter.value)
  }
  if (sort.value === 'price-asc') list.sort((a, b) => a.price - b.price)
  else if (sort.value === 'price-desc') list.sort((a, b) => b.price - a.price)
  return list
})

async function loadProducts() {
  loading.value = true
  const { data, error } = await supabase
    .from('product')
    .select('*, seller:product_seller_id_fkey(name, places)')
    .order('product_id', { ascending: true })
  if (!error) {
    products.value = data || []
    maxPrice.value = Math.max(0, ...products.value.map((p) => Number(p.price)))
    categories.value = ['ทั้งหมด', ...new Set(products.value.map((p) => p.category).filter(Boolean))]
  }
  loading.value = false
}

function resetFilters() {
  category.value = 'ทั้งหมด'
  maxPriceFilter.value = null
}

watch(
  () => route.query.q,
  (v) => (search.value = v || ''),
  { immediate: true }
)

onMounted(loadProducts)
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <!-- hero -->
      <section class="bg-gradient-to-r from-brand-700 to-brand-500 text-white">
        <div class="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Icon name="store" :size="14" /> โดยนิสิต เพื่อนิสิต ม.พะเยา
            </span>
            <h1 class="mt-4 text-3xl font-bold leading-tight md:text-4xl">
              ซื้อ-ขายเสื้อผ้าแฟชั่น<br />ในรั้วมหาวิทยาลัย
            </h1>
            <p class="mt-3 max-w-md text-brand-50">
              ค้นหาสินค้าแฟชั่น, เสื้อผ้ามือสอง และของใช้ต้องมีของนิสิต ราคาเป็นกันเอง ซื้อง่าย ขายคล่อง
            </p>
          </div>
          <div class="hidden items-center justify-center md:flex">
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <p class="text-2xl font-bold">{{ products.length }}+</p>
                <p class="text-xs text-brand-100">สินค้า</p>
              </div>
              <div class="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <p class="text-2xl font-bold">{{ new Set(products.map((p) => p.seller_id)).size }}</p>
                <p class="text-xs text-brand-100">ร้านค้า</p>
              </div>
              <div class="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                <p class="text-2xl font-bold">100%</p>
                <p class="text-xs text-brand-100">ในรั้วม.พะเยา</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- shop -->
      <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="mb-5 flex flex-wrap items-center gap-3">
          <h2 class="text-xl font-bold text-stone-800">สินค้าทั้งหมด</h2>
          <span v-if="search || category !== 'ทั้งหมด' || maxPriceFilter" class="text-sm text-stone-400">
            (พบ {{ filtered.length }} รายการ)
          </span>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <select v-model="category" class="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
            <select v-model="sort" class="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400">
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="price-asc">ราคาต่ำไปสูง</option>
              <option value="price-desc">ราคาสูงไปต่ำ</option>
            </select>
            <input
              v-model.number="maxPriceFilter"
              type="number"
              min="0"
              placeholder="ราคาสูงสุด"
              class="w-28 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400"
            />
            <button
              v-if="category !== 'ทั้งหมด' || maxPriceFilter || search"
              class="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
              @click="resetFilters"
            >ล้าง</button>
          </div>
        </div>

        <Spinner v-if="loading" />
        <EmptyState v-else-if="!filtered.length" icon="search" title="ไม่พบสินค้าที่ค้นหา" message="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะ" />
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ProductCard v-for="p in filtered" :key="p.product_id" :product="p" />
        </div>
      </section>
    </main>
    <SiteFooter />
  </div>
</template>