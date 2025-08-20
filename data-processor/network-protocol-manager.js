// 网络协议管理器 - 避免Network.enable超时
const config = require('./config');
const logger = require('./logger');

class NetworkProtocolManager {
  constructor() {
    this.maxRetries = config.crawler.maxNetworkRetries || 5;
    this.retryDelay = config.crawler.networkRetryDelay || 3000;
    this.protocolTimeout = config.crawler.protocolTimeout || 120000; // 120秒协议超时
    this.connectionTimeout = config.crawler.connectionTimeout || 30000; // 30秒连接超时
    this.protocols = new Map(); // 记录协议状态
  }

  // 安全的Network.enable调用
  async safeNetworkEnable(page, retryCount = 0) {
    try {
      logger.retryAttempt(`尝试启用网络协议 (尝试 ${retryCount + 1}/${this.maxRetries})`);
      
      // 检查页面是否已连接
      if (!page._client || !page._client().connection) {
        logger.protocolWarning('页面客户端未连接，跳过Network.enable');
        return false;
      }

      // 检查连接状态
      const connectionStatus = await this.checkProtocolStatus(page);
      if (!connectionStatus.connected) {
        logger.protocolWarning(`页面连接状态异常: ${connectionStatus.reason}`);
        if (retryCount < this.maxRetries - 1) {
          logger.retryAttempt(`等待 ${this.retryDelay}ms 后重试...`);
          await this.delay(this.retryDelay);
          return this.safeNetworkEnable(page, retryCount + 1);
        }
        return false;
      }

      // 使用超时包装Network.enable
      const networkEnablePromise = page._client().send('Network.enable');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network.enable timeout')), this.protocolTimeout)
      );
      
      await Promise.race([networkEnablePromise, timeoutPromise]);
      if (config.logging.showSuccess) {
        if (config.logging.showBrowserOperations) {
          logger.success('Network.enable 成功');
        }
      }
      this.protocols.set('Network', true);
      return true;
      
    } catch (error) {
              logger.protocolWarning(`Network.enable 失败 (尝试 ${retryCount + 1}): ${error.message}`);
      
      if (retryCount < this.maxRetries - 1) {
                  logger.retryAttempt(`等待 ${this.retryDelay}ms 后重试...`);
        await this.delay(this.retryDelay);
        return this.safeNetworkEnable(page, retryCount + 1);
      } else {
        if (config.logging.showProtocolWarnings) {
          logger.protocolWarning('Network.enable 最终失败，继续执行');
        }
        this.protocols.set('Network', false);
        return false;
      }
    }
  }

  // 安全的页面协议初始化
  async initializePageProtocols(page) {
    try {
      if (config.logging.showProgress) {
        if (config.logging.showBrowserOperations) {
          logger.progress('初始化页面协议...');
        }
      }
      
      // 尝试启用网络协议
      const networkEnabled = await this.safeNetworkEnable(page);
      
      if (networkEnabled) {
        // 尝试启用其他有用的协议
        await this.enableAdditionalProtocols(page);
      } else {
        if (config.logging.showProtocolWarnings) {
          logger.protocolWarning('网络协议启用失败，尝试基础协议...');
        }
        // 即使网络协议失败，也尝试其他协议
        await this.enableAdditionalProtocols(page);
      }
      
      if (config.logging.showSuccess) {
        if (config.logging.showBrowserOperations) {
          logger.success('页面协议初始化完成');
        }
      }
      return true;
      
    } catch (error) {
      if (config.logging.showErrors) {
        logger.protocolWarning('页面协议初始化失败: ' + error.message);
      }
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
        // 检查协议是否已经启用
        if (this.protocols.get(protocol.name)) {
          if (config.logging.showBrowserOperations) {
            logger.success(`${protocol.name} 已经启用`);
          }
          continue;
        }

        // 使用超时保护
        const protocolPromise = page._client().send(protocol.method);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${protocol.name} timeout`)), this.protocolTimeout)
        );
        
        await Promise.race([protocolPromise, timeoutPromise]);
        if (config.logging.showBrowserOperations) {
          logger.success(`${protocol.name} 启用成功`);
        }
        this.protocols.set(protocol.name, true);
        
      } catch (error) {
        logger.protocolWarning(`${protocol.name} 启用失败: ${error.message}`);
        this.protocols.set(protocol.name, false);
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

  // 重新连接页面协议
  async reconnectProtocols(page) {
    try {
      if (config.logging.showBrowserOperations) {
        logger.progress('尝试重新连接页面协议...');
      }
      
      // 等待一段时间让连接稳定
      await this.delay(5000);
      
      // 重新初始化协议
      const success = await this.initializePageProtocols(page);
      
      if (success) {
        if (config.logging.showBrowserOperations) {
          logger.success('页面协议重新连接成功');
        }
      } else {
        logger.protocolWarning('页面协议重新连接失败');
      }
      
      return success;
    } catch (error) {
      logger.protocolWarning('重新连接页面协议时出错: ' + error.message);
      return false;
    }
  }

  // 获取协议状态摘要
  getProtocolStatus() {
    const status = {};
    for (const [protocol, enabled] of this.protocols) {
      status[protocol] = enabled ? '✅' : '❌';
    }
    return status;
  }

  // 延迟函数
  delay(ms) {
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
