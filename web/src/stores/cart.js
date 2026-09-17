// ============================================================================
// Cart store (Pinia) - ตะกร้าสินค้าของผู้ซื้อ
// เตรียมข้อมูล + จัดกลุ่มรายการ และเรียก src/api/cart.js ในการอ่าน/เขียนตาราง
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { toNumber } from '@/lib/format'
import {
  getOrCreateCart,
  listCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
} from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  const cartId = ref(null)
  const items = ref([])
  const loaded = ref(false)
  const loading = ref(false)

  /** จำนวนชิ้นรวมในตะกร้า (เช่น ซื้อ 2+3 = 5) */
  const count = computed(() => items.value.reduce((s, i) => s + toNumber(i.quantity), 0))
  /** ยอดรวมเงินทั้งหมดในตะกร้า (ค่าเพี้ยนให้ถือเป็น 0 แทนการกระจาย NaN) */
  const total = computed(() =>
    items.value.reduce((s, i) => s + toNumber(i.quantity) * toNumber(i.price), 0)
  )

  /** หา cart_id ของผู้ซื้อ (สร้างใหม่ถ้ายังไม่มี) และจดจำไว้ใช้งาน */
  async function ensureCart(buyerId) {
    if (cartId.value) return cartId.value
    cartId.value = await getOrCreateCart(buyerId)
    return cartId.value
  }

  /** โหลดรายการในตะกร้าทั้งหมด (เรียกเมื่อเข้าหน้าที่ต้องใช้ตะกร้า) */
  async function loadCart(buyerId) {
    loading.value = true
    try {
      const id = await ensureCart(buyerId)
      items.value = await listCartItems(id)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * เพิ่มสินค้าเข้าตะกร้า
   * หากมีรายการสี/ไซส์เดียวกันอยู่แล้ว ให้รวมจำนวนเข้าไปแทนการเพิ่มแถวใหม่
   * (รายการที่มี variant_id จะรวมกันด้วย variant_id เป็นหลัก)
   */
  async function addItem(buyerId, { product_id, quantity, color, size, variant_id }) {
    const id = await ensureCart(buyerId)
    const existing = items.value.find((i) =>
      variant_id
        ? i.variant_id === variant_id
        : !i.variant_id &&
          i.product_id === product_id &&
          (i.selected_color || null) === (color || null) &&
          (i.selected_size || null) === (size || null)
    )
    if (existing) {
      await updateQty(existing.cart_item_id, existing.quantity + quantity)
    } else {
      await addCartItem({ cartId: id, productId: product_id, quantity, color, size, variantId: variant_id })
      await loadCart(buyerId)
    }
  }

  /** เปลี่ยนจำนวนชิ้นของรายการ 1 บรรทัด (อัปเดต state ทันที) */
  async function updateQty(cartItemId, quantity) {
    await updateCartItemQuantity(cartItemId, quantity)
    const it = items.value.find((i) => i.cart_item_id === cartItemId)
    if (it) it.quantity = quantity
  }

  /** ลบสินค้าออกจากตะกร้า */
  async function removeItem(cartItemId) {
    await removeCartItem(cartItemId)
    items.value = items.value.filter((i) => i.cart_item_id !== cartItemId)
  }

  /** ล้าง state เมื่อล็อกเอาต์/เปลี่ยนผู้ใช้ */
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