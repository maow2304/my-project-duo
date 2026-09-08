<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useChatStore } from '../../stores/chat'
import SiteNavbar from '../../components/SiteNavbar.vue'
import SiteFooter from '../../components/SiteFooter.vue'
import ChatRoom from '../../components/ChatRoom.vue'
import EmptyState from '../../components/EmptyState.vue'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()

const activeId = ref(null)

const activeConvo = computed(() => chat.conversations.find((c) => c.id === activeId.value))

function openProduct() {
  if (activeConvo.value?.product) {
    router.push({ name: 'product-detail', params: { id: activeConvo.value.product.product_id } })
  }
}

onMounted(() => chat.listConversations(auth.user.id).catch(() => {}))
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 class="mb-6 text-2xl font-bold text-stone-800">แชทกับผู้ขาย</h1>

        <div class="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside class="space-y-2">
            <EmptyState v-if="chat.loaded && !chat.conversations.length" icon="chat" title="ยังไม่มีแชท" message="เลือกเมนูคุยกับผู้ขายในหน้าสินค้าเพื่อเริ่มแชท" />
            <button
              v-for="c in chat.conversations"
              :key="c.id"
              class="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
              :class="activeId === c.id ? 'border-brand-400 bg-brand-50' : 'border-stone-200 bg-white hover:bg-stone-50'"
              @click="activeId = c.id"
            >
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 font-bold text-stone-500">
                {{ chat.otherParty(c, auth.user.id)?.name?.charAt(0) || '?' }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-stone-700">{{ chat.otherParty(c, auth.user.id)?.name }}</p>
                <p class="truncate text-xs text-stone-400">{{ c.last_message?.content || 'เริ่มสนทนา' }}</p>
              </div>
              <span v-if="c.product" class="shrink-0 text-xs text-stone-400">{{ c.product.product_name }}</span>
            </button>
          </aside>

          <ChatRoom v-if="activeId" :key="activeId" :conversation-id="activeId" @open="openProduct" />
          <div v-else class="grid h-[460px] place-items-center rounded-2xl border border-stone-200 bg-white text-stone-400">
            <div class="text-center">
              <Icon name="chat" :size="40" class="mx-auto mb-2 text-stone-300" />
              <p class="text-sm">เลือกห้องแชทเพื่อเริ่มคุย</p>
            </div>
          </div>
        </div>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>