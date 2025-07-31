// 模块加载测试文件
console.log('🧪 开始测试模块加载...');

// 测试config.js
try {
  const CONFIG = await import('./config.js');
  console.log('✅ config.js 加载成功:', CONFIG.default);
} catch (error) {
  console.error('❌ config.js 加载失败:', error);
}

// 测试utils.js
try {
  const { Utils } = await import('./utils.js');
  console.log('✅ utils.js 加载成功:', Utils);
} catch (error) {
  console.error('❌ utils.js 加载失败:', error);
}

// 测试exchangeRate.js
try {
  const { ExchangeRateManager } = await import('./exchangeRate.js');
  console.log('✅ exchangeRate.js 加载成功:', ExchangeRateManager);
} catch (error) {
  console.error('❌ exchangeRate.js 加载失败:', error);
}

// 测试themeManager.js
try {
  const { ThemeManager } = await import('./themeManager.js');
  console.log('✅ themeManager.js 加载成功:', ThemeManager);
} catch (error) {
  console.error('❌ themeManager.js 加载失败:', error);
}

// 测试calculationEngine.js
try {
  const { CalculationEngine } = await import('./calculationEngine.js');
  console.log('✅ calculationEngine.js 加载成功:', CalculationEngine);
} catch (error) {
  console.error('❌ calculationEngine.js 加载失败:', error);
}

// 测试eventManager.js
try {
  const { EventManager } = await import('./eventManager.js');
  console.log('✅ eventManager.js 加载成功:', EventManager);
} catch (error) {
  console.error('❌ eventManager.js 加载失败:', error);
}

// 测试carSearch.js
try {
  const { CarSearch } = await import('./carSearch.js');
  console.log('✅ carSearch.js 加载成功:', CarSearch);
} catch (error) {
  console.error('❌ carSearch.js 加载失败:', error);
}

// 测试contractGenerator.js
try {
  const { ContractGenerator } = await import('./contractGenerator.js');
  console.log('✅ contractGenerator.js 加载成功:', ContractGenerator);
} catch (error) {
  console.error('❌ contractGenerator.js 加载失败:', error);
}

// 测试contractManager.js
try {
  const { ContractManager } = await import('./contractManager.js');
  console.log('✅ contractManager.js 加载成功:', ContractManager);
} catch (error) {
  console.error('❌ contractManager.js 加载失败:', error);
}

// 测试loadingManager.js
try {
  const { LoadingManager } = await import('./loadingManager.js');
  console.log('✅ loadingManager.js 加载成功:', LoadingManager);
} catch (error) {
  console.error('❌ loadingManager.js 加载失败:', error);
}

console.log('🧪 模块加载测试完成'); 