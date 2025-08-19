const puppeteer = require('puppeteer');
const { getSmartUserAgent, getRandomViewport, optimizePageLoad } = require('./anti-detection');
const config = require('./config');

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.pagePool = [];
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
      protocolTimeout: 0, // 无超时限制
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
        '--disable-timeouts', // 禁用所有超时
        '--disable-hang-monitor' // 禁用挂起监控
      ]
    });

    return browser;
  }

  async createPage(browser) {
    const page = await browser.newPage();
    
    // 设置用户代理和视口
    await page.setUserAgent(getSmartUserAgent());
    await page.setViewport(getRandomViewport());
    
    // 优化页面加载
    await optimizePageLoad(page);

    // 设置更高的协议超时，兼容 Network.enable 超时
    try {
      await page._client().send('Network.enable');
    } catch (e) {
      // 忽略此处异常，由外层重试处理
    }
    
    // 设置请求拦截
    await this.setupRequestInterception(page);
    
    return page;
  }

  async setupRequestInterception(page) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const block = config.crawler.resourceBlocking;
      const shouldBlock = block && (
        resourceType === 'media' || resourceType === 'eventsource' || resourceType === 'websocket'
      );
      
      if (shouldBlock) {
        req.abort();
      } else {
        req.continue();
      }
    });
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