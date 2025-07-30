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
  }
  
  // 初始化所有事件监听器
  initializeEvents() {
    this.bindFormTypeEvents();
    this.bindQuoteTypeEvents();
    this.bindNewCarEvents();
    this.bindUsedCarEvents();
    this.bindNewEnergyEvents();
    this.bindExchangeRateEvents();
    this.bindServiceFeeEvents();
    this.bindCalculateButtonEvents();
    this.bindCurrencyEvents();
  }
  
  // 绑定表单类型切换事件
  bindFormTypeEvents() {
    document.querySelectorAll('.export-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const type = btn.getAttribute('data-type');
        this.switchFormType(type);
      });
    });
  }
  
  // 切换表单类型
  switchFormType(type) {
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
  
  // 获取当前报价类型
  getCurrentQuoteType() {
    const checkedRadio = document.querySelector('input[name="globalQuoteType"]:checked');
    return checkedRadio ? checkedRadio.value : 'EXW';
  }
  
  // 绑定报价类型切换事件
  bindQuoteTypeEvents() {
    document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (!e.target.checked) return;
        const value = e.target.value;
        const type = this.getActiveFormType();
        this.quoteTypeState[type] = value;
        this.handleQuoteTypeChange(type);
      });
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
  
  // 绑定新车表单事件
  bindNewCarEvents() {
    const newCarFields = [
      'guidePrice', 'discount', 'optionalEquipment', 'compulsoryInsurance',
      'otherExpenses', 'domesticShipping', 'portCharges', 'portChargesFob', 'seaFreight'
    ];
    
    newCarFields.forEach(fieldId => {
      const element = Utils.getElement(fieldId);
      if (element) {
        element.addEventListener('input', () => {
          this.calculationEngine.calculateNewCarAll();
        });
      }
    });
    
    // 人民币报价变化时重新计算最终报价
    Utils.getElement('rmbPrice')?.addEventListener('input', () => {
      this.calculationEngine.calculateFinalQuote();
    });
  }
  
  // 绑定二手车表单事件
  bindUsedCarEvents() {
    const usedCarFields = [
      'usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment', 'usedCompulsoryInsurance',
      'usedOtherExpenses', 'usedQualificationFee', 'usedAgencyFee', 'usedDomesticShipping',
      'usedPortCharges', 'usedPortChargesFob', 'usedSeaFreight', 'usedMarkup'
    ];
    
    usedCarFields.forEach(fieldId => {
      const element = Utils.getElement(fieldId);
      if (element) {
        element.addEventListener('input', () => {
          this.calculationEngine.calculateUsedCarAll();
        });
      }
    });
    
    // 人民币报价变化时重新计算最终报价
    Utils.getElement('usedRmbPrice')?.addEventListener('input', () => {
      this.calculationEngine.calculateUsedCarFinalQuote();
    });
  }
  
  // 绑定新能源表单事件
  bindNewEnergyEvents() {
    const newEnergyFields = [
      'newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment',
      'newEnergyCompulsoryInsurance', 'newEnergyOtherExpenses', 'newEnergyQualificationFee',
      'newEnergyAgencyFee', 'newEnergyDomesticShipping', 'newEnergyPortCharges',
      'newEnergyPortChargesFob', 'newEnergySeaFreight', 'newEnergyMarkup'
    ];
    
    newEnergyFields.forEach(fieldId => {
      const element = Utils.getElement(fieldId);
      if (element) {
        element.addEventListener('input', () => {
          this.calculationEngine.calculateNewEnergyAll();
        });
      }
    });
    
    // 人民币报价变化时重新计算最终报价
    Utils.getElement('newEnergyRmbPrice')?.addEventListener('input', () => {
      this.calculationEngine.calculateNewEnergyFinalQuote();
    });
  }
  
  // 绑定汇率相关事件
  bindExchangeRateEvents() {
    // 新车汇率
    Utils.getElement('currency')?.addEventListener('change', (e) => {
      const currency = e.target.value;
      if (currency) {
        this.exchangeRateManager.fetchExchangeRate(currency, 'new');
      } else {
        Utils.setElementValue('exchangeRate', '');
        Utils.setElementValue('finalQuote', '');
      }
    });
    
    // 二手车汇率
    Utils.getElement('currencyUsed')?.addEventListener('change', (e) => {
      const currency = e.target.value;
      if (currency) {
        this.exchangeRateManager.fetchExchangeRate(currency, 'used');
      } else {
        Utils.setElementValue('exchangeRateUsed', '');
        Utils.setElementValue('finalQuoteUsed', '');
      }
    });
    
    // 新能源汇率
    Utils.getElement('currencyNewEnergy')?.addEventListener('change', (e) => {
      const currency = e.target.value;
      if (currency) {
        this.exchangeRateManager.fetchExchangeRate(currency, 'newEnergy');
      } else {
        Utils.setElementValue('exchangeRateNewEnergy', '');
        Utils.setElementValue('finalQuoteNewEnergy', '');
      }
    });
    
    // 汇率输入框手动输入事件
    Utils.getElement('exchangeRate')?.addEventListener('input', () => {
      this.calculationEngine.calculateFinalQuote();
    });
    
    Utils.getElement('exchangeRateUsed')?.addEventListener('input', () => {
      this.calculationEngine.calculateUsedCarFinalQuote();
    });
    
    Utils.getElement('exchangeRateNewEnergy')?.addEventListener('input', () => {
      this.calculationEngine.calculateNewEnergyFinalQuote();
    });
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
    ['currency', 'currencyUsed', 'currencyNewEnergy'].forEach(currencyId => {
      Utils.getElement(currencyId)?.addEventListener('change', (e) => {
        const currency = e.target.value;
        const flag = Utils.getCurrencyFlag(currency);
        
        if (currencyId === 'currency') {
          Utils.setElementText('currencyFlag', flag);
        } else if (currencyId === 'currencyUsed') {
          Utils.setElementText('currencyFlagUsed', flag);
        } else if (currencyId === 'currencyNewEnergy') {
          Utils.setElementText('currencyFlagNewEnergy', flag);
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
      displayValue = Utils.formatCurrency(value);
    } else {
      displayValue = Utils.formatCurrencyInteger(Math.round(value));
    }
    spanValue.textContent = displayValue;
    
    li.appendChild(spanLabel);
    li.appendChild(spanValue);
    container.appendChild(li);
  }
} 