import { CONFIG, FORM_TYPES } from './config.js';
import { safeParseFloat, formatCurrency } from './utils.js';

// 计算器类
export class Calculator {
  constructor() {
    this.currentFormType = FORM_TYPES.NEW_CAR;
    this.quoteTypeState = {
      [FORM_TYPES.NEW_CAR]: 'EXW',
      [FORM_TYPES.USED_CAR]: 'EXW',
      [FORM_TYPES.NEW_ENERGY]: 'EXW'
    };
  }

  // 设置当前表单类型
  setFormType(formType) {
    this.currentFormType = formType;
  }

  // 获取表单前缀
  getFormPrefix() {
    const prefixes = {
      [FORM_TYPES.NEW_CAR]: '',
      [FORM_TYPES.USED_CAR]: 'used',
      [FORM_TYPES.NEW_ENERGY]: 'newEnergy'
    };
    return prefixes[this.currentFormType];
  }

  // 获取元素ID
  getElementId(baseId) {
    const prefix = this.getFormPrefix();
    return prefix ? `${prefix}${baseId.charAt(0).toUpperCase() + baseId.slice(1)}` : baseId;
  }

  // 获取输入值
  getInputValue(elementId, defaultValue = 0) {
    const element = document.getElementById(elementId);
    return element ? safeParseFloat(element.value, defaultValue) : defaultValue;
  }

  // 设置输入值
  setInputValue(elementId, value, round = false) {
    const element = document.getElementById(elementId);
    if (element) {
      element.value = round ? Math.round(value) : value;
    }
  }

  // 新车计算 - 开票价
  calculateNewCarInvoicePrice() {
    const guidePrice = this.getInputValue('guidePrice');
    const discount = this.getInputValue('discount');
    const optionalEquipment = this.getInputValue('optionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    this.setInputValue('invoicePrice', invoicePrice, true);
    return invoicePrice;
  }

  // 新车计算 - 退税
  calculateNewCarTaxRefund() {
    const invoicePrice = this.getInputValue('invoicePrice');
    const taxRefund = invoicePrice / (1 + CONFIG.TAX_RATES.VAT_RATE) * CONFIG.TAX_RATES.VAT_RATE;
    this.setInputValue('taxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }

  // 新车计算 - 手续费
  calculateNewCarServiceFee() {
    const rate = this.getInputValue('serviceFeeRate', CONFIG.DEFAULT_SERVICE_FEE_RATE);
    const invoicePrice = this.getInputValue('invoicePrice');
    const fee = rate * invoicePrice;
    const serviceFeeElement = document.getElementById('serviceFee');
    if (serviceFeeElement) {
      serviceFeeElement.textContent = formatCurrency(Math.round(fee));
    }
    return fee;
  }

  // 新车计算 - 购车成本
  calculateNewCarPurchaseCost() {
    const invoicePrice = this.getInputValue('invoicePrice');
    const serviceFee = this.calculateNewCarServiceFee();
    const domesticShipping = this.getInputValue('domesticShipping');
    const portChargesCif = this.getInputValue('portCharges');
    const portChargesFob = this.getInputValue('portChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const compulsoryInsurance = this.getInputValue('compulsoryInsurance');
    const otherExpenses = this.getInputValue('otherExpenses');
    const taxRefund = this.getInputValue('taxRefund');
    
    const purchaseCost = invoicePrice + serviceFee + domesticShipping + portCharges + 
                        compulsoryInsurance + otherExpenses - taxRefund;
    this.setInputValue('purchaseCost', purchaseCost, true);
    return purchaseCost;
  }

  // 新车计算 - 人民币报价
  calculateNewCarRmbQuote() {
    const purchaseCost = this.getInputValue('purchaseCost');
    const rmbQuote = purchaseCost; // 人民币报价 = 采购费用
    this.setInputValue('rmbPrice', rmbQuote, true);
    return rmbQuote;
  }

  // 二手车计算 - 开票价
  calculateUsedCarInvoicePrice() {
    const guidePrice = this.getInputValue('usedGuidePrice');
    const discount = this.getInputValue('usedDiscount');
    const optionalEquipment = this.getInputValue('usedOptionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    this.setInputValue('usedInvoicePrice', invoicePrice, true);
    return invoicePrice;
  }

  // 二手车计算 - 购置税
  calculateUsedCarPurchaseTax() {
    const invoicePrice = this.getInputValue('usedInvoicePrice');
    const purchaseTax = invoicePrice / CONFIG.TAX_RATES.PURCHASE_TAX_RATE;
    this.setInputValue('usedPurchaseTax', purchaseTax.toFixed(2));
    return purchaseTax;
  }

  // 二手车计算 - 退税
  calculateUsedCarTaxRefund() {
    const invoicePrice = this.getInputValue('usedInvoicePrice');
    const taxRefund = invoicePrice / (1 + CONFIG.TAX_RATES.VAT_RATE) * CONFIG.TAX_RATES.VAT_RATE;
    this.setInputValue('usedTaxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }

  // 二手车计算 - 退税手续费
  calculateUsedCarTaxRefundFee() {
    const taxRefund = this.getInputValue('usedTaxRefund');
    const taxRefundFee = taxRefund * CONFIG.TAX_RATES.TAX_REFUND_FEE_RATE;
    this.setInputValue('usedTaxRefundFee', taxRefundFee, true);
    return taxRefundFee;
  }

  // 二手车计算 - 购车成本
  calculateUsedCarPurchaseCost() {
    const invoicePrice = this.getInputValue('usedInvoicePrice');
    const purchaseTax = this.calculateUsedCarPurchaseTax();
    const compulsoryInsurance = this.getInputValue('usedCompulsoryInsurance');
    const otherExpenses = this.getInputValue('usedOtherExpenses');
    const qualificationFee = this.getInputValue('usedQualificationFee');
    const agencyFee = this.getInputValue('usedAgencyFee');
    const taxRefundFee = this.calculateUsedCarTaxRefundFee();
    const domesticShipping = this.getInputValue('usedDomesticShipping');
    const portChargesCif = this.getInputValue('usedPortCharges');
    const portChargesFob = this.getInputValue('usedPortChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const taxRefund = this.getInputValue('usedTaxRefund');
    
    const purchaseCost = invoicePrice + purchaseTax + compulsoryInsurance + otherExpenses + 
                        qualificationFee + agencyFee + taxRefundFee + domesticShipping + 
                        portCharges - taxRefund;
    this.setInputValue('usedPurchaseCost', purchaseCost, true);
    return purchaseCost;
  }

  // 二手车计算 - 人民币报价
  calculateUsedCarRmbQuote() {
    const purchaseCost = this.getInputValue('usedPurchaseCost');
    const markup = this.getInputValue('usedMarkup');
    const rmbQuote = purchaseCost + markup;
    const rmbInput = document.getElementById('usedRmbPrice');
    this.setInputValue('usedRmbPrice', rmbQuote, true);
    if (rmbInput) {
      rmbInput.dispatchEvent(new Event('input'));
    }
    return rmbQuote;
  }

  // 新能源计算 - 开票价
  calculateNewEnergyInvoicePrice() {
    const guidePrice = this.getInputValue('newEnergyGuidePrice');
    const discount = this.getInputValue('newEnergyDiscount');
    const optionalEquipment = this.getInputValue('newEnergyOptionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    this.setInputValue('newEnergyInvoicePrice', invoicePrice, true);
    return invoicePrice;
  }

  // 新能源计算 - 购置税
  calculateNewEnergyPurchaseTax() {
    const invoicePrice = this.getInputValue('newEnergyInvoicePrice');
    const taxNote = document.getElementById('newEnergyTaxNote');
    const taxNoteContainer = taxNote?.parentElement;
    
    if (invoicePrice <= CONFIG.NEW_ENERGY_TAX_THRESHOLD) {
      // 开票价低于33.9万元免征购置税
      this.setInputValue('newEnergyPurchaseTax', '0.00');
      if (taxNote) {
        taxNote.textContent = '免征购置税';
        taxNote.className = 'text-green-600';
      }
      if (taxNoteContainer) {
        taxNoteContainer.style.display = 'block';
      }
      return 0;
    } else {
      // 开票价高于33.9万元，购置税 = (开票价 - 339000) / 11.3
      const purchaseTax = (invoicePrice - CONFIG.NEW_ENERGY_TAX_THRESHOLD) / CONFIG.TAX_RATES.PURCHASE_TAX_RATE;
      this.setInputValue('newEnergyPurchaseTax', purchaseTax.toFixed(2));
      if (taxNoteContainer) {
        taxNoteContainer.style.display = 'none';
      }
      return purchaseTax;
    }
  }

  // 新能源计算 - 退税
  calculateNewEnergyTaxRefund() {
    const invoicePrice = this.getInputValue('newEnergyInvoicePrice');
    const taxRefund = invoicePrice / (1 + CONFIG.TAX_RATES.VAT_RATE) * CONFIG.TAX_RATES.VAT_RATE;
    this.setInputValue('newEnergyTaxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }

  // 新能源计算 - 退税手续费
  calculateNewEnergyTaxRefundFee() {
    const taxRefund = this.getInputValue('newEnergyTaxRefund');
    const taxRefundFee = taxRefund * CONFIG.TAX_RATES.TAX_REFUND_FEE_RATE;
    this.setInputValue('newEnergyTaxRefundFee', taxRefundFee, true);
    return taxRefundFee;
  }

  // 新能源计算 - 购车成本
  calculateNewEnergyPurchaseCost() {
    const invoicePrice = this.getInputValue('newEnergyInvoicePrice');
    const purchaseTax = this.calculateNewEnergyPurchaseTax();
    const compulsoryInsurance = this.getInputValue('newEnergyCompulsoryInsurance');
    const otherExpenses = this.getInputValue('newEnergyOtherExpenses');
    const qualificationFee = this.getInputValue('newEnergyQualificationFee');
    const agencyFee = this.getInputValue('newEnergyAgencyFee');
    const taxRefundFee = this.calculateNewEnergyTaxRefundFee();
    const domesticShipping = this.getInputValue('newEnergyDomesticShipping');
    const portChargesCif = this.getInputValue('newEnergyPortCharges');
    const portChargesFob = this.getInputValue('newEnergyPortChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const taxRefund = this.getInputValue('newEnergyTaxRefund');
    
    const purchaseCost = invoicePrice + purchaseTax + compulsoryInsurance + otherExpenses + 
                        qualificationFee + agencyFee + taxRefundFee + domesticShipping + 
                        portCharges - taxRefund;
    this.setInputValue('newEnergyPurchaseCost', purchaseCost, true);
    return purchaseCost;
  }

  // 新能源计算 - 人民币报价
  calculateNewEnergyRmbQuote() {
    const purchaseCost = this.getInputValue('newEnergyPurchaseCost');
    const markup = this.getInputValue('newEnergyMarkup');
    const rmbQuote = purchaseCost + markup;
    const rmbInput = document.getElementById('newEnergyRmbPrice');
    this.setInputValue('newEnergyRmbPrice', rmbQuote, true);
    if (rmbInput) {
      rmbInput.dispatchEvent(new Event('input'));
    }
    return rmbQuote;
  }

  // 计算最终报价（新车）
  calculateFinalQuote() {
    const rmbQuote = this.getInputValue('rmbPrice');
    const exchangeRate = this.getInputValue('exchangeRate');
    const currency = document.getElementById('currency')?.value;
    let seaFreight = this.getInputValue('seaFreight');
    
    if (currency && exchangeRate > 0 && rmbQuote > 0) {
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      this.setInputValue('finalQuote', finalQuote, true);
      
      // 计算成本价格
      const invoicePrice = this.getInputValue('invoicePrice');
      const domesticShipping = this.getInputValue('domesticShipping');
      const portChargesCif = this.getInputValue('portCharges');
      const portChargesFob = this.getInputValue('portChargesFob');
      const portCharges = portChargesCif + portChargesFob;
      const compulsoryInsurance = this.getInputValue('compulsoryInsurance');
      const otherExpenses = this.getInputValue('otherExpenses');
      const taxRefund = this.getInputValue('taxRefund');
      
      const costPrice = (invoicePrice + invoicePrice * CONFIG.DEFAULT_SERVICE_FEE_RATE + 
                        domesticShipping + portCharges + compulsoryInsurance + 
                        otherExpenses - taxRefund) / exchangeRate + seaFreight;
      this.setInputValue('costPrice', costPrice, true);
      
      // 触发利润计算
      this.calculateNewCarProfit();
      
      return finalQuote;
    }
    
    this.setInputValue('finalQuote', '');
    this.setInputValue('costPrice', '');
    this.setInputValue('profit', '');
    this.setInputValue('profitRate', '');
    return 0;
  }

  // 二手车最终报价计算
  calculateUsedCarFinalQuote() {
    const purchaseCost = this.getInputValue('usedPurchaseCost');
    const rmbQuote = this.getInputValue('usedRmbPrice');
    const exchangeRate = this.getInputValue('exchangeRateUsed');
    let seaFreight = this.getInputValue('usedSeaFreight');
    
    if (exchangeRate > 0) {
      // 成本价格 = 购车成本 / 汇率 + 海运费
      const costPrice = purchaseCost / exchangeRate + seaFreight;
      this.setInputValue('costPriceUsed', costPrice, true);
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      this.setInputValue('finalQuoteUsed', finalQuote, true);
      
      // 触发利润计算
      this.calculateUsedCarProfit();
    } else {
      this.setInputValue('costPriceUsed', '');
      this.setInputValue('finalQuoteUsed', '');
      this.setInputValue('usedProfit', '');
      this.setInputValue('usedProfitRate', '');
    }
  }

  // 新能源车最终报价计算
  calculateNewEnergyFinalQuote() {
    const purchaseCost = this.getInputValue('newEnergyPurchaseCost');
    const rmbQuote = this.getInputValue('newEnergyRmbPrice');
    const exchangeRate = this.getInputValue('exchangeRateNewEnergy');
    let seaFreight = this.getInputValue('newEnergySeaFreight');
    
    if (exchangeRate > 0) {
      // 成本价格 = 购车成本 / 汇率 + 海运费
      const costPrice = purchaseCost / exchangeRate + seaFreight;
      this.setInputValue('costPriceNewEnergy', costPrice, true);
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      this.setInputValue('finalQuoteNewEnergy', finalQuote, true);
      
      // 触发利润计算
      this.calculateNewEnergyProfit();
    } else {
      this.setInputValue('costPriceNewEnergy', '');
      this.setInputValue('finalQuoteNewEnergy', '');
      this.setInputValue('newEnergyProfit', '');
      this.setInputValue('newEnergyProfitRate', '');
    }
  }

  // 新车计算 - 利润
  calculateNewCarProfit() {
    const finalQuote = this.getInputValue('finalQuote');
    const costPrice = this.getInputValue('costPrice');
    const exchangeRate = this.getInputValue('exchangeRate');
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
    this.setInputValue('profit', rmbProfit, true);
    this.setInputValue('profitRate', foreignProfit, true);
  }

  // 二手车计算 - 利润
  calculateUsedCarProfit() {
    const finalQuote = this.getInputValue('finalQuoteUsed');
    const costPrice = this.getInputValue('costPriceUsed');
    const exchangeRate = this.getInputValue('exchangeRateUsed');
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
    this.setInputValue('usedProfit', rmbProfit, true);
    this.setInputValue('usedProfitRate', foreignProfit, true);
  }

  // 新能源计算 - 利润
  calculateNewEnergyProfit() {
    const finalQuote = this.getInputValue('finalQuoteNewEnergy');
    const costPrice = this.getInputValue('costPriceNewEnergy');
    const exchangeRate = this.getInputValue('exchangeRateNewEnergy');
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
    this.setInputValue('newEnergyProfit', rmbProfit, true);
    this.setInputValue('newEnergyProfitRate', foreignProfit, true);
  }

  // 新车计算 - 所有计算
  calculateNewCarAll() {
    this.calculateNewCarInvoicePrice();
    this.calculateNewCarTaxRefund();
    this.calculateNewCarServiceFee();
    this.calculateNewCarPurchaseCost();
    this.calculateNewCarRmbQuote();
    this.calculateFinalQuote();
    this.calculateNewCarProfit();
  }

  // 二手车计算 - 所有计算
  calculateUsedCarAll() {
    this.calculateUsedCarInvoicePrice();
    this.calculateUsedCarPurchaseTax();
    this.calculateUsedCarTaxRefund();
    this.calculateUsedCarTaxRefundFee();
    this.calculateUsedCarPurchaseCost();
    this.calculateUsedCarRmbQuote();
    this.calculateUsedCarFinalQuote();
    this.calculateUsedCarProfit();
  }

  // 新能源计算 - 所有计算
  calculateNewEnergyAll() {
    this.calculateNewEnergyInvoicePrice();
    this.calculateNewEnergyPurchaseTax();
    this.calculateNewEnergyTaxRefund();
    this.calculateNewEnergyTaxRefundFee();
    this.calculateNewEnergyPurchaseCost();
    this.calculateNewEnergyRmbQuote();
    this.calculateNewEnergyFinalQuote();
    this.calculateNewEnergyProfit();
  }
}

// 创建全局计算器实例
export const calculator = new Calculator(); 