<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import SellerLayout from './SellerLayout.vue'
import EmptyState from '../../components/EmptyState.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()

function open(convoId) {
  router.push({ name: 'seller-chat-room', params: { id: convoId } })
}

onMounted(() => chat.listConversations(auth.user.id).catch(() => {}))
</script>

<template>
  <SellerLayout>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-stone-800">แชทกับลูกค้า</h1>
      <p class="text-sm text-stone-500">ตอบแชทจากผู้ซื้อที่สนใจสินค้าของคุณ</p>
    </div>

    <div class="space-y-2">
      <EmptyState v-if="chat.loaded && !chat.conversations.length" icon="chat" title="ยังไม่มีแชท" message="เมื่อผู้ซื้อเริ่มคุยจากหน้าสินค้า จะแสดงที่นี่" />
      <button
        v-for="c in chat.conversations"
        :key="c.id"
        class="flex w-full items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-brand-300"
        @click="open(c.id)"
      >
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
          {{ chat.otherParty(c, auth.user.id)?.name?.charAt(0) || '?' }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate font-medium text-stone-700">{{ chat.otherParty(c, auth.user.id)?.name }}</p>
            <span v-if="c.product" class="truncate rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{{ c.product.product_name }}</span>
          </div>
          <p class="mt-0.5 truncate text-sm text-stone-400">{{ c.last_message?.content || 'ยังไม่มีข้อความ' }}</p>
        </div>
        <span v-if="c.last_message" class="shrink-0 text-xs text-stone-400">{{ c.last_message.sent_at }}</span>
        <Icon name="chevron-right" class="shrink-0 text-stone-300" />
      </button>
    </div>
  </SellerLayout>
</template>