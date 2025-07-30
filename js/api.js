import { CONFIG } from './config.js';

// API服务类
export class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API.BASE_URL;
    this.mainAppId = CONFIG.API.MAIN_APP_ID;
    this.backupAppId = CONFIG.API.BACKUP_APP_ID;
  }

  // 获取汇率
  async fetchExchangeRate(currency) {
    const exchangeRateInput = document.getElementById('exchangeRate');
    const exchangeRateLabel = document.getElementById('exchangeRateLabel');
    
    if (!exchangeRateInput || !exchangeRateLabel) {
      console.error('汇率相关元素未找到');
      return;
    }

    exchangeRateInput.value = '加载中...';
    
    try {
      // 尝试主API
      const rate = await this._fetchRateWithAppId(this.mainAppId, currency);
      this._handleRateSuccess(rate, currency, exchangeRateInput, exchangeRateLabel);
    } catch (error) {
      console.warn('主API失败，尝试备用API:', error);
      try {
        // 尝试备用API
        const rate = await this._fetchRateWithAppId(this.backupAppId, currency);
        this._handleRateSuccess(rate, currency, exchangeRateInput, exchangeRateLabel);
      } catch (backupError) {
        this._handleRateError(exchangeRateInput, exchangeRateLabel);
      }
    }
  }

  // 使用指定App ID获取汇率
  async _fetchRateWithAppId(appId, currency) {
    const response = await fetch(`${this.baseUrl}&app_id=${appId}`);
    
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

  // 处理汇率获取成功
  _handleRateSuccess(rate, currency, exchangeRateInput, exchangeRateLabel) {
    exchangeRateLabel.textContent = `汇率 实时基准：${rate.toFixed(2)}`;
    exchangeRateInput.value = (rate - 0.05).toFixed(2);
    this._updateCurrencyLabels(currency);
    this._triggerFinalQuoteCalculation();
  }

  // 处理汇率获取失败
  _handleRateError(exchangeRateInput, exchangeRateLabel) {
    exchangeRateInput.value = '';
    exchangeRateLabel.textContent = '汇率 实时基准：获取失败';
    alert('汇率获取失败，请稍后重试');
  }

  // 更新货币标签
  _updateCurrencyLabels(currency) {
    const currencyFlags = {
      'USD': '🇺🇸',
      'EUR': '🇪🇺',
      'GBP': '🇬🇧'
    };
    
    const flag = currencyFlags[currency];
    if (flag) {
      document.getElementById('currencyFlag').textContent = flag;
    }
  }

  // 触发最终报价计算
  _triggerFinalQuoteCalculation() {
    // 这里会调用计算模块的方法
    if (window.calculator) {
      window.calculator.calculateFinalQuote();
    }
  }

  // 获取所有品牌
  async fetchBrands() {
    try {
      const response = await fetch('/api/brands');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('获取品牌列表失败:', error);
      return [];
    }
  }

  // 获取品牌车型数据
  async fetchBrandCars(brandName) {
    try {
      const response = await fetch(`/api/brands/${brandName}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`获取品牌 ${brandName} 车型数据失败:`, error);
      return null;
    }
  }

  // 获取所有车型数据
  async fetchAllCars() {
    try {
      const brands = await this.fetchBrands();
      const carPromises = brands.map(async (brand) => {
        try {
          const data = await this.fetchBrandCars(brand.name);
          if (data && data.cars && Array.isArray(data.cars)) {
            return data.cars.map(car => ({
              ...car,
              brand: data.brand,
              brandImage: data.brandImage
            }));
          }
        } catch (error) {
          console.error(`获取品牌 ${brand.name} 数据失败:`, error);
        }
        return [];
      });
      
      const carsArrays = await Promise.all(carPromises);
      return carsArrays.flat();
    } catch (error) {
      console.error('获取所有车型数据失败:', error);
      return [];
    }
  }
}

// 创建全局API服务实例
export const apiService = new ApiService(); 