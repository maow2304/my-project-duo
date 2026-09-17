// ============================================================================
// Auth store (Pinia) - จัดการสถานะการล็อกอิน/โปรไฟล์ของผู้ใช้ทั้งแอป
// เรียก Supabase Auth โดยตรง แต่การอ่าน/เขียนตารางจะผ่าน src/api/* เสมอ
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
// ใช้ alias (updateProfileApi) เพราะด้านล่างมี function ชื่อ updateProfile ใน store
// ถ้า import มาชื่อเดียวกัน จะเรียกตัวมันเอง (infinite recursion)
import { getSellerProfile, getBuyerProfile, createProfile, updateProfile as updateProfileApi } from '@/api/profile'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const role = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const isBuyer = computed(() => role.value === 'buyer')
  const isSeller = computed(() => role.value === 'seller')
  const displayName = computed(() => profile.value?.name || user.value?.email || 'ผู้ใช้งาน')

  /** โหลดโปรไฟล์ตาม uid - ดูตาราง seller ก่อน ถ้าไม่เจอค่อยดู buyer */
  async function loadProfile(uid) {
    const seller = await getSellerProfile(uid).catch(() => null)
    if (seller) {
      role.value = 'seller'
      profile.value = seller
      return
    }
    const buyer = await getBuyerProfile(uid).catch(() => null)
    if (buyer) {
      role.value = 'buyer'
      profile.value = buyer
      return
    }
    role.value = null
    profile.value = null
  }

  /** เริ่มต้นแอป: คืน session ที่มีอยู่ + ฟังการเปลี่ยนสถานะล็อกอิน */
  async function init() {
    loading.value = true
    const { data } = await supabase.auth.getSession()
    user.value = data?.session?.user ?? null
    if (user.value) {
      await loadProfile(user.value.id)
    }
    loading.value = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user ?? null
      if (user.value) {
        await loadProfile(user.value.id)
      } else {
        role.value = null
        profile.value = null
      }
    })
  }

  /** ล็อกอินด้วยอีเมล/รหัสผ่าน */
  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /**
   * สมัครสมาชิก: สร้างบัญชี Auth + สร้างแถวโปรไฟล์ในตาราง seller/buyer
   * ตามบทบาทที่เลือก (ชื่อ/ที่อยู่ ผู้ขายเพิ่ม places, ผู้ซื้อเพิ่ม address)
   */
  async function register({ email, password, username, role: chosenRole, ...extra }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: extra.name || username } },
    })
    if (error) throw error
    if (!data.user) throw new Error('สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่')

    const table = chosenRole === 'seller' ? 'seller' : 'buyer'
    const idColumn = chosenRole === 'seller' ? 'seller_id' : 'buyer_id'
    const row = {
      [idColumn]: data.user.id,
      username,
      email,
      name: extra.name,
      phone: extra.phone || null,
    }
    if (chosenRole === 'seller') row.places = extra.places || null
    else row.address = extra.address || null

    await createProfile(table, row)
    return data
  }

  /** ล็อกเอาต์ */
  async function logout() {
    await supabase.auth.signOut()
  }

  /** แก้ไขโปรไฟล์ของตัวเองแล้วโหลดกลับมาใหม่ทันที */
  async function updateProfile(fields) {
    if (!user.value) return
    await updateProfileApi(role.value, user.value.id, fields)
    await loadProfile(user.value.id)
  }

  return {
    user,
    profile,
    role,
    loading,
    isLoggedIn,
    isBuyer,
    isSeller,
    displayName,
    init,
    login,
    register,
    logout,
    loadProfile,
    updateProfile,
  }
})