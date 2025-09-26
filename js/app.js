import { CONFIG } from './config.js';
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
      if (CONFIG.APP.DEBUG) console.log('🚗 汽车报价系统初始化中...');
      
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

      // 8. 初始化合同管理模块
      this.loadingManager.nextStep();
      this.contractManager.init();

      this.initialized = true;
      this.performanceMetrics.initTime = performance.now() - startTime;
      this.performanceMetrics.lastUpdate = Date.now();
      
      if (CONFIG.APP.DEBUG) console.log('✅ 汽车报价系统初始化完成');
      if (CONFIG.APP.DEBUG) console.log(`⏱️ 初始化耗时: ${this.performanceMetrics.initTime.toFixed(2)}ms`);
      
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
  
  // 重置所有输入值
  resetAllInputs() {
    try {
      console.log('🔄 开始重置所有输入值...');
      console.log('🔍 当前应用实例:', this);
      
      // 保存当前汇率数值，防止被重置
      const savedExchangeRates = {
        new: Utils.getElementValue('exchangeRate'),
        used: Utils.getElementValue('exchangeRateUsed'),
        newEnergy: Utils.getElementValue('exchangeRateNewEnergy')
      };
      console.log('💾 保存的汇率数值:', savedExchangeRates);
      
      // 重置搜索输入
      const searchInput = Utils.getElement('searchCarInput');
      console.log('🔍 搜索输入框:', searchInput);
      if (searchInput) {
        searchInput.value = '';
        console.log('✅ 搜索输入框已清空');
      }
      
      // 隐藏基础信息部分
      Utils.toggleElement('baseInfoSection', false);
      console.log('✅ 基础信息部分已隐藏');
      
      // 重置所有表单输入
      console.log('🔄 开始重置表单输入...');
      this.resetFormInputs('new');
      this.resetFormInputs('used');
      this.resetFormInputs('newEnergy');
      console.log('✅ 表单输入重置完成');
      
      // 重置出口类型为新车
      this.setDefaultFormType();
      console.log('✅ 表单类型重置为新车');
      
      // 重置报价类型为EXW
      const exwRadio = Utils.getElement('globalQuoteType');
      console.log('🔍 报价类型单选按钮:', exwRadio);
      if (exwRadio) {
        exwRadio.value = 'EXW';
        // 触发报价类型变化事件
        const event = new Event('change', { bubbles: true });
        exwRadio.dispatchEvent(event);
        console.log('✅ 报价类型重置为EXW');
      }
      
      // 重置手续费滑块
      const serviceFeeRate = Utils.getElement('serviceFeeRate');
      const serviceFeeRateValue = Utils.getElement('serviceFeeRateValue');
      console.log('🔍 手续费滑块:', serviceFeeRate, serviceFeeRateValue);
      if (serviceFeeRate && serviceFeeRateValue) {
        serviceFeeRate.value = CONFIG.DEFAULTS.SERVICE_FEE_RATE;
        serviceFeeRateValue.textContent = CONFIG.DEFAULTS.SERVICE_FEE_RATE;
        console.log('✅ 手续费滑块重置完成');
      }
      
      // 重置货币选择
      const currencySelects = ['currency', 'currencyUsed', 'currencyNewEnergy'];
      currencySelects.forEach(currencyId => {
        const select = Utils.getElement(currencyId);
        if (select) {
          select.value = CONFIG.DEFAULTS.CURRENCY;
        }
      });
      console.log('✅ 货币选择重置完成');
      
      // 清除计算结果
      this.calculationEngine.clearCache();
      console.log('✅ 计算结果缓存已清除');
      
      // 重新计算当前表单
      this.calculationEngine.calculateNewCarAll();
      console.log('✅ 重新计算完成');
      
      // 恢复汇率数值（防止被重置清空）
      console.log('🔄 恢复汇率数值...');
      if (savedExchangeRates.new) {
        Utils.setElementValue('exchangeRate', savedExchangeRates.new);
        console.log('✅ 新车汇率已恢复:', savedExchangeRates.new);
      }
      if (savedExchangeRates.used) {
        Utils.setElementValue('exchangeRateUsed', savedExchangeRates.used);
        console.log('✅ 二手车汇率已恢复:', savedExchangeRates.used);
      }
      if (savedExchangeRates.newEnergy) {
        Utils.setElementValue('exchangeRateNewEnergy', savedExchangeRates.newEnergy);
        console.log('✅ 新能源车汇率已恢复:', savedExchangeRates.newEnergy);
      }
      
      // 如果汇率为空，则重新获取
      const currentCurrency = CONFIG.DEFAULTS.CURRENCY;
      if (!savedExchangeRates.new || !savedExchangeRates.used || !savedExchangeRates.newEnergy) {
        console.log('🔄 部分汇率为空，重新获取...');
        try {
          await this.exchangeRateManager.fetchExchangeRate(currentCurrency, 'new');
          await this.exchangeRateManager.fetchExchangeRate(currentCurrency, 'used');
          await this.exchangeRateManager.fetchExchangeRate(currentCurrency, 'newEnergy');
          console.log('✅ 汇率重新获取完成');
        } catch (error) {
          console.warn('⚠️ 汇率获取失败，使用降级汇率:', error);
          const fallbackRate = this.exchangeRateManager.getFallbackRate(currentCurrency);
          this.exchangeRateManager.updateUI(currentCurrency, fallbackRate, 'new', true);
          this.exchangeRateManager.updateUI(currentCurrency, fallbackRate, 'used', true);
          this.exchangeRateManager.updateUI(currentCurrency, fallbackRate, 'newEnergy', true);
        }
      }
      
      console.log('✅ 所有输入值重置完成');
      
    } catch (error) {
      console.error('❌ 重置输入值失败:', error);
    }
  }
  
  // 重置指定表单的输入
  resetFormInputs(formType) {
    console.log(`🔄 开始重置 ${formType} 表单输入...`);
    
    const formSelectors = {
      'new': [
        'guidePrice', 'discount', 'optionalEquipment', 'compulsoryInsurance', 'otherExpenses',
        'domesticShipping', 'portCharges', 'portChargesFob', 'internationalShipping',
        'finalQuote'
      ],
      'used': [
        'usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment', 'usedCompulsoryInsurance', 
        'usedOtherExpenses', 'usedQualificationFee', 'usedAgencyFee', 'usedDomesticShipping',
        'usedPortCharges', 'usedPortChargesFob', 'usedInternationalShipping', 'usedMarkup',
        'finalQuoteUsed'
      ],
      'newEnergy': [
        'newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment', 
        'newEnergyCompulsoryInsurance', 'newEnergyOtherExpenses', 'newEnergyQualificationFee', 
        'newEnergyAgencyFee', 'newEnergyDomesticShipping', 'newEnergyPortCharges', 
        'newEnergyPortChargesFob', 'newEnergyInternationalShipping', 'newEnergyMarkup',
        'finalQuoteNewEnergy'
      ]
    };
    
    const selectors = formSelectors[formType] || [];
    console.log(`🔍 ${formType} 表单选择器:`, selectors);
    
    let resetCount = 0;
    selectors.forEach(selector => {
      const element = Utils.getElement(selector);
      console.log(`🔍 查找元素 ${selector}:`, element);
      if (element && !element.readOnly) {
        const oldValue = element.value;
        element.value = '';
        console.log(`✅ ${selector} 已重置: "${oldValue}" -> ""`);
        resetCount++;
        
        // 触发input事件以更新计算
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
      } else if (element && element.readOnly) {
        console.log(`⚠️ ${selector} 是只读的，跳过重置`);
      } else {
        console.log(`❌ ${selector} 元素未找到`);
      }
    });
    
    console.log(`✅ ${formType} 表单重置完成，共重置 ${resetCount} 个字段`);
  }
  
  // 初始化卡片悬浮效果
  initCardHoverEffects() {
    if (CONFIG.APP.DEBUG) console.log('🎨 初始化卡片悬浮效果...');
    
    const cards = document.querySelectorAll('.bg-gray-50.p-6.rounded-lg.border.border-gray-200');
    
    cards.forEach(card => {
      // 跳过搜索卡片，因为它已经有search-card类
      if (card.classList.contains('search-card')) {
        return;
      }
      
      // 跳过车型图片区域，不添加悬浮效果
      if (card.querySelector('h3') && card.querySelector('h3').textContent.includes('车型图片')) {
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
    
    if (CONFIG.APP.DEBUG) console.log(`✅ 已为 ${cards.length} 个卡片添加悬浮效果`);
  }
  
  // 开始缓存清理
  startCacheCleanup() {
    // 每10分钟清理一次过期缓存
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
  }
  
  // 清理过期缓存
  async cleanupExpiredCache() {
    try {
      // 使用缓存管理器清理过期缓存
      const { cacheManager } = await import('./cacheManager.js');
      cacheManager.cleanup();
      if (CONFIG.APP.DEBUG) console.log('✅ 缓存清理完成');
    } catch (error) {
      console.error('❌ 缓存清理失败:', error);
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
    console.log('🚀 开始初始化应用...');
    
    app = CarQuoteApp.getInstance();
    console.log('✅ 应用实例创建成功:', app);
    
    await app.initialize();
    console.log('✅ 应用初始化完成');
    
    // 将应用实例挂载到全局对象（用于调试）
    window.carQuoteApp = app;
    console.log('✅ 应用实例已挂载到 window.carQuoteApp:', window.carQuoteApp);
    console.log('🔍 重置方法存在:', !!(window.carQuoteApp && window.carQuoteApp.resetAllInputs));
    
    // 确保重置按钮事件绑定成功
    setTimeout(() => {
      console.log('🔧 重新绑定重置按钮事件...');
      app.eventManager.bindResetButtonEvents();
    }, 500);
    
    console.log('🎉 汽车报价系统已就绪');
    
    // 输出性能指标
    setTimeout(() => {
      const metrics = app.getPerformanceMetrics();
      console.log('📊 性能指标:', metrics);
    }, 1000);
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    console.error('❌ 错误详情:', error.stack);
    
    // 即使初始化失败，也尝试设置应用实例
    if (app) {
      window.carQuoteApp = app;
      console.log('⚠️ 应用实例已设置（初始化失败）:', window.carQuoteApp);
    } else {
      console.error('❌ 应用实例创建失败，无法设置 window.carQuoteApp');
    }
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