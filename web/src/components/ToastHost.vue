<script setup>
import { toasts, removeToast } from '../lib/toast'

const styles = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-sky-600',
}
</script>

<template>
  <div class="pointer-events-none fixed right-4 top-4 z-[100] flex w-80 flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
        :class="styles[t.type] || styles.success"
      >
        <span class="leading-snug">{{ t.message }}</span>
        <button class="shrink-0 opacity-70 hover:opacity-100" @click="removeToast(t.id)">✕</button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>