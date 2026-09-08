import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useCartStore = defineStore('cart', () => {
  const cartId = ref(null)
  const items = ref([])
  const loaded = ref(false)
  const loading = ref(false)

  const count = computed(() => items.value.reduce((s, i) => s + i.quantity, 0))
  const total = computed(() =>
    items.value.reduce((s, i) => s + i.quantity * Number(i.price || 0), 0)
  )

  async function ensureCart(buyerId) {
    if (cartId.value) return cartId.value
    const { data, error } = await supabase
      .from('cart')
      .select('cart_id')
      .eq('buyer_id', buyerId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      cartId.value = data.cart_id
      return cartId.value
    }
    const { data: created, error: createError } = await supabase
      .from('cart')
      .insert({ buyer_id: buyerId })
      .select('cart_id')
      .single()
    if (createError) throw createError
    cartId.value = created.cart_id
    return cartId.value
  }

  async function loadCart(buyerId) {
    loading.value = true
    try {
      const id = await ensureCart(buyerId)
      const { data, error } = await supabase
        .from('cart_item')
        .select('cart_item_id, quantity, selected_color, selected_size, product_id, product:cart_item_product_id_fkey(*)')
        .eq('cart_id', id)
      if (error) throw error
      items.value = data.map((i) => ({
        cart_item_id: i.cart_item_id,
        quantity: i.quantity,
        selected_color: i.selected_color,
        selected_size: i.selected_size,
        product_id: i.product_id,
        product: i.product,
        price: i.product?.price ?? 0,
      }))
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function addItem(buyerId, { product_id, quantity, color, size }) {
    const id = await ensureCart(buyerId)
    const existing = items.value.find(
      (i) =>
        i.product_id === product_id &&
        (i.selected_color || null) === (color || null) &&
        (i.selected_size || null) === (size || null)
    )
    if (existing) {
      await updateQty(existing.cart_item_id, existing.quantity + quantity)
    } else {
      const { error } = await supabase.from('cart_item').insert({
        cart_id: id,
        product_id,
        quantity,
        selected_color: color || null,
        selected_size: size || null,
      })
      if (error) throw error
      await loadCart(buyerId)
    }
  }

  async function updateQty(cartItemId, quantity) {
    const { error } = await supabase
      .from('cart_item')
      .update({ quantity })
      .eq('cart_item_id', cartItemId)
    if (error) throw error
    const it = items.value.find((i) => i.cart_item_id === cartItemId)
    if (it) it.quantity = quantity
  }

  async function removeItem(cartItemId) {
    const { error } = await supabase
      .from('cart_item')
      .delete()
      .eq('cart_item_id', cartItemId)
    if (error) throw error
    items.value = items.value.filter((i) => i.cart_item_id !== cartItemId)
  }

  function reset() {
    cartId.value = null
    items.value = []
    loaded.value = false
  }

  return {
    cartId,
    items,
    loaded,
    loading,
    count,
    total,
    loadCart,
    addItem,
    updateQty,
    removeItem,
    reset,
  }
})