<script setup>
// ช่องกรอกข้อมูล (input) พร้อม label ในสไตล์เดียวทั้งระบบ
// รองรับ v-model, ประเภท input ต่าง ๆ และคำแนะนำตัวเลือก (datalist)
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  name: { type: String, default: '' }, // ใช้สร้าง id ของ datalist (ไม่ซ้ำกันในหน้า)
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  step: { type: Number, default: null },
  maxlength: { type: [Number, String], default: null },
  error: { type: String, default: '' }, // ข้อความ error ใต้ช่อง (ยกเว้นว่าง = ไม่มี error)
  suggestions: { type: Array, default: () => [] }, // ตัวเลือกสำหรับ datalist
})
const emit = defineEmits(['update:modelValue'])

const listId = computed(() => (props.name ? `dl-${props.name}` : null))
</script>

<template>
  <div>
    <label v-if="label" class="mb-1.5 block text-sm font-medium text-stone-600">
      {{ label }}<span v-if="required" class="text-red-500"> *</span>
    </label>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength || undefined"
      :list="listId || undefined"
      class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 disabled:bg-stone-100"
      :class="error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
    <datalist v-if="suggestions.length" :id="listId">
      <option v-for="s in suggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>