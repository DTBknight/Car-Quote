const puppeteer = require('puppeteer');
const { getSmartUserAgent, getRandomViewport, optimizePageLoad } = require('./anti-detection');
const config = require('./config');
const NetworkProtocolManager = require('./network-protocol-manager');

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.pagePool = [];
    this.networkProtocolManager = new NetworkProtocolManager();
  }

  async createBrowser() {
    // 根据环境自动检测Chrome路径
    let executablePath = null;
    
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
      protocolTimeout: config.crawler.protocolTimeout || 30000, // 使用配置的超时时间
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
        '--disable-ipc-flooding-protection'
      ]
    });

    return browser;
  }

  async createPage(browser) {
    const page = await browser.newPage();
    
    try {
      // 使用网络协议管理器优化页面
      await this.networkProtocolManager.optimizePageForCrawling(page);
      
      // 设置用户代理和视口
      await page.setUserAgent(getSmartUserAgent());
      await page.setViewport(getRandomViewport());
      
      // 优化页面加载
      await optimizePageLoad(page);

      // 安全地初始化页面协议
      await this.networkProtocolManager.initializePageProtocols(page);
      
      // 设置请求拦截
      await this.setupRequestInterception(page);
      
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
}

module.exports = BrowserManager; 