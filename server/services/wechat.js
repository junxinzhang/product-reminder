const axios = require('axios');
const { db } = require('../database/init');

// 获取企业微信访问令牌
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM wechat_config WHERE is_active = 1', async (err, config) => {
      if (err) {
        reject(new Error('获取配置失败'));
        return;
      }

      if (!config) {
        reject(new Error('未配置企业微信'));
        return;
      }

      try {
        const response = await axios.get(`https://qyapi.weixin.qq.com/cgi-bin/gettoken`, {
          params: {
            corpid: config.corp_id,
            corpsecret: config.secret
          }
        });

        if (response.data.errcode === 0) {
          resolve({
            access_token: response.data.access_token,
            agent_id: config.agent_id,
            webhook_url: config.webhook_url
          });
        } else {
          reject(new Error(`获取访问令牌失败: ${response.data.errmsg}`));
        }
      } catch (error) {
        reject(new Error(`请求失败: ${error.message}`));
      }
    });
  });
}

// 发送企业微信消息
async function sendWeChatMessage(accessToken, agentId, message) {
  const data = {
    touser: '@all',
    msgtype: 'text',
    agentid: agentId,
    text: {
      content: message
    }
  };

  const response = await axios.post(
    `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${accessToken}`,
    data
  );

  if (response.data.errcode !== 0) {
    throw new Error(`发送消息失败: ${response.data.errmsg}`);
  }

  return response.data;
}

// 发送Webhook消息
async function sendWebhookMessage(webhookUrl, message) {
  const data = {
    msgtype: 'text',
    text: {
      content: message
    }
  };

  const response = await axios.post(webhookUrl, data);
  
  if (response.data.errcode !== 0) {
    throw new Error(`Webhook发送失败: ${response.data.errmsg}`);
  }

  return response.data;
}

// 发送产品到期通知
async function sendWeChatNotification(product, isTest = false) {
  try {
    const config = await getAccessToken();
    
    let message;
    if (isTest) {
      message = '🔔 企业微信通知测试\n\n这是一条测试消息，如果您收到此消息，说明企业微信通知配置正确！';
    } else {
      const daysUntilExpiry = Math.ceil((new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) {
        message = `⚠️ 产品过期提醒\n\n产品：${product.name}\n状态：已过期 ${Math.abs(daysUntilExpiry)} 天\n到期日期：${product.expiry_date}\n\n请及时处理过期产品！`;
      } else if (daysUntilExpiry === 0) {
        message = `🚨 产品到期提醒\n\n产品：${product.name}\n状态：今天到期\n到期日期：${product.expiry_date}\n\n请立即处理即将到期的产品！`;
      } else {
        message = `🔔 产品即将到期提醒\n\n产品：${product.name}\n状态：还有 ${daysUntilExpiry} 天到期\n到期日期：${product.expiry_date}\n\n请提前做好准备！`;
      }
    }

    let result;
    
    // 优先使用Webhook，如果没有配置则使用应用消息
    if (config.webhook_url) {
      result = await sendWebhookMessage(config.webhook_url, message);
    } else {
      result = await sendWeChatMessage(config.access_token, config.agent_id, message);
    }

    return {
      success: true,
      message: message,
      result: result
    };

  } catch (error) {
    console.error('发送企业微信通知失败:', error);
    return {
      success: false,
      message: `发送通知失败: ${error.message}`,
      error: error.message
    };
  }
}

module.exports = {
  sendWeChatNotification,
  getAccessToken
};