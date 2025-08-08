#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const config = require('./config');

// 导入现有的爬虫逻辑
const { CarDataProcessor } = require('./index-optimized');

class DataSyncProcessor {
  constructor() {
    this.progressFile = path.join(__dirname, 'weekly-progress.json');
    this.weeklyLogFile = path.join(__dirname, 'weekly-execution.log');
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // 写入日志文件
    fs.appendFileSync(this.weeklyLogFile, logMessage + '\n');
  }

  async loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const progress = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
        await this.log(`📋 加载进度: 已完成 ${progress.completed.length} 个品牌`);
        return progress;
      }
    } catch (error) {
      await this.log(`⚠️ 加载进度失败: ${error.message}`);
    }
    return { completed: [], failed: [], lastExecution: null };
  }

  async saveProgress(progress) {
    try {
      progress.lastExecution = new Date().toISOString();
      fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
      await this.log('💾 进度已保存');
    } catch (error) {
      await this.log(`❌ 保存进度失败: ${error.message}`);
    }
  }

  async processData() {
    await this.log('🚀 开始数据同步任务...');
    
    const startTime = Date.now();
    const progress = await this.loadProgress();
    
    // 获取所有品牌ID
    const allBrandIds = this.getAllBrandIds();
    
    // 定期执行时，处理所有品牌（完整更新）
    const brandsToProcess = allBrandIds;
    await this.log(`📊 本次处理 ${brandsToProcess.length} 个品牌（完整更新）`);

    const processor = new CarDataProcessor();
    // 优雅退出：捕获SIGTERM/SIGINT，保存进度
    const handleSignal = async (signal) => {
      await this.log(`⚠️ 收到 ${signal}，保存进度并安全退出...`);
      await this.saveProgress(progress);
      await processor.cleanup();
      process.exit(0);
    };
    process.on('SIGTERM', handleSignal);
    process.on('SIGINT', handleSignal);
    
    // 重置进度（定期重新开始）
    progress.completed = [];
    progress.failed = [];
    
    try {
      for (let i = 0; i < brandsToProcess.length; i++) {
        const brandId = brandsToProcess[i];
        
        try {
          await this.log(`\n🚗 处理品牌 ID: ${brandId} (${i + 1}/${brandsToProcess.length})`);
          
          // 设置超时处理
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('处理超时')), 300000); // 5分钟超时
          });
          
          const processPromise = processor.processBrand(brandId);
          
          await Promise.race([processPromise, timeoutPromise]);
          
          progress.completed.push(brandId);
          await this.log(`✅ 品牌 ${brandId} 完成`);
          
          // 保存进度
          await this.saveProgress(progress);
          
          // 减少延迟以节省时间
          await this.delay(800);
          
        } catch (error) {
          await this.log(`❌ 品牌 ${brandId} 处理失败: ${error.message}`);
          progress.failed.push(brandId);
          await this.saveProgress(progress);
          
          // 如果连续失败太多，暂停一下
          if (progress.failed.length > 5 && progress.failed.length % 5 === 0) {
            await this.log(`⚠️ 连续失败较多，暂停30秒...`);
            await this.delay(30000);
          }
        }
      }
    } finally {
      await processor.cleanup();
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    await this.log(`\n🎉 数据同步任务完成!`);
    await this.log(`⏱️  总耗时: ${duration} 秒`);
    await this.log(`✅ 成功: ${progress.completed.length} 个品牌`);
    await this.log(`❌ 失败: ${progress.failed.length} 个品牌`);
    
    // 生成执行报告
    await this.generateReport(progress, duration);
  }

  async generateReport(progress, duration) {
    const report = {
      executionTime: new Date().toISOString(),
      duration: duration,
      totalBrands: progress.completed.length + progress.failed.length,
      successful: progress.completed.length,
      failed: progress.failed.length,
      successRate: ((progress.completed.length / (progress.completed.length + progress.failed.length)) * 100).toFixed(2) + '%',
      completedBrands: progress.completed,
      failedBrands: progress.failed
    };
    
    const reportFile = path.join(__dirname, `weekly-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    await this.log(`📊 执行报告已保存: ${reportFile}`);
  }

  getAllBrandIds() {
    // 返回所有品牌名称列表
    return [
      'Volkswagen', 'Audi', 'Benz', 'BMW', 'Toyota', 'Ford', 'Honda', 'GWM', 'Changan', 'Chery',
      'Buick', 'Jeep', 'Mazda', 'Kia', 'LandRover', 'BYD', 'Haval', 'Bestune', 'Porsche',
      'Lexus', 'Lincoln', 'Bentley', 'RollsRoyce', 'Lamborghini', 'Ferrari', 'Maserati', 'AstonMartin',
      'AlfaRomeo', 'Cadillac', 'Jaguar', 'Peugeot', 'Mini', 'McLaren', 'Lotus', 'ChanganNevo',
      'Hongqi', 'Nio', 'Xpeng', 'LiAuto', 'Zeekr', 'Leapmotor', 'Neta', 'IM', 'Avatr', 'Deepal',
      'Denza', 'Aion', 'Arcfox', 'Dongfeng', 'FAW', 'Geely', 'GeelyGalaxy', 'LynkCo', 'Roewe',
      'Trumpchi', 'Jetour', 'JAC', 'JMC', 'Foton', 'Forthing', 'FormulaLeopard', 'Firefly',
      'Hama', 'Hengchi', 'GMC', 'Genesis', 'Hyundai', 'Infiniti', 'Nissan', 'Subaru', 'Mitsubishi',
      'Suzuki', 'Daihatsu', 'Isuzu', 'Volvo', 'Skoda', 'Seat', 'Citroen', 'DS', 'Renault', 'Fiat', 'Lancia',
      'Opel', 'Vauxhall', 'Saab', 'Koenigsegg', 'Polestar', 'Smart',
      'Wuling', 'Baojun', 'Ora', 'Tank', 'Wey', 'Voyah', 'Yangwang', 'Xiaomi',
      'iCAR', 'Luxeed', 'Stelato', 'Onvo', 'RisingAuto', 'Rox', 'Maextro', 'Landian',
      'Kaicene', 'Kaiyi', 'Mhero', 'Nami', 'Geome', 'Livan',
      'Fengon', 'BJSUV', 'BAW', 'BAIC', 'Aeolus', 'Aito', 'eπ', 'Hycan', 'Hyper'
    ];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const processor = new DataSyncProcessor();
    await processor.processData();
    // 显式退出，避免残留异步句柄导致步骤卡住
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据同步执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main();
}

module.exports = { DataSyncProcessor }; 