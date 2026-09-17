<script setup>
// Dialog ยืนยันการทำงานที่อันตราย (เช่น ลบข้อมูล) ใช้ซ้ำได้ทุกหน้า
// แสดง overlay มืด + การ์ดกลางจอ มีปุ่มยกเลิก/ยืนยัน
// ข้อความและปุ่มส่งผ่าน props; ต้องเรียกใช้กับ v-if หรือ bind open ด้วย

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'ยืนยัน' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
    <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 class="text-lg font-bold text-stone-800">{{ title }}</h3>
      <p class="mt-2 text-sm text-stone-500">{{ message }}</p>
      <div class="mt-5 flex justify-end gap-3">
        <button
          type="button"
          class="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-600 hover:bg-stone-50"
          :disabled="busy"
          @click="emit('cancel')"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          :disabled="busy"
          @click="emit('confirm')"
        >
          <span v-if="busy" class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>