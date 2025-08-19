// 配置文件 - 运行时配置
const config = {
  // 爬虫配置
  crawler: {
    concurrency: 4, // 并发数 - 保持适中
    maxRetries: 2, // 最大重试次数 - 适度容错
    timeout: 60000, // 单次页面超时 (ms) - 增加到60秒以兼容索奈等特殊页面
    protocolTimeout: 120000, // 协议层超时 (ms)，处理 Network.enable timed out
    delays: {
      min: 300, // 最小延迟 (ms)
      max: 900  // 最大延迟 (ms)
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