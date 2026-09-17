// จุดเริ่มต้นของแอป: สร้าง Vue app + ติดตั้ง Pinia/Router
// รอให้ auth store โหลด session เสร็จก่อน จึง mount UI (กันหน้าจอสลับตอน reload)
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// กับ error ที่เกิดตอน render โดยไม่ตั้งใจ: log ขึ้นคอนโซลไว้ดูแทนที่จะเงียบๆ
app.config.errorHandler = (err, _instance, info) => {
  console.error('[uncaught]', info, err)
}

const auth = useAuthStore()
// ถ้าติดต่อ Supabase ครั้งแรกหลุด (offline/รอ retry) ให้ mount ต่อไปแบบหน้าว่าง
auth.init().catch(() => {}).finally(() => {
  app.mount('#app')
})