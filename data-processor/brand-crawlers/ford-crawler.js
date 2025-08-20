#!/usr/bin/env node

/**
 * Ford 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.276Z
 * 品牌ID: 7
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class FordCrawler extends BrandCrawler {
  constructor() {
    super('Ford', [7]);
    
    // Ford 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Ford 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Ford 品牌特点调整的配置
      
      // 标准配置
      timeout: 60000,
      concurrency: 2
    };
  }

  /**
   * Ford 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Ford 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Ford 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Ford 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new FordCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Ford 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ford 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = FordCrawler;
