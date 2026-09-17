<script setup>
// ช่องกรอกข้อความยาว (textarea) พร้อม label ในสไตล์เดียวทั้งระบบ
defineProps({
  label: { type: String, default: '' },
  modelValue: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  maxlength: { type: [Number, String], default: null },
  error: { type: String, default: '' }, // ข้อความ error ใต้ช่อง
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
      :maxlength="maxlength || undefined"
      class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-stone-100"
      :class="error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'"
      @input="emit('update:modelValue', $event.target.value)"
    ></textarea>
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
  </div>
</template>