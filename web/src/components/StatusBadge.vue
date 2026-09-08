<script setup>
import { STATUS_STYLES, STATUS_LABEL } from '../lib/format'

defineProps({
  status: { type: String, required: true },
})

const styleMap = function (s) {
  return STATUS_STYLES[s] || 'bg-stone-100 text-stone-600 ring-stone-200'
}
const labelMap = function (s) {
  return STATUS_LABEL[s] || s
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1" :class="styleMap(status)">
    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
    {{ labelMap(status) }}
  </span>
</template>