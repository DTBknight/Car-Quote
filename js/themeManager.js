import CONFIG from './config.js';
import { Utils } from './utils.js';

// 主题管理模块
export class ThemeManager {
  constructor() {
    this.currentTheme = 'new';
  }
  
  // 切换到新车主题
  switchToNewCarTheme() {
    const body = Utils.getElement('mainBody');
    if (body) {
      Utils.removeClass('mainBody', 'used-car-theme');
      Utils.removeClass('mainBody', 'new-energy-theme');
    }
    this.updateThemeColors(CONFIG.THEMES.NEW_CAR);
    this.currentTheme = 'new';
  }
  
  // 切换到二手车主题
  switchToUsedCarTheme() {
    const body = Utils.getElement('mainBody');
    if (body) {
      Utils.removeClass('mainBody', 'new-energy-theme');
      Utils.addClass('mainBody', 'used-car-theme');
    }
    this.updateThemeColors(CONFIG.THEMES.USED_CAR);
    this.currentTheme = 'used';
  }
  
  // 切换到新能源主题
  switchToNewEnergyTheme() {
    const body = Utils.getElement('mainBody');
    if (body) {
      Utils.removeClass('mainBody', 'used-car-theme');
      Utils.addClass('mainBody', 'new-energy-theme');
    }
    this.updateThemeColors(CONFIG.THEMES.NEW_ENERGY);
    this.currentTheme = 'newEnergy';
  }
  
  // 更新主题颜色
  updateThemeColors(theme) {
    // 更新CSS变量
    Utils.updateCSSVariable('--primary-color', theme.primary);
    Utils.updateCSSVariable('--secondary-color', theme.secondary);
    Utils.updateCSSVariable('--accent-color', theme.accent);
    
    // 更新滑块颜色
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
      slider.style.setProperty('--tw-accent-color', theme.primary);
    });
    
    // 更新单选按钮颜色
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.style.setProperty('--tw-accent-color', theme.primary);
    });
  }
  
  // 根据表单类型切换主题
  switchThemeByFormType(formType) {
    switch (formType) {
      case 'new':
        this.switchToNewCarTheme();
        break;
      case 'used':
        this.switchToUsedCarTheme();
        break;
      case 'newEnergy':
        this.switchToNewEnergyTheme();
        break;
      default:
        this.switchToNewCarTheme();
    }
  }
  
  // 获取当前主题
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  // 初始化主题
  initializeTheme() {
    this.switchToNewCarTheme();
  }
} 