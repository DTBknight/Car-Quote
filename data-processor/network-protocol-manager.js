// 网络协议管理器 - 避免Network.enable超时
class NetworkProtocolManager {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.protocolTimeout = 15000; // 15秒协议超时
  }

  // 安全的Network.enable调用
  async safeNetworkEnable(page, retryCount = 0) {
    try {
      console.log(`🔄 尝试启用网络协议 (尝试 ${retryCount + 1}/${this.maxRetries})`);
      
      // 检查页面是否已连接
      if (!page._client || !page._client().connection) {
        console.warn('⚠️ 页面客户端未连接，跳过Network.enable');
        return false;
      }

      // 使用超时包装Network.enable
      const networkEnablePromise = page._client().send('Network.enable');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network.enable timeout')), this.protocolTimeout)
      );
      
      await Promise.race([networkEnablePromise, timeoutPromise]);
      console.log('✅ Network.enable 成功');
      return true;
      
    } catch (error) {
      console.warn(`⚠️ Network.enable 失败 (尝试 ${retryCount + 1}): ${error.message}`);
      
      if (retryCount < this.maxRetries - 1) {
        console.log(`⏳ 等待 ${this.retryDelay}ms 后重试...`);
        await this.delay(this.retryDelay);
        return this.safeNetworkEnable(page, retryCount + 1);
      } else {
        console.warn('⚠️ Network.enable 最终失败，继续执行');
        return false;
      }
    }
  }

  // 安全的页面协议初始化
  async initializePageProtocols(page) {
    try {
      console.log('🔧 初始化页面协议...');
      
      // 尝试启用网络协议
      const networkEnabled = await this.safeNetworkEnable(page);
      
      if (networkEnabled) {
        // 尝试启用其他有用的协议
        await this.enableAdditionalProtocols(page);
      }
      
      console.log('✅ 页面协议初始化完成');
      return true;
      
    } catch (error) {
      console.warn('⚠️ 页面协议初始化失败:', error.message);
      return false;
    }
  }

  // 启用额外的协议
  async enableAdditionalProtocols(page) {
    const protocols = [
      { name: 'Page.enable', method: 'Page.enable' },
      { name: 'Runtime.enable', method: 'Runtime.enable' },
      { name: 'DOM.enable', method: 'DOM.enable' }
    ];

    for (const protocol of protocols) {
      try {
        await page._client().send(protocol.method);
        console.log(`✅ ${protocol.name} 启用成功`);
      } catch (error) {
        console.warn(`⚠️ ${protocol.name} 启用失败: ${error.message}`);
        // 继续尝试其他协议
      }
    }
  }

  // 检查页面协议状态
  async checkProtocolStatus(page) {
    try {
      if (!page._client || !page._client().connection) {
        return { connected: false, reason: '页面客户端未连接' };
      }

      const connection = page._client().connection;
      return {
        connected: connection.connected,
        reason: connection.connected ? '连接正常' : '连接断开'
      };
    } catch (error) {
      return { connected: false, reason: `检查失败: ${error.message}` };
    }
  }

  // 延迟函数
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 创建页面时的协议优化
  async optimizePageForCrawling(page) {
    try {
      console.log('🔧 优化页面配置...');
      
      // 设置页面超时
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
      
      // 设置页面视口
      await page.setViewport({ width: 1280, height: 800 });
      
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // 启用JavaScript
      await page.setJavaScriptEnabled(true);
      
      // 设置请求拦截
      await page.setRequestInterception(true);
      
      // 优化资源加载
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const shouldBlock = ['image', 'media', 'font'].includes(resourceType);
        
        if (shouldBlock) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      console.log('✅ 页面配置优化完成');
      return true;
      
    } catch (error) {
      console.warn('⚠️ 页面配置优化失败:', error.message);
      return false;
    }
  }
}

module.exports = NetworkProtocolManager;
