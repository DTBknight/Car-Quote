// 优化的配置文件 - 增强稳定性
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 1, // 保持单并发，确保稳定性
    maxRetries: 3, // 增加重试次数，提高成功率
    timeout: 60000, // 增加页面超时到60秒，适应复杂页面
    protocolTimeout: 300000, // 增加协议超时到5分钟，解决超时问题
    pageWaitTime: 3000, // 增加页面等待时间，确保页面稳定
    imageWaitTime: 2000, // 增加图片等待时间
    globalTimeout: 1800000, // 增加全局超时到30分钟
    delays: {
      min: 2000, // 增加最小延迟，减少服务器压力
      max: 4000  // 增加最大延迟
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
    blockImages: false, // 不阻塞图片加载，确保图片采集成功
    blockStylesheets: false, // 不阻塞CSS加载，确保页面正常显示
    blockFonts: true, // 阻塞字体加载
    userAgentRotation: false, // 关闭用户代理轮换
    viewportRotation: false, // 关闭视口轮换
    humanBehavior: false, // 关闭人类行为模拟
    // 页面加载策略
    pageLoadStrategy: 'domcontentloaded', // 使用更快的加载策略
    maxWaitTime: 10000, // 增加最大等待时间
    // 网络稳定性配置
    networkRetryDelay: 5000, // 增加网络重试延迟
    maxNetworkRetries: 3, // 增加网络重试次数
    connectionTimeout: 30000, // 增加连接超时
    // 图片采集配置
    imageRetryDelay: 3000, // 增加图片重试延迟
    maxImageRetries: 3, // 增加图片重试次数
    imageTimeout: 90000, // 增加图片采集超时到90秒
    // 图片采集配置
    imageConcurrency: 1, // 保持单并发，避免资源竞争
    colorConcurrency: 1, // 保持单并发
    pageTimeout: 45000, // 增加页面超时
    colorPageTimeout: 35000, // 增加颜色页面超时
    pageWaitTime: 3000, // 页面等待时间
    imageWaitTime: 2000, // 图片等待时间
    
    // 断点保存配置
    largeBrandThreshold: 0, // 所有品牌都启用断点保存
    enableAutoCheckpoint: true, // 启用自动断点保存
    checkpointInterval: 1, // 每个车型保存断点
    maxExecutionTime: 1800000, // 30分钟最大执行时间
    
    // 大品牌自动调整的超时配置倍数
    largeBrandMultiplier: {
      timeout: 2, // 减少超时倍数
      protocolTimeout: 2, // 减少协议超时倍数
      globalTimeout: 2, // 减少全局超时倍数
      maxRetries: 1 // 减少重试次数
    }
  },

  // 日志配置
  logging: {
    level: 'warn', // 提高日志级别，减少输出
    file: 'logs/crawler.log',
    maxSize: '5m', // 减少日志文件大小
    maxFiles: 3, // 减少日志文件数量
    // 精细化日志控制
    showNetworkErrors: false,
    showResourceBlocking: false,
    showProtocolWarnings: false,
    showConsoleErrors: false,
    showRetryAttempts: false,
    showHeartbeat: false,
    showDataCollection: true,
    showProgress: true,
    showSuccess: false, // 关闭成功信息
    showErrors: true,
    showWarnings: false,
    showPageOperations: false,
    showBrowserOperations: false
  },

  // 验证配置
  validation: {
    requireImages: false, // 不强制要求图片
    minConfigs: 1, // 最少配置数量
    maxRetries: 2 // 减少验证重试次数
  },

  // 生产环境配置
  production: {
    enabled: process.env.NODE_ENV === 'production',
    skipExisting: false, // 不跳过已存在的品牌
    maxBrands: 50, // 减少最大品牌数
    saveProgress: true, // 保存进度
    progressFile: 'progress.json', // 进度文件
    // 生产环境稳定性配置
    enableHeartbeat: true, // 启用心跳检测
    heartbeatInterval: 60000, // 增加心跳间隔到60秒
    maxStuckTime: 180000, // 减少最大卡住时间到3分钟
    enableAutoRecovery: true, // 启用自动恢复
    recoveryDelay: 15000 // 增加恢复延迟
  }
};

module.exports = config;

