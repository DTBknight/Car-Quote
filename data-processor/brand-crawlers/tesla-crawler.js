#!/usr/bin/env node

/**
 * Tesla 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.309Z
 * 品牌ID: 63
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class TeslaCrawler extends BrandCrawler {
  constructor() {
    super('Tesla', [63]);
    
    // Tesla 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Tesla 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Tesla 品牌特点调整的配置
      
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
   * Tesla 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Tesla 品牌特定逻辑...');
    
    // Tesla 特殊处理：检查国际化价格
    
    await super.beforeCrawl?.();
  }

  /**
   * Tesla 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Tesla 品牌特定后处理...');
    
    // 新能源品牌：验证电池信息
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new TeslaCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Tesla 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Tesla 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = TeslaCrawler;
