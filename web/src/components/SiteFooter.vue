<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
</script>

<template>
  <footer class="mt-16 border-t border-stone-200 bg-white">
    <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">UP</span>
          <span class="font-bold">Cloth<span class="text-brand-600">Market</span></span>
        </div>
        <p class="mt-3 text-sm text-stone-500">
          ตลาดซื้อขายเสื้อผ้ามือสอง &amp; สินค้าแฟชั่น สำหรับนิสิตมหาวิทยาลัยพะเยา
        </p>
      </div>
      <div>
        <h4 class="mb-3 text-sm font-bold text-stone-800">หมวดหมู่ยอดนิยม</h4>
        <ul class="space-y-2 text-sm text-stone-500">
          <li><RouterLink to="/" class="hover:text-brand-600">เสื้อผ้า</RouterLink></li>
          <li><RouterLink to="/" class="hover:text-brand-600">รองเท้า</RouterLink></li>
          <li><RouterLink to="/" class="hover:text-brand-600">กระเป๋า</RouterLink></li>
        </ul>
      </div>
      <div>
        <h4 class="mb-3 text-sm font-bold text-stone-800">สำหรับผู้ใช้งาน</h4>
        <ul class="space-y-2 text-sm text-stone-500">
          <li>
            <button v-if="!auth.isLoggedIn" class="hover:text-brand-600" @click="router.push({ name: 'register' })">สมัครสมาชิก</button>
            <button v-else-if="auth.isSeller" class="hover:text-brand-600" @click="router.push({ name: 'seller-dashboard' })">โหมดผู้ขาย</button>
            <button v-else class="hover:text-brand-600" @click="router.push({ name: 'orders' })">ประวัติการสั่งซื้อ</button>
          </li>
          <li>
            <button class="hover:text-brand-600" @click="router.push({ name: 'register', query: { role: 'seller' } })">เปิดร้านขายของ</button>
          </li>
        </ul>
      </div>
      <div>
        <h4 class="mb-3 text-sm font-bold text-stone-800">มหาวิทยาลัยพะเยา</h4>
        <p class="text-sm text-stone-500">รายวิชา 227202 พื้นฐานของระบบฐานข้อมูล</p>
        <p class="text-sm text-stone-500">กลุ่ม "ไม่ใส่กุ้ง"</p>
      </div>
    </div>
    <div class="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
      © 2569 UP Cloth Market — โครงงานกลุ่ม "ไม่ใส่กุ้ง" รายวิชา 227202
    </div>
  </footer>
</template>