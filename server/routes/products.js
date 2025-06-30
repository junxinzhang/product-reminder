const express = require('express');
const moment = require('moment');
const { db } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// 使用认证中间件
router.use(authenticateToken);

// 获取所有产品
router.get('/', (req, res) => {
  const { category, status, search } = req.query;
  let query = 'SELECT * FROM products WHERE user_id = ?';
  const params = [req.user.id];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY expiry_date ASC';

  db.all(query, params, (err, products) => {
    if (err) {
      return res.status(500).json({ error: '获取产品列表失败' });
    }

    // 计算剩余天数
    const productsWithDays = products.map(product => ({
      ...product,
      daysUntilExpiry: moment(product.expiry_date).diff(moment(), 'days'),
      isExpired: moment(product.expiry_date).isBefore(moment()),
      isExpiringSoon: moment(product.expiry_date).diff(moment(), 'days') <= product.reminder_days
    }));

    res.json(productsWithDays);
  });
});

// 获取单个产品
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: '获取产品信息失败' });
    }

    if (!product) {
      return res.status(404).json({ error: '产品不存在' });
    }

    res.json({
      ...product,
      daysUntilExpiry: moment(product.expiry_date).diff(moment(), 'days'),
      isExpired: moment(product.expiry_date).isBefore(moment()),
      isExpiringSoon: moment(product.expiry_date).diff(moment(), 'days') <= product.reminder_days
    });
  });
});

// 创建新产品
router.post('/', (req, res) => {
  const {
    name,
    description,
    category,
    purchase_date,
    expiry_date,
    price,
    supplier,
    reminder_days
  } = req.body;

  if (!name || !expiry_date) {
    return res.status(400).json({ error: '产品名称和到期日期不能为空' });
  }

  const query = `
    INSERT INTO products (
      name, description, category, purchase_date, expiry_date, 
      price, supplier, reminder_days, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [name, description, category, purchase_date, expiry_date, price, supplier, reminder_days || 7, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '创建产品失败' });
      }

      res.status(201).json({
        id: this.lastID,
        message: '产品创建成功'
      });
    }
  );
});

// 更新产品
router.put('/:id', (req, res) => {
  const {
    name,
    description,
    category,
    purchase_date,
    expiry_date,
    price,
    supplier,
    status,
    reminder_days
  } = req.body;

  const query = `
    UPDATE products SET
      name = ?, description = ?, category = ?, purchase_date = ?,
      expiry_date = ?, price = ?, supplier = ?, status = ?,
      reminder_days = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `;

  db.run(
    query,
    [name, description, category, purchase_date, expiry_date, price, supplier, status, reminder_days, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新产品失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '产品不存在' });
      }

      res.json({ message: '产品更新成功' });
    }
  );
});

// 删除产品
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: '删除产品失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: '产品不存在' });
    }

    res.json({ message: '产品删除成功' });
  });
});

// 获取统计信息
router.get('/stats/overview', (req, res) => {
  console.log('Stats overview request - User ID:', req.user ? req.user.id : 'No user');
  
  const queries = [
    'SELECT COUNT(*) as total FROM products WHERE user_id = ?',
    'SELECT COUNT(*) as expired FROM products WHERE user_id = ? AND expiry_date < date(\'now\')',
    'SELECT COUNT(*) as expiring_soon FROM products WHERE user_id = ? AND expiry_date BETWEEN date(\'now\') AND date(\'now\', \'+7 days\')',
    'SELECT COUNT(*) as active FROM products WHERE user_id = ? AND status = \'active\''
  ];

  Promise.all(queries.map((query, index) => {
    return new Promise((resolve, reject) => {
      db.get(query, [req.user.id], (err, result) => {
        if (err) {
          console.error(`Query ${index + 1} failed:`, err);
          reject(err);
        } else {
          resolve(result ? Object.values(result)[0] : 0);
        }
      });
    });
  }))
  .then(results => {
    res.json({
      total: results[0],
      expired: results[1],
      expiring_soon: results[2],
      active: results[3]
    });
  })
  .catch(err => {
    console.error('Stats overview error:', err);
    res.status(500).json({ error: '获取统计信息失败' });
  });
});

module.exports = router;