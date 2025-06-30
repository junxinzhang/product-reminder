import moment from 'moment'

// 设置moment为中文
moment.locale('zh-cn')

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  return moment(date).format(format)
}

// 格式化日期时间
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return moment(date).format(format)
}

// 计算相对时间
export function fromNow(date) {
  if (!date) return ''
  return moment(date).fromNow()
}

// 计算距离天数
export function daysDiff(date) {
  if (!date) return 0
  return moment(date).diff(moment(), 'days')
}

// 格式化价格
export function formatPrice(price) {
  if (!price && price !== 0) return ''
  return `¥${parseFloat(price).toFixed(2)}`
}

// 获取产品状态
export function getProductStatus(product) {
  const daysUntilExpiry = daysDiff(product.expiry_date)
  const reminderDays = product.reminder_days || 7
  
  if (product.status !== 'active') {
    return {
      status: 'inactive',
      label: '已停用',
      type: 'info'
    }
  }
  
  if (daysUntilExpiry < 0) {
    return {
      status: 'expired',
      label: `已过期${Math.abs(daysUntilExpiry)}天`,
      type: 'danger'
    }
  } else if (daysUntilExpiry === 0) {
    return {
      status: 'expiring',
      label: '今天到期',
      type: 'warning'
    }
  } else if (daysUntilExpiry <= reminderDays) {
    return {
      status: 'expiring',
      label: `${daysUntilExpiry}天后到期`,
      type: 'warning'
    }
  } else {
    return {
      status: 'active',
      label: `${daysUntilExpiry}天后到期`,
      type: 'success'
    }
  }
}

// 获取通知状态
export function getNotificationStatus(status) {
  const statusMap = {
    pending: { label: '待发送', type: 'warning' },
    sent: { label: '已发送', type: 'success' },
    failed: { label: '发送失败', type: 'danger' }
  }
  
  return statusMap[status] || { label: '未知', type: 'info' }
}

// 获取通知类型
export function getNotificationType(type) {
  const typeMap = {
    auto: { label: '自动提醒', type: 'primary' },
    manual: { label: '手动发送', type: 'success' },
    expired: { label: '过期提醒', type: 'danger' },
    test: { label: '测试通知', type: 'info' }
  }
  
  return typeMap[type] || { label: '未知', type: 'info' }
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, wait) {
  let timeout
  return function executedFunction(...args) {
    if (!timeout) {
      func(...args)
      timeout = setTimeout(() => {
        timeout = null
      }, wait)
    }
  }
}

// 深拷贝
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 生成随机ID
export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 颜色工具
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 验证工具
export const validators = {
  email: (value) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value)
  },
  
  phone: (value) => {
    const pattern = /^1[3-9]\d{9}$/
    return pattern.test(value)
  },
  
  required: (value) => {
    return value !== null && value !== undefined && value !== ''
  },
  
  minLength: (value, min) => {
    return value && value.length >= min
  },
  
  maxLength: (value, max) => {
    return !value || value.length <= max
  }
}