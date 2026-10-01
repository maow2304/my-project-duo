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
  removeCartItems as apiRemoveCartItems,
} from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  const cartId = ref(null)
  const items = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  // id รายการที่ "เอาออก" จากการสั่งซื้อรอบนี้ (ค่าเริ่มต้น = เลือกทั้งหมด)
  // ใช้ Set ของ id ที่ไม่เลือกแทน เพื่อให้ของที่เพิ่มใหม่ถูกเลือกอัตโนมัติ
  const deselected = ref(new Set())

  /** จำนวนชิ้นรวมในตะกร้า (เช่น ซื้อ 2+3 = 5) */
  const count = computed(() => items.value.reduce((s, i) => s + toNumber(i.quantity), 0))
  /** ยอดรวมเงินทั้งหมดในตะกร้า (ค่าเพี้ยนให้ถือเป็น 0 แทนการกระจาย NaN) */
  const total = computed(() =>
    items.value.reduce((s, i) => s + toNumber(i.quantity) * toNumber(i.price), 0)
  )
  /** รายการที่ติ๊กเลือกจะสั่งซื้อ (ตัดแถวที่เอาออกแล้ว) */
  const selectedItems = computed(() => items.value.filter((i) => !deselected.value.has(i.cart_item_id)))
  /** จำนวนชิ้น + ยอดรวมเฉพาะรายการที่เลือก */
  const selectedCount = computed(() => selectedItems.value.reduce((s, i) => s + toNumber(i.quantity), 0))
  const selectedTotal = computed(() =>
    selectedItems.value.reduce((s, i) => s + toNumber(i.quantity) * toNumber(i.price), 0)
  )
  /** ติ๊กครบทุกแถวหรือไม่ */
  const allSelected = computed(
    () => items.value.length > 0 && items.value.every((i) => !deselected.value.has(i.cart_item_id))
  )

  /** แถวนี้ถูกเลือกสั่งซื้ออยู่หรือไม่ */
  function isSelected(cartItemId) {
    return !deselected.value.has(cartItemId)
  }

  /** ติ๊ก/เอาติ๊กรายการเดียว */
  function toggleSelect(cartItemId) {
    if (deselected.value.has(cartItemId)) deselected.value.delete(cartItemId)
    else deselected.value.add(cartItemId)
  }

  /** ติ๊กทั้งหมด / เอาออกทั้งหมด */
  function toggleSelectAll() {
    if (allSelected.value) items.value.forEach((i) => deselected.value.add(i.cart_item_id))
    else deselected.value.clear()
  }

  /** ตัด id ที่ไม่มีในตะกร้าแล้วออกจากชุดที่เอาออก */
  function pruneSelection() {
    const ids = new Set(items.value.map((i) => i.cart_item_id))
    for (const id of [...deselected.value]) {
      if (!ids.has(id)) deselected.value.delete(id)
    }
  }

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
      pruneSelection()
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
    deselected.value.delete(cartItemId)
  }

  /** ลบหลายรายการพร้อมกัน (ใช้หลังสั่งซื้อเฉพาะรายการที่เลือก) */
  async function removeItems(cartItemIds) {
    if (!cartItemIds.length) return
    await apiRemoveCartItems(cartItemIds)
    const gone = new Set(cartItemIds)
    items.value = items.value.filter((i) => !gone.has(i.cart_item_id))
    pruneSelection()
  }

  /** ล้าง state เมื่อล็อกเอาต์/เปลี่ยนผู้ใช้ */
  function reset() {
    cartId.value = null
    items.value = []
    deselected.value = new Set()
    loaded.value = false
  }

  return {
    cartId,
    items,
    loaded,
    loading,
    count,
    total,
    selectedItems,
    selectedCount,
    selectedTotal,
    allSelected,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    loadCart,
    addItem,
    updateQty,
    removeItem,
    removeItems,
    reset,
  }
})