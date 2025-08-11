import { CONFIG } from './config.js';

// 工具函数模块
export class Utils {
  // 货币格式化配置
  static CURRENCY_CONFIG = {
    CNY: { symbol: '¥', locale: 'zh-CN', currency: 'CNY' },
    USD: { symbol: '$', locale: 'en-US', currency: 'USD' },
    EUR: { symbol: '€', locale: 'de-DE', currency: 'EUR' },
    GBP: { symbol: '£', locale: 'en-GB', currency: 'GBP' }
  };

  // 统一的货币格式化方法
  static formatCurrency(value, currency = 'CNY', showDecimals = true) {
    if (isNaN(value) || value === '' || value === null) return '0.00';
    
    const config = this.CURRENCY_CONFIG[currency] || this.CURRENCY_CONFIG.CNY;
    
    const options = {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    };
    
    return new Intl.NumberFormat(config.locale, options).format(value);
  }
  
  // 格式化数字为货币格式（保留小数点）
  static formatCurrencyWithDecimals(value, currency = 'CNY') {
    return this.formatCurrency(value, currency, true);
  }
  
  // 格式化数字为整数货币格式（不显示小数点）
  static formatCurrencyInteger(value, currency = 'CNY') {
    return this.formatCurrency(value, currency, false);
  }
  
  // 安全解析数字
  static parseFloat(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  // 防抖函数
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        try {
          func(...args);
        } catch (e) {
          if (CONFIG?.APP?.DEBUG) console.warn('debounce 执行出错:', e);
        }
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 节流函数
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // 获取DOM元素（带缓存）
  static elementCache = new Map();
  static getElement(id) {
    if (!this.elementCache.has(id)) {
      this.elementCache.set(id, document.getElementById(id));
    }
    return this.elementCache.get(id);
  }
  
  // 清除元素缓存
  static clearElementCache() {
    this.elementCache.clear();
  }
  
  // 获取DOM元素值
  static getElementValue(id, defaultValue = 0) {
    const element = this.getElement(id);
    return element ? this.parseFloat(element.value, defaultValue) : defaultValue;
  }
  
  // 设置DOM元素值
  static setElementValue(id, value) {
    const element = this.getElement(id);
    if (element) {
      element.value = value;
    }
  }
  
  // 设置DOM元素文本内容
  static setElementText(id, text) {
    const element = this.getElement(id);
    if (element) {
      element.textContent = text;
    }
  }
  
  // 触发DOM事件
  static triggerEvent(elementId, eventType = 'input') {
    const element = this.getElement(elementId);
    if (element) {
      element.dispatchEvent(new Event(eventType));
    }
  }
  
  // 显示/隐藏元素
  static toggleElement(id, show) {
    const element = this.getElement(id);
    if (element) {
      if (show) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  }
  
  // 添加CSS类
  static addClass(id, className) {
    const element = this.getElement(id);
    if (element) {
      element.classList.add(className);
    }
  }
  
  // 移除CSS类
  static removeClass(id, className) {
    const element = this.getElement(id);
    if (element) {
      element.classList.remove(className);
    }
  }
  
  // 更新CSS变量
  static updateCSSVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
  }
  
  // 货币标志映射
  static getCurrencyFlag(currency) {
    const flags = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧',
      'CNY': '🇨🇳'
    };
    return flags[currency] || '🇺🇸';
  }
  
  // 货币名称映射
  static getCurrencyName(currency) {
    const names = {
      'USD': '美元 (USD)',
      'EUR': '欧元 (EUR)',
      'GBP': '英镑 (GBP)',
      'CNY': '人民币 (CNY)'
    };
    return names[currency] || '美元 (USD)';
  }
  
  // 深拷贝对象
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }
  
  // 生成唯一ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 