#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { BrowserManager } = require('./browser-manager');
const { DataCollector } = require('./data-collector');
const { DataManager } = require('./data-manager');
const config = require('./config');

class ProductionCrawler {
  constructor() {
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
    this.dataManager = new DataManager();
    this.progressFile = path.join(__dirname, config.production.progressFile);
  }

  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        console.log(`📋 加载进度: 已完成 ${progress.completed.length} 个品牌`);
        return progress;
      }
    } catch (error) {
      console.warn('⚠️ 加载进度失败:', error.message);
    }
    return { completed: [], failed: [] };
  }

  async saveProgress(progress) {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
      console.log('💾 进度已保存');
    } catch (error) {
      console.error('❌ 保存进度失败:', error.message);
    }
  }

  async crawlAllBrands() {
    console.log('🚀 开始生产环境爬虫任务...');
    
    const startTime = Date.now();
    const progress = await this.loadProgress();
    
    // 获取所有品牌ID
    const allBrandIds = this.getAllBrandIds();
    const remainingBrands = allBrandIds.filter(id => 
      !progress.completed.includes(id) && !progress.failed.includes(id)
    );

    if (remainingBrands.length === 0) {
      console.log('✅ 所有品牌已完成，无需重复爬取');
      return;
    }

    // 限制品牌数量防止超时
    const brandsToProcess = remainingBrands.slice(0, config.production.maxBrands);
    console.log(`📊 本次处理 ${brandsToProcess.length} 个品牌`);

    const browser = await this.browserManager.createBrowser();
    
    try {
      for (const brandId of brandsToProcess) {
        try {
          console.log(`\n🚗 处理品牌 ID: ${brandId}`);
          
          const result = await this.dataCollector.collectCarData(brandId, [brandId]);
          
          if (result && result.cars && result.cars.length > 0) {
            await this.dataManager.saveBrandData(result);
            progress.completed.push(brandId);
            console.log(`✅ 品牌 ${brandId} 完成: ${result.cars.length} 个车型`);
          } else {
            progress.failed.push(brandId);
            console.log(`❌ 品牌 ${brandId} 失败: 无数据`);
          }
          
          // 保存进度
          await this.saveProgress(progress);
          
          // 生产环境延迟
          await this.delay(2000);
          
        } catch (error) {
          console.error(`❌ 品牌 ${brandId} 处理失败:`, error.message);
          progress.failed.push(brandId);
          await this.saveProgress(progress);
        }
      }
    } finally {
      await browser.close();
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 爬虫任务完成!`);
    console.log(`⏱️  总耗时: ${duration} 秒`);
    console.log(`✅ 成功: ${progress.completed.length} 个品牌`);
    console.log(`❌ 失败: ${progress.failed.length} 个品牌`);
  }

  getAllBrandIds() {
    // 返回所有品牌ID列表
    return [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
      61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
      81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100
    ];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主函数
async function main() {
  const crawler = new ProductionCrawler();
  
  try {
    await crawler.crawlAllBrands();
  } catch (error) {
    console.error('❌ 爬虫任务失败:', error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = ProductionCrawler; 