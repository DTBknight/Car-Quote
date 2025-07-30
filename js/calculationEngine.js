import CONFIG from './config.js';
import { Utils } from './utils.js';

// 计算引擎模块
export class CalculationEngine {
  constructor() {
    this.formTypes = ['new', 'used', 'newEnergy'];
  }
  
  // 新车计算 - 开票价
  calculateNewCarInvoicePrice() {
    const guidePrice = Utils.getElementValue('guidePrice');
    const discount = Utils.getElementValue('discount');
    const optionalEquipment = Utils.getElementValue('optionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    Utils.setElementValue('invoicePrice', Math.round(invoicePrice));
    return invoicePrice;
  }
  
  // 新车计算 - 退税
  calculateNewCarTaxRefund() {
    const invoicePrice = Utils.getElementValue('invoicePrice');
    const taxRefund = invoicePrice / CONFIG.CALCULATION.TAX_DIVISOR * CONFIG.CALCULATION.TAX_RATE;
    Utils.setElementValue('taxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }
  
  // 新车计算 - 手续费
  calculateNewCarServiceFee() {
    const rate = Utils.getElementValue('serviceFeeRate');
    const invoicePrice = Utils.getElementValue('invoicePrice');
    const fee = rate * invoicePrice;
    Utils.setElementText('serviceFee', Utils.formatCurrency(Math.round(fee)));
    return fee;
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
    
    const purchaseCost = invoicePrice + serviceFee + domesticShipping + portCharges + compulsoryInsurance + otherExpenses - taxRefund;
    Utils.setElementValue('purchaseCost', Math.round(purchaseCost));
    return purchaseCost;
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
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
    Utils.setElementValue('profit', Math.round(rmbProfit));
    Utils.setElementValue('profitRate', Math.round(foreignProfit));
  }
  
  // 二手车计算 - 开票价
  calculateUsedCarInvoicePrice() {
    const guidePrice = Utils.getElementValue('usedGuidePrice');
    const discount = Utils.getElementValue('usedDiscount');
    const optionalEquipment = Utils.getElementValue('usedOptionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    Utils.setElementValue('usedInvoicePrice', Math.round(invoicePrice));
    return invoicePrice;
  }
  
  // 二手车计算 - 购置税
  calculateUsedCarPurchaseTax() {
    const invoicePrice = Utils.getElementValue('usedInvoicePrice');
    const purchaseTax = invoicePrice / CONFIG.CALCULATION.PURCHASE_TAX_RATE;
    Utils.setElementValue('usedPurchaseTax', purchaseTax.toFixed(2));
    return purchaseTax;
  }
  
  // 二手车计算 - 退税
  calculateUsedCarTaxRefund() {
    const invoicePrice = Utils.getElementValue('usedInvoicePrice');
    const taxRefund = invoicePrice / CONFIG.CALCULATION.TAX_DIVISOR * CONFIG.CALCULATION.TAX_RATE;
    Utils.setElementValue('usedTaxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }
  
  // 二手车计算 - 退税手续费
  calculateUsedCarTaxRefundFee() {
    const taxRefund = Utils.getElementValue('usedTaxRefund');
    const taxRefundFee = taxRefund * CONFIG.CALCULATION.TAX_REFUND_FEE_RATE;
    Utils.setElementValue('usedTaxRefundFee', Math.round(taxRefundFee));
    return taxRefundFee;
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
    
    const purchaseCost = invoicePrice + purchaseTax + compulsoryInsurance + otherExpenses + qualificationFee + agencyFee + taxRefundFee + domesticShipping + portCharges - taxRefund;
    Utils.setElementValue('usedPurchaseCost', Math.round(purchaseCost));
    return purchaseCost;
  }
  
  // 二手车计算 - 人民币报价
  calculateUsedCarRmbQuote() {
    const purchaseCost = Utils.getElementValue('usedPurchaseCost');
    const markup = Utils.getElementValue('usedMarkup');
    const rmbQuote = purchaseCost + markup;
    Utils.setElementValue('usedRmbPrice', Math.round(rmbQuote));
    Utils.triggerEvent('usedRmbPrice');
    return rmbQuote;
  }
  
  // 二手车计算 - 利润
  calculateUsedCarProfit() {
    const finalQuote = Utils.getElementValue('finalQuoteUsed');
    const costPrice = Utils.getElementValue('costPriceUsed');
    const exchangeRate = Utils.getElementValue('exchangeRateUsed');
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
    Utils.setElementValue('usedProfit', Math.round(rmbProfit));
    Utils.setElementValue('usedProfitRate', Math.round(foreignProfit));
  }
  
  // 新能源计算 - 开票价
  calculateNewEnergyInvoicePrice() {
    const guidePrice = Utils.getElementValue('newEnergyGuidePrice');
    const discount = Utils.getElementValue('newEnergyDiscount');
    const optionalEquipment = Utils.getElementValue('newEnergyOptionalEquipment');
    const invoicePrice = Math.max(0, guidePrice + optionalEquipment - discount);
    Utils.setElementValue('newEnergyInvoicePrice', Math.round(invoicePrice));
    return invoicePrice;
  }
  
  // 新能源计算 - 购置税
  calculateNewEnergyPurchaseTax() {
    const invoicePrice = Utils.getElementValue('newEnergyInvoicePrice');
    const taxNote = Utils.getElement('newEnergyTaxNote');
    const taxNoteContainer = taxNote?.parentElement;
    
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
      return 0;
    } else {
      // 开票价高于33.9万元，购置税 = (开票价 - 339000) / 11.3
      const purchaseTax = (invoicePrice - CONFIG.CALCULATION.NEW_ENERGY_TAX_THRESHOLD) / CONFIG.CALCULATION.PURCHASE_TAX_RATE;
      Utils.setElementValue('newEnergyPurchaseTax', purchaseTax.toFixed(2));
      if (taxNoteContainer) {
        Utils.toggleElement(taxNoteContainer.id, false);
      }
      return purchaseTax;
    }
  }
  
  // 新能源计算 - 退税
  calculateNewEnergyTaxRefund() {
    const invoicePrice = Utils.getElementValue('newEnergyInvoicePrice');
    const taxRefund = invoicePrice / CONFIG.CALCULATION.TAX_DIVISOR * CONFIG.CALCULATION.TAX_RATE;
    Utils.setElementValue('newEnergyTaxRefund', taxRefund.toFixed(2));
    return taxRefund;
  }
  
  // 新能源计算 - 退税手续费
  calculateNewEnergyTaxRefundFee() {
    const taxRefund = Utils.getElementValue('newEnergyTaxRefund');
    const taxRefundFee = taxRefund * CONFIG.CALCULATION.TAX_REFUND_FEE_RATE;
    Utils.setElementValue('newEnergyTaxRefundFee', Math.round(taxRefundFee));
    return taxRefundFee;
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
    
    const purchaseCost = invoicePrice + purchaseTax + compulsoryInsurance + otherExpenses + qualificationFee + agencyFee + taxRefundFee + domesticShipping + portCharges - taxRefund;
    Utils.setElementValue('newEnergyPurchaseCost', Math.round(purchaseCost));
    return purchaseCost;
  }
  
  // 新能源计算 - 人民币报价
  calculateNewEnergyRmbQuote() {
    const purchaseCost = Utils.getElementValue('newEnergyPurchaseCost');
    const markup = Utils.getElementValue('newEnergyMarkup');
    const rmbQuote = purchaseCost + markup;
    Utils.setElementValue('newEnergyRmbPrice', Math.round(rmbQuote));
    Utils.triggerEvent('newEnergyRmbPrice');
    return rmbQuote;
  }
  
  // 新能源计算 - 利润
  calculateNewEnergyProfit() {
    const finalQuote = Utils.getElementValue('finalQuoteNewEnergy');
    const costPrice = Utils.getElementValue('costPriceNewEnergy');
    const exchangeRate = Utils.getElementValue('exchangeRateNewEnergy');
    
    const foreignProfit = finalQuote - costPrice; // 外币利润
    const rmbProfit = foreignProfit * exchangeRate; // 人民币利润
    
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
      
      // 计算成本价格（新公式）
      const invoicePrice = Utils.getElementValue('invoicePrice');
      const domesticShipping = Utils.getElementValue('domesticShipping');
      const portChargesCif = Utils.getElementValue('portCharges');
      const portChargesFob = Utils.getElementValue('portChargesFob');
      const portCharges = portChargesCif + portChargesFob;
      const compulsoryInsurance = Utils.getElementValue('compulsoryInsurance');
      const otherExpenses = Utils.getElementValue('otherExpenses');
      const taxRefund = Utils.getElementValue('taxRefund');
      
      const costPrice = (invoicePrice + invoicePrice * CONFIG.CALCULATION.SERVICE_FEE_RATE + domesticShipping + portCharges + compulsoryInsurance + otherExpenses - taxRefund) / exchangeRate + seaFreight;
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
} 