const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { 
  getRandomUserAgent, 
  getRandomViewport, 
  getRandomDelay, 
  getRandomHeaders,
  generateMouseTrajectory,
  generateScrollBehavior
} = require('./anti-detection');

// 车型数据结构
const carData = [];

async function collectCarData() {
  console.log('开始收集车型数据...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-ipc-flooding-protection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--safebrowsing-disable-auto-update',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // 伪装浏览器指纹
    await page.evaluateOnNewDocument(() => {
      // 删除 webdriver 属性
      delete navigator.__proto__.webdriver;
      
      // 伪装 navigator 属性
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // 伪装 plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // 伪装 languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en'],
      });
      
      // 伪装 platform
      Object.defineProperty(navigator, 'platform', {
        get: () => 'MacIntel',
      });
      
      // 伪装 chrome
      window.chrome = {
        runtime: {},
      };
      
      // 伪装 permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });
    
    // 使用反爬虫配置
    const randomUserAgent = getRandomUserAgent();
    await page.setUserAgent(randomUserAgent);
    
    const randomViewport = getRandomViewport();
    await page.setViewport(randomViewport);
    
    // 设置请求拦截，只加载必要的资源，并添加随机延迟
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      // 随机延迟请求
      setTimeout(() => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      }, Math.random() * 100);
    });
    
    // 爬取热门车型的具体配置信息
    const carSeries = [
      { 
        name: '比亚迪秦PLUS DM', 
        url: 'https://www.dongchedi.com/auto/series/4802',
        brand: '比亚迪'
      },
      { 
        name: '特斯拉Model 3', 
        url: 'https://www.dongchedi.com/auto/series/4803',
        brand: '特斯拉'
      },
      { 
        name: '特斯拉Model Y', 
        url: 'https://www.dongchedi.com/auto/series/4804',
        brand: '特斯拉'
      },
      { 
        name: '比亚迪汉', 
        url: 'https://www.dongchedi.com/auto/series/4805',
        brand: '比亚迪'
      },
      { 
        name: '奔驰C级', 
        url: 'https://www.dongchedi.com/auto/series/4806',
        brand: '奔驰'
      },
      { 
        name: '宝马3系', 
        url: 'https://www.dongchedi.com/auto/series/4807',
        brand: '宝马'
      },
      { 
        name: '奥迪A4L', 
        url: 'https://www.dongchedi.com/auto/series/4808',
        brand: '奥迪'
      }
    ];
    
    for (const car of carSeries) {
      console.log(`正在收集 ${car.name} 的配置信息...`);
      
      try {
        // 使用反爬虫配置的随机延迟
        const randomDelay = getRandomDelay(2000, 5000);
        await page.waitForTimeout(randomDelay);
        
        // 先访问主页，再访问具体页面
        await page.goto('https://www.dongchedi.com/', { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        // 模拟人类滚动行为
        const scrollBehavior = generateScrollBehavior();
        await page.evaluate((behavior) => {
          for (let i = 0; i < behavior.scrollSteps; i++) {
            setTimeout(() => {
              window.scrollTo(0, Math.random() * behavior.scrollDistance);
            }, i * behavior.scrollDelay);
          }
        }, scrollBehavior);
        
        await page.waitForTimeout(getRandomDelay(1000, 3000));
        
        // 访问具体车型页面
        await page.goto(car.url, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        // 等待页面完全加载
        await page.waitForTimeout(getRandomDelay(3000, 6000));
        
        // 滚动到配置信息区域
        await page.evaluate(() => {
          // 查找配置信息区域
          const configSection = document.querySelector('.config-section, .price-section, .series-config');
          if (configSection) {
            configSection.scrollIntoView({ behavior: 'smooth' });
          }
        });
        
        await page.waitForTimeout(2000);
        
        // 获取车型配置数据
        const carConfigs = await page.evaluate((carInfo) => {
          const configs = [];
          
          // 获取车型名称
          const carNameSelectors = [
            '.series-name', '.car-name', 'h1', 'h2',
            '.title', '.car-title', '.series-title',
            '[class*="name"]', '[class*="title"]'
          ];
          
          let carName = carInfo.name;
          for (const selector of carNameSelectors) {
            const element = document.querySelector(selector);
            if (element) {
              carName = element.textContent.trim();
              break;
            }
          }
          
          // 获取车型图片
          const imageSelectors = [
            '.car-img', '.series-img', '.main-img',
            '.banner-img', '.hero-img', 'img[src*="car"]'
          ];
          
          let carImage = '';
          for (const selector of imageSelectors) {
            const element = document.querySelector(selector);
            if (element && element.src) {
              carImage = element.src;
              break;
            }
          }
          
          // 查找配置信息
          const configSelectors = [
            '.config-item', '.price-item', '.series-item',
            '.car-config', '.model-item', '.version-item',
            '[class*="config"]', '[class*="price"]', '[class*="model"]'
          ];
          
          let configElements = [];
          for (const selector of configSelectors) {
            configElements = document.querySelectorAll(selector);
            if (configElements.length > 0) {
              console.log(`找到 ${configElements.length} 个配置元素，使用选择器: ${selector}`);
              break;
            }
          }
          
          // 如果找不到配置元素，尝试查找包含价格信息的元素
          if (configElements.length === 0) {
            configElements = document.querySelectorAll('*');
            configElements = Array.from(configElements).filter(el => {
              const text = el.textContent || '';
              return text.includes('万') || text.includes('元') || text.includes('款');
            });
          }
          
          configElements.forEach((element) => {
            try {
              // 查找配置名称
              const configNameSelectors = [
                '.config-name', '.model-name', '.version-name',
                '.name', '.title', 'h3', 'h4', 'h5',
                '[class*="name"]', '[class*="title"]'
              ];
              
              // 查找价格信息
              const priceSelectors = [
                '.price', '.guide-price', '.official-price',
                '.price-value', '.price-text',
                '[class*="price"]'
              ];
              
              let configNameElement = null;
              let priceElement = null;
              
              // 查找配置名称
              for (const selector of configNameSelectors) {
                configNameElement = element.querySelector(selector);
                if (configNameElement) break;
              }
              
              // 查找价格
              for (const selector of priceSelectors) {
                priceElement = element.querySelector(selector);
                if (priceElement) break;
              }
              
              if (configNameElement) {
                const configName = configNameElement.textContent.trim();
                const priceText = priceElement ? priceElement.textContent.trim() : '';
                
                // 提取价格数字
                const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
                const price = priceMatch ? priceMatch[1] + '元' : '价格待定';
                
                // 过滤有效的配置名称
                if (configName && configName.length > 0 && configName.length < 100 && 
                    !configName.includes('广告') && !configName.includes('推广')) {
                  configs.push({
                    id: Date.now() + Math.random(),
                    carName: carName,
                    brand: carInfo.brand,
                    configName: configName,
                    price: price,
                    carImage: carImage,
                    category: '新车',
                    created_at: new Date().toISOString()
                  });
                }
              }
            } catch (error) {
              console.error('解析配置元素失败:', error);
            }
          });
          
          return configs;
        }, car);
        
        carData.push(...carConfigs);
        console.log(`成功收集 ${carConfigs.length} 个 ${car.name} 配置`);
        
        // 使用反爬虫配置的随机延迟
        const randomWait = getRandomDelay(2000, 5000);
        await page.waitForTimeout(randomWait);
        
              } catch (error) {
          console.error(`收集 ${car.name} 失败:`, error.message);
        }
    }
    
    // 尝试使用API接口获取数据
    console.log('尝试使用API接口获取车型数据...');
    try {
      const apiCars = await fetchCarsFromAPI();
      if (apiCars.length > 0) {
        carData.push(...apiCars);
        console.log(`通过API收集到 ${apiCars.length} 个车型数据`);
      }
    } catch (error) {
      console.log('API获取失败，使用备用数据');
    }
    
    // 添加一些热门车型配置作为备用数据
    const fallbackCars = [
      { carName: '比亚迪秦PLUS DM', brand: '比亚迪', configName: '2025款 智驾版 DM-i 55KM 领先型', price: '79800元', category: '新能源车' },
      { carName: '比亚迪秦PLUS DM', brand: '比亚迪', configName: '2025款 智驾版 DM-i 120KM 领先型', price: '89800元', category: '新能源车' },
      { carName: '特斯拉Model 3', brand: '特斯拉', configName: '2024款 后轮驱动版', price: '259900元', category: '新能源车' },
      { carName: '特斯拉Model Y', brand: '特斯拉', configName: '2024款 后轮驱动版', price: '263900元', category: '新能源车' },
      { carName: '比亚迪汉', brand: '比亚迪', configName: '2024款 EV 创世版 715KM 前驱尊荣型', price: '219800元', category: '新能源车' },
      { carName: '奔驰C级', brand: '奔驰', configName: '2024款 C 200 L 运动版', price: '332300元', category: '新车' },
      { carName: '宝马3系', brand: '宝马', configName: '2024款 320i 运动套装', price: '299900元', category: '新车' },
      { carName: '奥迪A4L', brand: '奥迪', configName: '2024款 40 TFSI 时尚动感型', price: '321800元', category: '新车' }
    ];
    
    // 合并数据并去重
    const allCars = [...carData, ...fallbackCars.map(car => ({
      ...car,
      id: Date.now() + Math.random(),
      carImage: car.carImage || '',
      created_at: new Date().toISOString()
    }))];
    
    // 去重（基于车型名称和配置名称）
    const uniqueCars = allCars.filter((car, index, self) => 
      index === self.findIndex(c => c.carName === car.carName && c.configName === car.configName)
    );
    
    // 保存数据到文件
    const dataPath = path.join(__dirname, '..', 'data', 'cars.json');
    fs.writeFileSync(dataPath, JSON.stringify(uniqueCars, null, 2));
    
    console.log(`收集完成！共获取 ${uniqueCars.length} 个车型数据`);
    console.log(`数据已保存到: ${dataPath}`);
    
  } catch (error) {
    console.error('DBT Messenger执行失败:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  collectCarData()
    .then(() => {
      console.log('DBT Messenger执行成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('DBT Messenger执行失败:', error);
      process.exit(1);
    });
}

// API获取车型数据的函数
async function fetchCarsFromAPI() {
  const axios = require('axios');
  const cars = [];
  
  try {
    // 尝试多个可能的API端点
    const apiEndpoints = [
      'https://www.dongchedi.com/motor/pc/car/series/get_car_series_list/?brand_id=1&city_id=201',
      'https://www.dongchedi.com/motor/pc/car/series/get_car_series_list/?brand_id=2&city_id=201',
      'https://www.dongchedi.com/motor/pc/car/series/get_car_series_list/?brand_id=3&city_id=201'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: getRandomHeaders(),
          timeout: 10000
        });
        
        if (response.data && response.data.data) {
          const brandCars = response.data.data.map(car => ({
            id: Date.now() + Math.random(),
            carName: car.series_name || car.name,
            brand: car.brand_name || '未知品牌',
            configName: car.config_name || car.name,
            price: car.price_range || car.guide_price || '价格待定',
            carImage: car.series_img || car.image || '',
            category: '新车',
            created_at: new Date().toISOString()
          }));
          
          cars.push(...brandCars);
        }
        
        // 使用反爬虫配置的随机延迟
        await new Promise(resolve => setTimeout(resolve, getRandomDelay(1000, 3000)));
        
      } catch (error) {
        console.log(`API端点 ${endpoint} 获取失败:`, error.message);
      }
    }
    
  } catch (error) {
    console.log('API获取失败:', error.message);
  }
  
  return cars;
}

module.exports = { collectCarData }; 