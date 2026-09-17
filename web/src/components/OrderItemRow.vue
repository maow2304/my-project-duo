<script setup>
// แถวรายการสินค้าในออเดอร์ - แสดงรูป ชื่อ สี/ไซส์ จำนวน และยอดย่อย
// ใช้ทั้งฝั่งผู้ซื้อ (หน้ารายละเอียดออเดอร์) และฝั่งผู้ขาย (หน้าคำสั่งซื้อ)
// mode "compact" = แถวสั้น ๆ พื้นสีเทาอ่อน เหมาะกับรายการย่อยในออเดอร์ฝั่งผู้ขาย
import { formatTHB } from '@/lib/format'
import Icon from '@/components/Icon.vue'

defineProps({
  item: { type: Object, required: true },
  showUnitPrice: { type: Boolean, default: false }, // แสดงบรรทัด "ชิ้นละ X บาท" ด้วย
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex gap-3 py-3" :class="compact ? 'items-center rounded-xl bg-stone-50 px-4 py-2.5' : ''">
    <div class="shrink-0 overflow-hidden" :class="compact ? 'h-10 w-10 rounded-lg bg-white' : 'h-16 w-16 rounded-xl bg-stone-100'">
      <img v-if="item.product?.image" :src="item.product.image" class="h-full w-full object-cover" />
      <div v-else class="grid h-full w-full place-items-center text-stone-300"><Icon name="image" /></div>
    </div>
    <div class="flex-1">
      <p class="text-sm font-medium text-stone-700">{{ item.product?.product_name || 'สินค้า' }}</p>
      <p class="text-xs text-stone-400">{{ item.color || 'ไม่ระบุสี' }} · {{ item.size || 'ไม่ระบุไซส์' }} · ×{{ item.quantity }}</p>
      <p v-if="showUnitPrice" class="mt-1 text-xs text-stone-500">ชิ้นละ {{ formatTHB(item.price) }}</p>
    </div>
    <p class="text-sm font-semibold">{{ formatTHB(item.subtotal) }}</p>
  </div>
</template>