// ============================================================================
// Router ทั้งหมดของแอป พร้อม guard ตรวจสิทธิ์:
// - requiresAuth  = ต้องล็อกอินก่อนเข้าหน้านั้น
// - role          = เฉพาะบทบาทที่ระบุ (buyer / seller) เท่านั้น
// - guestOnly     = หน้าล็อกอิน/สมัคร ยังไงก็ไม่อนุญาตตอนล็อกอินแล้ว
// ============================================================================

import { createRouter, createWebHistory } from 'vue-router'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/lib/toast'

/** true เมื่อโหลดหน้า (lazy chunk) ล้มเหลวล่าสุด — App.vue ใช้โชว์ปุ่มลองใหม่
 *  กันเคสหน้าขาวเปล่าโดยไม่มีอะไรบอก (เช่น เน็ตสะดุด หรือ AdBlock บล็อกไฟล์) */
export const routeLoadError = ref(false)

/** ตรวจว่าเป็น error จากการโหลด lazy chunk หรือไม่ (ดูจาก message มาตรฐานของ bundler) */
function isChunkLoadError(err) {
  const msg = String(err?.message || '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk [\w-]+ failed|Loading CSS chunk/i.test(msg)
}

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/products/:id',
    name: 'product-detail',
    component: () => import('../views/ProductDetailPage.vue'),
  },
  { path: '/login', name: 'login', component: () => import('../views/auth/LoginPage.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('../views/auth/RegisterPage.vue'), meta: { guestOnly: true } },

  // -------- buyer only --------
  { path: '/cart', name: 'cart', component: () => import('../views/buyer/CartPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/checkout', name: 'checkout', component: () => import('../views/buyer/CheckoutPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/orders', name: 'orders', component: () => import('../views/buyer/OrderHistoryPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/orders/:id', name: 'order-detail', component: () => import('../views/buyer/OrderDetailPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/chats', name: 'buyer-chats', component: () => import('../views/buyer/ChatListPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/chats/:id', name: 'buyer-chat-room', component: () => import('../views/buyer/ChatRoomPage.vue'), meta: { requiresAuth: true, role: ['buyer'] } },
  { path: '/notifications', name: 'notifications', component: () => import('../views/NotificationsPage.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfilePage.vue'), meta: { requiresAuth: true } },

  // -------- seller only --------
  {
    path: '/seller',
    component: () => import('../views/seller/SellerLayout.vue'),
    meta: { requiresAuth: true, role: ['seller'] },
    children: [
      { path: '', name: 'seller-dashboard', component: () => import('../views/seller/SellerDashboardPage.vue') },
      { path: 'products', name: 'seller-products', component: () => import('../views/seller/SellerProductsPage.vue') },
      { path: 'products/new', name: 'seller-product-new', component: () => import('../views/seller/SellerProductEditPage.vue') },
      { path: 'products/:id/edit', name: 'seller-product-edit', component: () => import('../views/seller/SellerProductEditPage.vue') },
      { path: 'orders', name: 'seller-orders', component: () => import('../views/seller/SellerOrdersPage.vue') },
      { path: 'chat', name: 'seller-chats', component: () => import('../views/seller/SellerChatListPage.vue') },
      { path: 'chat/:id', name: 'seller-chat-room', component: () => import('../views/seller/SellerChatRoomPage.vue') },
      { path: 'notifications', name: 'seller-notifications', component: () => import('../views/NotificationsPage.vue') },
      { path: 'profile', name: 'seller-profile', component: () => import('../views/ProfilePage.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.role && !to.meta.role.includes(auth.role)) {
    if (!auth.isLoggedIn) return { name: 'login', query: { redirect: to.fullPath } }
    return auth.isSeller ? { name: 'seller-dashboard' } : { name: 'home' }
  }

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return auth.role === 'seller' ? { name: 'seller-dashboard' } : { name: 'home' }
  }

  return true
})

router.onError((err) => {
  if (isChunkLoadError(err)) {
    routeLoadError.value = true
    toast('โหลดหน้าไม่สำเร็จ กรุณากด “โหลดใหม่” (ถ้าใช้ AdBlock ลองปิดแล้วลองอีกครั้ง)', 'error')
  }
})

// นำทางสำเร็จให้ล้างสถานะ error (กัน overlay ค้างหลังกดย้อนกลับ/ไปหน้าอื่น)
router.afterEach(() => {
  routeLoadError.value = false
})

export default router