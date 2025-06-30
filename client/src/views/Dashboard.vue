<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card">
          <el-icon class="stats-icon" size="32" color="#409EFF">
            <Box />
          </el-icon>
          <div class="stats-number">{{ stats.total }}</div>
          <div class="stats-label">总产品数</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card warning">
          <el-icon class="stats-icon" size="32" color="#E6A23C">
            <WarningFilled />
          </el-icon>
          <div class="stats-number">{{ stats.expiring_soon }}</div>
          <div class="stats-label">即将到期</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card danger">
          <el-icon class="stats-icon" size="32" color="#F56C6C">
            <CircleCloseFilled />
          </el-icon>
          <div class="stats-number">{{ stats.expired }}</div>
          <div class="stats-label">已过期</div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <div class="stats-card success">
          <el-icon class="stats-icon" size="32" color="#67C23A">
            <CircleCheckFilled />
          </el-icon>
          <div class="stats-number">{{ stats.active }}</div>
          <div class="stats-label">正常状态</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="card">
          <div class="card-header">
            <h3>产品到期趋势</h3>
          </div>
          <div class="chart-container">
            <v-chart
              :option="trendChartOption"
              :autoresize="true"
              style="height: 300px;"
            />
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
        <div class="card">
          <div class="card-header">
            <h3>产品分类分布</h3>
          </div>
          <div class="chart-container">
            <v-chart
              :option="pieChartOption"
              :autoresize="true"
              style="height: 300px;"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 即将到期产品列表 -->
    <div class="card">
      <div class="card-header">
        <h3>即将到期产品</h3>
        <el-button type="primary" size="small" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      
      <el-table
        :data="expiringProducts"
        :loading="loading"
        style="width: 100%"
        empty-text="暂无即将到期的产品"
      >
        <el-table-column prop="name" label="产品名称" min-width="150">
          <template #default="{ row }">
            <div class="product-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.category" size="small" type="info">
                {{ row.category }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="expiry_date" label="到期日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expiry_date) }}
          </template>
        </el-table-column>
        
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <span :class="getDaysClass(row.daysUntilExpiry)">
              {{ row.daysUntilExpiry }}天
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getProductStatus(row).type" 
              size="small"
            >
              {{ getProductStatus(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="supplier" label="供应商" width="120" />
        
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="sendNotification(row.id)"
              :loading="sendingNotification[row.id]"
            >
              发送通知
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="viewProduct(row.id)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 最近通知 -->
    <div class="card">
      <div class="card-header">
        <h3>最近通知</h3>
        <el-button type="text" size="small" @click="viewAllNotifications">
          查看全部
        </el-button>
      </div>
      
      <div class="notification-list">
        <div
          v-for="notification in recentNotifications"
          :key="notification.id"
          class="notification-item"
        >
          <div class="notification-content">
            <div class="notification-title">
              <el-tag :type="getNotificationType(notification.type).type" size="small">
                {{ getNotificationType(notification.type).label }}
              </el-tag>
              <span class="product-name">{{ notification.product_name }}</span>
            </div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ fromNow(notification.created_at) }}</div>
          </div>
          <div class="notification-status">
            <el-tag :type="getNotificationStatus(notification.status).type" size="small">
              {{ getNotificationStatus(notification.status).label }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import api from '@/utils/api'
import {
  formatDate,
  fromNow,
  getProductStatus,
  getNotificationStatus,
  getNotificationType
} from '@/utils/helpers'
import {
  Box,
  WarningFilled,
  CircleCloseFilled,
  CircleCheckFilled,
  Refresh
} from '@element-plus/icons-vue'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()

// 响应式数据
const loading = ref(false)
const stats = reactive({
  total: 0,
  expired: 0,
  expiring_soon: 0,
  active: 0
})
const expiringProducts = ref([])
const recentNotifications = ref([])
const sendingNotification = ref({})

// 图表配置
const trendChartOption = ref({
  title: {
    text: '未来30天到期产品数量',
    left: 'center',
    textStyle: {
      fontSize: 14,
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '到期产品',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'rgba(64, 158, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(64, 158, 255, 0.1)'
            }
          ]
        }
      }
    }
  ]
})

const pieChartOption = ref({
  title: {
    text: '产品类别占比',
    left: 'center',
    textStyle: {
      fontSize: 14,
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    top: 'middle'
  },
  series: [
    {
      name: '产品类别',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '18',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: []
    }
  ]
})

// 方法
const loadStats = async () => {
  try {
    const response = await api.get('/products/stats/overview')
    Object.assign(stats, response.data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadExpiringProducts = async () => {
  try {
    loading.value = true
    const response = await api.get('/products', {
      params: { status: 'active' }
    })
    
    // 过滤即将到期的产品
    expiringProducts.value = response.data
      .filter(product => product.isExpiringSoon || product.isExpired)
      .slice(0, 10) // 只显示前10个
      
  } catch (error) {
    console.error('加载即将到期产品失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadRecentNotifications = async () => {
  try {
    const response = await api.get('/notifications')
    recentNotifications.value = response.data.slice(0, 5) // 只显示最近5条
  } catch (error) {
    console.error('加载最近通知失败:', error)
  }
}

const loadChartData = async () => {
  try {
    // 加载趋势图数据
    const trendResponse = await api.get('/products')
    const products = trendResponse.data
    
    // 计算未来30天的到期数据
    const dates = []
    const counts = []
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dates.push(dateStr.substring(5)) // 只显示月-日
      
      const count = products.filter(p => p.expiry_date === dateStr).length
      counts.push(count)
    }
    
    trendChartOption.value.xAxis.data = dates
    trendChartOption.value.series[0].data = counts
    
    // 加载饼图数据
    const categoryStats = {}
    products.forEach(product => {
      const category = product.category || '未分类'
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })
    
    const pieData = Object.entries(categoryStats).map(([name, value]) => ({
      name,
      value
    }))
    
    pieChartOption.value.series[0].data = pieData
    
  } catch (error) {
    console.error('加载图表数据失败:', error)
  }
}

const sendNotification = async (productId) => {
  try {
    sendingNotification.value[productId] = true
    
    const response = await api.post(`/notifications/send/${productId}`)
    
    if (response.data.success) {
      ElMessage.success('通知发送成功')
      await loadRecentNotifications()
    } else {
      ElMessage.error(response.data.message || '通知发送失败')
    }
  } catch (error) {
    console.error('发送通知失败:', error)
    ElMessage.error('通知发送失败')
  } finally {
    sendingNotification.value[productId] = false
  }
}

const viewProduct = (productId) => {
  router.push(`/products?id=${productId}`)
}

const viewAllNotifications = () => {
  router.push('/notifications')
}

const refreshData = async () => {
  await Promise.all([
    loadStats(),
    loadExpiringProducts(),
    loadRecentNotifications(),
    loadChartData()
  ])
  ElMessage.success('数据已刷新')
}

const getDaysClass = (days) => {
  if (days < 0) return 'text-danger'
  if (days <= 3) return 'text-warning'
  return 'text-success'
}

// 生命周期
onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-row {
  margin-bottom: 24px;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stats-card.warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-card.danger {
  background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
}

.stats-card.success {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon {
  margin-bottom: 12px;
}

.stats-number {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.chart-row {
  margin-bottom: 24px;
}

.card {
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--el-border-color-light);
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

.chart-container {
  width: 100%;
  height: 300px;
}

.product-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-content {
  flex: 1;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification-title .product-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-message {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-status {
  margin-left: 16px;
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-warning {
  color: var(--el-color-warning);
  font-weight: 600;
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-card {
    padding: 16px;
  }
  
  .stats-number {
    font-size: 28px;
  }
  
  .card {
    padding: 16px;
  }
  
  .chart-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .stats-number {
    font-size: 24px;
  }
  
  .notification-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .notification-status {
    margin-left: 0;
    align-self: flex-start;
  }
}
</style>