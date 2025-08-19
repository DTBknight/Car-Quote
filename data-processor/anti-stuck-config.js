// 防卡住配置文件
const antiStuckConfig = {
  // 页面加载策略
  pageLoadStrategies: {
    fast: 'domcontentloaded',      // 最快，只等待DOM加载
    balanced: 'load',              // 平衡，等待所有资源加载
    complete: 'networkidle2'       // 最慢，等待网络空闲
  },
  
  // 超时设置
  timeouts: {
    pageLoad: 15000,               // 页面加载超时 15秒
    elementWait: 10000,            // 元素等待超时 10秒
    networkIdle: 8000,             // 网络空闲等待 8秒
    maxTotalWait: 30000            // 最大总等待时间 30秒
  },
  
  // 重试策略
  retry: {
    maxAttempts: 2,                // 最大重试次数
    delayBetweenRetries: 2000,     // 重试间隔 2秒
    exponentialBackoff: true       // 指数退避
  },
  
  // 资源阻塞
  resourceBlocking: {
    blockImages: true,             // 阻塞图片
    blockStylesheets: false,       // 不阻塞样式表
    blockFonts: false,             // 不阻塞字体
    blockMedia: true,              // 阻塞媒体
    blockScripts: false            // 不阻塞脚本（需要JavaScript功能）
  },
  
  // 页面稳定性检测
  stability: {
    checkInterval: 500,            // 检查间隔 500ms
    maxChecks: 20,                 // 最大检查次数
    networkQuietThreshold: 1000    // 网络安静阈值 1秒
  },
  
  // 错误恢复
  recovery: {
    enableAutoRecovery: true,      // 启用自动恢复
    maxRecoveryAttempts: 3,        // 最大恢复尝试次数
    recoveryDelay: 5000            // 恢复延迟 5秒
  }
};

module.exports = antiStuckConfig;
