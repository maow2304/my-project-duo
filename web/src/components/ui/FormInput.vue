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
      :list="listId || undefined"
      class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-100"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <datalist v-if="suggestions.length" :id="listId">
      <option v-for="s in suggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>