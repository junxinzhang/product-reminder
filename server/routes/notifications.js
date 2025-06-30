const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('./auth');
const { sendWeChatNotification } = require('../services/wechat');

const router = express.Router();
router.use(authenticateToken);

// 获取通知记录
router.get('/', (req, res) => {
  const query = `
    SELECT n.*, p.name as product_name 
    FROM notifications n
    JOIN products p ON n.product_id = p.id
    WHERE p.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 100
  `;

  db.all(query, [req.user.id], (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: '获取通知记录失败' });
    }
    res.json(notifications);
  });
});

// 手动发送通知
router.post('/send/:productId', async (req, res) => {
  try {
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.productId, req.user.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    const result = await sendWeChatNotification(product);
    
    // 记录通知
    db.run(
      'INSERT INTO notifications (product_id, message, type, status, sent_at) VALUES (?, ?, ?, ?, ?)',
      [product.id, result.message, 'manual', result.success ? 'sent' : 'failed', new Date()],
      (err) => {
        if (err) {
          console.error('记录通知失败:', err);
        }
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '发送通知失败', details: error.message });
  }
});

// 获取企业微信配置
router.get('/wechat/config', (req, res) => {
  db.get('SELECT * FROM wechat_config WHERE is_active = 1', (err, config) => {
    if (err) {
      return res.status(500).json({ error: '获取配置失败' });
    }

    if (config) {
      // 不返回敏感信息
      const { secret, ...safeConfig } = config;
      res.json(safeConfig);
    } else {
      res.json(null);
    }
  });
});

// 更新企业微信配置
router.post('/wechat/config', (req, res) => {
  const { corp_id, agent_id, secret, webhook_url } = req.body;

  if (!corp_id || !agent_id || !secret) {
    return res.status(400).json({ error: '企业ID、应用ID和密钥不能为空' });
  }

  // 先禁用所有配置
  db.run('UPDATE wechat_config SET is_active = 0', (err) => {
    if (err) {
      return res.status(500).json({ error: '更新配置失败' });
    }

    // 插入新配置
    db.run(
      'INSERT INTO wechat_config (corp_id, agent_id, secret, webhook_url, is_active) VALUES (?, ?, ?, ?, 1)',
      [corp_id, agent_id, secret, webhook_url],
      function(err) {
        if (err) {
          return res.status(500).json({ error: '保存配置失败' });
        }

        res.json({ message: '企业微信配置保存成功', id: this.lastID });
      }
    );
  });
});

// 测试企业微信通知
router.post('/wechat/test', async (req, res) => {
  try {
    const testProduct = {
      id: 0,
      name: '测试产品',
      expiry_date: new Date(),
      daysUntilExpiry: 0
    };

    const result = await sendWeChatNotification(testProduct, true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '测试通知失败', details: error.message });
  }
});

module.exports = router;