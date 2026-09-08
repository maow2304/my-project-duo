import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref([])
  const loaded = ref(false)
  const messages = ref({})

  async function getOrCreate({ buyerId, sellerId, productId, productSellerId }) {
    const effectiveSeller = sellerId || productSellerId
    if (buyerId === effectiveSeller) return null

    let query = supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', effectiveSeller)
    query = productId ? query.eq('product_id', productId) : query.is('product_id', null)

    const { data: existing } = await query.maybeSingle()

    if (existing) return existing

    const { data, error } = await supabase
      .from('conversations')
      .insert({ buyer_id: buyerId, seller_id: effectiveSeller, product_id: productId || null })
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  async function listConversations(uid) {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        '*, buyer:conversations_buyer_id_fkey(username, name, phone), seller:conversations_seller_id_fkey(username, name, places), product:conversations_product_id_fkey(product_id, product_name, price, image, color), last_message:messages(id, content, sent_at, sender_id) order by sent_at desc limit 1'
      )
      .or(`buyer_id.eq.${uid},seller_id.eq.${uid}`)
      .order('created_at', { ascending: false })
    if (error) throw error
    conversations.value = data || []
    loaded.value = true
    return conversations.value
  }

  function otherParty(convo, uid) {
    return convo.buyer_id === uid ? convo.seller : convo.buyer
  }

  async function loadMessages(conversationId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
    if (error) throw error
    messages.value[conversationId] = data || []
    return messages.value[conversationId]
  }

  async function sendMessage(conversationId, senderId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select('*')
      .single()
    if (error) throw error
    if (!messages.value[conversationId]) messages.value[conversationId] = []
    messages.value[conversationId].push(data)
    return data
  }

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