<template>
  <div class="not-found">
    <div class="not-found-container">
      <div class="error-code">404</div>
      <div class="error-message">页面未找到</div>
      <div class="error-description">
        抱歉，您访问的页面不存在或已被移除
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
      
      <div class="suggestions">
        <h4>您可以尝试：</h4>
        <ul>
          <li>检查URL地址是否正确</li>
          <li>返回首页重新导航</li>
          <li>联系管理员获取帮助</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-container {
  text-align: center;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 60px 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #667eea;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.error-message {
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.error-description {
  font-size: 16px;
  color: #7f8c8d;
  margin-bottom: 40px;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
}

.suggestions {
  text-align: left;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.suggestions h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.suggestions li:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-container {
    padding: 40px 24px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-message {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 200px;
  }
}

/* 暗色主题适配 */
.dark .not-found-container {
  background: rgba(30, 30, 30, 0.95);
}

.dark .error-message {
  color: #e4e7ed;
}

.dark .error-description {
  color: #909399;
}
</style>