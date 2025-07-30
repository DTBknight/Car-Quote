import CONFIG from './config.js';

// 工具函数模块
export class Utils {
  // 格式化数字为货币格式
  static formatCurrency(value, currency = 'CNY') {
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
  static formatCurrencyInteger(value, currency = 'CNY') {
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
  static parseFloat(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  // 获取DOM元素
  static getElement(id) {
    return document.getElementById(id);
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
      'GBP': '🇬🇧'
    };
    return flags[currency] || '🇺🇸';
  }
  
  // 货币名称映射
  static getCurrencyName(currency) {
    const names = {
      'USD': '美元 (USD)',
      'EUR': '欧元 (EUR)',
      'GBP': '英镑 (GBP)'
    };
    return names[currency] || '美元 (USD)';
  }
} 