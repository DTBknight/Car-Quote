#!/usr/bin/env node

/**
 * Audi 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.252Z
 * 品牌ID: 2, 10362
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class AudiCrawler extends BrandCrawler {
  constructor() {
    super('Audi', [2,10362]);
    
    // Audi 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Audi 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Audi 品牌特点调整的配置
      
      // 复杂品牌配置
      concurrency: 1, // 单线程处理
      maxRetries: 8, // 更多重试次数
      retryDelay: 5000 // 更长的重试延迟
    };
  }

  /**
   * Audi 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Audi 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Audi 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Audi 品牌特定后处理...');
    
    // 豪华品牌：验证配置丰富度
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new AudiCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Audi 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Audi 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = AudiCrawler;
