import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  // 登录
  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token: newToken, user: userData } = response.data
      
      token.value = newToken
      user.value = userData
      
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // 设置API默认headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || '登录失败'
      }
    }
  }

  // 注册
  async function register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      const { token: newToken, user: newUser } = response.data
      
      token.value = newToken
      user.value = newUser
      
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      // 设置API默认headers
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.error || '注册失败'
      }
    }
  }

  // 登出
  function logout() {
    token.value = null
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // 清除API默认headers
    delete api.defaults.headers.common['Authorization']
  }

  // 初始化认证状态
  function initAuth() {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    initAuth
  }
})