<script setup>
// หน้าห้องแชท (ผู้ขาย) - wrapper ส่ง conversationId จาก route ให้ ChatRoom.vue (ในเลย์เอาต์ผู้ขาย)
import { useRoute, useRouter } from 'vue-router'
import ChatRoom from '@/components/ChatRoom.vue'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <!-- หมายเหตุ: ไม่ห่อ SellerLayout ซ้ำ เพราะ route /seller ใส่ layout ให้อยู่แล้ว -->
  <div>
    <button class="mb-4 text-sm text-stone-500 hover:text-brand-600" @click="router.push({ name: 'seller-chats' })">
      ← กลับไปรายการแชท
    </button>
    <ChatRoom :conversation-id="String(route.params.id)" />
  </div>
</template>