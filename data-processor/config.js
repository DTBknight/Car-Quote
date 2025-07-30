// 配置文件 - 运行时配置
module.exports = {
  // 目标网站配置
  targetSite: {
    baseUrl: process.env.TARGET_BASE_URL || 'https://www.example.com',
    apiBaseUrl: process.env.TARGET_API_BASE_URL || 'https://www.example.com'
  },
  
  // 爬虫配置
  crawler: {
    // 并发控制
    maxConcurrency: parseInt(process.env.MAX_CONCURRENCY) || 4,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    timeout: parseInt(process.env.TIMEOUT) || 60000,
    
    // 延迟配置
    minDelay: parseInt(process.env.MIN_DELAY) || 2000,
    maxDelay: parseInt(process.env.MAX_DELAY) || 5000,
    
    // 浏览器配置
    headless: process.env.HEADLESS !== 'false',
    noSandbox: process.env.NO_SANDBOX !== 'false',
    
    // 资源拦截
    blockImages: process.env.BLOCK_IMAGES !== 'false',
    blockStylesheets: process.env.BLOCK_STYLESHEETS !== 'false',
    blockFonts: process.env.BLOCK_FONTS !== 'false',
    
    // 缓存配置
    enableCache: process.env.ENABLE_CACHE !== 'false',
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT) || 3600000 // 1小时
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/crawler.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },
  
  // 数据验证配置
  validation: {
    minCarsPerBrand: parseInt(process.env.MIN_CARS_PER_BRAND) || 1,
    requireImages: process.env.REQUIRE_IMAGES !== 'false',
    requirePrices: process.env.REQUIRE_PRICES !== 'false'
  },
  
  // 车型系列配置
  carSeries: [
    { 
      name: '比亚迪秦PLUS DM', 
      seriesId: '4802',
      brand: '比亚迪'
    },
    { 
      name: '特斯拉Model 3', 
      seriesId: '4803',
      brand: '特斯拉'
    },
    { 
      name: '特斯拉Model Y', 
      seriesId: '4804',
      brand: '特斯拉'
    },
    { 
      name: '比亚迪汉', 
      seriesId: '4805',
      brand: '比亚迪'
    },
    { 
      name: '奔驰C级', 
      seriesId: '4806',
      brand: '奔驰'
    },
    { 
      name: '宝马3系', 
      seriesId: '4807',
      brand: '宝马'
    },
    { 
      name: '奥迪A4L', 
      seriesId: '4808',
      brand: '奥迪'
    }
  ],
  
  // API端点配置
  apiEndpoints: [
    '/motor/pc/car/series/get_car_series_list/?brand_id=1&city_id=201',
    '/motor/pc/car/series/get_car_series_list/?brand_id=2&city_id=201',
    '/motor/pc/car/series/get_car_series_list/?brand_id=3&city_id=201'
  ]
}; 