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
    this.stuckDetectionFile = path.join(__dirname, 'stuck-detection.json');
    this.maxStuckTime = 10 * 60 * 1000; // 10分钟无响应认为卡住
    this.heartbeatInterval = 2 * 60 * 1000; // 2分钟输出一次心跳
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
    
    // 检查是否有断点需要恢复
    const { startIndex, shouldResume } = await this.resumeFromCheckpoint(brandsToProcess, progress);
    if (shouldResume) {
      await this.log(`🔄 从断点处继续执行，跳过前 ${startIndex} 个品牌`);
    }
    
    // 优雅退出：捕获SIGTERM/SIGINT，保存进度和断点
    const handleSignal = async (signal) => {
      await this.log(`⚠️ 收到 ${signal}，保存进度和断点并安全退出...`);
      await this.saveProgress(progress);
      await this.saveCheckpoint(brandsToProcess[startIndex], startIndex, progress, 'signal_interrupt');
      await processor.cleanup();
      process.exit(0);
    };
    process.on('SIGTERM', handleSignal);
    process.on('SIGINT', handleSignal);
    
    // 如果不是从断点恢复，重置进度
    if (!shouldResume) {
      progress.completed = [];
      progress.failed = [];
    }
    
    try {
      // 添加心跳机制和卡住检测
      let lastHeartbeat = 0;
      let lastActivityTime = Date.now();
      let consecutiveStuckCount = 0;
      
      for (let i = startIndex; i < brandsToProcess.length; i++) {
        const brandId = brandsToProcess[i];
        
        // 更新活动时间
        lastActivityTime = Date.now();
        
        // 心跳输出
        if (i - lastHeartbeat >= 5) {
          await this.log(`💓 心跳: 已处理 ${i}/${brandsToProcess.length} 个品牌，成功: ${progress.completed.length}，失败: ${progress.failed.length}`);
          lastHeartbeat = i;
        }
        
        try {
          await this.log(`\n🚗 处理品牌 ID: ${brandId} (${i + 1}/${brandsToProcess.length})`);
          await this.log(`⏰ 开始时间: ${new Date().toISOString()}`);
          
          // 添加品牌处理进度监控
          const startBrandTime = Date.now();
          
          // 添加全局超时保护（30分钟），防止某个品牌无限期卡住
          const brandTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`品牌 ${brandId} 处理超时（30分钟）`)), 30 * 60 * 1000);
          });
          
          const brandProcessPromise = processor.processBrand(brandId);
          
          await Promise.race([brandProcessPromise, brandTimeoutPromise]);
          
          const brandDuration = Math.round((Date.now() - startBrandTime) / 1000);
          await this.log(`✅ 品牌 ${brandId} 完成，耗时: ${brandDuration} 秒`);
          
          progress.completed.push(brandId);
          
          // 保存进度和断点
          await this.saveProgress(progress);
          await this.saveCheckpoint(brandId, i, progress, 'normal');
          
          // 重置卡住计数
          consecutiveStuckCount = 0;
          
          // 减少延迟以节省时间
          await this.log(`⏳ 等待800ms后继续下一个品牌...`);
          await this.delay(800);
          
        } catch (error) {
          const errorTime = new Date().toISOString();
          await this.log(`❌ 品牌 ${brandId} 处理失败 (${errorTime}): ${error.message}`);
          await this.log(`🔍 错误堆栈: ${error.stack || '无堆栈信息'}`);
          
          progress.failed.push(brandId);
          
          // 保存进度和断点
          await this.saveProgress(progress);
          await this.saveCheckpoint(brandId, i, progress, 'error');
          
          // 如果连续失败太多，暂停一下
          if (progress.failed.length > 5 && progress.failed.length % 5 === 0) {
            await this.log(`⚠️ 连续失败较多，暂停30秒...`);
            await this.delay(30000);
          }
        }
        
        // 检查是否卡住
        if (await this.checkIfStuck(lastActivityTime)) {
          consecutiveStuckCount++;
          await this.log(`⚠️ 检测到卡住状态！连续卡住次数: ${consecutiveStuckCount}`);
          
          // 保存断点
          await this.saveCheckpoint(brandId, i, progress, 'stuck');
          
          if (consecutiveStuckCount >= 3) {
            await this.log(`🚨 连续卡住3次，强制退出并保存断点`);
            break;
          }
          
          // 等待一段时间后继续
          await this.log(`⏳ 等待5分钟后重试...`);
          await this.delay(5 * 60 * 1000);
        }
      }
    } finally {
      await processor.cleanup();
      
      // 如果正常完成，清理断点文件
      if (consecutiveStuckCount < 3) {
        await this.clearCheckpoint();
        await this.log(`🎉 任务正常完成，断点文件已清理`);
      } else {
        await this.log(`⚠️ 任务因卡住而中断，断点已保存，下次可从断点处继续`);
      }
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

  // 检测是否卡住
  async checkIfStuck(lastActivityTime) {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;
    
    if (timeSinceLastActivity > this.maxStuckTime) {
      await this.log(`⚠️ 检测到卡住状态！距离上次活动已过去 ${Math.round(timeSinceLastActivity / 1000)} 秒`);
      return true;
    }
    return false;
  }

  // 保存断点信息
  async saveCheckpoint(brandId, index, progress, reason = 'normal') {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      brandId,
      index,
      reason,
      progress: {
        completed: progress.completed,
        failed: progress.failed,
        lastExecution: progress.lastExecution
      }
    };
    
    try {
      fs.writeFileSync(this.stuckDetectionFile, JSON.stringify(checkpoint, null, 2));
      await this.log(`💾 断点已保存: 品牌 ${brandId} (第${index + 1}个)，原因: ${reason}`);
    } catch (error) {
      await this.log(`❌ 保存断点失败: ${error.message}`);
    }
  }

  // 加载断点信息
  async loadCheckpoint() {
    try {
      if (fs.existsSync(this.stuckDetectionFile)) {
        const checkpoint = JSON.parse(fs.readFileSync(this.stuckDetectionFile, 'utf8'));
        await this.log(`📍 发现断点: 品牌 ${checkpoint.brandId} (第${checkpoint.index + 1}个)，时间: ${checkpoint.timestamp}`);
        return checkpoint;
      }
    } catch (error) {
      await this.log(`⚠️ 加载断点失败: ${error.message}`);
    }
    return null;
  }

  // 清理断点文件
  async clearCheckpoint() {
    try {
      if (fs.existsSync(this.stuckDetectionFile)) {
        fs.unlinkSync(this.stuckDetectionFile);
        await this.log(`🗑️ 断点文件已清理`);
      }
    } catch (error) {
      await this.log(`⚠️ 清理断点失败: ${error.message}`);
    }
  }

  // 从断点处重新开始
  async resumeFromCheckpoint(brandsToProcess, progress) {
    const checkpoint = await this.loadCheckpoint();
    if (!checkpoint) {
      return { startIndex: 0, shouldResume: false };
    }

    // 检查断点是否仍然有效
    const checkpointIndex = checkpoint.index;
    if (checkpointIndex >= brandsToProcess.length) {
      await this.log(`⚠️ 断点索引超出范围，从头开始`);
      await this.clearCheckpoint();
      return { startIndex: 0, shouldResume: false };
    }

    // 恢复进度
    progress.completed = checkpoint.progress.completed || [];
    progress.failed = checkpoint.progress.failed || [];
    
    await this.log(`🔄 从断点恢复: 品牌 ${checkpoint.brandId} (第${checkpointIndex + 1}个)`);
    await this.log(`📊 已恢复进度: 成功 ${progress.completed.length} 个，失败 ${progress.failed.length} 个`);
    
    return { startIndex: checkpointIndex, shouldResume: true };
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