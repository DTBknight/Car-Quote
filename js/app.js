import CONFIG from './config.js';
import { Utils } from './utils.js';
import { ExchangeRateManager } from './exchangeRate.js';
import { ThemeManager } from './themeManager.js';
import { CalculationEngine } from './calculationEngine.js';
import { EventManager } from './eventManager.js';
import { CarSearch } from './carSearch.js';
import { ContractManager } from './contractManager.js';
import { LoadingManager } from './loadingManager.js';

// 主应用类
export class CarQuoteApp {
  constructor() {
    this.loadingManager = new LoadingManager();
    this.exchangeRateManager = new ExchangeRateManager();
    this.themeManager = new ThemeManager();
    this.calculationEngine = new CalculationEngine();
    this.eventManager = new EventManager(
      this.calculationEngine,
      this.exchangeRateManager,
      this.themeManager
    );
    this.carSearch = new CarSearch();
    this.contractManager = new ContractManager();
    this.initialized = false;
    this.performanceMetrics = {
      initTime: 0,
      memoryUsage: 0,
      lastUpdate: Date.now()
    };
  }
  
  // 初始化应用
  async initialize() {
    const startTime = performance.now();
    
    try {
      // 开始加载动画
      this.loadingManager.startLoading();
      console.log('🚗 汽车报价系统初始化中...');
      
      // 1. 先设置默认值
      this.loadingManager.nextStep();
      this.setDefaultValues();
      
      // 2. 初始化主题
      this.loadingManager.nextStep();
      this.themeManager.initializeTheme();
      
      // 3. 并行初始化汇率和车辆搜索
      this.loadingManager.nextStep();
      await Promise.allSettled([
        this.exchangeRateManager.initializeExchangeRates(),
        this.carSearch.initialize()
      ]);
      
      // 4. 初始化事件监听器
      this.loadingManager.nextStep();
      this.eventManager.initializeEvents();
      
      // 5. 显示汇率区域
      this.showCurrencySection();
      
      // 6. 统一触发一次新车全表单计算，避免页面闪烁
      this.calculationEngine.calculateNewCarAll();

      // 7. 初始化卡片悬浮效果
      this.loadingManager.nextStep();
      this.initCardHoverEffects();

      // 8. 合同管理模块已在构造函数中初始化

      this.initialized = true;
      this.performanceMetrics.initTime = performance.now() - startTime;
      this.performanceMetrics.lastUpdate = Date.now();
      
      console.log('✅ 汽车报价系统初始化完成');
      console.log(`⏱️ 初始化耗时: ${this.performanceMetrics.initTime.toFixed(2)}ms`);
      
      // 定期清理缓存
      this.startCacheCleanup();
      
      // 完成加载动画
      await this.loadingManager.completeLoading();
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      this.loadingManager.showError(error.message);
      throw error;
    }
  }
  
  // 设置默认值
  setDefaultValues() {
    // 设置手续费滑块默认值
    const serviceFeeRate = Utils.getElement('serviceFeeRate');
    const serviceFeeRateValue = Utils.getElement('serviceFeeRateValue');
    
    if (serviceFeeRate && serviceFeeRateValue) {
      serviceFeeRate.value = CONFIG.DEFAULTS.SERVICE_FEE_RATE;
      serviceFeeRateValue.textContent = CONFIG.DEFAULTS.SERVICE_FEE_RATE;
    }
    
    // 设置默认货币
    const currencySelects = ['currency', 'currencyUsed', 'currencyNewEnergy'];
    currencySelects.forEach(currencyId => {
      const select = Utils.getElement(currencyId);
      if (select) {
        select.value = CONFIG.DEFAULTS.CURRENCY;
      }
    });
    
    // 设置默认表单类型为新车
    this.setDefaultFormType();
  }
  
  // 设置默认表单类型
  setDefaultFormType() {
    // 激活新车按钮
    const newCarBtn = document.querySelector('[data-type="new"]');
    if (newCarBtn) {
      newCarBtn.classList.remove('border-gray-300', 'text-gray-700');
      newCarBtn.classList.add('border-primary', 'text-primary');
    }
    
    // 显示新车表单
    Utils.toggleElement('newCarForm', true);
    Utils.addClass('newCarForm', 'animate-fadeIn');
    
    // 隐藏其他表单
    Utils.toggleElement('usedCarForm', false);
    Utils.toggleElement('newEnergyForm', false);
    
    // 重新初始化卡片悬浮效果（确保动态内容也有悬浮效果）
    setTimeout(() => {
      this.initCardHoverEffects();
    }, 100);
  }
  
  // 显示汇率区域
  showCurrencySection() {
    const currencySection = Utils.getElement('currencySection');
    if (currencySection) {
      Utils.toggleElement('currencySection', true);
    }
  }
  
  // 获取应用状态
  getAppState() {
    return {
      initialized: this.initialized,
      currentTheme: this.themeManager.getCurrentTheme(),
      exchangeRateCache: this.exchangeRateManager.cache.size,
      carsLoaded: this.carSearch.allCarsLoaded,
      searchHistoryCount: this.carSearch.searchHistory.length,
      calculationCacheSize: this.calculationEngine.calculationCache.size,
      performanceMetrics: this.performanceMetrics
    };
  }
  
  // 重置应用
  async reset() {
    try {
      console.log('🔄 开始重置应用...');
      
      // 清除所有缓存
      this.exchangeRateManager.clearCache();
      this.calculationEngine.clearCache();
      this.carSearch.searchCache.clear();
      
      // 重新初始化汇率
      await this.exchangeRateManager.initializeExchangeRates();
      
      // 重新设置默认值
      this.setDefaultValues();
      
      console.log('✅ 应用重置完成');
    } catch (error) {
      console.error('❌ 应用重置失败:', error);
    }
  }
  
  // 初始化卡片悬浮效果
  initCardHoverEffects() {
    console.log('🎨 初始化卡片悬浮效果...');
    
    const cards = document.querySelectorAll('.bg-gray-50.p-6.rounded-lg.border.border-gray-200');
    
    cards.forEach(card => {
      // 跳过搜索卡片，因为它已经有search-card类
      if (card.classList.contains('search-card')) {
        return;
      }
      
      // 添加悬浮类
      if (!card.classList.contains('card-hover')) {
        card.classList.add('card-hover');
      }
      
      // 添加点击悬浮动画
      card.addEventListener('click', function(e) {
        // 如果点击的是输入框、按钮或其他交互元素，不触发悬浮效果
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'BUTTON' || 
            e.target.tagName === 'SELECT' || 
            e.target.tagName === 'LABEL' ||
            e.target.closest('input') ||
            e.target.closest('button') ||
            e.target.closest('select') ||
            e.target.closest('label')) {
          return;
        }
        
        // 移除之前的动画类
        card.classList.remove('card-float');
        
        // 触发重排以重新开始动画
        void card.offsetWidth;
        
        // 添加悬浮动画类
        card.classList.add('card-float');
        
        // 动画结束后移除类
        setTimeout(() => {
          card.classList.remove('card-float');
        }, 600);
      });
    });
    
    console.log(`✅ 已为 ${cards.length} 个卡片添加悬浮效果`);
  }
  
  // 开始缓存清理
  startCacheCleanup() {
    // 每10分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
  }
  
  // 清理过期缓存
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // 清理汇率缓存
    for (const [key, value] of this.exchangeRateManager.cache.entries()) {
      if (now - value.timestamp > this.exchangeRateManager.cacheTimeout) {
        this.exchangeRateManager.cache.delete(key);
        cleanedCount++;
      }
    }
    
    // 清理计算缓存
    for (const [key, value] of this.calculationEngine.calculationCache.entries()) {
      if (now - value.timestamp > this.calculationEngine.cacheTimeout) {
        this.calculationEngine.calculationCache.delete(key);
        cleanedCount++;
      }
    }
    
    // 清理搜索缓存
    for (const [key, value] of this.carSearch.searchCache.entries()) {
      if (now - value.timestamp > this.carSearch.cacheTimeout) {
        this.carSearch.searchCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`);
    }
  }
  
  // 获取性能指标
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      memoryUsage: this.getMemoryUsage(),
      cacheSizes: {
        exchangeRate: this.exchangeRateManager.cache.size,
        calculation: this.calculationEngine.calculationCache.size,
        search: this.carSearch.searchCache.size,
        element: Utils.elementCache.size
      }
    };
  }
  
  // 获取内存使用情况
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
  
  // 导出应用实例（用于调试）
  static getInstance() {
    if (!CarQuoteApp.instance) {
      CarQuoteApp.instance = new CarQuoteApp();
    }
    return CarQuoteApp.instance;
  }
  
  // 清理资源
  cleanup() {
    try {
      console.log('🧹 开始清理应用资源...');
      
      // 清理各个模块
      this.exchangeRateManager.cleanup();
      this.calculationEngine.cleanup();
      this.carSearch.cleanup();
      this.eventManager.cleanup();
      
      // 清理工具类缓存
      Utils.clearElementCache();
      
      console.log('✅ 应用资源清理完成');
    } catch (error) {
      console.error('❌ 应用资源清理失败:', error);
    }
  }
}

// 全局应用实例
let app;

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    app = CarQuoteApp.getInstance();
    await app.initialize();
    
    // 将应用实例挂载到全局对象（用于调试）
    window.carQuoteApp = app;
    
    console.log('🎉 汽车报价系统已就绪');
    
    // 输出性能指标
    setTimeout(() => {
      const metrics = app.getPerformanceMetrics();
      console.log('📊 性能指标:', metrics);
    }, 1000);
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
  }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (app) {
    app.cleanup();
  }
});

// 页面可见性变化时处理
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // 页面隐藏时，可以暂停一些非关键操作
    console.log('📱 页面已隐藏');
  } else {
    // 页面显示时，可以恢复操作
    console.log('📱 页面已显示');
    if (app && app.initialized) {
      // 刷新汇率等实时数据
      app.exchangeRateManager.refreshExchangeRates();
    }
  }
});

// 导出应用类
export default CarQuoteApp; 