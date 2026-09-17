<script setup>
// หน้าโปรไฟล์ (ผู้ซื้อ) - แก้ชื่อ/สถานที่ และสลับไปโหมดผู้ขายได้จากลิงก์ที่นี่
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { toast } from '@/lib/toast'
import { hasDigit, isValidName, cleanDigits } from '@/lib/validators'
import SiteNavbar from '@/components/SiteNavbar.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import Icon from '@/components/Icon.vue'

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
// ข้อความ error รายช่อง (แสดงใต้ input ที่เกี่ยวข้อง) - ล้างทุกครั้งที่พิมพ์
const errors = ref({})

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

/** ตรวจรูปแบบข้อมูลก่อนบันทึก; คืน error รายช่อง (ช่องไหนผ่าน = เป็น "") */
function validate() {
  const errs = {}
  const name = form.value.name.trim()
  const rawPhone = form.value.phone.trim()

  // ชื่อ/ชื่อร้าน: ห้ามตัวเลขและอักขระพิเศษ (กันการ bypass หลายทางทั้ง user หน้าเว็บ)
  if (!name) errs.name = 'กรุณากรอก' + (auth.isSeller ? 'ชื่อร้านค้า' : 'ชื่อ-นามสกุล')
  else if (hasDigit(name)) errs.name = 'ชื่อห้ามมีตัวเลข'
  else if (!isValidName(name)) errs.name = 'ชื่อมีอักขระที่ไม่ได้รับอนุญาต'
  else if (name.length > 100) errs.name = 'ชื่อต้องไม่เกิน 100 ตัวอักษร'

  // เบอร์โทร: ถ้ากรอกต้องเป็นตัวเลข 9-10 หลัก
  if (rawPhone) {
    const withoutSep = rawPhone.replace(/[\s\-()]+/g, '')
    if (/\D/.test(withoutSep)) errs.phone = 'เบอร์โทรต้องเป็นตัวเลขเท่านั้น'
    else if (withoutSep.length < 9 || withoutSep.length > 10) errs.phone = 'เบอร์โทรต้องมี 9-10 หลัก'
  }

  // สถานที่ติดต่อ: จำกัดความยาว
  const place = (auth.isSeller ? form.value.places : form.value.address).trim()
  if (place.length > 200) errs.place = 'สถานที่ต้องไม่เกิน 200 ตัวอักษร'

  return errs
}

async function save() {
  const errs = validate()
  errors.value = errs
  if (Object.values(errs).some(Boolean)) {
    toast('กรุณาแก้ไขช่องที่มีเครื่องหมายสีแดง', 'error')
    return
  }
  saving.value = true
  try {
    const fields = {
      name: form.value.name.trim(),
      phone: cleanDigits(form.value.phone),
    }
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

        <section class="space-y-4 rounded-2xl border border-stone-200 bg-white p-6" @input="errors = {}">
          <h2 class="font-semibold text-stone-800">ข้อมูลส่วนตัว</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">ชื่อผู้ใช้</label>
              <input v-model="form.username" disabled class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">{{ auth.isSeller ? 'ชื่อร้านค้า' : 'ชื่อ-นามสกุล' }}</label>
              <input v-model="form.name" maxlength="100"
                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
                :class="errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'" />
              <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">เบอร์โทรศัพท์</label>
              <input v-model="form.phone" maxlength="20"
                class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
                :class="errors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'" />
              <p v-if="errors.phone" class="mt-1 text-xs text-red-500">{{ errors.phone }}</p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-stone-600">อีเมล</label>
              <input v-model="form.email" disabled class="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-stone-600">สถานที่ติดต่อ/นัดรับ (places)</label>
            <textarea v-if="auth.isSeller" v-model="form.places" rows="2" maxlength="200"
              class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
              :class="errors.place ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'"></textarea>
            <textarea v-else v-model="form.address" rows="2" maxlength="200"
              class="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2"
              :class="errors.place ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-stone-200 focus:border-brand-400 focus:ring-brand-100'"></textarea>
            <p v-if="errors.place" class="mt-1 text-xs text-red-500">{{ errors.place }}</p>
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