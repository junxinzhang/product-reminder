const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/products');
const notificationRoutes = require('./routes/notifications');
const { router: authRoutes } = require('./routes/auth');
const { initDatabase } = require('./database/init');
const { startReminderScheduler } = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', notificationRoutes);

// SPA 支持
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 初始化数据库和启动定时任务
async function startServer() {
  try {
    await initDatabase();
    startReminderScheduler();
    
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`访问 http://localhost:${PORT} 查看应用`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer();