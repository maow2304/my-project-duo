<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { toast } from '../lib/toast'
import SiteNavbar from '../components/SiteNavbar.vue'
import SiteFooter from '../components/SiteFooter.vue'
import Icon from '../components/Icon.vue'

const auth = useAuthStore()
const cart = useCartStore()

const form = ref({
  name: '',
  phone: '',
  email: '',
  address: '',
  places: '',
  username: '',
})
const saving = ref(false)

onMounted(() => {
  const p = auth.profile || {}
  form.value = {
    name: p.name || '',
    phone: p.phone || '',
    email: p.email || '',
    address: p.address || '',
    places: p.places || '',
    username: p.username || '',
  }
})

async function save() {
  saving.value = true
  try {
    const fields = { name: form.value.name, phone: form.value.phone }
    if (auth.isBuyer) fields.address = form.value.address
    else fields.places = form.value.places
    await auth.updateProfile(fields)
    toast('บันทึกโปรไฟล์เรียบร้อย')
  } catch {
    toast('บันทึกไม่สำเร็จ', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNavbar />
    <main class="flex-1">
      <div class="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div class="mb-6 flex items-center gap-4">
          <span class="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">
            {{ auth.displayName?.charAt(0).toUpperCase() }}
          </span>
          <div>
            <h1 class="text-2xl font-bold text-stone-800">{{ auth.displayName }}</h1>
            <p class="text-sm text-stone-500">
              <span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {{ auth.isSeller ? 'ผู้ขาย' : 'ผู้ซื้อ' }}
              </span>
              <span class="ml-2">{{ auth.profile?.email || auth.user?.email }}</span>
            </p>
          </div>
        </div>

        <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 class="font-semibold text-stone-800">ข้อมูลส่วนตัว</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">ชื่อผู้ใช้</label>
              <input v-model="form.username" disabled class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">{{ auth.isSeller ? 'ชื่อร้านค้า' : 'ชื่อ-นามสกุล' }}</label>
              <input v-model="form.name" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">เบอร์โทรศัพท์</label>
              <input v-model="form.phone" class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">อีเมล</label>
              <input v-model="form.email" disabled class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">สถานที่ติดต่อ/นัดรับ (places)</label>
            <textarea v-if="auth.isSeller" v-model="form.places" rows="2"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"></textarea>
            <textarea v-else v-model="form.address" rows="2"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"></textarea>
          </div>
          <button
            :disabled="saving"
            class="rounded-full bg-brand-600 px-8 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            @click="save"
          >
            บันทึก
          </button>
        </section>

        <section v-if="auth.isBuyer" class="mt-4 flex flex-wrap gap-3">
          <RouterLink :to="{ name: 'cart' }" class="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300">
            <Icon name="cart" :size="16" /> ตะกร้าสินค้า ({{ cart.count }})
          </RouterLink>
          <RouterLink :to="{ name: 'orders' }" class="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300">
            <Icon name="order" :size="16" /> ประวัติการสั่งซื้อ
          </RouterLink>
          <RouterLink :to="{ name: 'buyer-chats' }" class="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-600 hover:border-brand-300">
            <Icon name="chat" :size="16" /> แชท
          </RouterLink>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>