<template>
  <div class="notifications">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="testNotification" :loading="testing">
          <el-icon><Bell /></el-icon>
          测试通知
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <div class="toolbar-right">
        <el-select
          v-model="filterType"
          placeholder="通知类型"
          clearable
          style="width: 150px; margin-right: 16px;"
          @change="handleFilter"
        >
          <el-option label="自动提醒" value="auto" />
          <el-option label="手动发送" value="manual" />
          <el-option label="过期提醒" value="expired" />
          <el-option label="测试通知" value="test" />
        </el-select>
        
        <el-select
          v-model="filterStatus"
          placeholder="发送状态"
          clearable
          style="width: 120px;"
          @change="handleFilter"
        >
          <el-option label="待发送" value="pending" />
          <el-option label="已发送" value="sent" />
          <el-option label="发送失败" value="failed" />
        </el-select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card">
          <el-icon class="stats-icon" size="24" color="#409EFF">
            <Message />
          </el-icon>
          <div class="stats-number">{{ stats.total }}</div>
          <div class="stats-label">总通知数</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card success">
          <el-icon class="stats-icon" size="24" color="#67C23A">
            <CircleCheckFilled />
          </el-icon>
          <div class="stats-number">{{ stats.sent }}</div>
          <div class="stats-label">发送成功</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card warning">
          <el-icon class="stats-icon" size="24" color="#E6A23C">
            <Clock />
          </el-icon>
          <div class="stats-number">{{ stats.pending }}</div>
          <div class="stats-label">待发送</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card danger">
          <el-icon class="stats-icon" size="24" color="#F56C6C">
            <CircleCloseFilled />
          </el-icon>
          <div class="stats-number">{{ stats.failed }}</div>
          <div class="stats-label">发送失败</div>
        </div>
      </el-col>
    </el-row>

    <!-- 通知列表 -->
    <div class="card">
      <div class="card-header">
        <h3>通知记录</h3>
        <div class="header-actions">
          <el-button
            type="danger"
            size="small"
            @click="clearOldNotifications"
            :loading="clearing"
          >
            清理旧记录
          </el-button>
        </div>
      </div>
      
      <el-table
        :data="filteredNotifications"
        :loading="loading"
        style="width: 100%"
        empty-text="暂无通知记录"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="product_name" label="产品名称" min-width="150" />
        
        <el-table-column label="通知类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getNotificationType(row.type).type" size="small">
              {{ getNotificationType(row.type).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="message" label="通知内容" min-width="300">
          <template #default="{ row }">
            <div class="message-cell">
              <div class="message-preview">{{ getMessagePreview(row.message) }}</div>
              <el-button
                v-if="row.message.length > 50"
                type="text"
                size="small"
                @click="showFullMessage(row)"
              >
                查看完整内容
              </el-button>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="发送状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getNotificationStatus(row.status).type" size="small">
              {{ getNotificationStatus(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="created_at" label="创建时间" width="180" sortable>
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ formatDateTime(row.created_at) }}</div>
              <div class="time-ago">{{ fromNow(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="sent_at" label="发送时间" width="180" sortable>
          <template #default="{ row }">
            <div v-if="row.sent_at" class="time-cell">
              <div>{{ formatDateTime(row.sent_at) }}</div>
              <div class="time-ago">{{ fromNow(row.sent_at) }}</div>
            </div>
            <span v-else class="text-muted">未发送</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'failed'"
              type="primary"
              size="small"
              @click="resendNotification(row)"
              :loading="resending[row.id]"
            >
              重发
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteNotification(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 通知详情对话框 -->
    <el-dialog
      v-model="showMessageDialog"
      title="通知详情"
      width="600px"
    >
      <div class="message-detail">
        <div class="detail-item">
          <label>产品名称：</label>
          <span>{{ selectedNotification?.product_name }}</span>
        </div>
        <div class="detail-item">
          <label>通知类型：</label>
          <el-tag :type="getNotificationType(selectedNotification?.type).type" size="small">
            {{ getNotificationType(selectedNotification?.type).label }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>发送状态：</label>
          <el-tag :type="getNotificationStatus(selectedNotification?.status).type" size="small">
            {{ getNotificationStatus(selectedNotification?.status).label }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>通知内容：</label>
        </div>
        <div class="message-content">
          {{ selectedNotification?.message }}
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showMessageDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import {
  formatDateTime,
  fromNow,
  getNotificationStatus,
  getNotificationType
} from '@/utils/helpers'
import {
  Bell,
  Refresh,
  Message,
  CircleCheckFilled,
  Clock,
  CircleCloseFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const testing = ref(false)
const clearing = ref(false)
const notifications = ref([])
const selectedNotification = ref(null)
const showMessageDialog = ref(false)
const resending = ref({})

// 过滤器
const filterType = ref('')
const filterStatus = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 统计数据
const stats = reactive({
  total: 0,
  sent: 0,
  pending: 0,
  failed: 0
})

// 计算属性
const filteredNotifications = computed(() => {
  let result = [...notifications.value]
  
  // 类型过滤
  if (filterType.value) {
    result = result.filter(notification => notification.type === filterType.value)
  }
  
  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(notification => notification.status === filterStatus.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 监听过滤结果的长度变化
watch(() => {
  let result = [...notifications.value]
  
  if (filterType.value) {
    result = result.filter(notification => notification.type === filterType.value)
  }
  
  if (filterStatus.value) {
    result = result.filter(notification => notification.status === filterStatus.value)
  }
  
  return result.length
}, (newTotal) => {
  total.value = newTotal
})

// 方法
const loadNotifications = async () => {
  try {
    loading.value = true
    const response = await api.get('/notifications')
    notifications.value = response.data
    
    // 更新统计数据
    stats.total = notifications.value.length
    stats.sent = notifications.value.filter(n => n.status === 'sent').length
    stats.pending = notifications.value.filter(n => n.status === 'pending').length
    stats.failed = notifications.value.filter(n => n.status === 'failed').length
    
  } catch (error) {
    console.error('加载通知记录失败:', error)
    ElMessage.error('加载通知记录失败')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadNotifications()
  ElMessage.success('数据已刷新')
}

const testNotification = async () => {
  try {
    testing.value = true
    const response = await api.post('/notifications/wechat/test')
    
    if (response.data.success) {
      ElMessage.success('测试通知发送成功')
      await loadNotifications()
    } else {
      ElMessage.error(response.data.message || '测试通知发送失败')
    }
  } catch (error) {
    console.error('测试通知失败:', error)
    ElMessage.error('测试通知失败')
  } finally {
    testing.value = false
  }
}

const clearOldNotifications = () => {
  ElMessageBox.confirm(
    '确定要清理30天前的通知记录吗？此操作不可撤销。',
    '确认清理',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      clearing.value = true
      // 这里应该调用后端清理API
      // await api.delete('/notifications/cleanup')
      
      // 模拟清理操作
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      notifications.value = notifications.value.filter(
        n => new Date(n.created_at) > thirtyDaysAgo
      )
      
      ElMessage.success('清理完成')
      await loadNotifications()
    } catch (error) {
      console.error('清理失败:', error)
      ElMessage.error('清理失败')
    } finally {
      clearing.value = false
    }
  }).catch(() => {})
}

const resendNotification = async (notification) => {
  try {
    resending.value[notification.id] = true
    
    // 这里应该调用重发API
    // const response = await api.post(`/notifications/resend/${notification.id}`)
    
    // 模拟重发
    notification.status = 'sent'
    notification.sent_at = new Date()
    
    ElMessage.success('通知重发成功')
    await loadNotifications()
  } catch (error) {
    console.error('重发通知失败:', error)
    ElMessage.error('重发通知失败')
  } finally {
    resending.value[notification.id] = false
  }
}

const deleteNotification = (notification) => {
  ElMessageBox.confirm(
    '确定要删除这条通知记录吗？',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 这里应该调用删除API
      // await api.delete(`/notifications/${notification.id}`)
      
      // 模拟删除
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
      
      ElMessage.success('删除成功')
      await loadNotifications()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const showFullMessage = (notification) => {
  selectedNotification.value = notification
  showMessageDialog.value = true
}

const getMessagePreview = (message) => {
  if (!message) return ''
  return message.length > 50 ? message.substring(0, 50) + '...' : message
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSortChange = ({ column, prop, order }) => {
  if (!order) return
  
  notifications.value.sort((a, b) => {
    let aVal = a[prop]
    let bVal = b[prop]
    
    if (prop === 'created_at' || prop === 'sent_at') {
      aVal = new Date(aVal || 0).getTime()
      bVal = new Date(bVal || 0).getTime()
    }
    
    if (order === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications {
  max-width: 1400px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.stats-row {
  margin-bottom: 24px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stats-card.success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-card.danger {
  background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
}

.stats-icon {
  margin-bottom: 12px;
}

.stats-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.card {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.message-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-preview {
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-ago {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.text-muted {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.message-detail {
  padding: 16px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
}

.detail-item label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 80px;
}

.message-content {
  background: var(--el-fill-color-lighter);
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
  
  .toolbar-right {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .toolbar-right .el-select {
    width: 100% !important;
    max-width: none !important;
  }
  
  .stats-card {
    padding: 16px;
  }
  
  .stats-number {
    font-size: 24px;
  }
}
</style>