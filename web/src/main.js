// จุดเริ่มต้นของแอป: สร้าง Vue app + ติดตั้ง Pinia/Router
// รอให้ auth store โหลด session เสร็จก่อน จึง mount UI (กันหน้าจอสลับตอน reload)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router, { routeLoadError, routeLoadErrorMessage } from './router'
import { useAuthStore } from './stores/auth'
import { toast } from './lib/toast'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// กับ error ที่เกิดตอน render โดยไม่ตั้งใจ: โชว์จอกู้คืนพร้อมปุ่มโหลดใหม่
// แทนการปล่อยจอขาวเปล่า (สาเหตุยัง log ไว้ใน console ให้ dev ดูต่อ)
app.config.errorHandler = (err, _instance, info) => {
  console.error('[uncaught]', info, err)
  routeLoadErrorMessage.value = 'เกิดข้อผิดพลาดตอนแสดงหน้านี้ ลองโหลดใหม่อีกครั้ง หากยังเป็นอยู่ให้แจ้งผู้ดูแลระบบ'
  routeLoadError.value = true
  toast('เกิดข้อผิดพลาด กรุณากด “โหลดใหม่”', 'error')
}

const auth = useAuthStore()
// ถ้าติดต่อ Supabase ครั้งแรกหลุด (offline/รอ retry) ให้ mount ต่อไปแบบหน้าว่าง
auth.init().catch(() => {}).finally(() => {
  app.mount('#app')
})