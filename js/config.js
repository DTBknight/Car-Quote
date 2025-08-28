// 配置文件
const CONFIG = {
  // API配置
  API: {
    // 开发环境
    DEVELOPMENT: {
      BASE_URL: 'http://localhost:5001',
      ENDPOINTS: {
        GENERATE_CONTRACT: '/generate-contract',
        HEALTH: '/health'
      }
    },
    // 生产环境 - Railway后端（备用）
    PRODUCTION: {
      BASE_URL: 'https://dbtknight-production.up.railway.app', // Railway后端域名
      ENDPOINTS: {
        GENERATE_CONTRACT: '/api/generate-contract',
        HEALTH: '/health'
      }
    },
    // 生产环境 - Railway后端
    RAILWAY: {
      BASE_URL: 'https://dbtknight-production.up.railway.app', // Railway后端域名
      ENDPOINTS: {
        GENERATE_CONTRACT: '/api/generate-contract',
        HEALTH: '/health'
      }
    },
    // 汇率API配置
    EXCHANGE_RATE: {
      BASE_URL: 'https://openexchangerates.org/api/latest.json',
      MAIN_APP_ID: '9625bee048bd4599842279906b9ca677', // Open Exchange Rates API密钥
      BACKUP_APP_ID: '145b3ca7abb2474f9e1f30b2ed19b77f' // 备用API密钥
    }
  },
  
  // 应用配置
  APP: {
    NAME: 'Car-Quote',
    VERSION: '2.0.0',
    DEBUG: false
  },
  
  // 功能开关
  FEATURES: {
    CONTRACT_MANAGEMENT: true,
    CAR_CALCULATOR: true,
    EXCHANGE_RATE: true
  },
  
  // 主题配置
  THEMES: {
    NEW_CAR: {
      primary: '#165DFF',
      secondary: '#36CFC9',
      accent: '#FF7D00'
    },
    USED_CAR: {
      primary: '#FF6B35',
      secondary: '#FF8C42',
      accent: '#FF7D00'
    },
    NEW_ENERGY: {
      primary: '#22C55E',
      secondary: '#4ADE80',
      accent: '#FF7D00'
    }
  },
  
  // 计算常量
  CALCULATION: {
    TAX_RATE: 0.13,
    TAX_DIVISOR: 1.13,
    PURCHASE_TAX_RATE: 11.3,
    TAX_REFUND_FEE_RATE: 0.025,
    SERVICE_FEE_RATE: 0.022,
    EXCHANGE_RATE_OFFSET: 0.05,
    NEW_ENERGY_TAX_THRESHOLD: 339000
  },
  
  // 默认值
  DEFAULTS: {
    SERVICE_FEE_RATE: 0.08,
    CURRENCY: 'USD'
  }
};

// 获取当前环境
const getEnvironment = () => {
  const hostname = window.location.hostname;
  
  // 检查是否为开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'DEVELOPMENT';
  }
  
  // 生产环境优先使用Railway后端
  return 'RAILWAY';
};

// 获取API配置
const getApiConfig = () => {
  const env = getEnvironment();
  return CONFIG.API[env];
};

// 获取API URL
const getApiUrl = (endpoint) => {
  const apiConfig = getApiConfig();
  return `${apiConfig.BASE_URL}${apiConfig.ENDPOINTS[endpoint]}`;
};

// 导出配置
export { CONFIG, getEnvironment, getApiConfig, getApiUrl }; 