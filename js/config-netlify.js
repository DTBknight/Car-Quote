// Netlify配置文件
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
    // 生产环境 - Netlify Functions
    PRODUCTION: {
      BASE_URL: '', // 部署时自动获取Netlify域名
      ENDPOINTS: {
        GENERATE_CONTRACT: '/api/generate-contract',
        HEALTH: '/api/generate-contract'
      }
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
    SERVICE_FEE_RATE: 0.04,
    CURRENCY: 'USD'
  }
};

// 获取当前环境
const getEnvironment = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'DEVELOPMENT';
  }
  return 'PRODUCTION';
};

// 获取API配置
const getApiConfig = () => {
  const env = getEnvironment();
  const config = CONFIG.API[env];
  
  // 如果是生产环境且BASE_URL为空，自动设置为当前域名
  if (env === 'PRODUCTION' && !config.BASE_URL) {
    config.BASE_URL = window.location.origin;
  }
  
  return config;
};

// 获取API URL
const getApiUrl = (endpoint) => {
  const apiConfig = getApiConfig();
  return `${apiConfig.BASE_URL}${apiConfig.ENDPOINTS[endpoint]}`;
};

// 导出配置
export { CONFIG, getEnvironment, getApiConfig, getApiUrl }; 