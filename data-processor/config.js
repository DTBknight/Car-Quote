// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 2, // 并发数 - 进一步降低以减少超时风险
    maxRetries: 3, // 最大重试次数 - 增加重试次数
    timeout: 0, // 单次页面超时 (ms) - 0表示无限制
    protocolTimeout: 0, // 协议层超时 (ms) - 0表示无限制
    delays: {
      min: 1000, // 最小延迟 (ms) - 增加延迟确保稳定性
      max: 2000  // 最大延迟 (ms) - 增加延迟确保稳定性
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
    blockImages: false,
    blockStylesheets: false,
    blockFonts: false,
    userAgentRotation: false, // 用户代理轮换 - 关闭以提升速度
    viewportRotation: false, // 视口轮换 - 关闭以提升速度
    humanBehavior: false // 人类行为模拟 - 关闭以提升速度
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
    maxRetries: 3 // 验证重试次数
  },

  // 生产环境配置
  production: {
    enabled: process.env.NODE_ENV === 'production',
    skipExisting: false, // 不跳过已存在的品牌，强制更新数据
    maxBrands: 100, // 每周执行，可以处理更多品牌
    saveProgress: true, // 保存进度
    progressFile: 'progress.json' // 进度文件
  }
};

module.exports = config; 