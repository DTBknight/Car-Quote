const puppeteer = require('puppeteer');
const { getSmartUserAgent, getRandomViewport, optimizePageLoad } = require('./anti-detection');
const config = require('./config');

class BrowserManager {
  constructor() {
    this.browsers = new Map();
    this.pagePool = [];
  }

  async createBrowser() {
    const browser = await puppeteer.launch({
      headless: config.crawler.headless,
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