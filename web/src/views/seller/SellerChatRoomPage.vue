<script setup>
import { useRoute, useRouter } from 'vue-router'
import SellerLayout from './SellerLayout.vue'
import ChatRoom from '../../components/ChatRoom.vue'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <SellerLayout>
    <button class="mb-4 text-sm text-stone-500 hover:text-brand-600" @click="router.push({ name: 'seller-chats' })">
      ← กลับไปรายการแชท
    </button>
    <ChatRoom :conversation-id="String(route.params.id)" />
  </SellerLayout>
</template>