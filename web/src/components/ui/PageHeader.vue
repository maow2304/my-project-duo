<script setup>
// หัวข้อมาตรฐานของหน้า seller (ชื่อ + คำอธิบายสั้น) ช่อง slot ไว้ใส่ปุ่มด้านขวา
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold text-stone-800">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-stone-500">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>