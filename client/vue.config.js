const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // 开发服务器配置
  devServer: {
    port: 8083,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // 生产构建配置
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  
  // PWA配置
  pwa: {
    name: '产品到期提醒系统',
    themeColor: '#409EFF',
    msTileColor: '#409EFF',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestOptions: {
      background_color: '#409EFF'
    }
  },
  
  // 性能优化
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          elementPlus: {
            name: 'chunk-element-plus',
            priority: 20,
            test: /[\\/]node_modules[\\/]element-plus[\\/]/
          }
        }
      }
    }
  },
  
  // CSS配置
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV !== 'production'
  },
  
  // 生产环境去除console
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap(args => {
        args[0].terserOptions.compress.drop_console = true
        return args
      })
    }
  }
})