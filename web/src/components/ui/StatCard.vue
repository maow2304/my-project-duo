<script setup>
// การ์ดสถิติ (เมตริก) ใช้ในแดชบอร์ดผู้ขาย
import Icon from '@/components/Icon.vue'

defineProps({
  icon: { type: String, required: true },
  iconClass: { type: String, default: 'bg-brand-50 text-brand-600' },
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  valueClass: { type: String, default: 'text-stone-800' }, // เช่น ใส่สีเขียวให้ยอดขาย
})
</script>

<template>
  <div class="rounded-2xl border border-stone-200 bg-white p-5">
    <span class="grid h-10 w-10 place-items-center rounded-xl" :class="iconClass"><Icon :name="icon" /></span>
    <p class="mt-3 text-2xl font-bold" :class="valueClass">{{ value }}</p>
    <p class="text-sm text-stone-500">{{ label }}</p>
  </div>
</template>