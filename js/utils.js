import { CONFIG } from './config.js';

// 格式化数字为货币格式
export function formatCurrency(value, currency = 'CNY') {
  if (isNaN(value) || value === '' || value === null) return '0.00';
  
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  
  if (currency === 'CNY') {
    options.style = 'currency';
    options.currency = 'CNY';
  } else if (currency === 'USD') {
    options.style = 'currency';
    options.currency = 'USD';
  } else if (currency === 'EUR') {
    options.style = 'currency';
    options.currency = 'EUR';
  } else if (currency === 'GBP') {
    options.style = 'currency';
    options.currency = 'GBP';
  }
  
  return new Intl.NumberFormat('zh-CN', options).format(value);
}

// 格式化数字为整数货币格式（不显示小数点）
export function formatCurrencyInteger(value, currency = 'CNY') {
  if (isNaN(value) || value === '' || value === null) return '¥0';
  
  const options = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  if (currency === 'CNY') {
    options.style = 'currency';
    options.currency = 'CNY';
  } else if (currency === 'USD') {
    options.style = 'currency';
    options.currency = 'USD';
  } else if (currency === 'EUR') {
    options.style = 'currency';
    options.currency = 'EUR';
  } else if (currency === 'GBP') {
    options.style = 'currency';
    options.currency = 'GBP';
  }
  
  return new Intl.NumberFormat('zh-CN', options).format(value);
}

// 安全解析数字
export function safeParseFloat(value, defaultValue = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// 验证输入值
export function validateInput(value, min = 0, max = Infinity) {
  const num = safeParseFloat(value);
  return num >= min && num <= max;
}

// 防抖函数
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// 深拷贝对象
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 本地存储工具
export const Storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  }
}; 