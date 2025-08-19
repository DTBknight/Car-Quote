// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 1, // 并发数 - 降低到1，避免资源竞争
    maxRetries: 2, // 最大重试次数 - 减少重试，避免无限循环
    timeout: 30000, // 单次页面超时 (ms) - 设置30秒超时，避免无限等待
    protocolTimeout: 30000, // 协议层超时 (ms) - 设置30秒超时
    pageWaitTime: 5000, // 页面加载后等待时间 (ms)
    imageWaitTime: 3000, // 图片加载后等待时间 (ms)
    delays: {
      min: 500, // 最小延迟 (ms) - 减少延迟，提升速度
      max: 1000  // 最大延迟 (ms) - 减少延迟，提升速度
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
    maxWaitTime: 10000 // 最大等待时间，避免无限等待
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