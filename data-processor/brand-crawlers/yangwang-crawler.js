#!/usr/bin/env node

/**
 * Yangwang 品牌专属爬虫
 * 自动生成于: 2025-08-20T07:48:00.312Z
 * 品牌ID: 546
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class YangwangCrawler extends BrandCrawler {
  constructor() {
    super('Yangwang', [546]);
    
    // Yangwang 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 Yangwang 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 Yangwang 品牌特点调整的配置
      
      // 标准配置
      timeout: 60000,
      concurrency: 2
    };
  }

  /**
   * Yangwang 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 Yangwang 品牌特定逻辑...');
    
    // 无特殊前置处理
    
    await super.beforeCrawl?.();
  }

  /**
   * Yangwang 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 Yangwang 品牌特定后处理...');
    
    // 无特殊后置处理
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new YangwangCrawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 Yangwang 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Yangwang 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = YangwangCrawler;
