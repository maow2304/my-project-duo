<script setup>
// ตัวอัปโหลดรูปสินค้า - เลือกรูปแล้วอัปโหลดไป Supabase Storage ให้อัตโนมัติ
// คืน URL สาธารณะกลับผ่าน v-model (update:modelValue)
// ใช้ในหน้าเพิ่ม/แก้ไขสินค้าของผู้ขาย
import { ref, watch } from 'vue'
import { uploadProductImage, removeProductImage } from '@/api/storage'
import { toast } from '@/lib/toast'
import Icon from '@/components/Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  ownerId: { type: String, required: true }, // เจ้าของไฟล์ ใช้เป็นโฟลเดอร์ใน Storage
})
const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const previewUrl = ref(props.modelValue)
const uploading = ref(false)

// เมื่อค่าจากภายนอกเปลี่ยน (เช่น โหลดสินค้าเดิมตอนแก้ไข) ให้อัปเดตพรีวิวตาม
watch(
  () => props.modelValue,
  (v) => (previewUrl.value = v || '')
)

function pickFile() {
  fileInput.value?.click()
}

async function onFile(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    // อัปโหลดรูปใหม่ + ลบรูปเดิมที่ถูกแทน (ถ้ามี) แบบเงียบ
    const url = await uploadProductImage(file, props.ownerId)
    if (props.modelValue && props.modelValue !== url) {
      removeProductImage(props.modelValue)
    }
    emit('update:modelValue', url)
    previewUrl.value = url
    toast('อัปโหลดรูปภาพสำเร็จ')
  } catch (e) {
    toast('อัปโหลดรูปไม่สำเร็จ ตรวจสอบว่าสร้าง bucket "product-images" แล้ว', 'error')
  } finally {
    uploading.value = false
    ev.target.value = ''
  }
}
</script>

<template>
  <div>
    <label class="mb-2 block text-sm font-medium text-stone-600">รูปสินค้า</label>
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="grid h-28 w-28 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 transition hover:border-brand-300"
        @click="pickFile"
      >
        <img v-if="previewUrl" :src="previewUrl" class="h-full w-full object-cover" />
        <span v-else class="flex flex-col items-center gap-1 text-xs">
          <Icon name="image" :size="24" />
          {{ uploading ? 'กำลังอัปโหลด...' : 'เลือกรูป' }}
        </span>
      </button>
      <div class="flex-1">
        <button type="button" class="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50" @click="pickFile">
          อัปโหลดรูป
        </button>
        <p class="mt-2 text-xs text-stone-400">
          รองรับ JPG/PNG บันทึกลง Supabase Storage (bucket: product-images)<br />หากยังไม่สร้าง bucket ให้สร้างใน Dashboard → Storage
        </p>
      </div>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />
    </div>
  </div>
</template>