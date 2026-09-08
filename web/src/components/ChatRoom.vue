<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/format'
import { toast } from '../lib/toast'
import Icon from './Icon.vue'

const props = defineProps({
  conversationId: { type: String, required: true },
})
const emit = defineEmits(['open'])

const auth = useAuthStore()
const chat = useChatStore()
const router = useRouter()

const convo = ref(null)
const text = ref('')
const sending = ref(false)
const loading = ref(true)
let channel = null
const scroller = ref(null)

const party = computed(() => (convo.value ? chat.otherParty(convo.value, auth.user.id) : null))
const messages = computed(() => chat.messages[props.conversationId] || [])

async function load() {
  loading.value = true
  const { data } = await supabase
    .from('conversations')
    .select('*, buyer:conversations_buyer_id_fkey(username, name, phone), seller:conversations_seller_id_fkey(username, name, places), product:conversations_product_id_fkey(*)')
    .eq('id', props.conversationId)
    .maybeSingle()
  convo.value = data
  await chat.loadMessages(props.conversationId)
  channel = chat.subscribeToMessages(props.conversationId, scrollDown)
  loading.value = false
  scrollDown()
}

function scrollDown() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

async function send() {
  const content = text.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    await chat.sendMessage(props.conversationId, auth.user.id, content)
    text.value = ''
    scrollDown()
  } catch {
    toast('ส่งข้อความไม่สำเร็จ', 'error')
  } finally {
    sending.value = false
  }
}

function onKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

onMounted(load)
onBeforeUnmount(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
    <header v-if="convo" class="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
        {{ party?.name?.charAt(0) || '?' }}
      </span>
      <div class="flex-1">
        <p class="font-medium">{{ party?.name || 'ผู้ใช้งาน' }}</p>
        <p v-if="convo.product" class="text-xs text-stone-400">
          สินค้า: {{ convo.product.product_name }}
        </p>
      </div>
      <button v-if="convo.product" class="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-500 hover:bg-stone-50"
        @click="emit('open')">
        ดูสินค้า
      </button>
    </header>

    <div ref="scroller" class="h-[420px] space-y-3 overflow-y-auto bg-stone-50 p-4">
      <div v-if="loading" class="grid h-full place-items-center text-sm text-stone-400">กำลังโหลดแชท...</div>
      <template v-else>
        <div v-for="m in messages" :key="m.id" class="flex" :class="m.sender_id === auth.user.id ? 'justify-end' : 'justify-start'">
          <div
            class="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm"
            :class="m.sender_id === auth.user.id ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-stone-700'"
          >
            <p class="whitespace-pre-line leading-relaxed">{{ m.content }}</p>
            <p class="mt-1 text-right text-[10px]" :class="m.sender_id === auth.user.id ? 'text-brand-100' : 'text-stone-400'">
              {{ formatDate(m.sent_at) }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <footer class="flex items-center gap-2 border-t border-stone-100 p-3">
      <textarea
        v-model="text"
        rows="1"
        placeholder="พิมพ์ข้อความ..."
        class="max-h-28 flex-1 resize-none rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        @keydown="onKey"
      ></textarea>
      <button
        :disabled="sending || !text.trim()"
        class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
        @click="send"
      >
        <Icon name="send" :size="18" />
      </button>
    </footer>
  </div>
</template>