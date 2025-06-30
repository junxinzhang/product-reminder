<template>
  <el-config-provider :locale="locale">
    <div id="app" :class="{ 'dark': isDark }">
      <router-view />
    </div>
  </el-config-provider>
</template>

<script>
import { ref, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

export default {
  name: 'App',
  setup() {
    const locale = ref(zhCn)
    const isDark = ref(false)

    onMounted(() => {
      // 检查系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const savedTheme = localStorage.getItem('theme')
      
      if (savedTheme) {
        isDark.value = savedTheme === 'dark'
      } else {
        isDark.value = prefersDark
      }
      
      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          isDark.value = e.matches
        }
      })
    })

    return {
      locale,
      isDark
    }
  }
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  transition: all 0.3s ease;
}

html.dark {
  color-scheme: dark;
}
</style>