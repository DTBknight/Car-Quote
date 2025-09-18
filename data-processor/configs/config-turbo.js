// 高性能配置 - 优化并发和等待时间
const config = {
  // 爬虫配置 - 激进优化
  crawler: {
    concurrency: 3, // 车型级并发增加到3，提高采集速度
    maxRetries: 3, // 增加重试次数，提高稳定性
    timeout: 120000, // 页面超时2分钟，快速失败
    protocolTimeout: 300000, // 协议超时5分钟，避免长时间卡住
    pageWaitTime: 800, // 页面等待减少，提高速度
    imageWaitTime: 600, // 图片等待减少，提高速度
    globalTimeout: 7200000, // 全局超时保持120分钟
    delays: {
      min: 500, // 最小延迟减少到0.5秒
      max: 1000  // 最大延迟减少到1秒
    },
    headless: true,
    resourceBlocking: true,
    blockImages: false, // 图片采集需要加载图片
    blockStylesheets: true, // 阻塞CSS提升速度
    blockFonts: true,
    userAgentRotation: false,
    viewportRotation: false,
    humanBehavior: false,
    
    // 页面加载策略优化
    pageLoadStrategy: 'domcontentloaded', // 使用更快的加载策略
    maxWaitTime: 10000, // 最大等待时间减少到10秒
    
    // 网络优化
    networkRetryDelay: 1000, // 网络重试延迟减少
    maxNetworkRetries: 2, // 网络重试减少
    connectionTimeout: 30000, // 连接超时减少
    
    // 图片采集配置 - 关键优化
    imageConcurrency: 2, // 配置级并发保持稳定
    colorConcurrency: 2, // 颜色级并发保持稳定
    pageTimeout: 90000, // 页面超时1.5分钟，给复杂页面更多时间
    colorPageTimeout: 45000, // 颜色页面超时45秒，给图片加载更多时间
    pageWaitTime: 600, // 页面等待时间减少
    imageWaitTime: 600, // 图片等待时间保持一致
    
    // 断点配置
    largeBrandThreshold: 0,
    enableAutoCheckpoint: true,
    checkpointInterval: 2, // 每2个车型保存断点，提高可靠性
    maxExecutionTime: 1800000, // 30分钟最大执行时间
    
    // 大品牌优化
    largeBrandMultiplier: {
      timeout: 1.5, // 超时倍数减少
      protocolTimeout: 1.5,
      globalTimeout: 1.5,
      maxRetries: 1 // 大品牌快速失败
    }
  },

  // 日志配置 - 减少日志输出提升性能
  logging: {
    level: 'info',
    file: 'logs/crawler.log',
    maxSize: '10m',
    maxFiles: 5,
    showNetworkErrors: false,
    showResourceBlocking: false,
    showProtocolWarnings: false,
    showConsoleErrors: false,
    showRetryAttempts: false,
    showHeartbeat: false,
    showDataCollection: true,
    showProgress: true,
    showSuccess: true,
    showErrors: true,
    showWarnings: false,
    showPageOperations: false,
    showBrowserOperations: false
  },

  // 验证配置
  validation: {
    requireImages: false,
    minConfigs: 1,
    maxRetries: 3
  },

  // 生产环境配置
  production: {
    enabled: process.env.NODE_ENV === 'production',
    skipExisting: false,
    maxBrands: 100,
    saveProgress: true,
    progressFile: 'progress.json',
    enableHeartbeat: true,
    heartbeatInterval: 60000, // 心跳间隔增加到1分钟
    maxStuckTime: 180000, // 最大卡住时间减少到3分钟
    enableAutoRecovery: true,
    recoveryDelay: 5000 // 恢复延迟减少
  }
};

module.exports = config;
