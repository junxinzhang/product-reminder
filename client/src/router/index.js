import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false 
    }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { 
          title: '仪表盘',
          icon: 'DataBoard'
        }
      },
      {
        path: '/products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { 
          title: '产品管理',
          icon: 'Box'
        }
      },
      {
        path: '/notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { 
          title: '通知管理',
          icon: 'Bell'
        }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { 
          title: '系统设置',
          icon: 'Setting'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 产品到期提醒系统` : '产品到期提醒系统'
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router