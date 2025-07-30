// 配置文件
export const CONFIG = {
  // API配置
  API: {
    MAIN_APP_ID: '9625bee048bd4599842279906b9ca677',
    BACKUP_APP_ID: '145b3ca7abb2474f9e1f30b2ed19b77f',
    BASE_URL: 'https://openexchangerates.org/api/latest.json?symbols=USD,EUR,GBP,CNY'
  },
  
  // 主题颜色配置
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
  
  // 新能源车购置税免征门槛
  NEW_ENERGY_TAX_THRESHOLD: 339000,
  
  // 税率配置
  TAX_RATES: {
    VAT_RATE: 0.13,
    PURCHASE_TAX_RATE: 11.3,
    TAX_REFUND_FEE_RATE: 0.025
  },
  
  // 默认手续费系数
  DEFAULT_SERVICE_FEE_RATE: 0.022,
  
  // 货币配置
  CURRENCIES: {
    USD: { symbol: 'USD', flag: '🇺🇸', name: '美元' },
    EUR: { symbol: 'EUR', flag: '🇪🇺', name: '欧元' },
    GBP: { symbol: 'GBP', flag: '🇬🇧', name: '英镑' }
  }
};

// 表单类型枚举
export const FORM_TYPES = {
  NEW_CAR: 'newCar',
  USED_CAR: 'usedCar',
  NEW_ENERGY: 'newEnergy'
};

// 报价类型枚举
export const QUOTE_TYPES = {
  EXW: 'EXW',
  FOB: 'FOB',
  CIF: 'CIF'
}; 