// 日志管理工具 - 统一控制日志输出
const config = require('./config');

class Logger {
  constructor() {
    this.config = config.logging;
  }

  // 数据采集相关日志
  dataCollection(message) {
    if (this.config.showDataCollection) {
      console.log(`📊 ${message}`);
    }
  }

  // 进度信息日志
  progress(message) {
    if (this.config.showProgress) {
      console.log(`⏳ ${message}`);
    }
  }

  // 成功信息日志
  success(message) {
    if (this.config.showSuccess) {
      console.log(`✅ ${message}`);
    }
  }

  // 错误信息日志
  error(message) {
    if (this.config.showErrors) {
      console.error(`❌ ${message}`);
    }
  }

  // 警告信息日志
  warning(message) {
    if (this.config.showWarnings) {
      console.warn(`⚠️ ${message}`);
    }
  }

  // 心跳检测日志
  heartbeat(message) {
    if (this.config.showHeartbeat) {
      console.log(`💓 ${message}`);
    }
  }

  // 网络错误日志（默认关闭）
  networkError(message) {
    if (this.config.showNetworkErrors) {
      console.warn(`🌐 ${message}`);
    }
  }

  // 资源拦截日志（默认关闭）
  resourceBlocking(message) {
    if (this.config.showResourceBlocking) {
      console.log(`🚫 ${message}`);
    }
  }

  // 协议警告日志（默认关闭）
  protocolWarning(message) {
    if (this.config.showProtocolWarnings) {
      console.warn(`🔧 ${message}`);
    }
  }

  // 控制台错误日志（默认关闭）
  consoleError(message) {
    if (this.config.showConsoleErrors) {
      console.warn(`📱 ${message}`);
    }
  }

  // 重试尝试日志（默认关闭）
  retryAttempt(message) {
    if (this.config.showRetryAttempts) {
      console.log(`🔄 ${message}`);
    }
  }

  // 品牌处理日志
  brandProcessing(brandId, index, total) {
    if (this.config.showDataCollection) {
      console.log(`\n🚗 处理品牌 ID: ${brandId} (${index + 1}/${total})`);
    }
  }

  // 车型采集日志
  carCollection(carName, configCount) {
    if (this.config.showDataCollection) {
      console.log(`📸 采集车型: ${carName} (${configCount} 个配置)`);
    }
  }

  // 配置采集日志
  configCollection(configName, price) {
    if (this.config.showDataCollection) {
      console.log(`   📋 配置: ${configName} - ${price}`);
    }
  }

  // 图片采集日志
  imageCollection(type, colorCount) {
    if (this.config.showDataCollection) {
      console.log(`   🎨 ${type}: ${colorCount} 个颜色`);
    }
  }

  // 采集完成日志
  collectionComplete(brandId, successCount, failCount) {
    if (this.config.showSuccess) {
      console.log(`✅ 品牌 ${brandId} 采集完成 - 成功: ${successCount}, 失败: ${failCount}`);
    }
  }

  // 统计信息日志
  statistics(totalBrands, completed, failed, duration) {
    if (this.config.showProgress) {
      console.log(`\n📊 采集统计:`);
      console.log(`   总品牌数: ${totalBrands}`);
      console.log(`   成功: ${completed}`);
      console.log(`   失败: ${failed}`);
      console.log(`   耗时: ${duration} 秒`);
    }
  }

  // 错误摘要日志
  errorSummary(errors) {
    if (this.config.showErrors && errors.length > 0) {
      console.log(`\n❌ 错误摘要:`);
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.brandId}: ${error.error}`);
      });
    }
  }

  // 分隔线
  separator() {
    if (this.config.showProgress) {
      console.log('─'.repeat(80));
    }
  }

  // 标题
  title(title) {
    if (this.config.showProgress) {
      console.log(`\n${'='.repeat(20)} ${title} ${'='.repeat(20)}`);
    }
  }
}

// 创建全局日志实例
const logger = new Logger();

module.exports = logger;
