// ============================================================================
// Chat store (Pinia) - ข้อมูลแชท + สมัคร subscribe ข้อความสด (realtime)
// งานอ่าน/เขียนตารางผ่าน src/api/chat.js ยกเว้น realtime channel ที่ต้องอยู่กับ state
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/toast'
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
  // ห้องที่เปิดดูอยู่ตอนนี้ (เปิดอยู่ไม่ต้องเตือนซ้ำ) + ข้อความใหม่ที่ยังไม่เปิดอ่านรายห้อง
  // หมายเหตุ: นับเฉพาะใน session นี้ (รีเฟรชแล้วหาย) เพราะไม่มีคอลัมน์เก็บสถานะอ่านใน DB
  const activeConversationId = ref(null)
  const unreadByRoom = ref({})
  let incomingChannel = null
  let incomingUid = null
  let pollTimer = null
  let pollRoomId = null
  let pollBusy = false

  /** จำนวนข้อความใหม่ที่ยังไม่อ่านรวมทุกห้อง (ใช้ติด badge ที่เมนูแชท) */
  const unreadChatCount = computed(() =>
    Object.values(unreadByRoom.value).reduce((s, n) => s + Number(n || 0), 0)
  )

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

  /** เริ่มฟังข้อความใหม่ทุกห้องของเรา (เรียกครั้งเดียวหลังล็อกอิน)
   *  ถ้าเปลี่ยนผู้ใช้จะถอด channel เก่าแล้วสมัครใหม่ให้เอง */
  function subscribeToIncoming(uid) {
    if (!uid) return
    if (incomingChannel && incomingUid === uid) return
    if (incomingChannel) {
      supabase.removeChannel(incomingChannel)
      incomingChannel = null
    }
    incomingUid = uid
    incomingChannel = supabase
      .channel('messages-incoming')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          await handleIncoming(uid, payload?.new)
        }
      )
      .subscribe()
  }

  /** ตรวจข้อความใหม่: ไม่ใช่ของเรา + ไม่ได้เปิดห้องนั้นอยู่ -> toast + นับ unread */
  async function handleIncoming(uid, msg) {
    if (!msg || !msg.id || !msg.conversation_id) return
    if (msg.sender_id === uid) return // ข้อความตัวเอง (เช่น เปิดอีกแท็บ) ไม่เตือน
    if (String(msg.conversation_id) === String(activeConversationId.value)) return // เปิดห้องนี้อยู่เห็นเอง
    if (!conversations.value.some((c) => String(c.id) === String(msg.conversation_id))) {
      // ห้องใหม่อาจยังไม่โหลด (เพิ่งมีคนทักครั้งแรก) โหลดรายการใหม่ก่อน
      try {
        await listConversations(uid)
      } catch {
        return
      }
      if (!conversations.value.some((c) => String(c.id) === String(msg.conversation_id))) return
    }
    unreadByRoom.value[msg.conversation_id] = (unreadByRoom.value[msg.conversation_id] || 0) + 1
    const convo = conversations.value.find((c) => String(c.id) === String(msg.conversation_id))
    const name = otherParty(convo, uid)?.name || 'คู่สนทนา'
    toast(`ข้อความใหม่จาก ${name}`, 'info')
  }

  /** เปิดห้องแล้ว: เลิกนับ unread ของห้องนั้น */
  function markRoomRead(conversationId) {
    if (unreadByRoom.value[conversationId]) delete unreadByRoom.value[conversationId]
  }

  /** เริ่ม polling ดึงข้อความห้องนี้ทุก 3 วิ (ใช้แทน realtime ชั่วคราวโดยไม่ต้องแก้ DB)
   *  - ยิงเฉพาะตอนแท็บเปิดอยู่ (document.visibilityState) เพื่อประหยัด request
   *  - ข้ามรอบถ้ารอบก่อนยังโหลดไม่เสร็จ (กันยิงซ้อนตอนเน็ตช้า) */
  function startRoomPolling(conversationId) {
    stopRoomPolling()
    pollRoomId = conversationId
    pollTimer = setInterval(async () => {
      if (!pollRoomId || document.visibilityState !== 'visible' || pollBusy) return
      pollBusy = true
      try {
        await loadMessages(pollRoomId)
      } catch {
        // เงียบไว้ รอบหน้าลองใหม่ (มีจอ error กลางของแอปดักกรณีร้ายแรงอยู่แล้ว)
      } finally {
        pollBusy = false
      }
    }, 3000)
  }

  /** หยุด polling (เรียกตอนออกจากห้อง/เปลี่ยนห้อง) */
  function stopRoomPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    pollRoomId = null
    pollBusy = false
  }

  /** ล้าง state เมื่อออกจากระบบ */
  function reset() {
    conversations.value = []
    messages.value = {}
    loaded.value = false
    activeConversationId.value = null
    unreadByRoom.value = {}
    incomingUid = null
    stopRoomPolling()
    if (incomingChannel) {
      supabase.removeChannel(incomingChannel)
      incomingChannel = null
    }
  }

  return {
    conversations,
    loaded,
    messages,
    activeConversationId,
    unreadByRoom,
    unreadChatCount,
    getOrCreate,
    listConversations,
    otherParty,
    loadMessages,
    sendMessage,
    subscribeToMessages,
    subscribeToIncoming,
    markRoomRead,
    startRoomPolling,
    stopRoomPolling,
    reset,
  }
})