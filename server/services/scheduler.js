const cron = require('node-cron');
const moment = require('moment');
const { db } = require('../database/init');
const { sendWeChatNotification } = require('./wechat');

// 检查即将到期的产品
function checkExpiringProducts() {
  console.log('开始检查到期产品...');
  
  const query = `
    SELECT * FROM products 
    WHERE status = 'active' 
    AND date(expiry_date) <= date('now', '+' || reminder_days || ' days')
    AND date(expiry_date) >= date('now')
  `;

  db.all(query, async (err, products) => {
    if (err) {
      console.error('查询到期产品失败:', err);
      return;
    }

    console.log(`发现 ${products.length} 个即将到期的产品`);

    for (const product of products) {
      try {
        // 检查今天是否已经发送过通知
        const today = moment().format('YYYY-MM-DD');
        
        const existingNotification = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM notifications WHERE product_id = ? AND date(created_at) = ? AND type = "auto"',
            [product.id, today],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (existingNotification) {
          console.log(`产品 ${product.name} 今天已发送过通知`);
          continue;
        }

        // 发送通知
        const result = await sendWeChatNotification(product);
        
        // 记录通知
        db.run(
          'INSERT INTO notifications (product_id, message, type, status, sent_at) VALUES (?, ?, ?, ?, ?)',
          [product.id, result.message, 'auto', result.success ? 'sent' : 'failed', new Date()],
          (err) => {
            if (err) {
              console.error('记录通知失败:', err);
            } else {
              console.log(`产品 ${product.name} 通知发送${result.success ? '成功' : '失败'}`);
            }
          }
        );

      } catch (error) {
        console.error(`处理产品 ${product.name} 时出错:`, error);
      }
    }
  });
}

// 检查已过期的产品
function checkExpiredProducts() {
  console.log('开始检查过期产品...');
  
  const query = `
    SELECT * FROM products 
    WHERE status = 'active' 
    AND date(expiry_date) < date('now')
  `;

  db.all(query, async (err, products) => {
    if (err) {
      console.error('查询过期产品失败:', err);
      return;
    }

    console.log(`发现 ${products.length} 个过期产品`);

    for (const product of products) {
      try {
        // 检查本周是否已经发送过过期通知
        const weekStart = moment().startOf('week').format('YYYY-MM-DD');
        
        const existingNotification = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM notifications WHERE product_id = ? AND date(created_at) >= ? AND type = "expired"',
            [product.id, weekStart],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (existingNotification) {
          console.log(`产品 ${product.name} 本周已发送过过期通知`);
          continue;
        }

        // 发送过期通知
        const result = await sendWeChatNotification(product);
        
        // 记录通知
        db.run(
          'INSERT INTO notifications (product_id, message, type, status, sent_at) VALUES (?, ?, ?, ?, ?)',
          [product.id, result.message, 'expired', result.success ? 'sent' : 'failed', new Date()],
          (err) => {
            if (err) {
              console.error('记录过期通知失败:', err);
            } else {
              console.log(`产品 ${product.name} 过期通知发送${result.success ? '成功' : '失败'}`);
            }
          }
        );

      } catch (error) {
        console.error(`处理过期产品 ${product.name} 时出错:`, error);
      }
    }
  });
}

// 清理旧通知记录
function cleanupOldNotifications() {
  console.log('开始清理旧通知记录...');
  
  const query = `
    DELETE FROM notifications 
    WHERE created_at < date('now', '-30 days')
  `;

  db.run(query, function(err) {
    if (err) {
      console.error('清理旧通知记录失败:', err);
    } else {
      console.log(`清理了 ${this.changes} 条旧通知记录`);
    }
  });
}

// 启动定时任务
function startReminderScheduler() {
  console.log('启动提醒调度器...');

  // 每天早上9点检查即将到期的产品
  cron.schedule('0 9 * * *', () => {
    console.log('执行每日到期检查任务');
    checkExpiringProducts();
  }, {
    timezone: 'Asia/Shanghai'
  });

  // 每天早上9点检查过期产品
  cron.schedule('0 9 * * *', () => {
    console.log('执行每日过期检查任务');
    checkExpiredProducts();
  }, {
    timezone: 'Asia/Shanghai'
  });

  // 每周日凌晨2点清理旧记录
  cron.schedule('0 2 * * 0', () => {
    console.log('执行每周清理任务');
    cleanupOldNotifications();
  }, {
    timezone: 'Asia/Shanghai'
  });

  // 开发环境下，每分钟检查一次（用于测试）
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('*/5 * * * *', () => {
      console.log('执行开发环境测试检查');
      checkExpiringProducts();
    });
  }

  console.log('提醒调度器启动成功');
}

module.exports = {
  startReminderScheduler,
  checkExpiringProducts,
  checkExpiredProducts
};