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
      executablePath: executablePath,
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
        '--disable-ipc-flooding-protection'
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
    
    // 设置请求拦截
    await this.setupRequestInterception(page);
    
    return page;
  }

  async setupRequestInterception(page) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      const shouldBlock = (
        (config.crawler.blockImages && resourceType === 'image') ||
        (config.crawler.blockStylesheets && resourceType === 'stylesheet') ||
        (config.crawler.blockFonts && resourceType === 'font') ||
        resourceType === 'media'
      );
      
      if (shouldBlock) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  async closeBrowser(browser) {
    if (browser && !browser.isConnected()) {
      await browser.close();
    }
  }
}

module.exports = BrowserManager; 