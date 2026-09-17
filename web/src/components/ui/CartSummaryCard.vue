<script setup>
// หัวข้อหน้าสรุปยอด (aside) ใช้ร่วมกันระหว่างหน้าตะกร้าและหน้า checkout
import { formatTHB } from '@/lib/format'
import Icon from '@/components/Icon.vue'

defineProps({
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  submitting: { type: Boolean, default: false },
  showStockIssue: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'ยืนยันการสั่งซื้อ' },
  disabled: { type: Boolean, default: false },
  backTo: { type: String, default: 'home' }, // ชื่อ route ปุ่มย้อนกลับ
  backLabel: { type: String, default: '← กลับไปเลือกสินค้าต่อ' },
})
const emit = defineEmits(['submit'])
</script>

<template>
  <aside class="h-fit rounded-2xl border border-stone-200 bg-white p-5">
    <h2 class="font-semibold text-stone-800">สรุปยอด</h2>
    <div class="mt-4 space-y-2 text-sm">
      <div class="flex justify-between text-stone-500">
        <span>จำนวนสินค้า</span><span>{{ count }} รายการ</span>
      </div>
      <div class="flex justify-between text-stone-500">
        <span>ค่าส่ง</span><span>นัดรับในมหาวิทยาลัย</span>
      </div>
      <div class="flex justify-between border-t border-dashed border-stone-200 pt-3 text-lg font-bold text-stone-800">
        <span>ยอดรวม</span><span class="text-brand-700">{{ formatTHB(total) }}</span>
      </div>
    </div>
    <p v-if="showStockIssue" class="mt-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
      สินค้าบางรายการเกินสต็อก กลับไปแก้ไขที่ตะกร้า
    </p>
    <button
      type="button"
      :disabled="disabled || submitting"
      class="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      @click="emit('submit')"
    >
      <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
      {{ submitLabel }}
    </button>
    <RouterLink :to="{ name: backTo }" class="mt-3 block text-center text-sm text-stone-500 hover:text-brand-600">
      {{ backLabel }}
    </RouterLink>
  </aside>
</template>