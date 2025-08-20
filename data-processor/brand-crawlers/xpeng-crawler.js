#!/usr/bin/env node

/**
 * Xpeng 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.311Z
 * 品牌ID: 195
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class XpengCrawler extends BrandCrawler {
  constructor() {
    super('Xpeng', [195]);
    
    // Xpeng 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Xpeng 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Xpeng 品牌特点调整的配置
      
      // 新能源品牌配置
      specialHandling: true, // 启用特殊处理
      priceStrategy: 'new_energy' // 新能源价格策略
    };
  }

  /**
   * Xpeng 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Xpeng 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Xpeng 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Xpeng 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new XpengCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Xpeng 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Xpeng 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = XpengCrawler;
