#!/usr/bin/env node

/**
 * 品牌爬虫调度器
 * 负责管理和调度所有品牌的独立爬虫实例
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./config');
const BrandCrawler = require('./brand-crawler-template');

// 从原系统导入品牌映射
const { brandIdsMap } = require('./index-optimized');

class BrandScheduler {
  constructor() {
    this.runningCrawlers = new Map(); // 正在运行的爬虫
    this.crawlerQueue = []; // 等待队列
    this.completedCrawlers = new Map(); // 已完成的爬虫
    this.failedCrawlers = new Map(); // 失败的爬虫
    this.maxConcurrent = config.crawler.concurrency || 1; // 最大并发数
    this.schedulerConfig = this.getSchedulerConfig();
    
    // 创建必要的目录
    this.ensureDirectories();
  }

  /**
   * 获取调度器配置
   */
  getSchedulerConfig() {
    return {
      maxConcurrent: 3, // 最大并发品牌数
      retryAttempts: 3, // 失败重试次数
      retryDelay: 60000, // 重试延迟（1分钟）
      healthCheckInterval: 30000, // 健康检查间隔（30秒）
      timeoutPerBrand: 1800000, // 单个品牌最大运行时间（30分钟）
      priorityBrands: ['BYD', 'Tesla', 'BMW', 'Audi', 'Benz'], // 优先处理的品牌
      logLevel: 'info',
      // 新增：自动采集配置
      autoMode: process.env.AUTO_MODE === 'true', // 启用自动模式
      maxBrandsPerSession: parseInt(process.env.MAX_BRANDS_PER_SESSION) || 20, // 每次会话最大采集品牌数
      progressFile: path.join(__dirname, 'auto-progress.json'), // 进度保存文件
      resumeFromLastPosition: true // 从上次位置继续
    };
  }

  /**
   * 确保必要目录存在
   */
  ensureDirectories() {
    const dirs = [
      path.join(__dirname, 'logs'),
      path.join(__dirname, 'logs', 'brands'),
      path.join(__dirname, 'logs', 'scheduler'),
      path.join(__dirname, 'pids'),
      path.join(__dirname, 'status')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 获取所有品牌列表
   */
  getAllBrands() {
    return Object.entries(brandIdsMap).map(([name, id]) => ({
      name,
      id: Array.isArray(id) ? id : [id]
    }));
  }

  /**
   * 加载采集进度
   */
  loadProgress() {
    try {
      if (fs.existsSync(this.schedulerConfig.progressFile)) {
        const progressData = JSON.parse(fs.readFileSync(this.schedulerConfig.progressFile, 'utf8'));
        return progressData;
      }
    } catch (error) {
      console.warn('⚠️ 加载进度文件失败:', error.message);
    }
    return {
      lastBrandIndex: 0,
      completedBrands: [],
      failedBrands: [],
      lastUpdateTime: null
    };
  }

  /**
   * 保存采集进度
   */
  saveProgress(currentIndex, completedBrands, failedBrands) {
    try {
      const progressData = {
        lastBrandIndex: currentIndex,
        completedBrands: completedBrands,
        failedBrands: failedBrands,
        lastUpdateTime: new Date().toISOString(),
        totalBrands: this.getAllBrands().length
      };
      fs.writeFileSync(this.schedulerConfig.progressFile, JSON.stringify(progressData, null, 2));
      console.log(`💾 进度已保存: ${currentIndex}/${progressData.totalBrands}`);
    } catch (error) {
      console.error('❌ 保存进度失败:', error.message);
    }
  }

  /**
   * 获取下一批要处理的品牌（自动模式）
   */
  getNextBrandBatch() {
    const allBrands = this.getAllBrands();
    const progress = this.loadProgress();
    
    let startIndex = 0;
    if (this.schedulerConfig.resumeFromLastPosition && progress.lastBrandIndex > 0) {
      startIndex = progress.lastBrandIndex;
      console.log(`🔄 从上次位置继续: ${startIndex}/${allBrands.length}`);
    }

    // 过滤掉已成功完成的品牌
    const remainingBrands = allBrands.filter((brand, index) => {
      if (index < startIndex) return false;
      return !progress.completedBrands.includes(brand.name);
    });

    // 获取当前批次
    const batchSize = Math.min(this.schedulerConfig.maxBrandsPerSession, remainingBrands.length);
    const currentBatch = remainingBrands.slice(0, batchSize);
    
    console.log(`📦 当前批次: ${currentBatch.length} 个品牌`);
    console.log(`📊 总进度: ${startIndex}/${allBrands.length} (${((startIndex/allBrands.length)*100).toFixed(1)}%)`);
    
    return {
      brands: currentBatch,
      startIndex: startIndex,
      totalBrands: allBrands.length,
      remainingBrands: remainingBrands.length
    };
  }

  /**
   * 按优先级排序品牌
   */
  sortBrandsByPriority(brands) {
    return brands.sort((a, b) => {
      const aPriority = this.schedulerConfig.priorityBrands.indexOf(a.name);
      const bPriority = this.schedulerConfig.priorityBrands.indexOf(b.name);
      
      // 优先品牌排在前面
      if (aPriority !== -1 && bPriority === -1) return -1;
      if (aPriority === -1 && bPriority !== -1) return 1;
      if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
      
      // 其他品牌按名称排序
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * 启动爬虫调度
   */
  async startScheduling(targetBrands = null) {
    console.log('🚀 启动品牌爬虫调度器...');
    
    let brands;
    let batchInfo;
    
    // 判断是自动模式还是指定品牌模式
    if (targetBrands && targetBrands.length > 0) {
      // 指定品牌模式
      console.log('🎯 指定品牌模式');
      brands = this.getAllBrands().filter(brand => targetBrands.includes(brand.name));
      console.log(`📋 指定品牌: ${targetBrands.join(', ')}`);
    } else {
      // 自动模式 - 按顺序处理
      console.log('🤖 自动采集模式');
      batchInfo = this.getNextBrandBatch();
      brands = batchInfo.brands;
      
      if (brands.length === 0) {
        console.log('🎉 所有品牌都已采集完成！');
        return;
      }
      
      console.log(`📈 剩余品牌: ${batchInfo.remainingBrands} 个`);
    }
    
    // 按优先级排序（如果是指定品牌模式）
    if (targetBrands && targetBrands.length > 0) {
      brands = this.sortBrandsByPriority(brands);
    }
    
    console.log(`📊 本次处理 ${brands.length} 个品牌`);
    console.log(`⚙️ 最大并发数: ${this.schedulerConfig.maxConcurrent}`);
    
    // 初始化队列
    this.crawlerQueue = [...brands];
    
    // 启动健康检查
    this.startHealthCheck();
    
    // 开始处理
    const startTime = Date.now();
    await this.processCrawlerQueue();
    
    // 保存进度（自动模式）
    if (!targetBrands || targetBrands.length === 0) {
      const completedBrandNames = Array.from(this.completedCrawlers.keys());
      const failedBrandNames = Array.from(this.failedCrawlers.keys());
      const currentIndex = batchInfo ? batchInfo.startIndex + brands.length : 0;
      this.saveProgress(currentIndex, completedBrandNames, failedBrandNames);
    }
    
    // 生成最终报告
    const duration = Math.round((Date.now() - startTime) / 1000);
    await this.generateFinalReport(duration);
    
    console.log('🎉 所有品牌爬虫任务完成!');
  }

  /**
   * 处理爬虫队列
   */
  async processCrawlerQueue() {
    while (this.crawlerQueue.length > 0 || this.runningCrawlers.size > 0) {
      // 启动新的爬虫（如果有空闲槽位）
      while (this.runningCrawlers.size < this.schedulerConfig.maxConcurrent && this.crawlerQueue.length > 0) {
        const brand = this.crawlerQueue.shift();
        await this.startBrandCrawler(brand);
      }
      
      // 等待一段时间后检查状态
      await this.delay(5000);
      
      // 检查完成的爬虫
      await this.checkCompletedCrawlers();
    }
  }

  /**
   * 启动单个品牌爬虫
   */
  async startBrandCrawler(brand) {
    console.log(`🚗 启动品牌爬虫: ${brand.name}`);
    
    try {
      const crawler = new BrandCrawler(brand.name, brand.id);
      
      const crawlerInfo = {
        brand: brand.name,
        startTime: Date.now(),
        crawler: crawler,
        attempts: 1
      };
      
      this.runningCrawlers.set(brand.name, crawlerInfo);
      
      // 启动爬虫
      crawler.crawlBrand()
        .then((result) => {
          this.handleCrawlerSuccess(brand.name, result);
        })
        .catch((error) => {
          this.handleCrawlerFailure(brand.name, error);
        });
        
    } catch (error) {
      console.error(`❌ 启动品牌爬虫失败: ${brand.name} - ${error.message}`);
      this.handleCrawlerFailure(brand.name, error);
    }
  }

  /**
   * 处理爬虫成功
   */
  async handleCrawlerSuccess(brandName, result) {
    console.log(`✅ 品牌爬虫完成: ${brandName}`);
    
    const crawlerInfo = this.runningCrawlers.get(brandName);
    if (crawlerInfo) {
      const duration = Date.now() - crawlerInfo.startTime;
      this.completedCrawlers.set(brandName, {
        ...result,
        duration: Math.round(duration / 1000),
        attempts: crawlerInfo.attempts
      });
      
      this.runningCrawlers.delete(brandName);
    }
    
    await this.saveSchedulerStatus();
  }

  /**
   * 处理爬虫失败
   */
  async handleCrawlerFailure(brandName, error) {
    console.error(`❌ 品牌爬虫失败: ${brandName} - ${error.message}`);
    
    const crawlerInfo = this.runningCrawlers.get(brandName);
    if (crawlerInfo) {
      // 检查是否需要重试
      if (crawlerInfo.attempts < this.schedulerConfig.retryAttempts) {
        console.log(`🔄 品牌 ${brandName} 将重试 (${crawlerInfo.attempts}/${this.schedulerConfig.retryAttempts})`);
        
        // 添加到重试队列
        setTimeout(() => {
          const brand = { name: brandName, id: this.getBrandId(brandName) };
          this.crawlerQueue.push(brand);
        }, this.schedulerConfig.retryDelay);
        
        crawlerInfo.attempts++;
      } else {
        // 最终失败
        const duration = Date.now() - crawlerInfo.startTime;
        this.failedCrawlers.set(brandName, {
          brand: brandName,
          error: error.message,
          duration: Math.round(duration / 1000),
          attempts: crawlerInfo.attempts,
          finalFailure: true
        });
      }
      
      this.runningCrawlers.delete(brandName);
    }
    
    await this.saveSchedulerStatus();
  }

  /**
   * 获取品牌ID
   */
  getBrandId(brandName) {
    const id = brandIdsMap[brandName];
    return Array.isArray(id) ? id : [id];
  }

  /**
   * 检查已完成的爬虫
   */
  async checkCompletedCrawlers() {
    const now = Date.now();
    
    for (const [brandName, crawlerInfo] of this.runningCrawlers.entries()) {
      const runningTime = now - crawlerInfo.startTime;
      
      // 检查是否超时
      if (runningTime > this.schedulerConfig.timeoutPerBrand) {
        console.warn(`⚠️ 品牌爬虫超时: ${brandName} (运行时间: ${Math.round(runningTime / 1000)}秒)`);
        
        // 强制结束并标记为失败
        try {
          await crawlerInfo.crawler.cleanup();
        } catch (e) {
          // 忽略清理错误
        }
        
        this.handleCrawlerFailure(brandName, new Error('爬虫运行超时'));
      }
    }
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.schedulerConfig.healthCheckInterval);
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck() {
    const status = this.getSchedulerStatus();
    
    console.log(`💓 调度器状态 - 运行中: ${status.running}, 队列: ${status.queued}, 完成: ${status.completed}, 失败: ${status.failed}`);
    
    // 保存状态到文件
    await this.saveSchedulerStatus();
  }

  /**
   * 获取调度器状态
   */
  getSchedulerStatus() {
    return {
      timestamp: new Date().toISOString(),
      running: this.runningCrawlers.size,
      queued: this.crawlerQueue.length,
      completed: this.completedCrawlers.size,
      failed: this.failedCrawlers.size,
      runningBrands: Array.from(this.runningCrawlers.keys()),
      queuedBrands: this.crawlerQueue.map(b => b.name),
      completedBrands: Array.from(this.completedCrawlers.keys()),
      failedBrands: Array.from(this.failedCrawlers.keys())
    };
  }

  /**
   * 保存调度器状态
   */
  async saveSchedulerStatus() {
    try {
      const status = this.getSchedulerStatus();
      const statusFile = path.join(__dirname, 'status', 'scheduler-status.json');
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
    } catch (error) {
      console.warn(`⚠️ 保存调度器状态失败: ${error.message}`);
    }
  }

  /**
   * 生成最终报告
   */
  async generateFinalReport(duration) {
    const report = {
      executionTime: new Date().toISOString(),
      totalDuration: `${duration}秒`,
      summary: {
        total: this.completedCrawlers.size + this.failedCrawlers.size,
        completed: this.completedCrawlers.size,
        failed: this.failedCrawlers.size,
        successRate: `${Math.round((this.completedCrawlers.size / (this.completedCrawlers.size + this.failedCrawlers.size)) * 100)}%`
      },
      completedBrands: Array.from(this.completedCrawlers.entries()).map(([name, info]) => ({
        brand: name,
        duration: `${info.duration}秒`,
        carCount: info.carCount || 0,
        attempts: info.attempts
      })),
      failedBrands: Array.from(this.failedCrawlers.entries()).map(([name, info]) => ({
        brand: name,
        error: info.error,
        duration: `${info.duration}秒`,
        attempts: info.attempts
      }))
    };
    
    // 保存报告
    const reportFile = path.join(__dirname, 'logs', 'scheduler', `report-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`📊 最终报告已保存: ${reportFile}`);
    console.log(`📈 成功率: ${report.summary.successRate} (${report.summary.completed}/${report.summary.total})`);
    
    return report;
  }

  /**
   * 停止所有爬虫
   */
  async stopAllCrawlers() {
    console.log('🛑 停止所有爬虫...');
    
    // 清空队列
    this.crawlerQueue = [];
    
    // 停止运行中的爬虫
    for (const [brandName, crawlerInfo] of this.runningCrawlers.entries()) {
      try {
        await crawlerInfo.crawler.cleanup();
        console.log(`✅ 已停止品牌爬虫: ${brandName}`);
      } catch (error) {
        console.warn(`⚠️ 停止品牌爬虫失败: ${brandName} - ${error.message}`);
      }
    }
    
    this.runningCrawlers.clear();
    await this.saveSchedulerStatus();
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const targetBrands = process.argv.slice(2);
  
  const scheduler = new BrandScheduler();
  
  // 优雅退出处理
  process.on('SIGTERM', async () => {
    console.log('📥 收到SIGTERM信号，正在停止调度器...');
    await scheduler.stopAllCrawlers();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('📥 收到SIGINT信号，正在停止调度器...');
    await scheduler.stopAllCrawlers();
    process.exit(0);
  });
  
  scheduler.startScheduling(targetBrands.length > 0 ? targetBrands : null)
    .then(() => {
      console.log('🎉 调度器完成所有任务');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 调度器运行失败:', error.message);
      process.exit(1);
    });
}

module.exports = BrandScheduler;
