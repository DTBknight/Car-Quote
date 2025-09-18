// 日志管理工具 - 统一控制日志输出
const config = require('../configs/config');

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

  // 新增：车型采集进度显示
  carCollectionProgress(current, total, currentCarName, remainingCount) {
    if (this.config.showProgress) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(current, total, 30);
      
      console.log(`🚗 车型采集进度: ${progressBar} ${percentage}% (${current}/${total})`);
      console.log(`📍 当前车型: ${currentCarName}`);
      console.log(`⏳ 剩余车型: ${remainingCount} 个`);
    }
  }

  // 新增：品牌采集进度显示
  brandCollectionProgress(current, total, currentBrandName, remainingCount) {
    if (this.config.showProgress) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(current, total, 30);
      
      console.log(`🏭 品牌采集进度: ${progressBar} ${percentage}% (${current}/${total})`);
      console.log(`📍 当前品牌: ${currentBrandName}`);
      console.log(`⏳ 剩余品牌: ${remainingCount} 个`);
    }
  }

  // 新增：配置采集进度显示
  configCollectionProgress(current, total, currentConfigName, carName) {
    if (this.config.showProgress) {
      const percentage = Math.round((current / total) * 100);
      const progressBar = this.createProgressBar(current, total, 20);
      
      console.log(`⚙️ 配置采集进度: ${progressBar} ${percentage}% (${current}/${total})`);
      if (carName) {
        console.log(`🚗 车型: ${carName} - 配置: ${currentConfigName}`);
      }
    }
  }

  // 新增：图片采集进度显示
  imageCollectionProgress(processed, total, colorName, imageType) {
    if (this.config.showProgress) {
      const percentage = Math.round((processed / total) * 100);
      const progressBar = this.createProgressBar(processed, total, 20);
      
      console.log(`🖼️ 图片采集进度: ${progressBar} ${percentage}% (${processed}/${total})`);
      console.log(`🎨 当前: ${imageType} - ${colorName}`);
    }
  }

  // 新增：实时采集状态显示
  liveCollectionStatus(stats) {
    if (this.config.showProgress) {
      const { successCount, failCount, totalProcessed, totalTarget, currentItem, estimatedRemaining } = stats;
      const successRate = totalProcessed > 0 ? Math.round((successCount / totalProcessed) * 100) : 0;
      
      console.log(`📊 实时统计: 成功 ${successCount} | 失败 ${failCount} | 成功率 ${successRate}%`);
      console.log(`📈 总进度: ${totalProcessed}/${totalTarget} | 剩余 ${totalTarget - totalProcessed} 项`);
      console.log(`🎯 正在处理: ${currentItem}`);
      
      if (estimatedRemaining && estimatedRemaining > 0) {
        const remainingMinutes = Math.round(estimatedRemaining / 60000);
        console.log(`⏱️ 预计剩余时间: ${remainingMinutes} 分钟`);
      }
    }
  }

  // 新增：标题显示
  title(titleText) {
    if (this.config.showProgress) {
      console.log(`\n${'='.repeat(titleText.length + 20)}`);
      console.log(`${' '.repeat(10)}${titleText}`);
      console.log(`${'='.repeat(titleText.length + 20)}`);
    }
  }

  // 新增：分隔符
  separator() {
    if (this.config.showProgress) {
      console.log('─'.repeat(80));
    }
  }

  // 新增：创建进度条
  createProgressBar(current, total, width = 30) {
    const percentage = current / total;
    const filled = Math.round(percentage * width);
    const empty = width - filled;
    
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
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
