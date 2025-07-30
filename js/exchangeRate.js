import CONFIG from './config.js';
import { Utils } from './utils.js';

// 汇率管理模块
export class ExchangeRateManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
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
      const rate = await this.fetchFromAPI(currency);
      this.cache.set(cacheKey, { rate, timestamp: Date.now() });
      this.updateUI(currency, rate, formType);
      return rate;
    } catch (error) {
      console.error('获取汇率失败:', error);
      this.handleError(formType);
      throw error;
    }
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
    return rate;
  }
  
  // 更新UI
  updateUI(currency, rate, formType) {
    const adjustedRate = rate - CONFIG.CALCULATION.EXCHANGE_RATE_OFFSET;
    
    if (formType === 'new') {
      Utils.setElementText('exchangeRateLabel', `汇率 实时基准：${rate.toFixed(2)}`);
      Utils.setElementValue('exchangeRate', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency);
    } else if (formType === 'used') {
      Utils.setElementText('exchangeRateLabelUsed', `汇率 实时基准：${rate.toFixed(2)}`);
      Utils.setElementValue('exchangeRateUsed', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency, 'used');
    } else if (formType === 'newEnergy') {
      Utils.setElementText('exchangeRateLabelNewEnergy', `汇率 实时基准：${rate.toFixed(2)}`);
      Utils.setElementValue('exchangeRateNewEnergy', adjustedRate.toFixed(2));
      this.updateCurrencyLabels(currency, 'newEnergy');
    }
  }
  
  // 处理错误
  handleError(formType) {
    if (formType === 'new') {
      Utils.setElementValue('exchangeRate', '');
      Utils.setElementText('exchangeRateLabel', '汇率 实时基准：获取失败');
    } else if (formType === 'used') {
      Utils.setElementValue('exchangeRateUsed', '');
      Utils.setElementText('exchangeRateLabelUsed', '汇率 实时基准：获取失败');
    } else if (formType === 'newEnergy') {
      Utils.setElementValue('exchangeRateNewEnergy', '');
      Utils.setElementText('exchangeRateLabelNewEnergy', '汇率 实时基准：获取失败');
    }
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
      await Promise.all([
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
} 