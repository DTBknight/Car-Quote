import CONFIG from './config.js';
import { Utils } from './utils.js';

// 计算引擎模块
export class CalculationEngine {
  constructor() {
    this.formTypes = ['new', 'used', 'newEnergy'];
    this.calculationCache = new Map(); // 计算缓存
    this.dependencies = new Map(); // 依赖关系
    this.cacheTimeout = 1 * 60 * 1000; // 1分钟缓存
    this.setupDependencies();
  }
  
  // 设置依赖关系
  setupDependencies() {
    // 新车依赖关系
    this.dependencies.set('new', {
      'invoicePrice': ['guidePrice', 'discount', 'optionalEquipment'],
      'taxRefund': ['invoicePrice'],
      'serviceFee': ['serviceFeeRate', 'invoicePrice'],
      'purchaseCost': ['invoicePrice', 'serviceFee', 'domesticShipping', 'portCharges', 'portChargesFob', 'compulsoryInsurance', 'otherExpenses', 'taxRefund'],
      'rmbQuote': ['purchaseCost'],
      'finalQuote': ['rmbQuote', 'exchangeRate', 'seaFreight'],
      'profit': ['finalQuote', 'costPrice', 'exchangeRate']
    });
    
    // 二手车依赖关系
    this.dependencies.set('used', {
      'invoicePrice': ['usedGuidePrice', 'usedDiscount', 'usedOptionalEquipment'],
      'purchaseTax': ['invoicePrice'],
      'taxRefund': ['invoicePrice'],
      'taxRefundFee': ['taxRefund'],
      'purchaseCost': ['invoicePrice', 'purchaseTax', 'usedCompulsoryInsurance', 'usedOtherExpenses', 'usedQualificationFee', 'usedAgencyFee', 'taxRefundFee', 'usedDomesticShipping', 'usedPortCharges', 'usedPortChargesFob', 'taxRefund'],
      'rmbQuote': ['purchaseCost', 'usedMarkup'],
      'finalQuote': ['rmbQuote', 'exchangeRate', 'usedSeaFreight'],
      'profit': ['finalQuote', 'costPrice', 'exchangeRate']
    });
    
    // 新能源车依赖关系
    this.dependencies.set('newEnergy', {
      'invoicePrice': ['newEnergyGuidePrice', 'newEnergyDiscount', 'newEnergyOptionalEquipment'],
      'purchaseTax': ['invoicePrice'],
      'taxRefund': ['invoicePrice'],
      'taxRefundFee': ['taxRefund'],
      'purchaseCost': ['invoicePrice', 'purchaseTax', 'newEnergyCompulsoryInsurance', 'newEnergyOtherExpenses', 'newEnergyQualificationFee', 'newEnergyAgencyFee', 'taxRefundFee', 'newEnergyDomesticShipping', 'newEnergyPortCharges', 'newEnergyPortChargesFob', 'taxRefund'],
      'rmbQuote': ['purchaseCost', 'newEnergyMarkup'],
      'finalQuote': ['rmbQuote', 'exchangeRate', 'newEnergySeaFreight'],
      'profit': ['finalQuote', 'costPrice', 'exchangeRate']
    });
  }
  
  // 获取缓存键
  getCacheKey(formType, calculation, params = {}) {
    const paramStr = Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('|');
    return `${formType}_${calculation}_${paramStr}`;
  }
  
  // 检查缓存
  getCachedResult(cacheKey) {
    const cached = this.calculationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }
  
  // 设置缓存
  setCachedResult(cacheKey, result) {
    this.calculationCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }
  
  // 清除缓存
  clearCache(formType = null) {
    if (formType) {
      for (const key of this.calculationCache.keys()) {
        if (key.startsWith(formType)) {
          this.calculationCache.delete(key);
        }
      }
    } else {
      this.calculationCache.clear();
    }
  }
  
  // 通用开票价计算
  calculateInvoicePrice(guidePrice, discount, optionalEquipment) {
    return Math.max(0, guidePrice + optionalEquipment - discount);
  }
  
  // 通用退税计算
  calculateTaxRefund(invoicePrice) {
    return invoicePrice / CONFIG.CALCULATION.TAX_DIVISOR * CONFIG.CALCULATION.TAX_RATE;
  }
  
  // 通用手续费计算
  calculateServiceFee(rate, invoicePrice) {
    return rate * invoicePrice;
  }
  
  // 通用购置税计算
  calculatePurchaseTax(invoicePrice, isNewEnergy = false) {
    if (isNewEnergy && invoicePrice <= CONFIG.CALCULATION.NEW_ENERGY_TAX_THRESHOLD) {
      return 0;
    }
    if (isNewEnergy) {
      return (invoicePrice - CONFIG.CALCULATION.NEW_ENERGY_TAX_THRESHOLD) / CONFIG.CALCULATION.PURCHASE_TAX_RATE;
    }
    return invoicePrice / CONFIG.CALCULATION.PURCHASE_TAX_RATE;
  }
  
  // 通用退税手续费计算
  calculateTaxRefundFee(taxRefund) {
    return taxRefund * CONFIG.CALCULATION.TAX_REFUND_FEE_RATE;
  }
  
  // 通用购车成本计算
  calculatePurchaseCost(components) {
    const { invoicePrice, serviceFee = 0, domesticShipping, portCharges = 0, compulsoryInsurance, otherExpenses, qualificationFee = 0, agencyFee = 0, taxRefundFee = 0, taxRefund } = components;
    return invoicePrice + serviceFee + domesticShipping + portCharges + compulsoryInsurance + otherExpenses + qualificationFee + agencyFee + taxRefundFee - taxRefund;
  }
  
  // 通用最终报价计算
  calculateFinalQuote(rmbQuote, exchangeRate, seaFreight = 0) {
    if (exchangeRate > 0 && rmbQuote > 0) {
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      return finalQuote;
    }
    return 0;
  }
  
  // 通用利润计算
  calculateProfit(finalQuote, costPrice, exchangeRate) {
    const foreignProfit = finalQuote - costPrice;
    const rmbProfit = foreignProfit * exchangeRate;
    return { foreignProfit, rmbProfit };
  }
  
  // 新车计算 - 开票价
  calculateNewCarInvoicePrice() {
    const guidePrice = Utils.getElementValue('guidePrice');
    const discount = Utils.getElementValue('discount');
    const optionalEquipment = Utils.getElementValue('optionalEquipment');
    
    const cacheKey = this.getCacheKey('new', 'invoicePrice', { guidePrice, discount, optionalEquipment });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('invoicePrice', cached);
      return cached;
    }
    
    const invoicePrice = this.calculateInvoicePrice(guidePrice, discount, optionalEquipment);
    const roundedPrice = Math.round(invoicePrice);
    
    Utils.setElementValue('invoicePrice', roundedPrice);
    this.setCachedResult(cacheKey, roundedPrice);
    return roundedPrice;
  }
  
  // 新车计算 - 退税
  calculateNewCarTaxRefund() {
    const invoicePrice = Utils.getElementValue('invoicePrice');
    
    const cacheKey = this.getCacheKey('new', 'taxRefund', { invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('taxRefund', cached.toFixed(2));
      return cached;
    }
    
    const taxRefund = this.calculateTaxRefund(invoicePrice);
    
    Utils.setElementValue('taxRefund', taxRefund.toFixed(2));
    this.setCachedResult(cacheKey, taxRefund);
    return taxRefund;
  }
  
  // 新车计算 - 手续费
  calculateNewCarServiceFee() {
    const rate = Utils.getElementValue('serviceFeeRate');
    const invoicePrice = Utils.getElementValue('invoicePrice');
    
    const cacheKey = this.getCacheKey('new', 'serviceFee', { rate, invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementText('serviceFee', Utils.formatCurrency(Math.round(cached)));
      return cached;
    }
    
    const fee = this.calculateServiceFee(rate, invoicePrice);
    const roundedFee = Math.round(fee);
    
    Utils.setElementText('serviceFee', Utils.formatCurrency(roundedFee));
    this.setCachedResult(cacheKey, roundedFee);
    return roundedFee;
  }
  
  // 新车计算 - 购车成本
  calculateNewCarPurchaseCost() {
    const invoicePrice = Utils.getElementValue('invoicePrice');
    const serviceFee = this.calculateNewCarServiceFee();
    const domesticShipping = Utils.getElementValue('domesticShipping');
    const portChargesCif = Utils.getElementValue('portCharges');
    const portChargesFob = Utils.getElementValue('portChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const compulsoryInsurance = Utils.getElementValue('compulsoryInsurance');
    const otherExpenses = Utils.getElementValue('otherExpenses');
    const taxRefund = Utils.getElementValue('taxRefund');
    
    const cacheKey = this.getCacheKey('new', 'purchaseCost', { 
      invoicePrice, serviceFee, domesticShipping, portCharges, compulsoryInsurance, otherExpenses, taxRefund 
    });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('purchaseCost', cached);
      return cached;
    }
    
    const purchaseCost = this.calculatePurchaseCost({
      invoicePrice, serviceFee, domesticShipping, portCharges, compulsoryInsurance, otherExpenses, taxRefund
    });
    const roundedCost = Math.round(purchaseCost);
    
    Utils.setElementValue('purchaseCost', roundedCost);
    this.setCachedResult(cacheKey, roundedCost);
    return roundedCost;
  }
  
  // 新车计算 - 人民币报价
  calculateNewCarRmbQuote() {
    const purchaseCost = Utils.getElementValue('purchaseCost');
    const rmbQuote = purchaseCost; // 人民币报价 = 采购费用
    Utils.setElementValue('rmbPrice', Math.round(rmbQuote));
    return rmbQuote;
  }
  
  // 新车计算 - 利润
  calculateNewCarProfit() {
    const finalQuote = Utils.getElementValue('finalQuote');
    const costPrice = Utils.getElementValue('costPrice');
    const exchangeRate = Utils.getElementValue('exchangeRate');
    
    const { foreignProfit, rmbProfit } = this.calculateProfit(finalQuote, costPrice, exchangeRate);
    
    Utils.setElementValue('profit', Math.round(rmbProfit));
    Utils.setElementValue('profitRate', Math.round(foreignProfit));
  }
  
  // 二手车计算 - 开票价
  calculateUsedCarInvoicePrice() {
    const guidePrice = Utils.getElementValue('usedGuidePrice');
    const discount = Utils.getElementValue('usedDiscount');
    const optionalEquipment = Utils.getElementValue('usedOptionalEquipment');
    
    const cacheKey = this.getCacheKey('used', 'invoicePrice', { guidePrice, discount, optionalEquipment });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('usedInvoicePrice', cached);
      return cached;
    }
    
    const invoicePrice = this.calculateInvoicePrice(guidePrice, discount, optionalEquipment);
    const roundedPrice = Math.round(invoicePrice);
    
    Utils.setElementValue('usedInvoicePrice', roundedPrice);
    this.setCachedResult(cacheKey, roundedPrice);
    return roundedPrice;
  }
  
  // 二手车计算 - 购置税
  calculateUsedCarPurchaseTax() {
    const invoicePrice = Utils.getElementValue('usedInvoicePrice');
    
    const cacheKey = this.getCacheKey('used', 'purchaseTax', { invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('usedPurchaseTax', cached.toFixed(2));
      return cached;
    }
    
    const purchaseTax = this.calculatePurchaseTax(invoicePrice);
    
    Utils.setElementValue('usedPurchaseTax', purchaseTax.toFixed(2));
    this.setCachedResult(cacheKey, purchaseTax);
    return purchaseTax;
  }
  
  // 二手车计算 - 退税
  calculateUsedCarTaxRefund() {
    const invoicePrice = Utils.getElementValue('usedInvoicePrice');
    
    const cacheKey = this.getCacheKey('used', 'taxRefund', { invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('usedTaxRefund', cached.toFixed(2));
      return cached;
    }
    
    const taxRefund = this.calculateTaxRefund(invoicePrice);
    
    Utils.setElementValue('usedTaxRefund', taxRefund.toFixed(2));
    this.setCachedResult(cacheKey, taxRefund);
    return taxRefund;
  }
  
  // 二手车计算 - 退税手续费
  calculateUsedCarTaxRefundFee() {
    const taxRefund = Utils.getElementValue('usedTaxRefund');
    
    const cacheKey = this.getCacheKey('used', 'taxRefundFee', { taxRefund });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('usedTaxRefundFee', cached);
      return cached;
    }
    
    const taxRefundFee = this.calculateTaxRefundFee(taxRefund);
    const roundedFee = Math.round(taxRefundFee);
    
    Utils.setElementValue('usedTaxRefundFee', roundedFee);
    this.setCachedResult(cacheKey, roundedFee);
    return roundedFee;
  }
  
  // 二手车计算 - 购车成本
  calculateUsedCarPurchaseCost() {
    const invoicePrice = Utils.getElementValue('usedInvoicePrice');
    const purchaseTax = this.calculateUsedCarPurchaseTax();
    const compulsoryInsurance = Utils.getElementValue('usedCompulsoryInsurance');
    const otherExpenses = Utils.getElementValue('usedOtherExpenses');
    const qualificationFee = Utils.getElementValue('usedQualificationFee');
    const agencyFee = Utils.getElementValue('usedAgencyFee');
    const taxRefundFee = this.calculateUsedCarTaxRefundFee();
    const domesticShipping = Utils.getElementValue('usedDomesticShipping');
    const portChargesCif = Utils.getElementValue('usedPortCharges');
    const portChargesFob = Utils.getElementValue('usedPortChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const taxRefund = Utils.getElementValue('usedTaxRefund');
    
    const cacheKey = this.getCacheKey('used', 'purchaseCost', { 
      invoicePrice, purchaseTax, compulsoryInsurance, otherExpenses, qualificationFee, agencyFee, taxRefundFee, domesticShipping, portCharges, taxRefund 
    });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('usedPurchaseCost', cached);
      return cached;
    }
    
    const purchaseCost = this.calculatePurchaseCost({
      invoicePrice, purchaseTax, compulsoryInsurance, otherExpenses, qualificationFee, agencyFee, taxRefundFee, domesticShipping, portCharges, taxRefund
    });
    const roundedCost = Math.round(purchaseCost);
    
    Utils.setElementValue('usedPurchaseCost', roundedCost);
    this.setCachedResult(cacheKey, roundedCost);
    return roundedCost;
  }
  
  // 二手车计算 - 人民币报价
  calculateUsedCarRmbQuote() {
    const purchaseCost = Utils.getElementValue('usedPurchaseCost');
    const markup = Utils.getElementValue('usedMarkup');
    const rmbQuote = purchaseCost + markup;
    const rmbInput = Utils.getElement('usedRmbPrice');
    rmbInput.value = Math.round(rmbQuote);
    rmbInput.dispatchEvent(new Event('input'));
    return rmbQuote;
  }
  
  // 二手车计算 - 利润
  calculateUsedCarProfit() {
    const finalQuote = Utils.getElementValue('finalQuoteUsed');
    const costPrice = Utils.getElementValue('costPriceUsed');
    const exchangeRate = Utils.getElementValue('exchangeRateUsed');
    
    const { foreignProfit, rmbProfit } = this.calculateProfit(finalQuote, costPrice, exchangeRate);
    
    Utils.setElementValue('usedProfit', Math.round(rmbProfit));
    Utils.setElementValue('usedProfitRate', Math.round(foreignProfit));
  }
  
  // 新能源计算 - 开票价
  calculateNewEnergyInvoicePrice() {
    const guidePrice = Utils.getElementValue('newEnergyGuidePrice');
    const discount = Utils.getElementValue('newEnergyDiscount');
    const optionalEquipment = Utils.getElementValue('newEnergyOptionalEquipment');
    
    const cacheKey = this.getCacheKey('newEnergy', 'invoicePrice', { guidePrice, discount, optionalEquipment });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('newEnergyInvoicePrice', cached);
      return cached;
    }
    
    const invoicePrice = this.calculateInvoicePrice(guidePrice, discount, optionalEquipment);
    const roundedPrice = Math.round(invoicePrice);
    
    Utils.setElementValue('newEnergyInvoicePrice', roundedPrice);
    this.setCachedResult(cacheKey, roundedPrice);
    return roundedPrice;
  }
  
  // 新能源计算 - 购置税
  calculateNewEnergyPurchaseTax() {
    const invoicePrice = Utils.getElementValue('newEnergyInvoicePrice');
    const taxNote = Utils.getElement('newEnergyTaxNote');
    const taxNoteContainer = taxNote?.parentElement;
    
    const cacheKey = this.getCacheKey('newEnergy', 'purchaseTax', { invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      if (cached === 0) {
        Utils.setElementValue('newEnergyPurchaseTax', '0.00');
      } else {
        Utils.setElementValue('newEnergyPurchaseTax', cached.toFixed(2));
      }
      return cached;
    }
    
    const purchaseTax = this.calculatePurchaseTax(invoicePrice, true);
    
    if (invoicePrice <= CONFIG.CALCULATION.NEW_ENERGY_TAX_THRESHOLD) {
      // 开票价低于33.9万元免征购置税
      Utils.setElementValue('newEnergyPurchaseTax', '0.00');
      if (taxNote) {
        Utils.setElementText('newEnergyTaxNote', '免征购置税');
        Utils.addClass('newEnergyTaxNote', 'text-green-600');
      }
      if (taxNoteContainer) {
        Utils.toggleElement(taxNoteContainer.id, true);
      }
      this.setCachedResult(cacheKey, 0);
      return 0;
    } else {
      // 开票价高于33.9万元，购置税 = (开票价 - 339000) / 11.3
      Utils.setElementValue('newEnergyPurchaseTax', purchaseTax.toFixed(2));
      if (taxNoteContainer) {
        Utils.toggleElement(taxNoteContainer.id, false);
      }
      this.setCachedResult(cacheKey, purchaseTax);
      return purchaseTax;
    }
  }
  
  // 新能源计算 - 退税
  calculateNewEnergyTaxRefund() {
    const invoicePrice = Utils.getElementValue('newEnergyInvoicePrice');
    
    const cacheKey = this.getCacheKey('newEnergy', 'taxRefund', { invoicePrice });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('newEnergyTaxRefund', cached.toFixed(2));
      return cached;
    }
    
    const taxRefund = this.calculateTaxRefund(invoicePrice);
    
    Utils.setElementValue('newEnergyTaxRefund', taxRefund.toFixed(2));
    this.setCachedResult(cacheKey, taxRefund);
    return taxRefund;
  }
  
  // 新能源计算 - 退税手续费
  calculateNewEnergyTaxRefundFee() {
    const taxRefund = Utils.getElementValue('newEnergyTaxRefund');
    
    const cacheKey = this.getCacheKey('newEnergy', 'taxRefundFee', { taxRefund });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('newEnergyTaxRefundFee', cached);
      return cached;
    }
    
    const taxRefundFee = this.calculateTaxRefundFee(taxRefund);
    const roundedFee = Math.round(taxRefundFee);
    
    Utils.setElementValue('newEnergyTaxRefundFee', roundedFee);
    this.setCachedResult(cacheKey, roundedFee);
    return roundedFee;
  }
  
  // 新能源计算 - 购车成本
  calculateNewEnergyPurchaseCost() {
    const invoicePrice = Utils.getElementValue('newEnergyInvoicePrice');
    const purchaseTax = this.calculateNewEnergyPurchaseTax();
    const compulsoryInsurance = Utils.getElementValue('newEnergyCompulsoryInsurance');
    const otherExpenses = Utils.getElementValue('newEnergyOtherExpenses');
    const qualificationFee = Utils.getElementValue('newEnergyQualificationFee');
    const agencyFee = Utils.getElementValue('newEnergyAgencyFee');
    const taxRefundFee = this.calculateNewEnergyTaxRefundFee();
    const domesticShipping = Utils.getElementValue('newEnergyDomesticShipping');
    const portChargesCif = Utils.getElementValue('newEnergyPortCharges');
    const portChargesFob = Utils.getElementValue('newEnergyPortChargesFob');
    const portCharges = portChargesCif + portChargesFob;
    const taxRefund = Utils.getElementValue('newEnergyTaxRefund');
    
    const cacheKey = this.getCacheKey('newEnergy', 'purchaseCost', { 
      invoicePrice, purchaseTax, compulsoryInsurance, otherExpenses, qualificationFee, agencyFee, taxRefundFee, domesticShipping, portCharges, taxRefund 
    });
    const cached = this.getCachedResult(cacheKey);
    if (cached !== null) {
      Utils.setElementValue('newEnergyPurchaseCost', cached);
      return cached;
    }
    
    const purchaseCost = this.calculatePurchaseCost({
      invoicePrice, purchaseTax, compulsoryInsurance, otherExpenses, qualificationFee, agencyFee, taxRefundFee, domesticShipping, portCharges, taxRefund
    });
    const roundedCost = Math.round(purchaseCost);
    
    Utils.setElementValue('newEnergyPurchaseCost', roundedCost);
    this.setCachedResult(cacheKey, roundedCost);
    return roundedCost;
  }
  
  // 新能源计算 - 人民币报价
  calculateNewEnergyRmbQuote() {
    const purchaseCost = Utils.getElementValue('newEnergyPurchaseCost');
    const markup = Utils.getElementValue('newEnergyMarkup');
    const rmbQuote = purchaseCost + markup;
    const rmbInput = Utils.getElement('newEnergyRmbPrice');
    rmbInput.value = Math.round(rmbQuote);
    rmbInput.dispatchEvent(new Event('input'));
    return rmbQuote;
  }
  
  // 新能源计算 - 利润
  calculateNewEnergyProfit() {
    const finalQuote = Utils.getElementValue('finalQuoteNewEnergy');
    const costPrice = Utils.getElementValue('costPriceNewEnergy');
    const exchangeRate = Utils.getElementValue('exchangeRateNewEnergy');
    
    const { foreignProfit, rmbProfit } = this.calculateProfit(finalQuote, costPrice, exchangeRate);
    
    Utils.setElementValue('newEnergyProfit', Math.round(rmbProfit));
    Utils.setElementValue('newEnergyProfitRate', Math.round(foreignProfit));
  }
  
  // 计算最终报价（新车）
  calculateFinalQuote() {
    const rmbQuote = Utils.getElementValue('rmbPrice');
    const exchangeRate = Utils.getElementValue('exchangeRate');
    const currency = Utils.getElement('currency')?.value;
    let seaFreight = Utils.getElementValue('seaFreight');
    
    if (currency && exchangeRate > 0 && rmbQuote > 0) {
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      Utils.setElementValue('finalQuote', Math.round(finalQuote));
      
      // 计算成本价格（新车专用公式）
      const invoicePrice = Utils.getElementValue('invoicePrice');
      const serviceFeeRate = Utils.getElementValue('serviceFeeRate');
      const domesticShipping = Utils.getElementValue('domesticShipping');
      const portChargesCif = Utils.getElementValue('portCharges');
      const portChargesFob = Utils.getElementValue('portChargesFob');
      const portCharges = portChargesCif + portChargesFob;
      const compulsoryInsurance = Utils.getElementValue('compulsoryInsurance');
      const otherExpenses = Utils.getElementValue('otherExpenses');
      const taxRefund = Utils.getElementValue('taxRefund');
      
      // 新车成本价格 = (开票价 + 开票价×手续费率 + 国内运输 + 港杂费 + 交强险 + 其他费用 - 退税) ÷ 汇率 + 海运费
      const serviceFeeRate = Utils.getElementValue('serviceFeeRate');
      const serviceFee = invoicePrice * serviceFeeRate; // 使用动态手续费率
      const costPrice = (invoicePrice + serviceFee + domesticShipping + portCharges + compulsoryInsurance + otherExpenses - taxRefund) / exchangeRate + seaFreight;
      Utils.setElementValue('costPrice', Math.round(costPrice));
      
      // 触发利润计算
      this.calculateNewCarProfit();
      
      return finalQuote;
    }
    
    Utils.setElementValue('finalQuote', '');
    Utils.setElementValue('costPrice', '');
    Utils.setElementValue('profit', '');
    Utils.setElementValue('profitRate', '');
    return 0;
  }
  
  // 二手车最终报价计算
  calculateUsedCarFinalQuote() {
    const purchaseCost = Utils.getElementValue('usedPurchaseCost');
    const rmbQuote = Utils.getElementValue('usedRmbPrice');
    const exchangeRate = Utils.getElementValue('exchangeRateUsed');
    let seaFreight = Utils.getElementValue('usedSeaFreight');
    
    if (exchangeRate > 0) {
      // 成本价格 = 购车成本 / 汇率 + 海运费
      const costPrice = purchaseCost / exchangeRate + seaFreight;
      Utils.setElementValue('costPriceUsed', Math.round(costPrice));
      
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      Utils.setElementValue('finalQuoteUsed', Math.round(finalQuote));
      
      // 触发利润计算
      this.calculateUsedCarProfit();
    } else {
      Utils.setElementValue('costPriceUsed', '');
      Utils.setElementValue('finalQuoteUsed', '');
      Utils.setElementValue('usedProfit', '');
      Utils.setElementValue('usedProfitRate', '');
    }
  }
  
  // 新能源车最终报价计算
  calculateNewEnergyFinalQuote() {
    const purchaseCost = Utils.getElementValue('newEnergyPurchaseCost');
    const rmbQuote = Utils.getElementValue('newEnergyRmbPrice');
    const exchangeRate = Utils.getElementValue('exchangeRateNewEnergy');
    let seaFreight = Utils.getElementValue('newEnergySeaFreight');
    
    if (exchangeRate > 0) {
      // 成本价格 = 购车成本 / 汇率 + 海运费
      const costPrice = purchaseCost / exchangeRate + seaFreight;
      Utils.setElementValue('costPriceNewEnergy', Math.round(costPrice));
      
      let finalQuote = rmbQuote / exchangeRate;
      if (seaFreight > 0) finalQuote += seaFreight;
      Utils.setElementValue('finalQuoteNewEnergy', Math.round(finalQuote));
      
      // 触发利润计算
      this.calculateNewEnergyProfit();
    } else {
      Utils.setElementValue('costPriceNewEnergy', '');
      Utils.setElementValue('finalQuoteNewEnergy', '');
      Utils.setElementValue('newEnergyProfit', '');
      Utils.setElementValue('newEnergyProfitRate', '');
    }
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
  
  // 清理资源
  cleanup() {
    this.calculationCache.clear();
    this.dependencies.clear();
  }
} 