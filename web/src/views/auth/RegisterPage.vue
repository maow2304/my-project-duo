<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { toast } from '../../lib/toast'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const role = ref(route.query.role === 'seller' ? 'seller' : 'buyer')
const form = ref({
  email: '',
  password: '',
  username: '',
  name: '',
  phone: '',
  address: '',
  places: '',
})
const showPw = ref(false)
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  if (!form.value.username.trim()) {
    error.value = 'กรุณากรอกชื่อผู้ใช้'
    return
  }
  if (form.value.password.length < 6) {
    error.value = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    return
  }
  submitting.value = true
  try {
    await auth.register({
      email: form.value.email,
      password: form.value.password,
      username: form.value.username.trim(),
      role: role.value,
      name: form.value.name.trim() || form.value.username.trim(),
      phone: form.value.phone.trim(),
      address: form.value.address.trim(),
      places: form.value.places.trim(),
    })
    toast(role.value === 'seller' ? 'สมัครร้านค้าสำเร็จ!' : 'สมัครสมาชิกสำเร็จ!')
    if (auth.isLoggedIn) {
      router.push(auth.isSeller ? { name: 'seller-dashboard' } : { name: 'home' })
    } else {
      router.push({ name: 'login' })
    }
  } catch (e) {
    error.value = e?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-10">
    <div class="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl"></div>

    <div class="relative w-full max-w-lg">
      <div class="mb-6 flex flex-col items-center gap-3">
        <span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/30">UP</span>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-stone-800">สมัครสมาชิก</h1>
          <p class="mt-1 text-sm text-stone-500">เลือกบทบาทของคุณ แล้วเริ่มใช้งานได้เลย</p>
        </div>
      </div>

      <form class="space-y-5 rounded-3xl border border-stone-100 bg-white p-7 shadow-xl shadow-stone-200/50" @submit.prevent="submit">
        <!-- role selection -->
        <div class="grid grid-cols-2 gap-3">
          <button type="button"
            class="flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition"
            :class="role === 'buyer' ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300'"
            @click="role = 'buyer'">
            <span class="grid h-10 w-10 place-items-center rounded-full" :class="role === 'buyer' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400'">
              <Icon name="bag" />
            </span>
            <span class="font-semibold text-stone-800">ผู้ซื้อ</span>
            <span class="text-xs text-stone-500">ช้อปสินค้า</span>
          </button>
          <button type="button"
            class="flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 transition"
            :class="role === 'seller' ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300'"
            @click="role = 'seller'">
            <span class="grid h-10 w-10 place-items-center rounded-full" :class="role === 'seller' ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400'">
              <Icon name="store" />
            </span>
            <span class="font-semibold text-stone-800">ผู้ขาย</span>
            <span class="text-xs text-stone-500">เปิดร้านขายของ</span>
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">อีเมล</label>
            <input v-model="form.email" type="email" required placeholder="you@example.com"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">ชื่อผู้ใช้ (username)</label>
            <input v-model="form.username" required placeholder="nickname"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">{{ role === 'seller' ? 'ชื่อร้านค้า' : 'ชื่อ-นามสกุล' }}</label>
            <input v-model="form.name" required :placeholder="role === 'seller' ? 'ชื่อร้านของคุณ' : 'ชื่อ นามสกุล'"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">เบอร์โทรศัพท์</label>
            <input v-model="form.phone" placeholder="08x-xxx-xxxx"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">สถานที่รับ/ส่งของ (places)</label>
          <input v-if="role === 'seller'" v-model="form.places"
            placeholder="เช่น หอพักนิสิต ม.พะเยา"
            class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <input v-else v-model="form.address"
            placeholder="เช่น หอพักนิสิต ม.พะเยา"
            class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">รหัสผ่าน</label>
          <div class="relative">
            <input v-model="form.password" :type="showPw ? 'text' : 'password'" required placeholder="อย่างน้อย 6 ตัวอักษร"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-600"
              @click="showPw = !showPw">{{ showPw ? 'ซ่อน' : 'แสดง' }}</button>
          </div>
        </div>

        <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{{ error }}</p>

        <button type="submit" :disabled="submitting"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
          <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          สมัครสมาชิก {{ role === 'seller' ? 'ในฐานะผู้ขาย' : 'ในฐานะผู้ซื้อ' }}
        </button>

        <p class="text-center text-sm text-stone-500">
          มีบัญชีอยู่แล้ว?
          <RouterLink :to="{ name: 'login' }" class="font-semibold text-brand-600 hover:underline">เข้าสู่ระบบ</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>