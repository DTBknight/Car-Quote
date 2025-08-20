#!/usr/bin/env node

/**
 * AstonMartin 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.260Z
 * 品牌ID: 80
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class AstonMartinCrawler extends BrandCrawler {
  constructor() {
    super('AstonMartin', [80]);
    
    // AstonMartin 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 AstonMartin 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 AstonMartin 品牌特点调整的配置
      
      // 豪华品牌配置
      timeout: 120000, // 2分钟超时
      imageWaitTime: 8000, // 更长的图片等待时间
      pageWaitTime: 10000 // 更长的页面等待时间
    };
  }

  /**
   * AstonMartin 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 AstonMartin 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * AstonMartin 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 AstonMartin 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new AstonMartinCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 AstonMartin 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 AstonMartin 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = AstonMartinCrawler;
