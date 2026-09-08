<script setup>
import { useRoute, useRouter } from 'vue-router'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import ChatRoom from '../../components/ChatRoom.vue'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <button class="mb-4 text-sm text-stone-500 hover:text-brand-600" @click="router.push({ name: 'buyer-chats' })">
          ← กลับไปรายการแชท
        </button>
        <ChatRoom :conversation-id="String(route.params.id)" />
      </div>
    </main>
    <SiteFooter />
  </div>
</template>