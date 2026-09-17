// ============================================================================
// Chat store (Pinia) - ข้อมูลแชท + สมัคร subscribe ข้อความสด (realtime)
// งานอ่าน/เขียนตารางผ่าน src/api/chat.js ยกเว้น realtime channel ที่ต้องอยู่กับ state
// ============================================================================

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
// ใช้ alias (apiListConversations / apiSendMessage) เพราะใน store มี function
// ชื่อ listConversations / sendMessage เหมือนกัน ถ้า import ชื่อชนจะเรียกตัวมันเอง (infinite recursion)
import {
  getOrCreateConversation,
  listConversations as apiListConversations,
  listMessages,
  sendMessage as apiSendMessage,
} from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const loaded = ref(false)
  const messages = ref({}) // map: conversationId -> array ข้อความ

  /** หาหรือสร้างห้องแชท (ดู api/chat.js) - คืน null ถ้าแชทกับตัวเอง */
  async function getOrCreate(args) {
    return getOrCreateConversation(args)
  }

  /** โหลดรายการห้องแชทของผู้ใช้ (ทั้งที่เราเป็นผู้ซื้อหรือผู้ขาย) */
  async function listConversations(uid) {
    conversations.value = await apiListConversations(uid)
    loaded.value = true
    return conversations.value
  }

  /** หาข้อมูลคู่สนทนาจากห้องแชท (คนที่ไม่ได้เป็นเรา) */
  function otherParty(convo, uid) {
    return convo.buyer_id === uid ? convo.seller : convo.buyer
  }

  /** โหลดข้อความหัวข้อตาม conversationId แล้วเก็บไว้ใน state */
  async function loadMessages(conversationId) {
    messages.value[conversationId] = await listMessages(conversationId)
    return messages.value[conversationId]
  }

  /** ส่งข้อความ - บันทึกลง DB และเพิ่มเข้า state ทันที */
  async function sendMessage(conversationId, senderId, content) {
    const saved = await apiSendMessage(conversationId, senderId, content)
    if (!messages.value[conversationId]) messages.value[conversationId] = []
    messages.value[conversationId].push(saved)
    return saved
  }

  /** สมัครฟังข้อความใหม่แบบ realtime และเรียก onNew เมื่อมีข้อความเข้ามา */
  function subscribeToMessages(conversationId, onNew) {
    return supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!messages.value[conversationId]) messages.value[conversationId] = []
          if (!messages.value[conversationId].some((m) => m.id === payload.new.id)) {
            messages.value[conversationId].push(payload.new)
          }
          onNew?.(payload.new)
        }
      )
      .subscribe()
  }

  /** ล้าง state เมื่อออกจากระบบ */
  function reset() {
    conversations.value = []
    messages.value = {}
    loaded.value = false
  }

  return {
    conversations,
    loaded,
    messages,
    getOrCreate,
    listConversations,
    otherParty,
    loadMessages,
    sendMessage,
    subscribeToMessages,
    reset,
  }
})