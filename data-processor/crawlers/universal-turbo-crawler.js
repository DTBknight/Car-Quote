// 高性能爬虫 - 优化并发和流水线处理
const DataCollector = require('../data-collector');
const BrowserManager = require('../managers/browser-manager');
const CheckpointManager = require('../managers/checkpoint-manager');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit').default;

// 使用高性能配置
const config = require('../configs/config-turbo');
// 使用统一的品牌映射
const { getBrandId, getBrandChineseName, isValidBrand } = require('../configs/brand-mapping');

class UniversalTurboCrawler {
  constructor(brandName, brandIds) {
    this.brandName = brandName;
    this.brandIds = Array.isArray(brandIds) ? brandIds : [brandIds];
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
    this.checkpointManager = new CheckpointManager(brandName);
    this.outputFile = path.join(__dirname, '..', '..', 'data', `${brandName}.json`);
    this.checkpointFile = path.join(__dirname, 'checkpoints', `${brandName}-checkpoint.json`);
    
    // 多浏览器实例管理
    this.browserPool = [];
    this.maxBrowsers = Math.min(config.crawler.concurrency, 4); // 最多4个浏览器实例
    
    this.stats = {
      successCount: 0,
      failCount: 0,
      startTime: Date.now()
    };
    
    // 定时断点保存和优雅退出
    this.lastCheckpointTime = Date.now();
    this.checkpointInterval = 5 * 60 * 1000; // 5分钟
    this.autoCheckpointTimer = null;
    this.isShuttingDown = false;
    
    console.log(`🚀 ${brandName} 高性能爬虫启动...`);
    console.log(`⚡ 使用 ${config.crawler.concurrency} 个车型并发`);
    console.log(`🌐 使用 ${this.maxBrowsers} 个浏览器实例`);
    console.log('📋 策略：高并发 + 流水线处理 + 资源池管理');
    console.log('💾 每5分钟自动保存断点，支持中断恢复');
    
    // 设置优雅退出处理
    this.setupGracefulShutdown();
  }

  // 设置优雅退出处理
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log(`\n🛑 收到 ${signal} 信号，开始优雅退出...`);
      console.log('💾 正在保存当前进度到断点...');
      
      try {
        // 保存最终断点
        if (this.currentCarIds && this.currentAllCarData && this.currentBrandLogo) {
          const remainingCarIds = this.checkpointManager.getRemainingCarIds(this.currentCarIdTracking);
          await this.checkpointManager.saveCheckpoint({
            remainingCarIds,
            completedCars: this.currentAllCarData,
            brandLogo: this.currentBrandLogo,
            totalCars: this.currentCarIds.length,
            carIdTracking: this.currentCarIdTracking
          });
          console.log(`✅ 断点已保存: ${this.currentAllCarData.length}/${this.currentCarIds.length} 车型完成`);
        }
        
        // 清理浏览器池
        await this.cleanupBrowserPool();
        console.log('🧹 浏览器池已清理');
        
        // 清理定时器
        if (this.autoCheckpointTimer) {
          clearInterval(this.autoCheckpointTimer);
        }
        
        console.log('👋 优雅退出完成，可通过断点继续采集');
        process.exit(0);
      } catch (error) {
        console.error('❌ 优雅退出时出错:', error.message);
        process.exit(1);
      }
    };
    
    // 监听退出信号
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
  }

  // 启动定时断点保存
  startAutoCheckpoint() {
    if (this.autoCheckpointTimer) {
      clearInterval(this.autoCheckpointTimer);
    }
    
    this.autoCheckpointTimer = setInterval(async () => {
      try {
        if (this.currentCarIds && this.currentAllCarData && this.currentCarIdTracking) {
          const remainingCarIds = this.checkpointManager.getRemainingCarIds(this.currentCarIdTracking);
          await this.checkpointManager.saveCheckpoint({
            remainingCarIds,
            completedCars: this.currentAllCarData,
            brandLogo: this.currentBrandLogo || '',
            totalCars: this.currentCarIds.length,
            carIdTracking: this.currentCarIdTracking
          });
          
          const now = Date.now();
          const elapsed = Math.round((now - this.stats.startTime) / 1000 / 60);
          console.log(`⏰ 定时断点保存 [${elapsed}分钟]: ${this.currentAllCarData.length}/${this.currentCarIds.length} 车型完成`);
        }
      } catch (error) {
        console.warn(`⚠️ 定时断点保存失败: ${error.message}`);
      }
    }, this.checkpointInterval);
    
    console.log('⏰ 定时断点保存已启动 (每5分钟)');
  }

  // 停止定时断点保存
  stopAutoCheckpoint() {
    if (this.autoCheckpointTimer) {
      clearInterval(this.autoCheckpointTimer);
      this.autoCheckpointTimer = null;
    }
  }

  // 检查是否需要保存断点（时间或数量触发）
  shouldSaveCheckpoint(processedCount) {
    const timeSinceLastCheckpoint = Date.now() - this.lastCheckpointTime;
    const timeThreshold = this.checkpointInterval;
    const countThreshold = 3; // 每3个车型也保存一次
    
    return (timeSinceLastCheckpoint >= timeThreshold) || (processedCount % countThreshold === 0);
  }

  // 更新断点保存时间
  updateCheckpointTime() {
    this.lastCheckpointTime = Date.now();
  }

  // 初始化浏览器池
  async initializeBrowserPool() {
    console.log(`🌐 初始化 ${this.maxBrowsers} 个浏览器实例...`);
    
    for (let i = 0; i < this.maxBrowsers; i++) {
      try {
        const browser = await this.browserManager.createBrowser();
        this.browserPool.push({
          browser,
          inUse: false,
          id: i
        });
        console.log(`✅ 浏览器实例 ${i + 1} 创建成功`);
      } catch (error) {
        console.warn(`⚠️ 浏览器实例 ${i + 1} 创建失败: ${error.message}`);
      }
    }
    
    console.log(`🎉 浏览器池初始化完成: ${this.browserPool.length}/${this.maxBrowsers} 个实例`);
  }

  // 获取可用浏览器
  getBrowser() {
    const availableBrowser = this.browserPool.find(item => !item.inUse);
    if (availableBrowser) {
      availableBrowser.inUse = true;
      return availableBrowser;
    }
    return null;
  }

  // 释放浏览器
  releaseBrowser(browserItem) {
    if (browserItem) {
      browserItem.inUse = false;
    }
  }

  // 高性能品牌采集
  async crawlBrand() {
    try {
      console.log(`🚀 开始采集 ${this.brandName} 品牌...`);
      
      // 初始化浏览器池
      await this.initializeBrowserPool();
      
      if (this.browserPool.length === 0) {
        throw new Error('无法创建浏览器实例');
      }

      // 检查断点
      const checkpoint = await this.checkpointManager.loadCheckpoint();
      let carIds = [];
      let allCarData = [];
      let brandLogo = '';

      if (checkpoint && checkpoint.exists) {
        console.log('📁 发现断点文件，从断点继续...');
        
        // 从现有数据文件中读取已完成的车型数据
        try {
          if (fs.existsSync(this.outputFile)) {
            const existingData = JSON.parse(fs.readFileSync(this.outputFile, 'utf8'));
            if (existingData.cars && Array.isArray(existingData.cars)) {
              allCarData = existingData.cars;
              console.log(`📂 从现有文件读取到 ${allCarData.length} 个已完成车型`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ 读取现有数据失败: ${error.message}`);
        }
        
        // 使用新的车型ID跟踪机制
        const carIdTracking = checkpoint.data.carIdTracking;
        if (carIdTracking) {
          carIds = this.checkpointManager.getRemainingCarIds(carIdTracking);
          console.log(`🎯 使用车型ID跟踪: 剩余 ${carIds.length} 个待采集车型`);
        } else {
          // 兼容旧版断点格式
          carIds = checkpoint.data.remainingCarIds || [];
        }
        
        brandLogo = checkpoint.data.brandLogo || '';
        this.stats.successCount = allCarData.length;
        console.log(`📊 断点信息: 剩余 ${carIds.length} 个车型，已完成 ${allCarData.length} 个车型`);
        
        if (carIds.length === 0) {
          console.log('🎉 所有车型已采集完成');
          return this.finalizeData(allCarData, brandLogo);
        }
      } else {
        // 获取车型列表
        const mainBrowser = this.browserPool[0].browser;
        const brandResult = await this.dataCollector.getBrandInfoAndCarIds(mainBrowser, this.brandIds);
        carIds = brandResult.carIds;
        brandLogo = await this.getBrandLogo(mainBrowser, carIds[0]);
        
        console.log(`📊 找到 ${carIds.length} 个车型待采集`);
        
        if (carIds.length === 0) {
          console.log('❌ 未找到任何车型');
          return null;
        }
        
        // 创建车型ID跟踪并保存初始断点
        const carIdTracking = this.checkpointManager.createCarIdTracking(carIds, []);
        await this.checkpointManager.saveCheckpoint({
          remainingCarIds: carIds,
          completedCars: [],
          brandLogo: brandLogo,
          totalCars: carIds.length,
          carIdTracking: carIdTracking
        });
      }

      // 设置当前状态供定时保存和优雅退出使用
      this.currentCarIds = carIds;
      this.currentAllCarData = allCarData;
      this.currentBrandLogo = brandLogo;
      
      // 启动定时断点保存
      this.startAutoCheckpoint();
      
      // 高并发车型采集
      await this.crawlCarsHighConcurrency(carIds, allCarData, brandLogo);
      
      // 停止定时保存
      this.stopAutoCheckpoint();
      
      return this.finalizeData(allCarData, brandLogo);

    } catch (error) {
      console.error(`❌ 品牌 ${this.brandName} 采集失败:`, error.message);
      
      // 全局异常时保存断点
      try {
        if (allCarData && carIds) {
          const completedCount = allCarData.length;
          
          // 获取车型ID跟踪数据
          const checkpoint = await this.checkpointManager.loadCheckpoint();
          let carIdTracking = null;
          if (checkpoint && checkpoint.exists && checkpoint.data.carIdTracking) {
            carIdTracking = checkpoint.data.carIdTracking;
          } else {
            carIdTracking = this.checkpointManager.createCarIdTracking(carIds, []);
          }
          
          const remainingCarIds = this.checkpointManager.getRemainingCarIds(carIdTracking);
          
          if (remainingCarIds.length > 0) {
            await this.checkpointManager.saveCheckpoint({
              remainingCarIds,
              completedCars: allCarData,
              brandLogo: brandLogo || '',
              totalCars: carIds.length,
              carIdTracking: carIdTracking
            });
            console.log(`💾 全局异常时断点已保存: ${completedCount}/${carIds.length} 车型完成，剩余 ${remainingCarIds.length} 个待采集`);
          }
        }
      } catch (checkpointError) {
        console.warn(`⚠️ 全局异常断点保存失败: ${checkpointError.message}`);
      }
      
      throw error;
    } finally {
      await this.cleanupBrowserPool();
    }
  }

  // 高并发车型采集
  async crawlCarsHighConcurrency(carIds, allCarData, brandLogo) {
    const totalCars = carIds.length;
    const limit = pLimit(config.crawler.concurrency);
    
    logger.title(`${this.brandName} 品牌高并发车型采集`);
    logger.carCollectionProgress(0, totalCars, '准备中...', totalCars);

    let completedCount = allCarData.length;
    let processedInThisBatch = 0;
    
    // 获取或创建车型ID跟踪
    let carIdTracking = null;
    const checkpoint = await this.checkpointManager.loadCheckpoint();
    if (checkpoint && checkpoint.exists && checkpoint.data.carIdTracking) {
      carIdTracking = checkpoint.data.carIdTracking;
    } else {
      carIdTracking = this.checkpointManager.createCarIdTracking(carIds, []);
    }
    
    // 创建采集任务
    const carTasks = carIds.map((carId, index) => 
      limit(async () => {
        const browserItem = await this.waitForAvailableBrowser();
        
        try {
          const carStartTime = Date.now();
          let carName = `车型${carId}`;
          
          console.log(`⚡ 采集: 车型${carId} [浏览器${browserItem.id}] [尝试 1/2]`);
          
          // 更新车型状态为进行中
          carIdTracking = this.checkpointManager.updateCarIdStatus(carIdTracking, carId, 'inProgress');
          
          // 增强协议错误处理
          const carData = await this.dataCollector.handleProtocolTimeout(
            () => this.dataCollector.collectSingleCarData(browserItem.browser, carId, this.brandName),
            `车型${carId}采集`
          );
          
          if (carData && carData.configs && carData.configs.length > 0) {
            allCarData.push(carData);
            carName = carData.carName || carName;
            this.stats.successCount++;
            
            // 更新车型状态为已完成
            carIdTracking = this.checkpointManager.updateCarIdStatus(carIdTracking, carId, 'completed');
            
            const carDuration = Math.round((Date.now() - carStartTime) / 1000);
            logger.success(`车型 ${carName} 采集成功 - ${carData.configs.length} 个配置 (${carDuration}s) [浏览器${browserItem.id}]`);
            
            // 立即保存单个车型数据
            await this.saveCarDataImmediately(allCarData, brandLogo, totalCars);
          } else {
            this.stats.failCount++;
            // 更新车型状态为失败
            carIdTracking = this.checkpointManager.updateCarIdStatus(carIdTracking, carId, 'failed', '无有效数据');
            logger.error(`车型 ${carId} 采集失败 - 无有效数据 [浏览器${browserItem.id}]`);
          }
          
          // 更新进度
          processedInThisBatch++;
          completedCount = allCarData.length;
          const remainingCount = totalCars - completedCount;
          
          logger.carCollectionProgress(completedCount, totalCars, carName, remainingCount);
          logger.liveCollectionStatus({
            successCount: this.stats.successCount,
            failCount: this.stats.failCount,
            totalProcessed: completedCount + this.stats.failCount,
            totalTarget: totalCars,
            currentItem: carName,
            estimatedRemaining: 0
          });
          
          // 更新当前状态
          this.currentAllCarData = allCarData;
          this.currentCarIdTracking = carIdTracking;
          
          // 智能断点保存（时间或数量触发）
          if (this.shouldSaveCheckpoint(processedInThisBatch)) {
            const remainingCarIds = this.checkpointManager.getRemainingCarIds(carIdTracking);
            await this.checkpointManager.saveCheckpoint({
              remainingCarIds,
              completedCars: allCarData,
              brandLogo,
              totalCars,
              carIdTracking: carIdTracking
            });
            this.updateCheckpointTime();
            
            const elapsed = Math.round((Date.now() - this.stats.startTime) / 1000 / 60);
            console.log(`💾 断点已保存 [${elapsed}分钟]: ${completedCount}/${totalCars} 车型完成，剩余 ${remainingCarIds.length} 个待采集`);
          }
          
          return carData;
          
        } catch (error) {
          this.stats.failCount++;
          
          // 更新车型状态为失败
          carIdTracking = this.checkpointManager.updateCarIdStatus(carIdTracking, carId, 'failed', error.message);
          
          logger.error(`车型 ${carId} 最终失败: ${error.message.substring(0, 50)} [浏览器${browserItem.id}]`);
          
          // 更新当前状态
          this.currentCarIdTracking = carIdTracking;
          
          // 异常时保存断点
          try {
            const remainingCarIds = this.checkpointManager.getRemainingCarIds(carIdTracking);
            await this.checkpointManager.saveCheckpoint({
              remainingCarIds,
              completedCars: allCarData,
              brandLogo,
              totalCars,
              carIdTracking: carIdTracking
            });
            this.updateCheckpointTime();
            console.log(`💾 异常时断点已保存: ${completedCount}/${totalCars} 车型完成，剩余 ${remainingCarIds.length} 个待采集`);
          } catch (checkpointError) {
            console.warn(`⚠️ 断点保存失败: ${checkpointError.message}`);
          }
          
          return null;
        } finally {
          this.releaseBrowser(browserItem);
        }
      })
    );

    // 并发执行所有任务
    await Promise.all(carTasks);
    
    // 显示最终统计
    const totalTime = Math.round((Date.now() - this.stats.startTime) / 1000);
    logger.title(`${this.brandName} 品牌采集完成`);
    console.log(`🎉 采集完成 - 用时 ${Math.floor(totalTime/60)}分${totalTime%60}秒`);
    console.log(`📊 成功: ${this.stats.successCount}, 失败: ${this.stats.failCount}, 成功率: ${Math.round(this.stats.successCount/totalCars*100)}%`);
  }

  // 等待可用浏览器
  async waitForAvailableBrowser() {
    while (true) {
      const browser = this.getBrowser();
      if (browser) {
        return browser;
      }
      // 等待50ms后重试
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // 立即保存车型数据
  async saveCarDataImmediately(allCarData, brandLogo, totalCars) {
    try {
      const brandData = {
        brand: this.brandName,
        brandImage: brandLogo,
        cars: allCarData,
        lastUpdated: new Date().toISOString(),
        progress: {
          completed: allCarData.length,
          total: totalCars,
          percentage: Math.round((allCarData.length / totalCars) * 100),
          currentIndex: allCarData.length
        }
      };

      fs.writeFileSync(this.outputFile, JSON.stringify(brandData, null, 2));
    } catch (error) {
      console.warn(`⚠️ 保存车型数据失败: ${error.message}`);
    }
  }

  // 品牌Logo采集
  async getBrandLogo(browser, carId) {
    try {
      console.log(`🎨 采集 ${this.brandName} 品牌logo...`);
      if (!carId) return '';

      const logoData = await this.dataCollector.getBrandLogo(browser, [carId], this.brandName);
      
      if (logoData && logoData.trim() !== '') {
        console.log(`✅ ${this.brandName} logo采集成功`);
        return logoData;
      } else {
        console.log(`⚠️ ${this.brandName} logo采集失败`);
        return '';
      }
    } catch (error) {
      console.warn(`⚠️ logo采集错误: ${error.message}`);
      return '';
    }
  }

  // 最终化数据
  async finalizeData(allCarData, brandLogo) {
    const totalCars = allCarData.length;
    
    const finalData = {
      brand: this.brandName,
      brandImage: brandLogo,
      cars: allCarData,
      lastUpdated: new Date().toISOString(),
      progress: {
        completed: totalCars,
        total: totalCars,
        percentage: 100,
        currentIndex: totalCars
      }
    };

    // 保存最终数据
    fs.writeFileSync(this.outputFile, JSON.stringify(finalData, null, 2));
    
    // 清理断点
    await this.checkpointManager.clearCheckpoint();
    
    console.log(`📁 数据文件: ${this.outputFile}`);
    console.log(`📈 完成度: 100%`);
    
    return finalData;
  }

  // 清理浏览器池
  async cleanupBrowserPool() {
    console.log('🧹 清理浏览器池...');
    
    for (const browserItem of this.browserPool) {
      try {
        await this.browserManager.closeBrowser(browserItem.browser);
      } catch (error) {
        console.warn(`⚠️ 关闭浏览器失败: ${error.message}`);
      }
    }
    
    this.browserPool = [];
    console.log('✅ 浏览器池清理完成');
  }
}

// 主函数
async function main() {
  const brandName = process.argv[2];
  const brandId = process.argv[3];
  
  if (!brandName || !brandId) {
    console.error('❌ 请提供品牌名称和ID');
    console.log('📋 用法: node universal-turbo-crawler.js <品牌名> <品牌ID>');
    process.exit(1);
  }
  
  const crawler = new UniversalTurboCrawler(brandName, parseInt(brandId));
  
  try {
    const result = await crawler.crawlBrand();
    if (result) {
      console.log(`🎉 ${brandName} 品牌采集完成！`);
      process.exit(0);
    } else {
      console.log(`❌ ${brandName} 品牌采集失败`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`💥 采集过程出错: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = UniversalTurboCrawler;
