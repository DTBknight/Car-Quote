import { CONFIG } from './config.js';
import { Utils } from './utils.js';

// 汇率管理模块
export class ExchangeRateManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24小时缓存（一天）
    this.retryAttempts = 3; // 重试次数
    this.retryDelay = 1000; // 重试延迟（毫秒）
    this.fallbackRates = {
      USD: 7.2,
      EUR: 7.8,
      GBP: 9.1
    };
    this.storageKey = 'exchangeRatesCache';
    this.lastUpdateKey = 'exchangeRatesLastUpdate';
    
    // 初始化时加载缓存
    this.loadCacheFromStorage();
  }
  
  // 从本地存储加载缓存
  loadCacheFromStorage() {
    try {
      const cachedData = localStorage.getItem(this.storageKey);
      const lastUpdate = localStorage.getItem(this.lastUpdateKey);
      
      if (cachedData && lastUpdate) {
        const data = JSON.parse(cachedData);
        const lastUpdateTime = parseInt(lastUpdate);
        const now = Date.now();
        
        // 检查缓存是否在24小时内
        if (now - lastUpdateTime < this.cacheTimeout) {
          console.log('📦 从本地存储加载汇率缓存');
          this.cache = new Map(Object.entries(data));
          return true;
        } else {
          console.log('⏰ 汇率缓存已过期，需要重新获取');
        }
      }
    } catch (error) {
      console.warn('⚠️ 加载汇率缓存失败:', error);
    }
    return false;
  }
  
  // 保存缓存到本地存储
  saveCacheToStorage() {
    try {
      const cacheData = Object.fromEntries(this.cache);
      localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
      localStorage.setItem(this.lastUpdateKey, Date.now().toString());
      console.log('💾 汇率缓存已保存到本地存储');
    } catch (error) {
      console.warn('⚠️ 保存汇率缓存失败:', error);
    }
  }
  
  // 获取汇率（通用方法）
  async fetchExchangeRate(currency, formType = 'new') {
    const cacheKey = `${currency}_${formType}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`📦 使用缓存的汇率: ${currency}`);
      this.updateUI(currency, cached.rate, formType);
      return cached.rate;
    }
    
    // 检查是否有全局汇率数据
    const globalKey = `global_${currency}`;
    const globalCached = this.cache.get(globalKey);
    
    if (globalCached && (Date.now() - globalCached.timestamp) < this.cacheTimeout) {
      console.log(`📦 使用全局缓存的汇率: ${currency}`);
      this.cache.set(cacheKey, globalCached);
      this.updateUI(currency, globalCached.rate, formType);
      return globalCached.rate;
    }
    
    // 需要获取新的汇率数据
    try {
      console.log(`🔄 获取新的汇率数据: ${currency}`);
      const rate = await this.fetchFromAPIWithRetry(currency);
      
      // 同时保存到全局缓存和特定缓存
      const cacheData = { rate, timestamp: Date.now() };
      this.cache.set(globalKey, cacheData);
      this.cache.set(cacheKey, cacheData);
      
      // 保存到本地存储
      this.saveCacheToStorage();
      
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
    const { PRIMARY, BACKUP_1, BACKUP_2, BACKUP_3 } = CONFIG.API.EXCHANGE_RATE;
    
    // 尝试主API
    try {
      console.log('🔄 尝试主API: Open Exchange Rates');
      const response = await fetch(`${PRIMARY.BASE_URL}?app_id=${PRIMARY.APP_ID}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          return this.calculateRate(data.rates, currency);
        }
      }
      
      if (response.status === 403) {
        console.warn('⚠️ 主API超额，切换到备用API');
      }
    } catch (error) {
      console.warn('⚠️ 主API失败:', error.message);
    }
    
    // 尝试备用API列表
    const backupAPIs = [
      { name: 'Exchange Rate API', url: `${BACKUP_1.BASE_URL}/${BACKUP_1.API_KEY}/latest/CNY`, handler: this.parseExchangeRateAPI },
      { name: 'Rates API', url: BACKUP_2.BASE_URL, handler: this.parseRatesAPI },
      { name: 'Frankfurter API', url: BACKUP_3.BASE_URL, handler: this.parseFrankfurterAPI }
    ];
    
    for (const api of backupAPIs) {
      try {
        console.log(`🔄 尝试备用API: ${api.name}`);
        const response = await fetch(api.url);
        
        if (response.ok) {
          const data = await response.json();
          const rate = await api.handler.call(this, data, currency);
          if (rate) {
            console.log(`✅ 成功从 ${api.name} 获取汇率`);
            return rate;
          }
        }
      } catch (error) {
        console.warn(`⚠️ ${api.name} 失败:`, error.message);
      }
    }
    
    throw new Error('所有API都失败了');
  }
  
  // 解析 Exchange Rate API 响应
  async parseExchangeRateAPI(data, currency) {
    // 处理 v6 版本的响应格式
    if (data && data.conversion_rates && data.conversion_rates[currency]) {
      return data.conversion_rates[currency];
    }
    // 兼容旧版本的响应格式
    if (data && data.rates && data.rates[currency]) {
      return data.rates[currency];
    }
    return null;
  }
  
  // 解析 Rates API 响应
  async parseRatesAPI(data, currency) {
    if (data && data.rates && data.rates[currency]) {
      return data.rates[currency];
    }
    return null;
  }
  
  // 解析 Frankfurter API 响应
  async parseFrankfurterAPI(data, currency) {
    if (data && data.rates && data.rates[currency]) {
      return data.rates[currency];
    }
    return null;
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
    const currencyText = currency || 'USD';
    
    // 更新货币标志
    if (formType === 'new') {
      Utils.setElementText('currencyFlag', flag);
    } else if (formType === 'used') {
      Utils.setElementText('currencyFlagUsed', flag);
    } else if (formType === 'newEnergy') {
      Utils.setElementText('currencyFlagNewEnergy', flag);
    }
    
    // 更新所有相关标签文本
    const profitRateLabels = [
      document.querySelector('label[for="profitRate"]'),
      document.querySelector('label[for="usedProfitRate"]'),
      document.querySelector('label[for="newEnergyProfitRate"]')
    ];
    
    profitRateLabels.forEach(label => {
      if (label) {
        label.textContent = `外币利润 (${currencyText})`;
      }
    });
    
    const costPriceLabels = [
      document.querySelector('label[for="costPrice"]'),
      document.querySelector('label[for="costPriceUsed"]'),
      document.querySelector('label[for="costPriceNewEnergy"]')
    ];
    
    costPriceLabels.forEach(label => {
      if (label) {
        label.textContent = `成本价格 (${currencyText})`;
      }
    });
    
    const finalQuoteLabels = [
      document.querySelector('label[for="finalQuote"]'),
      document.querySelector('label[for="finalQuoteUsed"]'),
      document.querySelector('label[for="finalQuoteNewEnergy"]')
    ];
    
    finalQuoteLabels.forEach(label => {
      if (label) {
        label.textContent = `最终报价 (${currencyText})`;
      }
    });
  }
  
  // 初始化汇率系统
  async initializeExchangeRates() {
    console.log('🚀 初始化汇率系统...');
    
    // 默认显示美元汇率
    const defaultCurrency = 'USD';
    const formTypes = ['new', 'used', 'newEnergy'];
    
    // 优先设置美元为默认显示
    for (const formType of formTypes) {
      try {
        // 先尝试从缓存获取美元汇率
        const cacheKey = `${defaultCurrency}_${formType}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
          console.log(`📦 使用缓存的美元汇率: ${cached.rate}`);
          this.updateUI(defaultCurrency, cached.rate, formType);
        } else {
          // 使用降级汇率确保立即显示
          const fallbackRate = this.getFallbackRate(defaultCurrency);
          this.updateUI(defaultCurrency, fallbackRate, formType, true);
          console.log(`✅ 默认汇率设置完成: ${defaultCurrency} (${formType}) - 使用降级汇率`);
        }
      } catch (error) {
        console.warn(`默认汇率设置失败 ${defaultCurrency} ${formType}:`, error);
        // 使用降级汇率
        const fallbackRate = this.getFallbackRate(defaultCurrency);
        this.updateUI(defaultCurrency, fallbackRate, formType, true);
      }
    }
    
    // 后台初始化所有汇率数据
    try {
      await this.initializeAllExchangeRates();
      
      // 后台加载其他货币汇率（不立即显示）
      const otherCurrencies = ['EUR', 'GBP'];
      for (const currency of otherCurrencies) {
        for (const formType of formTypes) {
          try {
            await this.fetchExchangeRate(currency, formType);
          } catch (error) {
            console.warn(`后台汇率加载失败 ${currency} ${formType}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('后台汇率初始化失败，但不影响默认显示:', error);
    }
    
    console.log('✅ 汇率系统初始化完成');
  }
  
  // 初始化所有汇率（一天只执行一次）
  async initializeAllExchangeRates() {
    console.log('🚀 初始化汇率系统...');
    
    // 检查是否需要更新
    const lastUpdate = localStorage.getItem(this.lastUpdateKey);
    if (lastUpdate) {
      const lastUpdateTime = parseInt(lastUpdate);
      const now = Date.now();
      
      if (now - lastUpdateTime < this.cacheTimeout) {
        console.log('📦 汇率数据仍然有效，无需重新获取');
        return;
      }
    }
    
    console.log('🔄 开始获取所有汇率数据...');
    
    // 获取所有支持的货币汇率
    const currencies = ['USD', 'EUR', 'GBP'];
    const ratePromises = currencies.map(async (currency) => {
      try {
        const rate = await this.fetchFromAPIWithRetry(currency);
        const globalKey = `global_${currency}`;
        this.cache.set(globalKey, { rate, timestamp: Date.now() });
        console.log(`✅ ${currency} 汇率获取成功: ${rate}`);
        return { currency, rate, success: true };
      } catch (error) {
        console.error(`❌ ${currency} 汇率获取失败:`, error);
        return { currency, success: false, error };
      }
    });
    
    // 等待所有汇率获取完成
    const results = await Promise.allSettled(ratePromises);
    
    // 统计结果
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const totalCount = currencies.length;
    
    console.log(`📊 汇率获取完成: ${successCount}/${totalCount} 成功`);
    
    // 保存到本地存储
    this.saveCacheToStorage();
    
    return results;
  }
  
  // 获取缓存状态信息
  getCacheStatus() {
    const lastUpdate = localStorage.getItem(this.lastUpdateKey);
    const cachedData = localStorage.getItem(this.storageKey);
    
    if (!lastUpdate || !cachedData) {
      return {
        hasCache: false,
        lastUpdate: null,
        cacheAge: null,
        isValid: false
      };
    }
    
    const lastUpdateTime = parseInt(lastUpdate);
    const now = Date.now();
    const cacheAge = now - lastUpdateTime;
    const isValid = cacheAge < this.cacheTimeout;
    
    return {
      hasCache: true,
      lastUpdate: new Date(lastUpdateTime),
      cacheAge: cacheAge,
      isValid: isValid,
      cacheSize: cachedData.length
    };
  }
  
  // 清除所有缓存
  clearAllCache() {
    this.cache.clear();
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.lastUpdateKey);
    console.log('🗑️ 所有汇率缓存已清除');
  }
  
  // 强制刷新汇率
  async forceRefreshRates() {
    console.log('🔄 强制刷新汇率数据...');
    this.clearAllCache();
    return await this.initializeAllExchangeRates();
  }
  
  // 设置降级汇率
  setFallbackRates(rates) {
    this.fallbackRates = { ...this.fallbackRates, ...rates };
  }
  
  // 清理资源
  cleanup() {
    this.clearCache();
  }


  
  // 获取汇率统计信息
  getExchangeRateStats() {
    const status = this.getCacheStatus();
    const cacheEntries = Array.from(this.cache.entries());
    
    return {
      cacheStatus: status,
      cacheEntries: cacheEntries.length,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      lastUpdate: status.lastUpdate,
      isValid: status.isValid,
      cacheAge: status.cacheAge
    };
  }
} 