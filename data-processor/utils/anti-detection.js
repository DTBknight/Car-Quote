// 反爬虫检测配置文件
const UserAgent = require('user-agents');

// 随机用户代理生成器
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// 智能用户代理生成器
function getSmartUserAgent() {
  try {
    const userAgent = new UserAgent({
      deviceCategory: 'desktop',
      platform: ['Windows', 'macOS', 'Linux']
    });
    return userAgent.toString();
  } catch (error) {
    // 如果智能生成失败，使用随机用户代理
    return getRandomUserAgent();
  }
}

// 随机视口大小
function getRandomViewport() {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 1680, height: 1050 },
    { width: 2560, height: 1440 },
    { width: 1920, height: 1200 }
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
}

// 智能延迟函数
function getSmartDelay(baseDelay = 2000, variance = 0.3) {
  const minDelay = baseDelay * (1 - variance);
  const maxDelay = baseDelay * (1 + variance);
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

// 随机延迟函数
function getRandomDelay(min = 1000, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 浏览器指纹伪装
function getBrowserFingerprint() {
  return {
    // 伪装 webdriver
    webdriver: false,
    
    // 伪装 navigator 属性
    navigator: {
      userAgent: getSmartUserAgent(),
      language: 'zh-CN',
      languages: ['zh-CN', 'zh', 'en'],
      platform: 'MacIntel',
      hardwareConcurrency: Math.floor(Math.random() * 8) + 4,
      deviceMemory: Math.floor(Math.random() * 8) + 4,
      maxTouchPoints: 0,
      cookieEnabled: true,
      doNotTrack: null,
      onLine: true,
      vendor: 'Google Inc.',
      product: 'Gecko',
      productSub: '20030107',
      appName: 'Netscape',
      appVersion: getSmartUserAgent(),
      appCodeName: 'Mozilla',
      plugins: [
        { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', filename: 'internal-nacl-plugin' }
      ]
    },
    
    // 伪装 screen 属性
    screen: {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
      pixelDepth: 24
    },
    
    // 伪装 window 属性
    window: {
      innerWidth: 1920,
      innerHeight: 937,
      outerWidth: 1920,
      outerHeight: 1040,
      devicePixelRatio: 1,
      screenX: 0,
      screenY: 0
    }
  };
}

// 智能请求头生成
function getSmartHeaders() {
  const userAgent = getSmartUserAgent();
  const isChrome = userAgent.includes('Chrome');
  const isFirefox = userAgent.includes('Firefox');
  const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
  
  const baseHeaders = {
    'User-Agent': userAgent,
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };
  
  if (isChrome) {
    return {
      ...baseHeaders,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };
  } else if (isFirefox) {
    return {
      ...baseHeaders,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    };
  } else if (isSafari) {
    return {
      ...baseHeaders,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Cache-Control': 'max-age=0'
    };
  }
  
  return baseHeaders;
}

// 请求头伪装
function getRandomHeaders() {
  const headers = [
    {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    },
    {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  ];
  
  return headers[Math.floor(Math.random() * headers.length)];
}

// 鼠标移动轨迹生成
function generateMouseTrajectory() {
  const trajectory = [];
  let x = Math.random() * 100;
  let y = Math.random() * 100;
  
  for (let i = 0; i < 10; i++) {
    x += (Math.random() - 0.5) * 20;
    y += (Math.random() - 0.5) * 20;
    trajectory.push({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }
  
  return trajectory;
}

// 滚动行为模拟
function generateScrollBehavior() {
  return {
    scrollSteps: Math.floor(Math.random() * 5) + 3,
    scrollDelay: Math.floor(Math.random() * 1000) + 500,
    scrollDistance: Math.floor(Math.random() * 500) + 200
  };
}

// 智能页面交互模拟
async function simulateHumanBehavior(page) {
  // 随机鼠标移动
  const viewport = await page.viewport();
  const mouseTrajectory = generateMouseTrajectory();
  
  for (const point of mouseTrajectory) {
    const x = (point.x / 100) * viewport.width;
    const y = (point.y / 100) * viewport.height;
    await page.mouse.move(x, y);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }
  
  // 随机滚动
  const scrollBehavior = generateScrollBehavior();
  for (let i = 0; i < scrollBehavior.scrollSteps; i++) {
    await page.evaluate((distance) => {
      window.scrollBy(0, distance);
    }, scrollBehavior.scrollDistance);
    await new Promise(resolve => setTimeout(resolve, scrollBehavior.scrollDelay));
  }
}

// 智能等待函数
async function smartWait(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.warn(`等待元素 ${selector} 超时`);
    return false;
  }
}

// 页面加载优化
async function optimizePageLoad(page) {
  // 设置页面超时
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  
  // 优化页面性能
  await page.evaluateOnNewDocument(() => {
    // 禁用一些可能被检测的功能
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
    
    // 伪装插件
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    
    // 伪装语言
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en'],
    });
  });
}

module.exports = {
  getRandomUserAgent,
  getSmartUserAgent,
  getRandomViewport,
  getRandomDelay,
  getSmartDelay,
  getBrowserFingerprint,
  getRandomHeaders,
  getSmartHeaders,
  generateMouseTrajectory,
  generateScrollBehavior,
  simulateHumanBehavior,
  smartWait,
  optimizePageLoad
}; 