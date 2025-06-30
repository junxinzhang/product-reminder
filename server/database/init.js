const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 产品表
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          purchase_date DATE,
          expiry_date DATE NOT NULL,
          price DECIMAL(10,2),
          supplier TEXT,
          status TEXT DEFAULT 'active',
          reminder_days INTEGER DEFAULT 7,
          user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // 通知记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'reminder',
          status TEXT DEFAULT 'pending',
          sent_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // 企业微信配置表
      db.run(`
        CREATE TABLE IF NOT EXISTS wechat_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          corp_id TEXT NOT NULL,
          agent_id TEXT NOT NULL,
          secret TEXT NOT NULL,
          webhook_url TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 插入默认管理员用户
      const bcrypt = require('bcryptjs');
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      
      db.run(`
        INSERT OR IGNORE INTO users (username, password, email) 
        VALUES ('admin', ?, 'admin@example.com')
      `, [defaultPassword], function(err) {
        if (err) {
          console.error('创建默认用户失败:', err);
          reject(err);
        } else {
          console.log('数据库初始化完成');
          resolve();
        }
      });
    });
  });
}

module.exports = { db, initDatabase };