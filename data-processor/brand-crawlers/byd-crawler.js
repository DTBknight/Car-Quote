#!/usr/bin/env node

/**
 * BYD 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.263Z
 * 品牌ID: 16
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class BYDCrawler extends BrandCrawler {
  constructor() {
    super('BYD', [16]);
    
    // BYD 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 BYD 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 BYD 品牌特点调整的配置
      
      // 复杂品牌配置
      concurrency: 1, // 单线程处理
      maxRetries: 8, // 更多重试次数
      retryDelay: 5000 // 更长的重试延迟,
      // 新能源品牌配置
      specialHandling: true, // 启用特殊处理
      priceStrategy: 'new_energy' // 新能源价格策略
    };
  }

  /**
   * BYD 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 BYD 品牌特定逻辑...');
    
    // BYD 特殊处理：处理新能源车型分类
    
    await super.beforeCrawl?.();
  }

  /**
   * BYD 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 BYD 品牌特定后处理...');
    
    // 新能源品牌：验证电池信息
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new BYDCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 BYD 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 BYD 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = BYDCrawler;
