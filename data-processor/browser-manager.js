const puppeteer = require('puppeteer-core');
const { getSmartUserAgent, getRandomViewport } = require('./anti-detection');
const { optimizePageLoad } = require('./utils');
const config = require('./config');

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.pages = new Map();
    this.networkProtocolManager = require('./network-protocol-manager');
    this.maxRetries = config.crawler.maxRetries || 5;
    this.retryDelay = config.crawler.delays.min || 1000;
  }

  async createBrowser() {
    let executablePath;
    
    if (process.platform === 'darwin') {
      // macOS
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (process.platform === 'linux') {
      // Linux (Ubuntu)
      executablePath = '/usr/bin/google-chrome-stable';
    } else if (process.platform === 'win32') {
      // Windows
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }
    
    const browser = await puppeteer.launch({
      headless: config.crawler.headless,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || executablePath,
      ignoreHTTPSErrors: true,
      protocolTimeout: config.crawler.protocolTimeout || 120000, // 使用配置的超时时间
      defaultViewport: { width: 1280, height: 800 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-web-security', // 禁用web安全策略
        '--disable-features=VizDisplayCompositor', // 禁用显示合成器
        '--memory-pressure-off', // 关闭内存压力检测
        '--max_old_space_size=4096', // 增加内存限制
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        // 新增：网络稳定性参数
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--disable-logging',
        '--disable-web-resources',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-domain-reliability'
      ]
    });

    return browser;
  }

  async createPage(browser) {
    const page = await browser.newPage();
    
    try {
      // 设置页面超时
      page.setDefaultTimeout(config.crawler.timeout || 60000);
      page.setDefaultNavigationTimeout(config.crawler.timeout || 60000);
      
      // 使用网络协议管理器优化页面
      await this.networkProtocolManager.optimizePageForCrawling(page);
      
      // 设置用户代理和视口
      await page.setUserAgent(getSmartUserAgent());
      await page.setViewport(getRandomViewport());
      
      // 优化页面加载
      await optimizePageLoad(page);

      // 安全地初始化页面协议
      const protocolSuccess = await this.networkProtocolManager.initializePageProtocols(page);
      
      if (!protocolSuccess) {
        console.warn('⚠️ 页面协议初始化失败，尝试恢复...');
        // 等待一段时间后重试
        await this.delay(3000);
        await this.networkProtocolManager.reconnectProtocols(page);
      }
      
      // 设置请求拦截
      await this.setupRequestInterception(page);
      
      // 设置页面错误处理
      this.setupPageErrorHandling(page);
      
      console.log('✅ 页面创建和配置完成');
      return page;
      
    } catch (error) {
      console.warn('⚠️ 页面配置过程中出现错误:', error.message);
      // 即使配置失败，也返回页面，让后续逻辑处理
      return page;
    }
  }

  async setupRequestInterception(page) {
    try {
      await page.setRequestInterception(true);
      
      page.on('request', (req) => {
        try {
          // 检查请求是否已经被处理
          if (req.isInterceptResolutionHandled()) {
            return;
          }
          
          const resourceType = req.resourceType();
          const block = config.crawler.resourceBlocking;
          const shouldBlock = block && (
            resourceType === 'media' || 
            resourceType === 'eventsource' || 
            resourceType === 'websocket' ||
            (config.crawler.blockImages && resourceType === 'image')
          );
          
          if (shouldBlock) {
            req.abort();
          } else {
            req.continue();
          }
        } catch (error) {
          console.warn('⚠️ 请求拦截处理失败:', error.message);
          // 如果拦截失败，继续请求
          try {
            if (!req.isInterceptResolutionHandled()) {
              req.continue();
            }
          } catch (e) {
            console.warn('⚠️ 请求继续失败:', e.message);
          }
        }
      });
      
      console.log('✅ 请求拦截设置完成');
    } catch (error) {
      console.warn('⚠️ 设置请求拦截失败:', error.message);
      // 即使拦截失败，也继续执行
    }
  }

  // 设置页面错误处理
  setupPageErrorHandling(page) {
    // 页面错误事件
    page.on('error', (error) => {
      console.warn('⚠️ 页面错误:', error.message);
    });

    // 页面崩溃事件
    page.on('crash', () => {
      console.warn('⚠️ 页面崩溃，尝试恢复...');
    });

    // 页面关闭事件
    page.on('close', () => {
      console.log('ℹ️ 页面已关闭');
    });

    // 控制台消息
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.warn('⚠️ 页面控制台错误:', msg.text());
      }
    });

    // 页面请求失败
    page.on('requestfailed', (request) => {
      console.warn('⚠️ 请求失败:', request.url(), request.failure().errorText);
    });
  }

  // 恢复页面
  async recoverPage(page, browser) {
    try {
      console.log('🔄 尝试恢复页面...');
      
      // 检查页面是否仍然可用
      if (page.isClosed()) {
        console.log('ℹ️ 页面已关闭，创建新页面...');
        return await this.createPage(browser);
      }

      // 尝试重新初始化协议
      const protocolStatus = await this.networkProtocolManager.getProtocolStatus();
      console.log('📊 当前协议状态:', protocolStatus);
      
      // 如果网络协议失败，尝试重新连接
      if (!protocolStatus.Network) {
        console.log('🔄 网络协议异常，尝试重新连接...');
        await this.networkProtocolManager.reconnectProtocols(page);
      }
      
      return page;
    } catch (error) {
      console.warn('⚠️ 页面恢复失败:', error.message);
      // 如果恢复失败，创建新页面
      console.log('🔄 创建新页面...');
      return await this.createPage(browser);
    }
  }

  // 安全的页面操作包装器
  async safePageOperation(page, operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation(page);
      } catch (error) {
        console.warn(`⚠️ 页面操作失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`);
        
        if (attempt < maxRetries) {
          console.log(`⏳ 等待 ${this.retryDelay}ms 后重试...`);
          await this.delay(this.retryDelay);
          
          // 尝试恢复页面
          if (page && !page.isClosed()) {
            await this.recoverPage(page, page.browser());
          }
        } else {
          throw error;
        }
      }
    }
  }

  async closeBrowser(browser) {
    if (!browser) return;
    try {
      if (browser.isConnected()) {
        await browser.close();
      }
    } catch (e) {
      // 忽略关闭异常，避免影响流程
    }
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = BrowserManager; 