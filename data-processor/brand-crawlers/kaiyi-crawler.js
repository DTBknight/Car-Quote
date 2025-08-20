#!/usr/bin/env node

/**
 * Kaiyi 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.289Z
 * 品牌ID: 142
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class KaiyiCrawler extends BrandCrawler {
  constructor() {
    super('Kaiyi', [142]);
    
    // Kaiyi 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Kaiyi 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Kaiyi 品牌特点调整的配置
      
      // 标准配置
      timeout: 60000,
      concurrency: 2
    };
  }

  /**
   * Kaiyi 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Kaiyi 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Kaiyi 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Kaiyi 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new KaiyiCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Kaiyi 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Kaiyi 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = KaiyiCrawler;
