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

const auth = useAuthStore()
auth.init().finally(() => {
  app.mount('#app')
})