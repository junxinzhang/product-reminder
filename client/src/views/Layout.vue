<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="sidebarWidth" class="sidebar">
      <div class="sidebar-header">
        <div class="logo" :class="{ collapsed: isCollapsed }">
          <el-icon size="32" color="#409EFF">
            <Bell />
          </el-icon>
          <span v-show="!isCollapsed" class="logo-text">产品提醒</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        background-color="var(--el-bg-color)"
        text-color="var(--el-text-color-primary)"
        active-text-color="var(--el-color-primary)"
        @select="handleMenuSelect"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapsed ? Expand : Fold"
            @click="toggleSidebar"
            circle
            size="small"
          />
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 主题切换 -->
          <el-button
            :icon="isDark ? Sunny : Moon"
            @click="toggleTheme"
            circle
            size="small"
          />
          
          <!-- 通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button
              :icon="Bell"
              @click="showNotifications"
              circle
              size="small"
            />
          </el-badge>

          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span class="username">{{ user?.username }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawer"
      title="通知中心"
      direction="rtl"
      size="400px"
    >
      <div class="notification-list">
        <div v-if="notifications.length === 0" class="empty-notifications">
          <el-empty description="暂无通知" />
        </div>
        
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatDateTime(notification.created_at) }}</div>
          </div>
          <el-button
            v-if="!notification.read"
            size="small"
            type="primary"
            text
            @click="markAsRead(notification.id)"
          >
            标记已读
          </el-button>
        </div>
      </div>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/helpers'
import {
  Bell,
  User,
  Setting,
  SwitchButton,
  Expand,
  Fold,
  Sunny,
  Moon,
  DataBoard,
  Box
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const isCollapsed = ref(false)
const isDark = ref(false)
const notificationDrawer = ref(false)
const notifications = ref([])
const unreadCount = ref(0)

// 计算属性
const sidebarWidth = computed(() => isCollapsed.value ? '64px' : '200px')
const user = computed(() => authStore.user)
const userAvatar = computed(() => null) // 可以后续添加头像功能

const activeMenu = computed(() => route.path)

const currentPageTitle = computed(() => {
  const currentRoute = menuItems.find(item => item.path === route.path)
  return currentRoute?.title || '未知页面'
})

// 菜单项
const menuItems = [
  {
    path: '/dashboard',
    title: '仪表盘',
    icon: 'DataBoard'
  },
  {
    path: '/products',
    title: '产品管理',
    icon: 'Box'
  },
  {
    path: '/notifications',
    title: '通知管理',
    icon: 'Bell'
  },
  {
    path: '/settings',
    title: '系统设置',
    icon: 'Setting'
  }
]

// 方法
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebarCollapsed', isCollapsed.value)
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

const handleMenuSelect = (path) => {
  router.push(path)
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人资料功能开发中')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      }).catch(() => {})
      break
  }
}

const showNotifications = () => {
  notificationDrawer.value = true
  loadNotifications()
}

const loadNotifications = async () => {
  try {
    // 这里应该调用API获取通知
    // const response = await api.get('/notifications')
    // notifications.value = response.data
    
    // 模拟通知数据
    notifications.value = [
      {
        id: 1,
        title: '产品到期提醒',
        message: '您的产品"测试产品1"将在3天后到期',
        created_at: new Date(),
        read: false
      },
      {
        id: 2,
        title: '系统通知',
        message: '企业微信配置已更新',
        created_at: new Date(Date.now() - 1000 * 60 * 60),
        read: true
      }
    ]
    
    unreadCount.value = notifications.value.filter(n => !n.read).length
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

const markAsRead = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.read = true
    unreadCount.value = notifications.value.filter(n => !n.read).length
  }
}

// 初始化
onMounted(() => {
  // 恢复侧边栏状态
  const savedCollapsed = localStorage.getItem('sidebarCollapsed')
  if (savedCollapsed !== null) {
    isCollapsed.value = JSON.parse(savedCollapsed)
  }

  // 恢复主题状态
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  document.documentElement.classList.toggle('dark', isDark.value)

  // 初始化认证状态
  authStore.initAuth()
  
  // 加载通知
  loadNotifications()
})

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 移动端自动收起侧边栏
    if (window.innerWidth <= 768) {
      isCollapsed.value = true
    }
  }
)
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s ease;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--el-border-color-light);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  transition: all 0.3s ease;
}

.logo.collapsed {
  justify-content: center;
  padding: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.header {
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.breadcrumb {
  margin-left: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.notification-badge {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: var(--el-fill-color-light);
}

.username {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.main-content {
  background-color: var(--el-bg-color-page);
  overflow-y: auto;
  padding: 24px;
}

.notification-list {
  height: 100%;
}

.empty-notifications {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: var(--el-fill-color-light);
}

.notification-item.unread {
  border-left: 3px solid var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 16px;
  }
  
  .breadcrumb {
    display: none;
  }
  
  .username {
    display: none;
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>