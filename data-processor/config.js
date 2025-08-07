// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 4, // 并发数 - 减少到4以避免资源不足
    maxRetries: 1, // 最大重试次数 - 减少到1以节省时间
    timeout: 20000, // 超时时间 (ms) - 减少到20秒
    delays: {
      min: 300, // 最小延迟 (ms) - 减少到300ms
      max: 800  // 最大延迟 (ms) - 减少到800ms
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
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
    requireImages: true, // 是否需要图片
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