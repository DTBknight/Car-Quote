// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 4, // 并发数
    maxRetries: 3, // 最大重试次数
    timeout: 60000, // 超时时间 (ms)
    delays: {
      min: 1000, // 最小延迟 (ms)
      max: 3000  // 最大延迟 (ms)
    },
    headless: true, // 无头模式
    resourceBlocking: true, // 资源拦截
    userAgentRotation: true, // 用户代理轮换
    viewportRotation: true, // 视口轮换
    humanBehavior: true // 人类行为模拟
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
    skipExisting: true, // 跳过已存在的品牌
    maxBrands: 50, // 最大品牌数量 (防止超时)
    saveProgress: true, // 保存进度
    progressFile: 'progress.json' // 进度文件
  }
};

module.exports = config; 