#!/usr/bin/env node

/**
 * Aion 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.256Z
 * 品牌ID: 242
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class AionCrawler extends BrandCrawler {
  constructor() {
    super('Aion', [242]);
    
    // Aion 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Aion 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Aion 品牌特点调整的配置
      
      // 新能源品牌配置
      specialHandling: true, // 启用特殊处理
      priceStrategy: 'new_energy' // 新能源价格策略
    };
  }

  /**
   * Aion 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Aion 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Aion 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Aion 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new AionCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Aion 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Aion 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = AionCrawler;
