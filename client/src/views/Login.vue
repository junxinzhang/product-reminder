<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon size="48" color="#409EFF">
            <Bell />
          </el-icon>
        </div>
        <h1 class="title">产品到期提醒系统</h1>
        <p class="subtitle">智能管理，及时提醒</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        size="large"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-divider>
          <span class="divider-text">还没有账号？</span>
        </el-divider>
        
        <el-button
          type="text"
          size="large"
          @click="showRegister = true"
          class="register-button"
        >
          立即注册
        </el-button>
      </div>
    </div>

    <!-- 注册对话框 -->
    <el-dialog
      v-model="showRegister"
      title="用户注册"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            clearable
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRegister = false">取消</el-button>
          <el-button
            type="primary"
            :loading="registerLoading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref()
const registerFormRef = ref()

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 状态管理
const loading = ref(false)
const registerLoading = ref(false)
const showRegister = ref(false)

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const result = await authStore.login(loginForm)
      
      if (result.success) {
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error(result.message)
      }
    } catch (error) {
      ElMessage.error('登录失败')
    } finally {
      loading.value = false
    }
  })
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return

  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return

    registerLoading.value = true
    try {
      const result = await authStore.register({
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password
      })
      
      if (result.success) {
        ElMessage.success('注册成功')
        showRegister.value = false
        router.push('/dashboard')
      } else {
        ElMessage.error(result.message)
      }
    } catch (error) {
      ElMessage.error('注册失败')
    } finally {
      registerLoading.value = false
    }
  })
}

onMounted(() => {
  // 开发环境下自动填充
  if (process.env.NODE_ENV === 'development') {
    loginForm.username = 'admin'
    loginForm.password = 'admin123'
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.subtitle {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.login-form {
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}

.login-footer {
  text-align: center;
}

.divider-text {
  color: #7f8c8d;
  font-size: 14px;
}

.register-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
  color: #409EFF;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    padding: 24px;
    margin: 16px;
  }
  
  .title {
    font-size: 24px;
  }
}

/* 暗色主题适配 */
.dark .login-card {
  background: rgba(30, 30, 30, 0.95);
  border-color: rgba(255, 255, 255, 0.1);
}

.dark .title {
  color: #e4e7ed;
}

.dark .subtitle {
  color: #909399;
}

.dark .divider-text {
  color: #909399;
}
</style>