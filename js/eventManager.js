import { Utils } from './utils.js';
import { CalculationEngine } from './calculationEngine.js';
import { ExchangeRateManager } from './exchangeRate.js';
import { ThemeManager } from './themeManager.js';

// 事件管理模块
export class EventManager {
  constructor(calculationEngine, exchangeRateManager, themeManager) {
    this.calculationEngine = calculationEngine;
    this.exchangeRateManager = exchangeRateManager;
    this.themeManager = themeManager;
    this.quoteTypeState = {
      new: 'EXW',
      used: 'EXW',
      newEnergyTax: 'EXW'
    };
    
    // 事件配置
    this.eventConfig = {
      formTypeEvents: {
        selector: '.export-type-btn',
        event: 'click',
        handler: this.handleFormTypeSwitch.bind(this)
      },
      quoteTypeEvents: {
        selector: 'input[name="globalQuoteType"]',
        event: 'change',
        handler: this.handleQuoteTypeChange.bind(this)
      },
      newCarFields: [
        'guidePrice', 'discount', 'optionalEquipment', 'compulsoryInsurance',
        'otherExpenses', 'domesticShipping', 'portCharges', 'portChargesFob', 'seaFreight', 'serviceFeeRate'
      ],
      usedCarFields: [
        'usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment', 'usedCompulsoryInsurance',
        'usedOtherExpenses', 'usedQualificationFee', 'usedAgencyFee', 'usedDomesticShipping',
        'usedPortCharges', 'usedPortChargesFob', 'usedSeaFreight', 'usedMarkup'
      ],
      newEnergyFields: [
        'newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment',
        'newEnergyCompulsoryInsurance', 'newEnergyOtherExpenses', 'newEnergyQualificationFee',
        'newEnergyAgencyFee', 'newEnergyDomesticShipping', 'newEnergyPortCharges',
        'newEnergyPortChargesFob', 'newEnergySeaFreight', 'newEnergyMarkup'
      ],
      currencyFields: ['currency', 'currencyUsed', 'currencyNewEnergy'],
      exchangeRateFields: ['exchangeRate', 'exchangeRateUsed', 'exchangeRateNewEnergy']
    };
    
    // 防抖计算函数 - 减少延迟时间提高响应性
    this.debouncedNewCarCalculation = Utils.debounce(() => {
      this.calculationEngine.calculateNewCarAll();
    }, 100);
    
    this.debouncedUsedCarCalculation = Utils.debounce(() => {
      this.calculationEngine.calculateUsedCarAll();
    }, 100);
    
    this.debouncedNewEnergyCalculation = Utils.debounce(() => {
      this.calculationEngine.calculateNewEnergyAll();
    }, 100);
  }
  
  // 初始化所有事件监听器
  initializeEvents() {
    this.bindFormTypeEvents();
    this.bindQuoteTypeEvents();
    this.bindFormFieldEvents();
    this.bindExchangeRateEvents();
    this.bindServiceFeeEvents();
    this.bindCalculateButtonEvents();
    this.bindCurrencyEvents();
  }
  
  // 绑定表单类型切换事件
  bindFormTypeEvents() {
    document.addEventListener('click', (e) => {
      if (e.target.matches(this.eventConfig.formTypeEvents.selector)) {
        e.preventDefault();
        const type = e.target.getAttribute('data-type');
        this.handleFormTypeSwitch(type);
      }
    });
  }
  
  // 处理表单类型切换
  handleFormTypeSwitch(type) {
    // 移除所有按钮的激活状态
    document.querySelectorAll('.export-type-btn').forEach(btn => {
      btn.classList.remove('border-primary', 'text-primary');
      btn.classList.add('border-gray-300', 'text-gray-700');
    });
    
    // 激活当前按钮
    const currentBtn = document.querySelector(`[data-type="${type}"]`);
    if (currentBtn) {
      currentBtn.classList.remove('border-gray-300', 'text-gray-700');
      currentBtn.classList.add('border-primary', 'text-primary');
    }
    
    // 隐藏所有表单
    document.querySelectorAll('section[id$="Form"]').forEach(form => {
      form.classList.add('hidden');
    });
    
    // 显示对应表单
    let formId = '';
    switch (type) {
      case 'new':
        formId = 'newCarForm';
        this.themeManager.switchToNewCarTheme();
        break;
      case 'used':
        formId = 'usedCarForm';
        this.themeManager.switchToUsedCarTheme();
        break;
      case 'newEnergyTax':
        formId = 'newEnergyForm';
        this.themeManager.switchToNewEnergyTheme();
        break;
    }
    
    if (formId) {
      Utils.toggleElement(formId, true);
      Utils.addClass(formId, 'animate-fadeIn');
    }
    
    // 同步报价类型并重新应用当前报价类型的显示逻辑
    this.syncGlobalQuoteType(type);
    
    // 重新应用当前报价类型的显示逻辑
    this.handleQuoteTypeChange(type);
  }
  
  // 绑定报价类型切换事件
  bindQuoteTypeEvents() {
    document.addEventListener('change', (e) => {
      if (e.target.matches(this.eventConfig.quoteTypeEvents.selector)) {
        if (!e.target.checked) return;
        const value = e.target.value;
        const type = this.getActiveFormType();
        this.quoteTypeState[type] = value;
        this.handleQuoteTypeChange(type);
      }
    });
  }
  
  // 处理报价类型变化
  handleQuoteTypeChange(type) {
    // 根据表单类型处理相应的容器
    if (type === 'new') {
      this.handleNewCarQuoteTypeChange();
    } else if (type === 'used') {
      this.handleUsedCarQuoteTypeChange();
    } else if (type === 'newEnergyTax') {
      this.handleNewEnergyQuoteTypeChange();
    }
  }
  
  // 获取当前激活的表单类型
  getActiveFormType() {
    const activeBtn = document.querySelector('.export-type-btn.border-primary.text-primary');
    return activeBtn ? activeBtn.getAttribute('data-type') : 'new';
  }
  
  // 处理新车表单的报价类型切换
  handleNewCarQuoteTypeChange() {
    const cifContainer = Utils.getElement('cifShippingContainer');
    const fobContainer = Utils.getElement('fobShippingContainer');
    const value = this.quoteTypeState.new;
    
    // 隐藏所有容器
    if (cifContainer) Utils.toggleElement('cifShippingContainer', false);
    if (fobContainer) Utils.toggleElement('fobShippingContainer', false);
    
    // 根据报价类型显示对应容器
    if (value === 'CIF') {
      if (cifContainer) {
        Utils.toggleElement('cifShippingContainer', true);
        Utils.addClass('cifShippingContainer', 'animate-fadeIn');
      }
    } else if (value === 'FOB') {
      if (fobContainer) {
        Utils.toggleElement('fobShippingContainer', true);
        Utils.addClass('fobShippingContainer', 'animate-fadeIn');
      }
    }
    // EXW时只显示国内运输，不需要额外容器
    
    this.calculationEngine.calculateNewCarAll();
  }
  
  // 处理二手车表单的报价类型切换
  handleUsedCarQuoteTypeChange() {
    const cifContainer = Utils.getElement('usedCifShippingContainer');
    const fobContainer = Utils.getElement('usedFobShippingContainer');
    const value = this.quoteTypeState.used;
    
    // 隐藏所有容器
    if (cifContainer) Utils.toggleElement('usedCifShippingContainer', false);
    if (fobContainer) Utils.toggleElement('usedFobShippingContainer', false);
    
    // 根据报价类型显示对应容器
    if (value === 'CIF') {
      if (cifContainer) {
        Utils.toggleElement('usedCifShippingContainer', true);
        Utils.addClass('usedCifShippingContainer', 'animate-fadeIn');
      }
    } else if (value === 'FOB') {
      if (fobContainer) {
        Utils.toggleElement('usedFobShippingContainer', true);
        Utils.addClass('usedFobShippingContainer', 'animate-fadeIn');
      }
    }
    // EXW时只显示国内运输，不需要额外容器
    
    this.calculationEngine.calculateUsedCarAll();
  }
  
  // 处理新能源表单的报价类型切换
  handleNewEnergyQuoteTypeChange() {
    const cifContainer = Utils.getElement('newEnergyCifShippingContainer');
    const fobContainer = Utils.getElement('newEnergyFobShippingContainer');
    const value = this.quoteTypeState.newEnergyTax;
    
    // 隐藏所有容器
    if (cifContainer) Utils.toggleElement('newEnergyCifShippingContainer', false);
    if (fobContainer) Utils.toggleElement('newEnergyFobShippingContainer', false);
    
    // 根据报价类型显示对应容器
    if (value === 'CIF') {
      if (cifContainer) {
        Utils.toggleElement('newEnergyCifShippingContainer', true);
        Utils.addClass('newEnergyCifShippingContainer', 'animate-fadeIn');
      }
    } else if (value === 'FOB') {
      if (fobContainer) {
        Utils.toggleElement('newEnergyFobShippingContainer', true);
        Utils.addClass('newEnergyFobShippingContainer', 'animate-fadeIn');
      }
    }
    // EXW时只显示国内运输，不需要额外容器
    
    this.calculationEngine.calculateNewEnergyAll();
  }
  
  // 绑定表单字段事件
  bindFormFieldEvents() {
    // 使用事件委托绑定所有表单字段
    document.addEventListener('input', (e) => {
      const fieldId = e.target.id;
      console.log('事件触发:', fieldId, e.target.value);
      
      // 关键字段即时计算（无防抖）
      const instantFields = ['guidePrice', 'discount', 'optionalEquipment', 'serviceFeeRate'];
      const instantUsedFields = ['usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment'];
      const instantNewEnergyFields = ['newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment'];
      
      // 新车字段
      if (this.eventConfig.newCarFields.includes(fieldId)) {
        console.log('新车字段事件:', fieldId);
        if (instantFields.includes(fieldId)) {
          // 关键字段即时计算
          console.log('触发即时计算:', fieldId);
          this.calculationEngine.calculateNewCarAll();
        } else {
          // 其他字段使用防抖
          console.log('触发防抖计算:', fieldId);
          this.debouncedNewCarCalculation();
        }
        return; // 避免重复处理
      }
      
      // 二手车字段
      if (this.eventConfig.usedCarFields.includes(fieldId)) {
        if (instantUsedFields.includes(fieldId)) {
          // 关键字段即时计算
          this.calculationEngine.calculateUsedCarAll();
        } else {
          // 其他字段使用防抖
          this.debouncedUsedCarCalculation();
        }
        return; // 避免重复处理
      }
      
      // 新能源字段
      if (this.eventConfig.newEnergyFields.includes(fieldId)) {
        if (instantNewEnergyFields.includes(fieldId)) {
          // 关键字段即时计算
          this.calculationEngine.calculateNewEnergyAll();
        } else {
          // 其他字段使用防抖
          this.debouncedNewEnergyCalculation();
        }
        return; // 避免重复处理
      }
      
      // 人民币报价字段是只读的，不应该有input事件，计算在各自的RmbQuote方法中直接调用
    });
  }
  
  // 绑定汇率相关事件
  bindExchangeRateEvents() {
    // 货币选择变化
    this.eventConfig.currencyFields.forEach(currencyId => {
      Utils.getElement(currencyId)?.addEventListener('change', (e) => {
        const currency = e.target.value;
        const formType = this.getFormTypeFromCurrencyId(currencyId);
        
        if (currency) {
          this.exchangeRateManager.fetchExchangeRate(currency, formType);
        } else {
          this.clearExchangeRate(formType);
        }
      });
    });
    
    // 汇率输入框手动输入事件
    this.eventConfig.exchangeRateFields.forEach(fieldId => {
      Utils.getElement(fieldId)?.addEventListener('input', () => {
        const formType = this.getFormTypeFromExchangeRateId(fieldId);
        this.recalculateFinalQuote(formType);
      });
    });
    
    // 海运费事件已经在bindFormFieldEvents中通过事件委托处理，这里不需要重复绑定
  }
  
  // 根据货币ID获取表单类型
  getFormTypeFromCurrencyId(currencyId) {
    switch (currencyId) {
      case 'currency': return 'new';
      case 'currencyUsed': return 'used';
      case 'currencyNewEnergy': return 'newEnergy';
      default: return 'new';
    }
  }
  
  // 根据汇率ID获取表单类型
  getFormTypeFromExchangeRateId(exchangeRateId) {
    switch (exchangeRateId) {
      case 'exchangeRate': return 'new';
      case 'exchangeRateUsed': return 'used';
      case 'exchangeRateNewEnergy': return 'newEnergy';
      default: return 'new';
    }
  }
  
  // 清除汇率
  clearExchangeRate(formType) {
    const fieldMap = {
      new: { rate: 'exchangeRate', quote: 'finalQuote' },
      used: { rate: 'exchangeRateUsed', quote: 'finalQuoteUsed' },
      newEnergy: { rate: 'exchangeRateNewEnergy', quote: 'finalQuoteNewEnergy' }
    };
    
    const fields = fieldMap[formType];
    if (fields) {
      Utils.setElementValue(fields.rate, '');
      Utils.setElementValue(fields.quote, '');
    }
  }
  
  // 重新计算最终报价
  recalculateFinalQuote(formType) {
    switch (formType) {
      case 'new':
        this.calculationEngine.calculateFinalQuote();
        break;
      case 'used':
        this.calculationEngine.calculateUsedCarFinalQuote();
        break;
      case 'newEnergy':
        this.calculationEngine.calculateNewEnergyFinalQuote();
        break;
    }
  }
  
  // 绑定手续费滑块事件
  bindServiceFeeEvents() {
    const serviceFeeRate = Utils.getElement('serviceFeeRate');
    const serviceFeeRateValue = Utils.getElement('serviceFeeRateValue');
    
    if (serviceFeeRate && serviceFeeRateValue) {
      serviceFeeRate.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value).toFixed(2);
        Utils.setElementText('serviceFeeRateValue', value);
        this.calculationEngine.calculateNewCarServiceFee();
        this.calculationEngine.calculateNewCarPurchaseCost();
        this.calculationEngine.calculateNewCarRmbQuote();
        this.calculationEngine.calculateFinalQuote();
      });
    }
  }
  
  // 绑定计算按钮事件
  bindCalculateButtonEvents() {
    Utils.getElement('calculateBtn')?.addEventListener('click', () => {
      this.calculationEngine.calculateNewCarAll();
      this.calculationEngine.calculateFinalQuote();
      
      // 显示结果卡片
      const resultCard = Utils.getElement('resultCard');
      if (resultCard) {
        Utils.toggleElement('resultCard', true);
        Utils.addClass('resultCard', 'animate-fadeIn');
      }
      
      // 填充结果数据
      this.fillResultData();
      
      // 滚动到结果区域
      resultCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  
  // 绑定货币事件
  bindCurrencyEvents() {
    // 更新货币标志
    this.eventConfig.currencyFields.forEach(currencyId => {
      Utils.getElement(currencyId)?.addEventListener('change', (e) => {
        const currency = e.target.value;
        const flag = Utils.getCurrencyFlag(currency);
        
        const flagMap = {
          currency: 'currencyFlag',
          currencyUsed: 'currencyFlagUsed',
          currencyNewEnergy: 'currencyFlagNewEnergy'
        };
        
        const flagId = flagMap[currencyId];
        if (flagId) {
          Utils.setElementText(flagId, flag);
        }
      });
    });
  }
  
  // 同步全局报价类型
  syncGlobalQuoteType(type) {
    const value = this.quoteTypeState[type] || 'EXW';
    document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
      radio.checked = (radio.value === value);
    });
  }
  
  // 填充结果数据
  fillResultData() {
    // 基础信息
    Utils.setElementText('resultCarModel', Utils.getElementValue('carModel2') || '未填写');
    
    // 出口类型
    const carTypeBtn = document.querySelector('.export-type-btn.border-primary.text-primary');
    const carTypeText = carTypeBtn ? carTypeBtn.textContent.trim() : '未选择';
    Utils.setElementText('resultCarType', carTypeText);
    
    // 报价类型
    let quoteTypeText = '未选择';
    document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
      if (radio.checked) quoteTypeText = radio.value;
    });
    Utils.setElementText('resultQuoteType', quoteTypeText);
    
    // 填充成本明细
    this.fillCostDetails();
    
    // 报价汇总
    Utils.setElementText('resultRmbQuote', Utils.formatCurrencyInteger(Math.round(Utils.getElementValue('rmbPrice'))));
    
    // 最终报价
    const currency = Utils.getElement('currency')?.value;
    const currencyText = Utils.getCurrencyName(currency);
    Utils.setElementText('resultCurrencyText', `最终报价 (${currencyText})`);
    Utils.setElementText('resultFinalQuote', Utils.formatCurrencyInteger(Math.round(Utils.getElementValue('finalQuote')), currency));
  }
  
  // 填充成本明细
  fillCostDetails() {
    const costDetails = Utils.getElement('resultCostDetails');
    if (!costDetails) return;
    
    costDetails.innerHTML = '';
    
    this.addCostDetail(costDetails, '开票价', Utils.getElementValue('invoicePrice'));
    
    const optionalEquipment = Utils.getElementValue('optionalEquipment');
    if (optionalEquipment > 0) {
      this.addCostDetail(costDetails, '选装', optionalEquipment);
    }
    
    this.addCostDetail(costDetails, '国内运输', Utils.getElementValue('domesticShipping'));
    
    const portChargesCif = Utils.getElementValue('portCharges');
    const portChargesFob = Utils.getElementValue('portChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    if (portCharges > 0) {
      this.addCostDetail(costDetails, '港杂费', portCharges);
    }
    
    const compulsoryInsurance = Utils.getElementValue('compulsoryInsurance');
    if (compulsoryInsurance > 0) {
      this.addCostDetail(costDetails, '交强险', compulsoryInsurance);
    }
    
    this.addCostDetail(costDetails, '退税', Utils.getElementValue('taxRefund'), true);
    this.addCostDetail(costDetails, '购车成本', Utils.getElementValue('purchaseCost'), false, true);
  }
  
  // 添加成本明细项
  addCostDetail(container, label, value, isNegative = false, isTotal = false) {
    const li = document.createElement('li');
    li.className = `flex justify-between ${isTotal ? 'pt-2 border-t border-gray-100 font-medium' : ''}`;
    
    const spanLabel = document.createElement('span');
    spanLabel.className = 'text-gray-600';
    spanLabel.textContent = `${label}:`;
    
    const spanValue = document.createElement('span');
    spanValue.className = isNegative ? 'text-green-600' : isTotal ? 'text-primary' : 'text-gray-700';
    
    // 购置税和退税保留小数点后两位，其他取整数
    let displayValue;
    if (label === '购置税' || label === '退税') {
      displayValue = Utils.formatCurrencyWithDecimals(value);
    } else {
      displayValue = Utils.formatCurrencyInteger(Math.round(value));
    }
    spanValue.textContent = displayValue;
    
    li.appendChild(spanLabel);
    li.appendChild(spanValue);
    container.appendChild(li);
  }
  
  // 清理资源
  cleanup() {
    // 清除所有事件监听器
    document.removeEventListener('click', this.handleFormTypeSwitch);
    document.removeEventListener('change', this.handleQuoteTypeChange);
    document.removeEventListener('input', this.debouncedNewCarCalculation);
    document.removeEventListener('input', this.debouncedUsedCarCalculation);
    document.removeEventListener('input', this.debouncedNewEnergyCalculation);
  }
} 