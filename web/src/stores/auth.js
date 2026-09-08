import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const role = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const isBuyer = computed(() => role.value === 'buyer')
  const isSeller = computed(() => role.value === 'seller')
  const displayName = computed(
    () => profile.value?.name || user.value?.email || 'ผู้ใช้งาน'
  )

  async function loadProfile(uid) {
    const { data: seller } = await supabase
      .from('seller')
      .select('*')
      .eq('seller_id', uid)
      .maybeSingle()
    if (seller) {
      role.value = 'seller'
      profile.value = seller
      return
    }
    const { data: buyer } = await supabase
      .from('buyer')
      .select('*')
      .eq('buyer_id', uid)
      .maybeSingle()
    if (buyer) {
      role.value = 'buyer'
      profile.value = buyer
      return
    }
    role.value = null
    profile.value = null
  }

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

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

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

    const { error: insertError } = await supabase.from(table).insert(row)
    if (insertError) throw insertError
    return data
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function updateProfile(fields) {
    if (!user.value) return
    const table = role.value === 'seller' ? 'seller' : 'buyer'
    const idColumn = role.value === 'seller' ? 'seller_id' : 'buyer_id'
    const { error } = await supabase
      .from(table)
      .update(fields)
      .eq(idColumn, user.value.id)
    if (error) throw error
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