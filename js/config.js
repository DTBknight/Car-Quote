// 配置文件
const CONFIG = {
  // API配置
  API: {
    EXCHANGE_RATE: {
      BASE_URL: 'https://openexchangerates.org/api/latest.json?symbols=USD,EUR,GBP,CNY',
      MAIN_APP_ID: '9625bee048bd4599842279906b9ca677',
      BACKUP_APP_ID: '145b3ca7abb2474f9e1f30b2ed19b77f'
    },
    CAR_DATA: {
      BRANDS_URL: 'https://dbtknight.netlify.app/data/brands.json',
      BASE_URL: 'https://dbtknight.netlify.app/data/'
    }
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

export default CONFIG; 