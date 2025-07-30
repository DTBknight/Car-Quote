#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('./config');

// 导入现有的爬虫逻辑
const { CarDataProcessor } = require('./index-optimized');

class ProductionCrawler {
  constructor() {
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
    console.log('🚀 开始生产环境数据同步任务...');
    
    const startTime = Date.now();
    const progress = await this.loadProgress();
    
    // 获取所有品牌ID
    const allBrandIds = this.getAllBrandIds();
    const remainingBrands = allBrandIds.filter(id => 
      !progress.completed.includes(id) && !progress.failed.includes(id)
    );

    if (remainingBrands.length === 0) {
      console.log('✅ 所有品牌已完成，无需重复处理');
      return;
    }

    // 限制品牌数量防止超时
    const brandsToProcess = remainingBrands.slice(0, config.production.maxBrands);
    console.log(`📊 本次处理 ${brandsToProcess.length} 个品牌`);

    const processor = new CarDataProcessor();
    
    try {
      for (const brandId of brandsToProcess) {
        try {
          console.log(`\n🚗 处理品牌 ID: ${brandId}`);
          
          await processor.processBrand(brandId);
          progress.completed.push(brandId);
          console.log(`✅ 品牌 ${brandId} 完成`);
          
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
      await processor.cleanup();
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 数据同步任务完成!`);
    console.log(`⏱️  总耗时: ${duration} 秒`);
    console.log(`✅ 成功: ${progress.completed.length} 个品牌`);
    console.log(`❌ 失败: ${progress.failed.length} 个品牌`);
  }

  getAllBrandIds() {
    // 返回所有品牌名称列表
    return [
      'Volkswagen', 'Audi', 'Benz', 'BMW', 'Toyota', 'Ford', 'Honda', 'GWM', 'Changan', 'Chery',
      'Buick', 'Jeep', 'Mazda', 'Kia', 'LandRover', 'BYD', 'Haval', 'Chery', 'Besturn', 'Porsche',
      'Lexus', 'Lincoln', 'Bentley', 'RollsRoyce', 'Lamborghini', 'Ferrari', 'Maserati', 'AstonMartin',
      'AlfaRomeo', 'Cadillac', 'Jaguar', 'Peugeot', 'Mini', 'McLaren', 'Lotus', 'ChanganNevo',
      'Aeolus', 'DS', 'Dongfeng', 'Fengon', 'eπ', 'Nami', '_212', 'RisingAuto', 'FormulaLeopard',
      'Foton', 'Trumpchi', 'Hyper', 'GMC', 'Hongqi', 'Hycan', 'Hama', 'Hengchi', 'iCAR',
      'Geely', 'GeelyGalaxy', 'Zeekr', 'Jetour', 'Jetta', 'Geome', 'Genesis', 'JMC', 'Arcfox',
      'JAC', 'Polestar', 'Rox', 'Kaiyi', 'Koenigsegg', 'LiAuto', 'LynkCo', 'Leapmotor', 'Onvo',
      'Voyah', 'Landian', 'MG', 'Mhero', 'Neta', 'Ora', 'Acura', 'Aion', 'Aito', 'Avatr',
      'BAIC', 'BAW', 'BJSUV', 'Baojun', 'Deepal', 'Denza', 'Firefly', 'Forthing', 'Fengon',
      'Hengchi', 'IM', 'Infiniti', 'Kaicene', 'Livan', 'Luxeed', 'Maextro', 'Maxus', 'Nami',
      'Nio', 'Nissan', 'Roewe', 'Skoda', 'Skyworth', 'Smart', 'Stelato', 'Subaru', 'Tank',
      'Tesla', 'Volvo', 'Voyah', 'Wey', 'Wuling', 'Xiaomi', 'Xpeng', 'Yangwang'
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
    console.error('❌ 数据同步任务失败:', error);
    process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = ProductionCrawler; 