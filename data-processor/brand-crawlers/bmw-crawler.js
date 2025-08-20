#!/usr/bin/env node

/**
 * BMW 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.254Z
 * 品牌ID: 4
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class BMWCrawler extends BrandCrawler {
  constructor() {
    super('BMW', [4]);
    
    // BMW 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 BMW 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 BMW 品牌特点调整的配置
      
      // 复杂品牌配置
      concurrency: 1, // 单线程处理
      maxRetries: 8, // 更多重试次数
      retryDelay: 5000 // 更长的重试延迟
    };
  }

  /**
   * BMW 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 BMW 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * BMW 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 BMW 品牌特定后处理...');
    
    // 豪华品牌：验证配置丰富度
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new BMWCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 BMW 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 BMW 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = BMWCrawler;
