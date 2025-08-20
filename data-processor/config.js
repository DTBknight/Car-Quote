// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 1, // 并发数 - 降低到1，避免资源竞争
    maxRetries: 5, // 最大重试次数 - 增加到5次，提高成功率
    timeout: 60000, // 单次页面超时 (ms) - 增加到60秒，适应网络波动
    protocolTimeout: 120000, // 协议层超时 (ms) - 增加到120秒，避免Network.enable超时
    pageWaitTime: 8000, // 页面加载后等待时间 (ms) - 增加等待时间
    imageWaitTime: 5000, // 图片加载后等待时间 (ms) - 增加等待时间
    globalTimeout: 300000, // 全局超时 (5分钟) - 防止单个任务无限期卡住
    delays: {
      min: 1000, // 最小延迟 (ms) - 增加延迟，减少被检测风险
      max: 2000  // 最大延迟 (ms) - 增加延迟，减少被检测风险
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
    blockImages: true, // 阻塞图片加载，提升速度
    blockStylesheets: false,
    blockFonts: false,
    userAgentRotation: false, // 用户代理轮换 - 关闭以提升速度
    viewportRotation: false, // 视口轮换 - 关闭以提升速度
    humanBehavior: false, // 人类行为模拟 - 关闭以提升速度
    // 新增：页面加载策略
    pageLoadStrategy: 'domcontentloaded', // 使用更快的加载策略
    maxWaitTime: 15000, // 最大等待时间，避免无限等待
    // 新增：网络稳定性配置
    networkRetryDelay: 3000, // 网络重试延迟
    maxNetworkRetries: 3, // 最大网络重试次数
    connectionTimeout: 30000, // 连接超时
    // 新增：图片采集配置
    imageRetryDelay: 2000, // 图片重试延迟
    maxImageRetries: 3, // 最大图片重试次数
    imageTimeout: 45000 // 图片采集超时
  },

  // 日志配置
  logging: {
    level: 'info', // 日志级别: debug, info, warn, error
    file: 'logs/crawler.log', // 日志文件
    maxSize: '10m', // 最大文件大小
    maxFiles: 5 // 最大文件数量
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