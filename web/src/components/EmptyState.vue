<script setup>
import Icon from './Icon.vue'

defineProps({
  icon: { type: String, default: 'search' },
  title: { type: String, default: 'ไม่พบข้อมูล' },
  message: { type: String, default: 'ลองเปลี่ยนคำค้นหาหรือลองใหม่อีกครั้ง' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <span class="grid h-16 w-16 place-items-center rounded-full bg-stone-100 text-stone-400">
      <Icon :name="icon" :size="32" />
    </span>
    <p class="font-semibold text-stone-700">{{ title }}</p>
    <p class="max-w-sm text-sm text-stone-400">{{ message }}</p>
    <slot />
  </div>
</template>