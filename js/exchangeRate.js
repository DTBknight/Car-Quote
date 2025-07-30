import CONFIG from './config.js';
import { Utils } from './utils.js';

// 汇率管理模块
export class ExchangeRateManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    this.retryAttempts = 3; // 重试次数
    this.retryDelay = 1000; // 重试延迟（毫秒）
    this.fallbackRates = {
      USD: 7.2,
      EUR: 7.8,
      GBP: 9.1
    };
  }
  
  // 获取汇率（通用方法）
  async fetchExchangeRate(currency, formType = 'new') {
    const cacheKey = `${currency}_${formType}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      this.updateUI(currency, cached.rate, formType);
      return cached.rate;
    }
    
    try {
      const rate = await this.fetchFromAPIWithRetry(currency);
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      this.updateUI(currency, rate, formType);
      return rate;
    } catch (error) {
      console.error('获取汇率失败:', error);
      // 使用降级汇率
      const fallbackRate = this.getFallbackRate(currency);
      this.updateUI(currency, fallbackRate, formType, true);
      return fallbackRate;
    }
  }
  
  // 带重试机制的API获取
  async fetchFromAPIWithRetry(currency) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.fetchFromAPI(currency);
      } catch (error) {
        lastError = error;
        console.warn(`汇率API请求失败 (尝试 ${attempt}/${this.retryAttempts}):`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // 递增延迟
        }
      }
    }
    
    throw lastError;
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 从API获取汇率
  async fetchFromAPI(currency) {
    const { BASE_URL, MAIN_APP_ID, BACKUP_APP_ID } = CONFIG.API.EXCHANGE_RATE;
    
    try {
      const response = await fetch(`${BASE_URL}&app_id=${MAIN_APP_ID}`);
      if (response.status === 403) {
        throw new Error('403');
      }
      const data = await response.json();
      
      if (!data || !data.rates) {
        throw new Error('no rates');
      }
      
      return this.calculateRate(data.rates, currency);
    } catch (error) {
      // 尝试备用API
      console.warn('主API失败，尝试备用API:', error.message);
      const response = await fetch(`${BASE_URL}&app_id=${BACKUP_APP_ID}`);
      if (response.status === 403) {
        throw new Error('403');
      }
      const data = await response.json();
      
      if (!data || !data.rates) {
        throw new Error('no rates');
      }
      
      return this.calculateRate(data.rates, currency);
    }
  }
  
  // 计算汇率
  calculateRate(rates, currency) {
    let rate = 0;
    if (currency === 'USD') {
      rate = rates.CNY / rates.USD;
    } else if (currency === 'EUR') {
      rate = rates.CNY / rates.EUR;
    } else if (currency === 'GBP') {
      rate = rates.CNY / rates.GBP;
    }
    
    // 验证汇率是否合理
    if (rate <= 0 || rate > 20) {
      throw new Error('Invalid rate');
    }
    
    return rate;
  }
  
  // 获取降级汇率
  getFallbackRate(currency) {
    return this.fallbackRates[currency] || this.fallbackRates.USD;
  }
  
  // 更新UI
  updateUI(currency, rate, formType, isFallback = false) {
    const adjustedRate = rate - CONFIG.CALCULATION.EXCHANGE_RATE_OFFSET;
    const rateText = isFallback ? `${rate.toFixed(2)} (离线)` : rate.toFixed(2);
    
    if (formType === 'new') {
      Utils.setElementText('exchangeRateLabel', `汇率 实时基准：${rateText}`);
      Utils.setElementValue('exchangeRate', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency);
    } else if (formType === 'used') {
      Utils.setElementText('exchangeRateLabelUsed', `汇率 实时基准：${rateText}`);
      Utils.setElementValue('exchangeRateUsed', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency, 'used');
    } else if (formType === 'newEnergy') {
      Utils.setElementText('exchangeRateLabelNewEnergy', `汇率 实时基准：${rateText}`);
      Utils.setElementValue('exchangeRateNewEnergy', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency, 'newEnergy');
    }
  }
  
  // 处理错误
  handleError(formType) {
    const fallbackRate = this.getFallbackRate('USD');
    this.updateUI('USD', fallbackRate, formType, true);
  }
  
  // 更新货币标签
  updateCurrencyLabels(currency, formType = 'new') {
    const flag = Utils.getCurrencyFlag(currency);
    
    if (formType === 'new') {
      Utils.setElementText('currencyFlag', flag);
    } else if (formType === 'used') {
      Utils.setElementText('currencyFlagUsed', flag);
    } else if (formType === 'newEnergy') {
      Utils.setElementText('currencyFlagNewEnergy', flag);
    }
  }
  
  // 初始化汇率
  async initializeExchangeRates() {
    const currency = CONFIG.DEFAULTS.CURRENCY;
    try {
      await Promise.allSettled([
        this.fetchExchangeRate(currency, 'new'),
        this.fetchExchangeRate(currency, 'used'),
        this.fetchExchangeRate(currency, 'newEnergy')
      ]);
    } catch (error) {
      console.error('初始化汇率失败:', error);
    }
  }
  
  // 清除缓存
  clearCache() {
    this.cache.clear();
  }
  
  // 获取缓存状态
  getCacheStatus() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        age: Date.now() - value.timestamp
      }))
    };
  }
  
  // 手动刷新汇率
  async refreshExchangeRates() {
    this.clearCache();
    await this.initializeExchangeRates();
  }
  
  // 设置降级汇率
  setFallbackRates(rates) {
    this.fallbackRates = { ...this.fallbackRates, ...rates };
  }
  
  // 清理资源
  cleanup() {
    this.clearCache();
  }
} 