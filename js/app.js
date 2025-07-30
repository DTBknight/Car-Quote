import CONFIG from './config.js';
import { Utils } from './utils.js';
import { ExchangeRateManager } from './exchangeRate.js';
import { ThemeManager } from './themeManager.js';
import { CalculationEngine } from './calculationEngine.js';
import { EventManager } from './eventManager.js';
import { CarSearch } from './carSearch.js';

// 主应用类
export class CarQuoteApp {
  constructor() {
    this.exchangeRateManager = new ExchangeRateManager();
    this.themeManager = new ThemeManager();
    this.calculationEngine = new CalculationEngine();
    this.eventManager = new EventManager(
      this.calculationEngine,
      this.exchangeRateManager,
      this.themeManager
    );
    this.carSearch = new CarSearch();
  }
  
  // 初始化应用
  async initialize() {
    try {
      console.log('🚗 汽车报价系统初始化中...');
      
      // 初始化主题
      this.themeManager.initializeTheme();
      
      // 初始化汇率
      await this.exchangeRateManager.initializeExchangeRates();
      
      // 初始化车辆搜索
      await this.carSearch.initialize();
      
      // 初始化事件监听器
      this.eventManager.initializeEvents();
      
      // 设置默认值
      this.setDefaultValues();
      
      // 显示汇率区域
      this.showCurrencySection();
      
      console.log('✅ 汽车报价系统初始化完成');
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
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
      currentTheme: this.themeManager.getCurrentTheme(),
      exchangeRateCache: this.exchangeRateManager.cache.size,
      carsLoaded: this.carSearch.allCarsLoaded,
      searchHistoryCount: this.carSearch.searchHistory.length
    };
  }
  
  // 重置应用
  reset() {
    // 清除汇率缓存
    this.exchangeRateManager.clearCache();
    
    // 重新初始化汇率
    this.exchangeRateManager.initializeExchangeRates();
    
    console.log('🔄 应用已重置');
  }
  
  // 导出应用实例（用于调试）
  static getInstance() {
    if (!CarQuoteApp.instance) {
      CarQuoteApp.instance = new CarQuoteApp();
    }
    return CarQuoteApp.instance;
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
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
  }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  if (app) {
    app.exchangeRateManager.clearCache();
  }
});

// 导出应用类
export default CarQuoteApp; 