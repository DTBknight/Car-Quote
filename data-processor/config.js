// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 2, // 并发数 - 提升到2，平衡速度和稳定性
    maxRetries: 3, // 最大重试次数 - 减少到3次，避免过度重试
    timeout: 300000, // 单次页面超时 (ms) - 增加到300秒，解决页面超时问题
    protocolTimeout: 1800000, // 协议层超时 (ms) - 增加到30分钟，彻底解决超时
    pageWaitTime: 4000, // 页面加载后等待时间 (ms) - 增加等待时间确保稳定
    imageWaitTime: 3000, // 图片加载后等待时间 (ms) - 增加等待时间
    globalTimeout: 1800000, // 全局超时 (30分钟) - 增加全局超时
    delays: {
      min: 1500, // 最小延迟 (ms) - 减少延迟，提升速度
      max: 3000  // 最大延迟 (ms) - 减少延迟，提升速度
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
    blockImages: false, // 不阻塞图片加载，确保图片采集成功
    blockStylesheets: false, // 不阻塞CSS加载，确保页面正常显示
    blockFonts: true, // 阻塞字体加载，提升速度
    userAgentRotation: false, // 用户代理轮换 - 关闭以提升速度
    viewportRotation: false, // 视口轮换 - 关闭以提升速度
    humanBehavior: false, // 人类行为模拟 - 关闭以提升速度
    // 新增：页面加载策略
    pageLoadStrategy: 'networkidle2', // 使用更稳定的加载策略，等待网络空闲
    maxWaitTime: 15000, // 最大等待时间，增加等待时间确保稳定
    // 新增：网络稳定性配置（优化版）
    networkRetryDelay: 3000, // 网络重试延迟 - 减少延迟提升速度
    maxNetworkRetries: 3, // 最大网络重试次数 - 减少重试次数避免过度重试
    connectionTimeout: 45000, // 连接超时 - 减少超时提升响应速度
    // 新增：图片采集配置（优化版）
    imageRetryDelay: 2000, // 图片重试延迟 - 减少延迟提升速度
    maxImageRetries: 3, // 最大图片重试次数 - 减少重试次数
    imageTimeout: 120000, // 图片采集超时 - 增加到120秒，适应复杂页面
      // 图片采集配置（平衡速度和稳定性）
  imageConcurrency: 1, // 配置级并发数 - 降低到1，避免协议冲突
  colorConcurrency: 1, // 颜色级并发数 - 降低到1，避免协议冲突
  pageTimeout: 300000, // 页面加载超时（图片采集专用）- 增加到300秒
  colorPageTimeout: 60000, // 颜色页面超时 - 减少到60秒，避免卡住
  pageWaitTime: 4000, // 页面等待时间（图片采集专用）- 确保页面稳定
  imageWaitTime: 3000, // 图片等待时间（图片采集专用）- 确保图片加载
    
    // 断点保存配置（所有品牌启用）
    largeBrandThreshold: 0, // 所有品牌都启用断点保存（设为0表示无阈值限制）
    enableAutoCheckpoint: true, // 启用自动断点保存
    checkpointInterval: 2, // 每2个车型保存断点（更频繁保存）
    maxExecutionTime: 3300000, // 55分钟最大执行时间（适应GitHub Actions）
    
              // 大品牌自动调整的超时配置倍数（优化版）
    largeBrandMultiplier: {
      timeout: 2, // 页面超时倍数 - 减少倍数，提升响应速度
      protocolTimeout: 2, // 协议超时倍数 - 减少倍数，提升响应速度
      globalTimeout: 2, // 全局超时倍数 - 减少倍数，提升响应速度
      maxRetries: 1 // 重试次数减少，避免过度重试
    }
  },

  // 日志配置
  logging: {
    level: 'info', // 日志级别: debug, info, warn, error
    file: 'logs/crawler.log', // 日志文件
    maxSize: '10m', // 最大文件大小
    maxFiles: 5, // 最大文件数量
    // 新增：精细化日志控制
    showNetworkErrors: false, // 不显示网络请求失败日志
    showResourceBlocking: false, // 不显示资源拦截日志
    showProtocolWarnings: false, // 不显示协议警告日志
    showConsoleErrors: false, // 不显示页面控制台错误
    showRetryAttempts: false, // 不显示重试尝试日志
    showHeartbeat: false, // 关闭心跳检测日志减少输出
    showDataCollection: true, // 显示数据采集日志
    showProgress: true, // 显示进度信息
    showSuccess: true, // 显示成功信息
    showErrors: true, // 显示错误信息
    showWarnings: false, // 不显示警告信息
    // 新增：页面操作日志控制
    showPageOperations: false, // 不显示页面关闭、初始化等操作
    showBrowserOperations: false // 不显示浏览器详细操作
  },

  // 验证配置
  validation: {
    requireImages: false, // 不需要强制要求图片
    minConfigs: 1, // 最少配置数量
    maxRetries: 5 // 验证重试次数 - 增加到5次
  },

  // 生产环境配置
  production: {
    enabled: process.env.NODE_ENV === 'production',
    skipExisting: false, // 不跳过已存在的品牌，强制更新数据
    maxBrands: 100, // 每周执行，可以处理更多品牌
    saveProgress: true, // 保存进度
    progressFile: 'progress.json', // 进度文件
    // 新增：生产环境稳定性配置
    enableHeartbeat: true, // 启用心跳检测
    heartbeatInterval: 30000, // 心跳间隔 (30秒)
    maxStuckTime: 300000, // 最大卡住时间 (5分钟)
    enableAutoRecovery: true, // 启用自动恢复
    recoveryDelay: 10000 // 恢复延迟 (10秒)
  }
};

module.exports = config; 