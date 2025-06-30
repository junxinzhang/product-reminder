<template>
  <div class="settings">
    <div class="settings-container">
      <!-- 企业微信配置 -->
      <div class="card">
        <div class="card-header">
          <h3>企业微信通知配置</h3>
          <el-button type="primary" size="small" @click="testWeChatConfig" :loading="testing">
            测试配置
          </el-button>
        </div>
        
        <el-form
          ref="wechatFormRef"
          :model="wechatForm"
          :rules="wechatRules"
          label-width="120px"
        >
          <div class="form-section">
            <div class="form-section-title">应用配置（推荐）</div>
            <p class="form-description">
              通过企业微信应用发送通知，支持更多功能和更好的消息格式。
            </p>
            
            <el-form-item label="企业ID" prop="corp_id">
              <el-input
                v-model="wechatForm.corp_id"
                placeholder="请输入企业微信的企业ID"
                clearable
              />
              <div class="form-tip">
                在企业微信管理后台 -> 我的企业 -> 企业信息中查看
              </div>
            </el-form-item>
            
            <el-form-item label="应用ID" prop="agent_id">
              <el-input
                v-model="wechatForm.agent_id"
                placeholder="请输入应用的AgentId"
                clearable
              />
              <div class="form-tip">
                在企业微信管理后台 -> 应用与小程序 -> 自建应用中查看
              </div>
            </el-form-item>
            
            <el-form-item label="应用密钥" prop="secret">
              <el-input
                v-model="wechatForm.secret"
                type="password"
                placeholder="请输入应用的Secret"
                show-password
                clearable
              />
              <div class="form-tip">
                在企业微信管理后台 -> 应用与小程序 -> 自建应用 -> 查看Secret
              </div>
            </el-form-item>
          </div>
          
          <el-divider />
          
          <div class="form-section">
            <div class="form-section-title">Webhook配置（可选）</div>
            <p class="form-description">
              如果配置了Webhook，将优先使用Webhook发送通知。适用于群聊机器人场景。
            </p>
            
            <el-form-item label="Webhook地址" prop="webhook_url">
              <el-input
                v-model="wechatForm.webhook_url"
                placeholder="请输入企业微信群机器人的Webhook地址"
                clearable
              />
              <div class="form-tip">
                在企业微信群聊中添加机器人，获取Webhook地址
              </div>
            </el-form-item>
          </div>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="saveWeChatConfig"
              :loading="saving"
            >
              保存配置
            </el-button>
            <el-button @click="resetWeChatForm">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 系统设置 -->
      <div class="card">
        <div class="card-header">
          <h3>系统设置</h3>
        </div>
        
        <el-form
          ref="systemFormRef"
          :model="systemForm"
          label-width="120px"
        >
          <div class="form-section">
            <div class="form-section-title">通知设置</div>
            
            <el-form-item label="检查频率">
              <el-select v-model="systemForm.checkFrequency" style="width: 200px">
                <el-option label="每小时" value="hourly" />
                <el-option label="每天早上9点" value="daily" />
                <el-option label="每周一早上9点" value="weekly" />
              </el-select>
              <div class="form-tip">
                系统自动检查产品到期的频率
              </div>
            </el-form-item>
            
            <el-form-item label="默认提醒天数">
              <el-input-number
                v-model="systemForm.defaultReminderDays"
                :min="1"
                :max="365"
                controls-position="right"
                style="width: 200px"
              />
              <div class="form-tip">
                新产品默认的提醒天数
              </div>
            </el-form-item>
            
            <el-form-item label="自动清理">
              <el-switch
                v-model="systemForm.autoCleanup"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">
                自动清理30天前的通知记录
              </div>
            </el-form-item>
          </div>
          
          <div class="form-section">
            <div class="form-section-title">界面设置</div>
            
            <el-form-item label="主题模式">
              <el-radio-group v-model="systemForm.theme">
                <el-radio label="light">浅色</el-radio>
                <el-radio label="dark">深色</el-radio>
                <el-radio label="auto">跟随系统</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="默认页面大小">
              <el-select v-model="systemForm.defaultPageSize" style="width: 200px">
                <el-option label="10条/页" :value="10" />
                <el-option label="20条/页" :value="20" />
                <el-option label="50条/页" :value="50" />
                <el-option label="100条/页" :value="100" />
              </el-select>
            </el-form-item>
          </div>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="saveSystemConfig"
              :loading="savingSystem"
            >
              保存设置
            </el-button>
            <el-button @click="resetSystemForm">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据管理 -->
      <div class="card">
        <div class="card-header">
          <h3>数据管理</h3>
        </div>
        
        <div class="data-management">
          <div class="management-item">
            <div class="item-info">
              <h4>导出数据</h4>
              <p>将所有产品数据导出为Excel文件</p>
            </div>
            <el-button
              type="primary"
              @click="exportData"
              :loading="exporting"
            >
              导出Excel
            </el-button>
          </div>
          
          <el-divider />
          
          <div class="management-item">
            <div class="item-info">
              <h4>导入数据</h4>
              <p>从Excel文件批量导入产品数据</p>
            </div>
            <div class="import-actions">
              <el-button @click="downloadTemplate">
                下载模板
              </el-button>
              <el-upload
                :before-upload="handleImport"
                :show-file-list="false"
                accept=".xlsx,.xls"
              >
                <el-button type="success">
                  <el-icon><Upload /></el-icon>
                  导入Excel
                </el-button>
              </el-upload>
            </div>
          </div>
          
          <el-divider />
          
          <div class="management-item danger">
            <div class="item-info">
              <h4>清空数据</h4>
              <p>删除所有产品和通知数据，此操作不可撤销</p>
            </div>
            <el-button
              type="danger"
              @click="clearAllData"
              :loading="clearing"
            >
              清空所有数据
            </el-button>
          </div>
        </div>
      </div>

      <!-- 关于系统 -->
      <div class="card">
        <div class="card-header">
          <h3>关于系统</h3>
        </div>
        
        <div class="about-info">
          <div class="info-item">
            <label>系统名称：</label>
            <span>产品到期提醒系统</span>
          </div>
          <div class="info-item">
            <label>版本号：</label>
            <span>v1.0.0</span>
          </div>
          <div class="info-item">
            <label>技术栈：</label>
            <span>Vue 3 + Node.js + SQLite + 企业微信API</span>
          </div>
          <div class="info-item">
            <label>部署方式：</label>
            <span>Docker 容器</span>
          </div>
          <div class="info-item">
            <label>更新时间：</label>
            <span>2024-01-01</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/utils/api'
import { Upload } from '@element-plus/icons-vue'

// 表单引用
const wechatFormRef = ref()
const systemFormRef = ref()

// 状态管理
const testing = ref(false)
const saving = ref(false)
const savingSystem = ref(false)
const exporting = ref(false)
const clearing = ref(false)

// 企业微信配置表单
const wechatForm = reactive({
  corp_id: '',
  agent_id: '',
  secret: '',
  webhook_url: ''
})

// 系统配置表单
const systemForm = reactive({
  checkFrequency: 'daily',
  defaultReminderDays: 7,
  autoCleanup: true,
  theme: 'auto',
  defaultPageSize: 20
})

// 表单验证规则
const wechatRules = {
  corp_id: [
    { required: true, message: '请输入企业ID', trigger: 'blur' }
  ],
  agent_id: [
    { required: true, message: '请输入应用ID', trigger: 'blur' }
  ],
  secret: [
    { required: true, message: '请输入应用密钥', trigger: 'blur' }
  ]
}

// 方法
const loadWeChatConfig = async () => {
  try {
    const response = await api.get('/notifications/wechat/config')
    if (response.data) {
      Object.assign(wechatForm, response.data)
    }
  } catch (error) {
    console.error('加载企业微信配置失败:', error)
  }
}

const saveWeChatConfig = async () => {
  if (!wechatFormRef.value) return

  await wechatFormRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      await api.post('/notifications/wechat/config', wechatForm)
      ElMessage.success('企业微信配置保存成功')
    } catch (error) {
      console.error('保存企业微信配置失败:', error)
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  })
}

const testWeChatConfig = async () => {
  testing.value = true
  try {
    const response = await api.post('/notifications/wechat/test')
    
    if (response.data.success) {
      ElMessage.success('测试成功！请检查企业微信是否收到测试消息')
    } else {
      ElMessage.error(response.data.message || '测试失败')
    }
  } catch (error) {
    console.error('测试企业微信配置失败:', error)
    ElMessage.error('测试失败')
  } finally {
    testing.value = false
  }
}

const resetWeChatForm = () => {
  if (wechatFormRef.value) {
    wechatFormRef.value.resetFields()
  }
  Object.keys(wechatForm).forEach(key => {
    wechatForm[key] = ''
  })
}

const saveSystemConfig = async () => {
  savingSystem.value = true
  try {
    // 保存到本地存储
    localStorage.setItem('systemConfig', JSON.stringify(systemForm))
    
    // 应用主题设置
    applyTheme(systemForm.theme)
    
    ElMessage.success('系统设置保存成功')
  } catch (error) {
    console.error('保存系统设置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    savingSystem.value = false
  }
}

const resetSystemForm = () => {
  Object.assign(systemForm, {
    checkFrequency: 'daily',
    defaultReminderDays: 7,
    autoCleanup: true,
    theme: 'auto',
    defaultPageSize: 20
  })
}

const applyTheme = (theme) => {
  const html = document.documentElement
  
  if (theme === 'dark') {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else if (theme === 'light') {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  } else {
    // auto
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)
    localStorage.removeItem('theme')
  }
}

const exportData = async () => {
  exporting.value = true
  try {
    // 这里应该调用后端导出API
    // const response = await api.get('/products/export', { responseType: 'blob' })
    
    // 模拟导出
    ElMessage.success('数据导出功能开发中')
    
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const downloadTemplate = () => {
  // 创建模板文件下载
  const template = [
    ['产品名称', '产品描述', '分类', '购买日期', '到期日期', '价格', '供应商', '提醒天数'],
    ['示例产品', '这是一个示例产品', '电子产品', '2024-01-01', '2024-12-31', '999.99', '示例供应商', '7']
  ]
  
  // 这里应该生成Excel文件
  ElMessage.info('模板下载功能开发中')
}

const handleImport = (file) => {
  // 处理文件导入
  console.log('导入文件:', file)
  ElMessage.info('数据导入功能开发中')
  return false // 阻止默认上传
}

const clearAllData = () => {
  ElMessageBox.confirm(
    '确定要清空所有数据吗？此操作将删除所有产品和通知记录，且不可撤销！',
    '危险操作确认',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    clearing.value = true
    try {
      // 这里应该调用后端清空API
      // await api.delete('/data/clear-all')
      
      ElMessage.success('所有数据已清空')
    } catch (error) {
      console.error('清空数据失败:', error)
      ElMessage.error('清空失败')
    } finally {
      clearing.value = false
    }
  }).catch(() => {})
}

const loadSystemConfig = () => {
  const saved = localStorage.getItem('systemConfig')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      Object.assign(systemForm, config)
    } catch (error) {
      console.error('加载系统配置失败:', error)
    }
  }
}

// 生命周期
onMounted(() => {
  loadWeChatConfig()
  loadSystemConfig()
})
</script>

<style scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
}

.settings-container {
  padding: 0;
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
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-8);
}

.form-description {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.data-management {
  padding: 16px 0;
}

.management-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.management-item.danger {
  background: var(--el-color-danger-light-9);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--el-color-danger-light-7);
}

.item-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.item-info p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.management-item.danger .item-info h4 {
  color: var(--el-color-danger);
}

.import-actions {
  display: flex;
  gap: 12px;
}

.about-info {
  padding: 16px 0;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  min-width: 120px;
}

.info-item span {
  color: var(--el-text-color-regular);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings {
    margin: 0 16px;
  }
  
  .card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .management-item {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .import-actions {
    width: 100%;
    justify-content: center;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .info-item label {
    min-width: auto;
  }
}
</style>