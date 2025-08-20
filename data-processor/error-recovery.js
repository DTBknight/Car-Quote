// 错误恢复工具类 - 智能处理各种爬虫错误
const config = require('./config');

class ErrorRecovery {
  constructor() {
    this.errorPatterns = new Map();
    this.recoveryStrategies = new Map();
    this.errorCounts = new Map();
    this.maxErrorCount = 5;
    this.initializeErrorPatterns();
  }

  // 初始化错误模式识别
  initializeErrorPatterns() {
    // 网络相关错误
    this.errorPatterns.set('network_timeout', /timeout|timed out|ETIMEDOUT/i);
    this.errorPatterns.set('network_connection', /connection|ECONNREFUSED|ENOTFOUND/i);
    this.errorPatterns.set('protocol_error', /Network\.enable|protocol|CDP/i);
    this.errorPatterns.set('page_crash', /crash|Target closed|Session closed/i);
    this.errorPatterns.set('resource_error', /net::ERR_|Failed to load resource/i);
    this.errorPatterns.set('memory_error', /out of memory|heap out of memory/i);
    this.errorPatterns.set('chrome_error', /Chrome crashed|Chrome died/i);
    
    // 初始化恢复策略
    this.initializeRecoveryStrategies();
  }

  // 初始化恢复策略
  initializeRecoveryStrategies() {
    // 网络超时恢复策略
    this.recoveryStrategies.set('network_timeout', {
      name: '网络超时恢复',
      actions: [
        { type: 'wait', duration: 5000, description: '等待5秒' },
        { type: 'retry', maxAttempts: 3, description: '重试3次' },
        { type: 'refresh_page', description: '刷新页面' },
        { type: 'recreate_page', description: '重新创建页面' }
      ]
    });

    // 协议错误恢复策略
    this.recoveryStrategies.set('protocol_error', {
      name: '协议错误恢复',
      actions: [
        { type: 'wait', duration: 3000, description: '等待3秒' },
        { type: 'reconnect_protocols', description: '重新连接协议' },
        { type: 'recreate_page', description: '重新创建页面' },
        { type: 'restart_browser', description: '重启浏览器' }
      ]
    });

    // 页面崩溃恢复策略
    this.recoveryStrategies.set('page_crash', {
      name: '页面崩溃恢复',
      actions: [
        { type: 'wait', duration: 10000, description: '等待10秒' },
        { type: 'recreate_page', description: '重新创建页面' },
        { type: 'clear_cache', description: '清理缓存' },
        { type: 'restart_browser', description: '重启浏览器' }
      ]
    });

    // 内存错误恢复策略
    this.recoveryStrategies.set('memory_error', {
      name: '内存错误恢复',
      actions: [
        { type: 'wait', duration: 15000, description: '等待15秒' },
        { type: 'clear_cache', description: '清理缓存' },
        { type: 'restart_browser', description: '重启浏览器' },
        { type: 'reduce_concurrency', description: '降低并发数' }
      ]
    });
  }

  // 分析错误类型
  analyzeError(error) {
    const errorMessage = error.message || error.toString();
    const errorStack = error.stack || '';
    const fullError = `${errorMessage} ${errorStack}`;

    for (const [patternName, pattern] of this.errorPatterns) {
      if (pattern.test(fullError)) {
        return {
          type: patternName,
          message: errorMessage,
          severity: this.getErrorSeverity(patternName),
          recoverable: this.isRecoverable(patternName)
        };
      }
    }

    // 默认错误类型
    return {
      type: 'unknown_error',
      message: errorMessage,
      severity: 'medium',
      recoverable: true
    };
  }

  // 获取错误严重程度
  getErrorSeverity(errorType) {
    const severityMap = {
      'network_timeout': 'low',
      'network_connection': 'medium',
      'protocol_error': 'medium',
      'page_crash': 'high',
      'resource_error': 'low',
      'memory_error': 'high',
      'chrome_error': 'critical'
    };
    return severityMap[errorType] || 'medium';
  }

  // 判断错误是否可恢复
  isRecoverable(errorType) {
    const nonRecoverable = ['chrome_error'];
    return !nonRecoverable.includes(errorType);
  }

  // 执行恢复策略
  async executeRecovery(errorType, context = {}) {
    const strategy = this.recoveryStrategies.get(errorType);
    if (!strategy) {
      console.warn(`⚠️ 未找到错误类型 ${errorType} 的恢复策略`);
      return false;
    }

    console.log(`🔄 执行恢复策略: ${strategy.name}`);
    
    try {
      for (const action of strategy.actions) {
        console.log(`  📋 执行: ${action.description}`);
        
        switch (action.type) {
          case 'wait':
            await this.delay(action.duration);
            break;
            
          case 'retry':
            if (context.retryFunction) {
              await this.executeWithRetry(context.retryFunction, action.maxAttempts);
            }
            break;
            
          case 'refresh_page':
            if (context.page && !context.page.isClosed()) {
              await context.page.reload({ waitUntil: 'domcontentloaded' });
            }
            break;
            
          case 'recreate_page':
            if (context.browser) {
              context.page = await context.browser.newPage();
            }
            break;
            
          case 'reconnect_protocols':
            if (context.networkManager) {
              await context.networkManager.reconnectProtocols(context.page);
            }
            break;
            
          case 'restart_browser':
            if (context.browserManager) {
              await context.browserManager.restartBrowser();
            }
            break;
            
          case 'clear_cache':
            if (context.page && !context.page.isClosed()) {
              await context.page.evaluate(() => {
                if (window.caches) {
                  return caches.keys().then(names => {
                    return Promise.all(names.map(name => caches.delete(name)));
                  });
                }
              });
            }
            break;
            
          case 'reduce_concurrency':
            // 降低并发数的逻辑
            break;
        }
        
        // 检查恢复是否成功
        if (await this.checkRecoverySuccess(context)) {
          console.log(`✅ 恢复策略执行成功`);
          return true;
        }
      }
      
      console.warn(`⚠️ 恢复策略执行完成，但可能未完全恢复`);
      return false;
      
    } catch (error) {
      console.error(`❌ 执行恢复策略时出错: ${error.message}`);
      return false;
    }
  }

  // 执行重试逻辑
  async executeWithRetry(fn, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        console.log(`  🔄 重试 ${attempt}/${maxAttempts}...`);
        await this.delay(1000 * attempt); // 递增延迟
      }
    }
  }

  // 检查恢复是否成功
  async checkRecoverySuccess(context) {
    try {
      if (context.page && !context.page.isClosed()) {
        // 检查页面是否响应
        const isResponsive = await context.page.evaluate(() => {
          return document.readyState === 'complete';
        });
        return isResponsive;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // 智能错误处理
  async handleError(error, context = {}) {
    const errorAnalysis = this.analyzeError(error);
    const errorKey = `${errorAnalysis.type}_${context.brandId || 'unknown'}`;
    
    // 记录错误次数
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    const errorCount = this.errorCounts.get(errorKey);
    
    console.log(`🚨 错误分析: ${errorAnalysis.type} (严重程度: ${errorAnalysis.severity})`);
    console.log(`📊 该类型错误发生次数: ${errorCount}`);
    
    // 如果错误次数过多，考虑跳过
    if (errorCount > this.maxErrorCount) {
      console.warn(`⚠️ 错误次数过多 (${errorCount}/${this.maxErrorCount})，建议跳过当前任务`);
      return { shouldSkip: true, reason: '错误次数过多' };
    }
    
    // 如果错误可恢复，尝试恢复
    if (errorAnalysis.recoverable) {
      console.log(`🔄 尝试自动恢复...`);
      const recoverySuccess = await this.executeRecovery(errorAnalysis.type, context);
      
      if (recoverySuccess) {
        console.log(`✅ 自动恢复成功`);
        return { shouldSkip: false, recovered: true };
      } else {
        console.warn(`⚠️ 自动恢复失败`);
        return { shouldSkip: false, recovered: false };
      }
    } else {
      console.error(`❌ 错误不可恢复，建议跳过`);
      return { shouldSkip: true, reason: '错误不可恢复' };
    }
  }

  // 获取错误统计
  getErrorStatistics() {
    const stats = {};
    for (const [errorKey, count] of this.errorCounts) {
      const [errorType, brandId] = errorKey.split('_');
      if (!stats[errorType]) {
        stats[errorType] = { total: 0, byBrand: {} };
      }
      stats[errorType].total += count;
      if (brandId !== 'unknown') {
        stats[errorType].byBrand[brandId] = count;
      }
    }
    return stats;
  }

  // 重置错误计数
  resetErrorCounts() {
    this.errorCounts.clear();
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ErrorRecovery;
