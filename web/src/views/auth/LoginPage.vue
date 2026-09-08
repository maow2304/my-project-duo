<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { toast } from '../../lib/toast'
import Icon from '../../components/Icon.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const showPw = ref(false)
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    toast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ!')
    const redirect = route.query.redirect
    if (redirect) router.push(String(redirect))
    else if (auth.isSeller) router.push({ name: 'seller-dashboard' })
    else router.push({ name: 'home' })
  } catch (e) {
    error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-10">
    <div class="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"></div>
    <div class="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl"></div>

    <div class="relative w-full max-w-md">
      <div class="mb-6 flex flex-col items-center gap-3">
        <span class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-lg shadow-brand-600/30">UP</span>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-stone-800">เข้าสู่ระบบ UP Cloth Market</h1>
          <p class="mt-1 text-sm text-stone-500">ยินดีต้อนรับกลับ! พร้อมลุยช้อปหรือขายของกันอีกครั้ง</p>
        </div>
      </div>

      <form class="space-y-4 rounded-3xl border border-stone-100 bg-white p-7 shadow-xl shadow-stone-200/50" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">อีเมล</label>
          <input v-model="email" type="email" required placeholder="you@example.com"
            class="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-stone-600">รหัสผ่าน</label>
          <div class="relative">
            <input v-model="password" :type="showPw ? 'text' : 'password'" required placeholder="••••••••"
              class="w-full rounded-xl border border-stone-200 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-600"
              @click="showPw = !showPw">{{ showPw ? 'ซ่อน' : 'แสดง' }}</button>
          </div>
        </div>

        <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{{ error }}</p>

        <button type="submit" :disabled="submitting"
          class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
          <span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          เข้าสู่ระบบ
        </button>

        <p class="text-center text-sm text-stone-500">
          ยังไม่มีบัญชี?
          <RouterLink :to="{ name: 'register' }" class="font-semibold text-brand-600 hover:underline">สมัครสมาชิก</RouterLink>
        </p>

        <div class="rounded-xl bg-stone-50 p-3 text-xs text-stone-500">
          <p class="mb-1 flex items-center gap-1.5 font-semibold text-stone-600"><Icon name="user" :size="14" /> บัญชีทดลอง</p>
          <p>ผู้ซื้อ: buyer01@upmarket.local / pass1234</p>
          <p>ผู้ขาย: seller01@upmarket.local / sell1234</p>
        </div>
      </form>
    </div>
  </div>
</template>