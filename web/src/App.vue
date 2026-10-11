<script setup>
// คอมโพเนนต์รากของแอป - วาง ToastHost เพื่อแสดงแจ้งเตือนแบบ global + ตัว RouterView
// + หน้าจอสำรองตอนโหลดหน้าล้มเหลว / render พัง กันเคสหน้าขาวเปล่าไม่มีปุ่มกด
import ToastHost from './components/ToastHost.vue'
import { routeLoadError, routeLoadErrorMessage } from './router'

function retryLoad() {
  routeLoadError.value = false
  routeLoadErrorMessage.value = ''
  window.location.reload()
}
</script>

<template>
  <ToastHost />
  <RouterView />
  <div v-if="routeLoadError" class="fixed inset-0 z-[100] grid place-items-center bg-white/95 p-6">
    <div class="max-w-sm text-center">
      <p class="text-lg font-bold text-stone-800">โหลดหน้านี้ไม่สำเร็จ</p>
      <p class="mt-2 text-sm leading-relaxed text-stone-500">
        {{ routeLoadErrorMessage || 'เกิดข้อผิดพลาด ลองโหลดใหม่อีกครั้ง' }}
      </p>
      <button
        class="mt-4 rounded-full bg-brand-600 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        @click="retryLoad"
      >
        โหลดใหม่
      </button>
    </div>
  </div>
</template>