<script setup>
// ช่องกรอกข้อความยาว (textarea) พร้อม label ในสไตล์เดียวทั้งระบบ
defineProps({
  label: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-stone-600">{{ label }}</label>
    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-100"
      @input="emit('update:modelValue', $event.target.value)"
    ></textarea>
  </div>
</template>