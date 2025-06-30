import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示加载状态
    if (config.showLoading !== false) {
      // 可以在这里添加全局loading
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 隐藏加载状态
    
    return response
  },
  (error) => {
    // 隐藏加载状态
    
    const { response } = error
    
    if (!response) {
      ElMessage.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }
    
    const { status, data } = response
    
    switch (status) {
      case 401: {
        // 未授权，清除token并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
        
        if (router.currentRoute.value.path !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          router.push('/login')
        }
        break
      }
        
      case 403:
        ElMessage.error('没有权限访问此资源')
        break
        
      case 404:
        ElMessage.error('请求的资源不存在')
        break
        
      case 500:
        ElMessage.error('服务器内部错误')
        break
        
      default: {
        const message = data?.error || data?.message || '请求失败'
        ElMessage.error(message)
        break
      }
    }
    
    return Promise.reject(error)
  }
)

export default api