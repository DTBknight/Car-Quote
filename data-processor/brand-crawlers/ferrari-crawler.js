#!/usr/bin/env node

/**
 * Ferrari 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.279Z
 * 品牌ID: 44
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class FerrariCrawler extends BrandCrawler {
  constructor() {
    super('Ferrari', [44]);
    
    // Ferrari 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Ferrari 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Ferrari 品牌特点调整的配置
      
      // 豪华品牌配置
      timeout: 120000, // 2分钟超时
      imageWaitTime: 8000, // 更长的图片等待时间
      pageWaitTime: 10000 // 更长的页面等待时间
    };
  }

  /**
   * Ferrari 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Ferrari 品牌特定逻辑...');
    
    // 超跑品牌特殊处理：延长等待时间
    
    await super.beforeCrawl?.();
  }

  /**
   * Ferrari 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Ferrari 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new FerrariCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Ferrari 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Ferrari 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = FerrariCrawler;
