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
    
    // 获取所有品牌ID（从权威映射中动态读取，避免硬编码缺失）
    const { brandIdsMap } = require('./index-optimized');
    const { brandIdsMap: referenceMap } = require('./index');
    const getPrimaryId = (val) => Array.isArray(val) ? val[0] : val;
    const orderMap = Object.entries(referenceMap)
      .map(([name, ids]) => ({ name, id: getPrimaryId(ids) }))
      .sort((a, b) => a.id - b.id)
      .reduce((acc, cur, idx) => { acc[cur.name] = idx; return acc; }, {});
    const allBrandIds = Object.keys(brandIdsMap).sort((a, b) => (orderMap[a] ?? Number.MAX_SAFE_INTEGER) - (orderMap[b] ?? Number.MAX_SAFE_INTEGER));
    
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
          
          // 移除超时限制，让每个品牌有足够时间完成采集
          await processor.processBrand(brandId);
          
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
    // 合并 latest 变化明细
    try {
      const fs = require('fs');
      const path = require('path');
      const latestPath = path.join(__dirname, 'weekly-report-latest.json');
      if (fs.existsSync(latestPath)) {
        const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
        report.changes = latest.changes || [];
        // 清理 latest 以便下次重新累积
        fs.unlinkSync(latestPath);
      }
    } catch (_) {}
    
    const reportFile = path.join(__dirname, `weekly-report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    await this.log(`📊 执行报告已保存: ${reportFile}`);
  }

  // 移除硬编码品牌列表，统一从 index-optimized 的 brandIdsMap 读取

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