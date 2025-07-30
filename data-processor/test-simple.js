// 简化的测试脚本
const puppeteer = require('puppeteer');

async function testBasicCrawling() {
  console.log('🧪 开始基础爬虫测试...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false, // 显示浏览器窗口，便于调试
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote'
      ]
    });
    
    const page = await browser.newPage();
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('🌐 访问测试页面...');
    
    // 先访问一个简单的页面测试连接
    await page.goto('https://www.baidu.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ 百度页面访问成功');
    
    // 等待一下
    await page.waitForTimeout(2000);
    
    // 尝试访问目标网站
    console.log('🌐 尝试访问目标网站...');
    await page.goto('https://www.dongchedi.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('✅ 目标网站访问成功');
    
    // 获取页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);
    
    // 等待用户查看
    console.log('⏳ 等待10秒，请查看浏览器窗口...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('🔚 测试完成');
  }
}

// 运行测试
testBasicCrawling().catch(console.error); 