#!/usr/bin/env node

/**
 * BAIC 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.267Z
 * 品牌ID: 68
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class BAICCrawler extends BrandCrawler {
  constructor() {
    super('BAIC', [68]);
    
    // BAIC 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 BAIC 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 BAIC 品牌特点调整的配置
      
      // 标准配置
      timeout: 60000,
      concurrency: 2
    };
  }

  /**
   * BAIC 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 BAIC 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * BAIC 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 BAIC 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new BAICCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 BAIC 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 BAIC 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = BAICCrawler;
