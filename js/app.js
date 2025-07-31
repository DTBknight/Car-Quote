// 简化的主应用类
export class CarQuoteApp {
  constructor() {
    this.initialized = false;
    console.log('🚗 CarQuoteApp 构造函数被调用');
  }
  
  // 初始化应用
  async initialize() {
    try {
      console.log('🚗 开始初始化汽车报价系统...');
      
      // 基础初始化
      this.setDefaultValues();
      
      this.initialized = true;
      console.log('✅ 汽车报价系统初始化完成');
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      throw error;
    }
  }
  
  // 设置默认值
  setDefaultValues() {
    console.log('📝 设置默认值...');
    
    // 设置默认货币
    const currencySelects = ['currency', 'currencyUsed', 'currencyNewEnergy'];
    currencySelects.forEach(currencyId => {
      const select = document.getElementById(currencyId);
      if (select) {
        select.value = 'USD';
      }
    });
    
    console.log('✅ 默认值设置完成');
  }
  
  // 获取应用状态
  getAppState() {
    return {
      initialized: this.initialized,
      timestamp: Date.now()
    };
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
    console.log('📄 DOM加载完成，开始初始化应用...');
    app = CarQuoteApp.getInstance();
    await app.initialize();
    
    // 将应用实例挂载到全局对象（用于调试）
    window.carQuoteApp = app;
    
    console.log('🎉 汽车报价系统已就绪');
    
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
  }
});

// 导出应用类
export default CarQuoteApp; 