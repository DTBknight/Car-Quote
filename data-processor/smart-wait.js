// 智能等待工具 - 防止页面无限等待
const antiStuckConfig = require('./anti-stuck-config');

class SmartWait {
  constructor() {
    this.config = antiStuckConfig;
  }

  // 智能页面导航，避免无限等待
  async smartGoto(page, url, options = {}) {
    const {
      waitUntil = this.config.pageLoadStrategies.fast,
      timeout = this.config.timeouts.pageLoad,
      maxRetries = this.config.retry.maxAttempts
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 页面导航尝试 ${attempt}/${maxRetries}: ${url}`);
        
        // 使用配置的超时时间
        await page.goto(url, {
          waitUntil,
          timeout: Math.min(timeout, this.config.timeouts.maxTotalWait)
        });
        
        // 等待页面稳定
        await this.waitForPageStability(page);
        
        console.log(`✅ 页面导航成功: ${url}`);
        return true;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ 页面导航尝试 ${attempt} 失败: ${error.message}`);
        
        if (attempt < maxRetries) {
          const delay = this.config.retry.delayBetweenRetries * (this.config.retry.exponentialBackoff ? Math.pow(2, attempt - 1) : 1);
          console.log(`⏳ 等待 ${delay}ms 后重试...`);
          await this.delay(delay);
        }
      }
    }
    
    throw new Error(`页面导航失败，已重试 ${maxRetries} 次: ${lastError?.message || '未知错误'}`);
  }

  // 等待页面稳定，避免无限等待
  async waitForPageStability(page, maxWaitTime = this.config.timeouts.maxTotalWait) {
    const startTime = Date.now();
    let isStable = false;
    let checkCount = 0;
    
    console.log(`🔍 等待页面稳定，最大等待时间: ${maxWaitTime}ms`);
    
    while (!isStable && (Date.now() - startTime) < maxWaitTime && checkCount < this.config.stability.maxChecks) {
      try {
        isStable = await page.evaluate(() => {
          // 检查页面状态
          if (document.readyState !== 'complete') {
            return false;
          }
          
          // 检查是否有活跃的网络请求
          if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            const recentResources = resources.filter(resource => 
              Date.now() - resource.startTime < this.config.stability.networkQuietThreshold
            );
            
            if (recentResources.length > 0) {
              return false;
            }
          }
          
          return true;
        });
        
        if (!isStable) {
          checkCount++;
          const elapsed = Date.now() - startTime;
          console.log(`⏳ 页面未稳定，检查 ${checkCount}/${this.config.stability.maxChecks}，已等待 ${elapsed}ms`);
          
          // 等待检查间隔
          await this.delay(this.config.stability.checkInterval);
        }
        
      } catch (error) {
        console.warn(`⚠️ 页面稳定性检查失败: ${error.message}`);
        checkCount++;
        await this.delay(this.config.stability.checkInterval);
      }
    }
    
    if (isStable) {
      console.log(`✅ 页面已稳定，耗时: ${Date.now() - startTime}ms`);
    } else {
      console.warn(`⚠️ 页面稳定性等待超时，继续执行`);
    }
  }

  // 智能等待元素，避免无限等待
  async smartWaitForSelector(page, selector, options = {}) {
    const {
      timeout = this.config.timeouts.elementWait,
      visible = true,
      hidden = false
    } = options;

    try {
      console.log(`🔍 等待元素: ${selector}`);
      
      const element = await page.waitForSelector(selector, {
        timeout: Math.min(timeout, this.config.timeouts.maxTotalWait),
        visible,
        hidden
      });
      
      console.log(`✅ 元素已找到: ${selector}`);
      return element;
      
    } catch (error) {
      console.warn(`⚠️ 等待元素超时: ${selector}, 错误: ${error.message}`);
      return null;
    }
  }

  // 智能等待函数，避免无限等待
  async smartWaitForFunction(page, fn, options = {}) {
    const {
      timeout = this.config.timeouts.elementWait,
      polling = this.config.stability.checkInterval
    } = options;

    try {
      console.log(`🔍 等待函数条件满足`);
      
      const result = await page.waitForFunction(fn, {
        timeout: Math.min(timeout, this.config.timeouts.maxTotalWait),
        polling
      });
      
      console.log(`✅ 函数条件已满足`);
      return result;
      
    } catch (error) {
      console.warn(`⚠️ 等待函数超时: ${error.message}`);
      return null;
    }
  }

  // 延迟函数
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 检查页面是否卡住
  async isPageStuck(page) {
    try {
      const isStuck = await page.evaluate(() => {
        // 检查页面是否有响应
        const now = Date.now();
        const lastActivity = window.lastActivityTime || 0;
        
        // 如果超过5秒没有活动，认为页面卡住
        if (now - lastActivity > 5000) {
          return true;
        }
        
        // 检查是否有无限循环的脚本
        if (window.infiniteLoopDetected) {
          return true;
        }
        
        return false;
      });
      
      return isStuck;
    } catch (error) {
      console.warn(`⚠️ 页面卡住检查失败: ${error.message}`);
      return false;
    }
  }

  // 强制页面恢复
  async forcePageRecovery(page) {
    try {
      console.log(`🔄 尝试强制页面恢复...`);
      
      // 尝试刷新页面
      await page.reload({ waitUntil: this.config.pageLoadStrategies.fast });
      
      // 等待页面基本加载
      await this.delay(2000);
      
      console.log(`✅ 页面恢复完成`);
      return true;
      
    } catch (error) {
      console.error(`❌ 页面恢复失败: ${error.message}`);
      return false;
    }
  }
}

module.exports = SmartWait;
