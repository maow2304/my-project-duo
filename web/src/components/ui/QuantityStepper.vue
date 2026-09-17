<script setup>
// Stepper เลือกจำนวนชิ้น (+/-) ใช้ทั้งหน้ารายละเอียดสินค้าและหน้าตะกร้า
// - ปุ่ม +/- จะ emit เหตุการณ์ "inc" / "dec" ให้เพจต้นทางเป็นคนตัดสินใจ
//   (เช่น เช็กสต็อกหรือแสดง toast) ไม่ clamp ให้เอง
// - ช่องตัวเลขใช้ v-model กับเพจต้นทาง ยืนยันค่าเมื่อพิมพ์เสร็จ (@change)
import Icon from '@/components/Icon.vue'

defineProps({
  modelValue: { type: Number, default: 1 },
  compact: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'inc', 'dec'])
</script>

<template>
  <div class="flex items-center rounded-full border border-stone-200">
    <button
      type="button"
      class="grid place-items-center text-stone-500 hover:text-brand-600 disabled:opacity-40"
      :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
      :disabled="disabled"
      @click="emit('dec')"
    >
      <Icon name="minus" :size="compact ? 14 : 16" />
    </button>
    <input
      type="number"
      min="1"
      class="border-x border-stone-200 text-center text-sm outline-none"
      :class="compact ? 'h-8 w-10' : 'h-9 w-14'"
      :value="modelValue"
      :disabled="disabled"
      @change="emit('update:modelValue', Number($event.target.value))"
    />
    <button
      type="button"
      class="grid place-items-center text-stone-500 hover:text-brand-600 disabled:opacity-40"
      :class="compact ? 'h-8 w-8' : 'h-9 w-9'"
      :disabled="disabled"
      @click="emit('inc')"
    >
      <Icon name="plus" :size="compact ? 14 : 16" />
    </button>
  </div>
</template>