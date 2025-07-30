import { CONFIG, FORM_TYPES } from './config.js';
import { calculator } from './calculator.js';
import { apiService } from './api.js';
import { debounce } from './utils.js';

// UI管理类
export class UIManager {
  constructor() {
    this.currentFormType = FORM_TYPES.NEW_CAR;
    this.allCars = [];
    this.allCarsLoaded = false;
    this.searchHistory = [];
    this.init();
  }

  // 初始化
  init() {
    this.bindEvents();
    this.loadSearchHistory();
    this.moveCurrencySection();
  }

  // 绑定事件
  bindEvents() {
    this.bindFormSwitching();
    this.bindQuoteTypeSwitching();
    this.bindInputEvents();
    this.bindSearchEvents();
    this.bindCurrencyEvents();
    this.bindServiceFeeSlider();
  }

  // 绑定表单切换事件
  bindFormSwitching() {
    const exportTypeBtns = document.querySelectorAll('.export-type-btn');
    exportTypeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchForm(btn.dataset.form);
      });
    });
  }

  // 绑定报价类型切换事件
  bindQuoteTypeSwitching() {
    document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handleQuoteTypeChange(e.target.value);
      });
    });
  }

  // 绑定输入事件
  bindInputEvents() {
    // 新车表单输入事件
    const newCarInputs = [
      'guidePrice', 'discount', 'optionalEquipment', 'compulsoryInsurance',
      'otherExpenses', 'domesticShipping', 'portCharges', 'portChargesFob'
    ];
    newCarInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateNewCarAll());
      }
    });

    // 二手车表单输入事件
    const usedCarInputs = [
      'usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment', 'usedCompulsoryInsurance',
      'usedOtherExpenses', 'usedQualificationFee', 'usedAgencyFee', 'usedDomesticShipping',
      'usedPortCharges', 'usedPortChargesFob', 'usedMarkup'
    ];
    usedCarInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateUsedCarAll());
      }
    });

    // 新能源表单输入事件
    const newEnergyInputs = [
      'newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment',
      'newEnergyCompulsoryInsurance', 'newEnergyOtherExpenses', 'newEnergyQualificationFee',
      'newEnergyAgencyFee', 'newEnergyDomesticShipping', 'newEnergyPortCharges',
      'newEnergyPortChargesFob', 'newEnergyMarkup'
    ];
    newEnergyInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateNewEnergyAll());
      }
    });

    // 人民币报价输入事件
    ['rmbPrice', 'usedRmbPrice'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateFinalQuote());
      }
    });

    // 最终报价相关事件
    ['usedPurchaseCost', 'usedRmbPrice', 'exchangeRateUsed'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateUsedCarFinalQuote());
      }
    });

    ['newEnergyPurchaseCost', 'newEnergyRmbPrice', 'exchangeRateNewEnergy'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => calculator.calculateNewEnergyFinalQuote());
      }
    });

    // 海运费事件
    ['seaFreight', 'usedSeaFreight', 'newEnergySeaFreight'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => {
          if (id === 'seaFreight') {
            calculator.calculateFinalQuote();
          } else if (id === 'usedSeaFreight') {
            calculator.calculateUsedCarFinalQuote();
          } else if (id === 'newEnergySeaFreight') {
            calculator.calculateNewEnergyFinalQuote();
          }
        });
      }
    });
  }

  // 绑定搜索事件
  bindSearchEvents() {
    const searchInput = document.getElementById('searchCarInput');
    const searchResults = document.getElementById('searchCarResults');
    const searchHistoryPanel = document.getElementById('searchHistoryPanel');
    const searchHistoryBtn = document.getElementById('searchHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.handleSearch(e.target.value);
      }, 300));

      searchInput.addEventListener('focus', () => {
        this.showSearchHistory();
      });
    }

    if (searchHistoryBtn) {
      searchHistoryBtn.addEventListener('click', () => {
        this.toggleSearchHistory();
      });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.clearSearchHistory();
      });
    }

    // 点击外部关闭搜索面板
    document.addEventListener('click', (e) => {
      if (!searchInput?.contains(e.target) && !searchResults?.contains(e.target)) {
        this.hideSearchResults();
      }
      if (!searchHistoryBtn?.contains(e.target) && !searchHistoryPanel?.contains(e.target)) {
        this.hideSearchHistory();
      }
    });
  }

  // 绑定货币事件
  bindCurrencyEvents() {
    const currencySelect = document.getElementById('currency');
    const exchangeRateInput = document.getElementById('exchangeRate');

    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        const currency = e.target.value;
        if (currency) {
          apiService.fetchExchangeRate(currency);
        } else {
          exchangeRateInput.value = '';
          document.getElementById('finalQuote').value = '';
        }
      });
    }

    if (exchangeRateInput) {
      exchangeRateInput.addEventListener('input', () => {
        calculator.calculateFinalQuote();
      });
    }
  }

  // 绑定手续费滑块事件
  bindServiceFeeSlider() {
    const serviceFeeRate = document.getElementById('serviceFeeRate');
    const serviceFeeRateValue = document.getElementById('serviceFeeRateValue');

    if (serviceFeeRate && serviceFeeRateValue) {
      serviceFeeRate.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value).toFixed(2);
        serviceFeeRateValue.textContent = value;
        calculator.calculateNewCarAll();
      });
    }
  }

  // 切换表单
  switchForm(formType) {
    // 更新按钮状态
    document.querySelectorAll('.export-type-btn').forEach(btn => {
      btn.classList.remove('border-primary', 'text-primary');
      btn.classList.add('border-gray-300', 'text-gray-600');
    });

    const activeBtn = document.querySelector(`[data-form="${formType}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('border-gray-300', 'text-gray-600');
      activeBtn.classList.add('border-primary', 'text-primary');
    }

    // 隐藏所有表单
    document.querySelectorAll('section[id$="Form"]').forEach(section => {
      section.classList.add('hidden');
    });

    // 显示对应表单
    const formMap = {
      [FORM_TYPES.NEW_CAR]: 'newCarForm',
      [FORM_TYPES.USED_CAR]: 'usedCarForm',
      [FORM_TYPES.NEW_ENERGY]: 'newEnergyForm'
    };

    const targetForm = document.getElementById(formMap[formType]);
    if (targetForm) {
      targetForm.classList.remove('hidden');
    }

    // 更新主题
    this.updateTheme(formType);

    // 同步报价类型
    this.syncQuoteType(formType);

    // 更新计算器当前表单类型
    calculator.setFormType(formType);
  }

  // 更新主题
  updateTheme(formType) {
    const body = document.getElementById('mainBody');
    const themes = {
      [FORM_TYPES.NEW_CAR]: CONFIG.THEMES.NEW_CAR,
      [FORM_TYPES.USED_CAR]: CONFIG.THEMES.USED_CAR,
      [FORM_TYPES.NEW_ENERGY]: CONFIG.THEMES.NEW_ENERGY
    };

    const theme = themes[formType];
    if (theme) {
      // 移除所有主题类
      body.classList.remove('used-car-theme', 'new-energy-theme');
      
      // 添加对应主题类
      if (formType === FORM_TYPES.USED_CAR) {
        body.classList.add('used-car-theme');
      } else if (formType === FORM_TYPES.NEW_ENERGY) {
        body.classList.add('new-energy-theme');
      }

      // 更新CSS变量
      document.documentElement.style.setProperty('--primary-color', theme.primary);
      document.documentElement.style.setProperty('--secondary-color', theme.secondary);
      document.documentElement.style.setProperty('--accent-color', theme.accent);

      // 更新滑块和单选按钮颜色
      document.querySelectorAll('input[type="range"], input[type="radio"]').forEach(input => {
        input.style.setProperty('--tw-accent-color', theme.primary);
      });
    }
  }

  // 处理报价类型变化
  handleQuoteTypeChange(quoteType) {
    const container = document.getElementById('internationalShippingContainer');
    if (quoteType === 'EXW') {
      container?.classList.add('hidden');
      this.setInputValue('portCharges', '');
      this.setInputValue('portChargesFob', '');
    } else {
      container?.classList.remove('hidden');
      container?.classList.add('animate-fadeIn');
    }
    calculator.calculateNewCarAll();
  }

  // 同步报价类型
  syncQuoteType(formType) {
    const quoteTypeState = {
      [FORM_TYPES.NEW_CAR]: 'EXW',
      [FORM_TYPES.USED_CAR]: 'EXW',
      [FORM_TYPES.NEW_ENERGY]: 'EXW'
    };

    const value = quoteTypeState[formType] || 'EXW';
    document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
      radio.checked = (radio.value === value);
    });
  }

  // 处理搜索
  async handleSearch(query) {
    if (!query.trim()) {
      this.hideSearchResults();
      return;
    }

    if (!this.allCarsLoaded) {
      await this.loadAllCars();
    }

    const results = this.allCars.filter(car => 
      car.name.toLowerCase().includes(query.toLowerCase()) ||
      car.brand.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    this.displaySearchResults(results);
  }

  // 加载所有车型数据
  async loadAllCars() {
    if (this.allCarsLoaded) return;

    try {
      this.allCars = await apiService.fetchAllCars();
      this.allCarsLoaded = true;
    } catch (error) {
      console.error('加载车型数据失败:', error);
    }
  }

  // 显示搜索结果
  displaySearchResults(results) {
    const searchResults = document.getElementById('searchCarResults');
    if (!searchResults) return;

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="p-4 text-gray-500 text-center">未找到相关车型</div>';
    } else {
      searchResults.innerHTML = results.map(car => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
             onclick="uiManager.selectCar('${car.brand}', '${car.name}')">
          <div class="flex items-center">
            <img src="${car.brandImage || '/default-brand.png'}" alt="${car.brand}" 
                 class="w-6 h-6 rounded mr-3">
            <div>
              <div class="font-medium text-gray-900">${car.name}</div>
              <div class="text-sm text-gray-500">${car.brand}</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    searchResults.classList.remove('hidden');
  }

  // 选择车型
  selectCar(brand, model) {
    const carModelInput = document.getElementById('carModel2');
    if (carModelInput) {
      carModelInput.value = `${brand} ${model}`;
    }

    this.addToSearchHistory(brand, model);
    this.hideSearchResults();
  }

  // 显示搜索历史
  showSearchHistory() {
    const searchHistoryPanel = document.getElementById('searchHistoryPanel');
    const searchHistoryList = document.getElementById('searchHistoryList');
    const noHistoryMessage = document.getElementById('noHistoryMessage');

    if (!searchHistoryPanel) return;

    if (this.searchHistory.length === 0) {
      searchHistoryList.innerHTML = '';
      noHistoryMessage.classList.remove('hidden');
    } else {
      noHistoryMessage.classList.add('hidden');
      searchHistoryList.innerHTML = this.searchHistory.map(item => `
        <div class="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
             onclick="uiManager.selectCar('${item.brand}', '${item.model}')">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900">${item.model}</div>
              <div class="text-sm text-gray-500">${item.brand}</div>
            </div>
            <div class="text-xs text-gray-400">${item.timestamp}</div>
          </div>
        </div>
      `).join('');
    }

    searchHistoryPanel.classList.remove('hidden');
  }

  // 隐藏搜索历史
  hideSearchHistory() {
    const searchHistoryPanel = document.getElementById('searchHistoryPanel');
    searchHistoryPanel?.classList.add('hidden');
  }

  // 切换搜索历史显示
  toggleSearchHistory() {
    const searchHistoryPanel = document.getElementById('searchHistoryPanel');
    if (searchHistoryPanel?.classList.contains('hidden')) {
      this.showSearchHistory();
    } else {
      this.hideSearchHistory();
    }
  }

  // 添加搜索历史
  addToSearchHistory(brand, model) {
    const existingIndex = this.searchHistory.findIndex(item => 
      item.brand === brand && item.model === model
    );

    if (existingIndex > -1) {
      this.searchHistory.splice(existingIndex, 1);
    }

    this.searchHistory.unshift({
      brand,
      model,
      timestamp: new Date().toLocaleDateString()
    });

    // 限制历史记录数量
    if (this.searchHistory.length > 10) {
      this.searchHistory = this.searchHistory.slice(0, 10);
    }

    this.saveSearchHistory();
  }

  // 保存搜索历史
  saveSearchHistory() {
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  // 加载搜索历史
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('searchHistory');
      this.searchHistory = saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      this.searchHistory = [];
    }
  }

  // 清除搜索历史
  clearSearchHistory() {
    this.searchHistory = [];
    localStorage.removeItem('searchHistory');
    this.hideSearchHistory();
  }

  // 隐藏搜索结果
  hideSearchResults() {
    const searchResults = document.getElementById('searchCarResults');
    searchResults?.classList.add('hidden');
  }

  // 移动汇率区域
  moveCurrencySection() {
    const currencySection = document.getElementById('currencySection');
    if (currencySection) {
      currencySection.classList.remove('hidden');
    }
  }

  // 设置输入值
  setInputValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = value;
    }
  }
}

// 创建全局UI管理器实例
export const uiManager = new UIManager(); 