<script setup>
// คอมโพเนนต์รากของแอป - วาง ToastHost เพื่อแสดงแจ้งเตือนแบบ global + ตัว RouterView
import ToastHost from './components/ToastHost.vue'
</script>

<template>
  <ToastHost />
  <RouterView />
</template>