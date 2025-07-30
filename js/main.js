import { calculator } from './calculator.js';
import { uiManager } from './ui.js';
import { apiService } from './api.js';
import { formatCurrencyInteger } from './utils.js';

// 主应用类
class App {
  constructor() {
    this.init();
  }

  // 初始化应用
  init() {
    this.bindGlobalEvents();
    this.initializeResultCard();
    this.setupGlobalReferences();
  }

  // 绑定全局事件
  bindGlobalEvents() {
    // 计算按钮事件
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
        calculator.calculateNewCarAll();
        calculator.calculateFinalQuote();
        this.showResultCard();
        this.fillResultData();
        this.scrollToResult();
      });
    }

    // 汇率相关事件
    this.bindExchangeRateEvents();
  }

  // 绑定汇率相关事件
  bindExchangeRateEvents() {
    // 二手车汇率事件
    const currencyUsed = document.getElementById('currencyUsed');
    const exchangeRateUsed = document.getElementById('exchangeRateUsed');
    
    if (currencyUsed) {
      currencyUsed.addEventListener('change', (e) => {
        const currency = e.target.value;
        if (currency) {
          this.fetchExchangeRateForForm(currency, 'Used');
        } else {
          exchangeRateUsed.value = '';
          document.getElementById('finalQuoteUsed').value = '';
        }
      });
    }

    if (exchangeRateUsed) {
      exchangeRateUsed.addEventListener('input', () => {
        calculator.calculateUsedCarFinalQuote();
      });
    }

    // 新能源汇率事件
    const currencyNewEnergy = document.getElementById('currencyNewEnergy');
    const exchangeRateNewEnergy = document.getElementById('exchangeRateNewEnergy');
    
    if (currencyNewEnergy) {
      currencyNewEnergy.addEventListener('change', (e) => {
        const currency = e.target.value;
        if (currency) {
          this.fetchExchangeRateForForm(currency, 'NewEnergy');
        } else {
          exchangeRateNewEnergy.value = '';
          document.getElementById('finalQuoteNewEnergy').value = '';
        }
      });
    }

    if (exchangeRateNewEnergy) {
      exchangeRateNewEnergy.addEventListener('input', () => {
        calculator.calculateNewEnergyFinalQuote();
      });
    }
  }

  // 为特定表单获取汇率
  async fetchExchangeRateForForm(currency, formSuffix) {
    const exchangeRateInput = document.getElementById(`exchangeRate${formSuffix}`);
    const exchangeRateLabel = document.getElementById(`exchangeRateLabel${formSuffix}`);
    
    if (!exchangeRateInput || !exchangeRateLabel) {
      console.error(`汇率相关元素未找到: ${formSuffix}`);
      return;
    }

    exchangeRateInput.value = '加载中...';
    
    try {
      const rate = await this._fetchRateWithAppId(apiService.mainAppId, currency);
      this._handleRateSuccessForForm(rate, currency, exchangeRateInput, exchangeRateLabel, formSuffix);
    } catch (error) {
      console.warn('主API失败，尝试备用API:', error);
      try {
        const rate = await this._fetchRateWithAppId(apiService.backupAppId, currency);
        this._handleRateSuccessForForm(rate, currency, exchangeRateInput, exchangeRateLabel, formSuffix);
      } catch (backupError) {
        this._handleRateErrorForForm(exchangeRateInput, exchangeRateLabel);
      }
    }
  }

  // 使用指定App ID获取汇率
  async _fetchRateWithAppId(appId, currency) {
    const response = await fetch(`${apiService.baseUrl}&app_id=${appId}`);
    
    if (response.status === 403) {
      throw new Error('403 Forbidden');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.rates) {
      throw new Error('Invalid response format');
    }
    
    let rate = 0;
    if (currency === 'USD') {
      rate = data.rates.CNY / data.rates.USD;
    } else if (currency === 'EUR') {
      rate = data.rates.CNY / data.rates.EUR;
    } else if (currency === 'GBP') {
      rate = data.rates.CNY / data.rates.GBP;
    }
    
    return rate;
  }

  // 处理汇率获取成功（特定表单）
  _handleRateSuccessForForm(rate, currency, exchangeRateInput, exchangeRateLabel, formSuffix) {
    exchangeRateLabel.textContent = `汇率 实时基准：${rate.toFixed(2)}`;
    exchangeRateInput.value = (rate - 0.05).toFixed(2);
    this._updateCurrencyLabelsForForm(currency, formSuffix);
    this._triggerFinalQuoteCalculationForForm(formSuffix);
  }

  // 处理汇率获取失败（特定表单）
  _handleRateErrorForForm(exchangeRateInput, exchangeRateLabel) {
    exchangeRateInput.value = '';
    exchangeRateLabel.textContent = '汇率 实时基准：获取失败';
    alert('汇率获取失败，请稍后重试');
  }

  // 更新货币标签（特定表单）
  _updateCurrencyLabelsForForm(currency, formSuffix) {
    const currencyFlags = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧'
    };
    
    const flag = currencyFlags[currency];
    if (flag) {
      const flagElement = document.getElementById(`currencyFlag${formSuffix}`);
      if (flagElement) {
        flagElement.textContent = flag;
      }
    }
  }

  // 触发最终报价计算（特定表单）
  _triggerFinalQuoteCalculationForForm(formSuffix) {
    if (formSuffix === 'Used') {
      calculator.calculateUsedCarFinalQuote();
    } else if (formSuffix === 'NewEnergy') {
      calculator.calculateNewEnergyFinalQuote();
    }
  }

  // 初始化结果卡片
  initializeResultCard() {
    // 结果卡片相关功能已集成到UI管理器中
  }

  // 显示结果卡片
  showResultCard() {
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
      resultCard.classList.remove('hidden');
      resultCard.classList.add('animate-fadeIn');
    }
  }

  // 填充结果数据
  fillResultData() {
    // 基础信息
    const carModelElement = document.getElementById('resultCarModel');
    const carTypeElement = document.getElementById('resultCarType');
    const quoteTypeElement = document.getElementById('resultQuoteType');
    
    if (carModelElement) {
      carModelElement.textContent = document.getElementById('carModel2')?.value || '未填写';
    }
    
    if (carTypeElement) {
      const carTypeBtn = document.querySelector('.export-type-btn.border-primary.text-primary');
      const carTypeText = carTypeBtn ? carTypeBtn.textContent.trim() : '未选择';
      carTypeElement.textContent = carTypeText;
    }
    
    if (quoteTypeElement) {
      let quoteTypeText = '未选择';
      document.querySelectorAll('input[name="globalQuoteType"]').forEach(radio => {
        if (radio.checked) quoteTypeText = radio.value;
      });
      quoteTypeElement.textContent = quoteTypeText;
    }

    // 填充成本明细
    this.fillCostDetails();

    // 报价汇总
    this.fillQuoteSummary();
  }

  // 填充成本明细
  fillCostDetails() {
    const costDetails = document.getElementById('resultCostDetails');
    if (!costDetails) return;

    costDetails.innerHTML = '';
    
    // 开票价
    this.addCostDetail(costDetails, '开票价', document.getElementById('invoicePrice')?.value);
    
    // 选装
    const optionalEquipment = document.getElementById('optionalEquipment')?.value;
    if (optionalEquipment && parseFloat(optionalEquipment) > 0) {
      this.addCostDetail(costDetails, '选装', optionalEquipment);
    }
    
    // 国内运输
    this.addCostDetail(costDetails, '国内运输', document.getElementById('domesticShipping')?.value);
    
    // 港杂费
    const portChargesCif = document.getElementById('portCharges')?.value;
    const portChargesFob = document.getElementById('portChargesFob')?.value;
    const portCharges = parseFloat(portChargesCif || 0) + parseFloat(portChargesFob || 0);
    if (portCharges > 0) {
      this.addCostDetail(costDetails, '港杂费', portCharges);
    }
    
    // 交强险
    const compulsoryInsurance = document.getElementById('compulsoryInsurance')?.value;
    if (compulsoryInsurance && parseFloat(compulsoryInsurance) > 0) {
      this.addCostDetail(costDetails, '交强险', compulsoryInsurance);
    }
    
    // 退税
    this.addCostDetail(costDetails, '退税', document.getElementById('taxRefund')?.value, true);
    
    // 购车成本
    this.addCostDetail(costDetails, '购车成本', document.getElementById('purchaseCost')?.value, false, true);
  }

  // 填充报价汇总
  fillQuoteSummary() {
    const resultRmbQuote = document.getElementById('resultRmbQuote');
    const resultFinalQuote = document.getElementById('resultFinalQuote');
    const resultCurrencyText = document.getElementById('resultCurrencyText');
    
    if (resultRmbQuote) {
      resultRmbQuote.textContent = formatCurrencyInteger(Math.round(parseFloat(document.getElementById('rmbPrice')?.value || 0)));
    }
    
    if (resultFinalQuote) {
      resultFinalQuote.textContent = formatCurrencyInteger(Math.round(parseFloat(document.getElementById('finalQuote')?.value || 0)));
    }
    
    if (resultCurrencyText) {
      const currency = document.getElementById('currency')?.value || 'USD';
      resultCurrencyText.textContent = `最终报价 (${currency})`;
    }
  }

  // 添加成本明细项
  addCostDetail(container, label, value, isNegative = false, isTotal = false) {
    if (!container || !value) return;
    
    const item = document.createElement('li');
    item.className = 'flex justify-between items-center';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'text-gray-600';
    labelSpan.textContent = label + ':';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = isTotal ? 'font-semibold text-lg' : 'font-medium';
    if (isNegative) {
      valueSpan.className += ' text-green-600';
    }
    valueSpan.textContent = formatCurrencyInteger(parseFloat(value));
    
    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    container.appendChild(item);
  }

  // 滚动到结果区域
  scrollToResult() {
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // 设置全局引用
  setupGlobalReferences() {
    // 将主要实例暴露到全局作用域，以便在HTML中直接调用
    window.calculator = calculator;
    window.uiManager = uiManager;
    window.apiService = apiService;
  }
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

// 导出主应用类（如果需要）
export default App; 