#!/usr/bin/env node

/**
 * Bentley 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.265Z
 * 品牌ID: 47
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class BentleyCrawler extends BrandCrawler {
  constructor() {
    super('Bentley', [47]);
    
    // Bentley 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Bentley 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Bentley 品牌特点调整的配置
      
      // 豪华品牌配置
      timeout: 120000, // 2分钟超时
      imageWaitTime: 8000, // 更长的图片等待时间
      pageWaitTime: 10000 // 更长的页面等待时间
    };
  }

  /**
   * Bentley 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Bentley 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Bentley 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Bentley 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new BentleyCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Bentley 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Bentley 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = BentleyCrawler;
