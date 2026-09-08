<script setup>
import Icon from './Icon.vue'
import { formatTHB } from '../lib/format'

const props = defineProps({
  product: { type: Object, required: true },
})
</script>

<template>
  <RouterLink
    :to="{ name: 'product-detail', params: { id: product.product_id } }"
    class="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
  >
    <div class="relative aspect-square overflow-hidden bg-stone-100">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.product_name"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <div v-else class="grid h-full w-full place-items-center text-stone-300">
        <Icon name="image" :size="48" />
      </div>
      <span
        v-if="product.quantity === 0"
        class="absolute left-3 top-3 rounded-full bg-stone-800/80 px-3 py-1 text-xs font-medium text-white"
      >หมดชั่วคราว</span>
      <span
        v-else-if="product.quantity < 10"
        class="absolute left-3 top-3 rounded-full bg-accent-400 px-3 py-1 text-xs font-medium text-stone-800"
      >เหลือ {{ product.quantity }}</span>
      <span v-if="product.category" class="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur">
        {{ product.category }}
      </span>
    </div>
    <div class="flex flex-1 flex-col gap-1 p-4">
      <h3 class="line-clamp-2 font-medium text-stone-800">{{ product.product_name }}</h3>
      <div class="mt-auto flex items-end justify-between pt-2">
        <span class="text-lg font-bold text-brand-700">{{ formatTHB(product.price) }}</span>
        <span v-if="product.color" class="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
          <span class="h-2.5 w-2.5 rounded-full border border-stone-300" :style="{ backgroundColor: product.color.toLowerCase() }"></span>
          {{ product.color }}
        </span>
      </div>
      <span v-if="product.seller" class="mt-1 text-xs text-stone-400">โดย {{ product.seller.name }}</span>
    </div>
  </RouterLink>
</template>