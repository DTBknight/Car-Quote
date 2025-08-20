#!/usr/bin/env node

/**
 * Deepal 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.315Z
 * 品牌ID: 515
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class DeepalCrawler extends BrandCrawler {
  constructor() {
    super('Deepal', [515]);
    
    // Deepal 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Deepal 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Deepal 品牌特点调整的配置
      
      // 标准配置
      timeout: 60000,
      concurrency: 2
    };
  }

  /**
   * Deepal 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Deepal 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Deepal 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Deepal 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new DeepalCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Deepal 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Deepal 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = DeepalCrawler;
