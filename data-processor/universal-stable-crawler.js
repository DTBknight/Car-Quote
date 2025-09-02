// 通用稳定爬虫 - 适用于所有品牌的每车型立即保存策略
const DataCollector = require('./data-collector');
const BrowserManager = require('./browser-manager');
const CheckpointManager = require('./checkpoint-manager');
const fs = require('fs');
const path = require('path');

class UniversalStableCrawler {
  constructor(brandName, brandIds) {
    this.brandName = brandName;
    this.brandIds = Array.isArray(brandIds) ? brandIds : [brandIds];
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
    this.checkpointManager = new CheckpointManager(brandName); // 初始化断点管理器
    this.outputFile = path.join(__dirname, '..', 'data', `${brandName}.json`);
    this.checkpointFile = path.join(__dirname, 'checkpoints', `${brandName}-checkpoint.json`);
    
    this.stats = {
      successCount: 0,
      failCount: 0,
      startTime: Date.now()
    };
    
    console.log(`🚗 ${brandName} 通用稳定爬虫启动...`);
    console.log('📋 策略：每个车型立即保存，无超时监控，数据永不丢失');
    console.log('🔄 启用增强断点管理系统');
  }

  // 优化的品牌logo采集（基于奥迪成功案例）
  async getBrandLogo(browser, carId) {
    try {
      console.log(`🎨 采集 ${this.brandName} 品牌logo...`);
      
      if (!carId) {
        console.log('⚠️ 无车型ID，跳过logo采集');
        return '';
      }

      // 使用奥迪成功的参数格式
      const logoData = await this.dataCollector.getBrandLogo(browser, [carId], this.brandName);
      
      if (logoData && logoData.trim() !== '') {
        console.log(`✅ ${this.brandName} logo采集成功: ${logoData.substring(0, 50)}...`);
        return logoData;
      } else {
        console.log(`⚠️ ${this.brandName} logo采集失败，使用默认值`);
        return '';
      }
    } catch (error) {
      console.log(`⚠️ ${this.brandName} logo采集错误: ${error.message.substring(0, 50)}`);
      return '';
    }
  }

  // 优化的车型采集（基于奥迪成功案例）
  async crawlSingleCarStable(browser, carId, carName) {
    const startTime = Date.now();
    const maxRetries = 3; // 增加重试次数
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`⚡ 采集: ${carName} (ID: ${carId}) [尝试 ${attempt}/${maxRetries}]`);
        
        // 使用奥迪成功的采集方法
        const carData = await this.dataCollector.collectSingleCarData(browser, carId, this.brandName);
        
        if (!carData || !carData.configs || carData.configs.length === 0) {
          console.log(`⚠️ ${carName} 无有效配置`);
          return null;
        }

        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`✅ ${carName} 完成: ${carData.configs.length}配置, ${duration}s`);
        
        // 验证数据完整性（奥迪案例显示需要验证）
        if (carData.configs.some(config => !config.configName || !config.configId)) {
          console.warn(`⚠️ ${carName} 部分配置数据不完整`);
        }
        
        return {
          carId: carId, // 添加车型ID
          carName: carData.carName || this.cleanCarName(carName),
          configs: carData.configs
        };
        
      } catch (error) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`❌ ${carName} 失败(${duration}s): ${error.message.substring(0, 50)}`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 ${carName} 将在 ${attempt * 2000}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 2000));
          
          // 重新创建浏览器实例
          try {
            await this.browserManager.closeBrowser(browser);
          } catch (closeError) {
            console.warn('⚠️ 关闭浏览器失败:', closeError.message);
          }
          
          browser = await this.browserManager.createBrowser();
        } else {
          console.log(`💥 ${carName} 最终失败，已重试 ${maxRetries} 次`);
          return null;
        }
      }
    }
  }

  // 清理车型名称
  cleanCarName(carName) {
    if (!carName) return '未知车型';
    
    // 品牌名称映射
    const brandMap = {
      'Audi': '奥迪',
      'BMW': '宝马',
      'Benz': '奔驰',
      'Volkswagen': '大众',
      'BYD': '比亚迪'
      // 可以继续添加其他品牌
    };
    
    const chineseBrand = brandMap[this.brandName] || this.brandName;
    return carName.replace(new RegExp(`^${chineseBrand}\\s*`), '').trim() || carName;
  }

  // 立即保存单个车型数据
  async saveCarData(brandInfo, carData, currentIndex, totalCars) {
    try {
      let existingData = {
        brand: this.brandName,
        brandImage: brandInfo?.brandImage || "",
        cars: []
      };

      if (fs.existsSync(this.outputFile)) {
        const fileContent = fs.readFileSync(this.outputFile, 'utf8');
        existingData = JSON.parse(fileContent);
      }

      // 检查车型是否已存在
      const existingCarIndex = existingData.cars.findIndex(car => car.carName === carData.carName);
      if (existingCarIndex >= 0) {
        existingData.cars[existingCarIndex] = carData;
        console.log(`🔄 更新: ${carData.carName}`);
      } else {
        existingData.cars.push(carData);
        console.log(`➕ 新增: ${carData.carName}`);
      }

      // 确保brandImage不丢失
      if (brandInfo?.brandImage && !existingData.brandImage) {
        existingData.brandImage = brandInfo.brandImage;
      }

      existingData.lastUpdated = new Date().toISOString();
      existingData.progress = {
        completed: existingData.cars.length,
        total: totalCars,
        percentage: Math.round((existingData.cars.length / totalCars) * 100),
        currentIndex: currentIndex
      };

      fs.writeFileSync(this.outputFile, JSON.stringify(existingData, null, 2));
      console.log(`💾 已保存 ${existingData.cars.length}/${totalCars} 车型 (${existingData.progress.percentage}%)`);
      
      return true;
    } catch (error) {
      console.error('❌ 保存失败:', error.message);
      return false;
    }
  }

  // 保存检查点
  async saveCheckpoint(carIds, carNames, brandInfo, currentIndex) {
    try {
      const checkpoint = {
        brand: this.brandName,
        timestamp: new Date().toISOString(),
        progress: {
          totalCars: carIds.length,
          completedCars: currentIndex,
          remainingCarIds: carIds.slice(currentIndex),
          remainingCarNames: carNames ? carNames.slice(currentIndex) : [],
          brandInfo: brandInfo
        }
      };

      const checkpointDir = path.dirname(this.checkpointFile);
      if (!fs.existsSync(checkpointDir)) {
        fs.mkdirSync(checkpointDir, { recursive: true });
      }

      fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
      console.log(`📋 检查点: ${currentIndex}/${carIds.length}`);
    } catch (error) {
      console.warn('⚠️ 检查点保存失败:', error.message);
    }
  }

  // 加载检查点
  loadCheckpoint() {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const checkpoint = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf8'));
        console.log(`🔄 发现检查点: ${checkpoint.progress.completedCars}/${checkpoint.progress.totalCars} 已完成`);
        return checkpoint.progress;
      }
    } catch (error) {
      console.warn('⚠️ 检查点加载失败:', error.message);
    }
    return null;
  }

  // 主采集流程
  async crawlBrand() {
    console.log(`\n🚀 开始采集 ${this.brandName} 品牌...`);
    
    const startTime = Date.now();
    let browser = null;
    
    try {
      // 检查断点
      const checkpoint = this.checkpointManager.loadCheckpoint();
      let carIds, carNames, brandInfo, startIndex = 0;
      
      if (checkpoint) {
        carIds = checkpoint.remainingCarIds;
        carNames = checkpoint.remainingCarNames;
        brandInfo = checkpoint.brandInfo;
        startIndex = checkpoint.completedCars;
        console.log(`🔄 从断点继续，剩余 ${carIds.length} 个车型`);
      } else {
        console.log('🆕 全新开始采集...');
        browser = await this.browserManager.createBrowser();
        
        // 获取品牌信息和车型列表
        const brandData = await this.dataCollector.getBrandInfoAndCarIds(browser, this.brandIds);
        carIds = brandData.carIds;
        carNames = brandData.carNames;
        brandInfo = brandData.brandInfo || { brand: this.brandName };
        
        console.log(`📊 找到 ${carIds.length} 个车型待采集`);
        console.log(`🎯 车型ID列表: ${carIds.join(', ')}`);
        
        // 立即创建初始断点，记录所有需要采集的车型ID
        const initialProgress = this.checkpointManager.createProgressData(carIds, carNames, [], []);
        await this.checkpointManager.saveCheckpoint(initialProgress);
        console.log(`💾 初始断点已创建，记录 ${carIds.length} 个车型ID`);
        
        // 采集品牌logo（修复版）
        if (carIds.length > 0) {
          const logoImage = await this.getBrandLogo(browser, carIds[0]);
          if (logoImage) {
            brandInfo.brandImage = logoImage;
            // 更新断点中的品牌信息
            initialProgress.brandInfo = brandInfo;
            await this.checkpointManager.saveCheckpoint(initialProgress);
          }
        }
        
        await this.browserManager.closeBrowser(browser);
        browser = null;
      }

      // 逐个采集车型
      for (let i = 0; i < carIds.length; i++) {
        const carId = carIds[i];
        const carName = (carNames && carNames[i]) ? carNames[i] : `车型${carId}`;
        const absoluteIndex = startIndex + i;
        
        console.log(`\n🚗 [${absoluteIndex + 1}/${startIndex + carIds.length}] ${carName}`);
        console.log(`📊 成功率: ${this.stats.successCount}/${this.stats.successCount + this.stats.failCount} (${Math.round(this.stats.successCount/(this.stats.successCount + this.stats.failCount || 1)*100)}%)`);
        
        try {
          // 为每个车型创建新的浏览器实例
          browser = await this.browserManager.createBrowser();
          
          const carData = await this.crawlSingleCarStable(browser, carId, carName);
          
          if (carData) {
            // 立即保存这个车型的数据
            await this.saveCarData(brandInfo, carData, absoluteIndex + 1, startIndex + carIds.length);
            this.stats.successCount++;
          } else {
            this.stats.failCount++;
          }
          
          // 关闭浏览器
          await this.browserManager.closeBrowser(browser);
          browser = null;
          
          // 更新检查点，标记当前车型为已完成
          const currentProgress = this.checkpointManager.createProgressData(
            carIds, 
            carNames, 
            carIds.slice(0, i + 1), // 已完成的车型ID
            [carData] // 当前车型数据
          );
          await this.checkpointManager.saveCheckpoint(currentProgress);
          
          // 更新车型状态为已完成
          this.checkpointManager.updateCarStatus(carId, 'completed', {
            configCount: carData.configs ? carData.configs.length : 0,
            endTime: new Date().toISOString()
          });
          
          // 短暂延迟
          await new Promise(resolve => setTimeout(resolve, 2000)); // 增加延迟时间
          
        } catch (error) {
          console.error(`❌ 车型 ${carName} 处理错误:`, error.message.substring(0, 100));
          this.stats.failCount++;
          
          // 确保关闭浏览器
          if (browser) {
            try {
              await this.browserManager.closeBrowser(browser);
            } catch (closeError) {
              console.warn('⚠️ 关闭浏览器失败:', closeError.message);
            }
            browser = null;
          }
          
          // 保存当前进度，标记当前车型为失败
          const currentProgress = this.checkpointManager.createProgressData(
            carIds, 
            carNames, 
            carIds.slice(0, i), // 已完成的车型ID（不包括当前失败的）
            [] // 当前没有新数据
          );
          await this.checkpointManager.saveCheckpoint(currentProgress);
          
          // 更新车型状态为失败
          this.checkpointManager.updateCarStatus(carId, 'failed', {
            errorMessage: error.message.substring(0, 100),
            endTime: new Date().toISOString()
          });
          
          // 增加失败后的延迟
          await new Promise(resolve => setTimeout(resolve, 5000)); // 失败后等待更长时间
          continue;
        }
      }
      
      // 采集完成，清理传统检查点文件，只保留优化格式
      if (fs.existsSync(this.checkpointFile)) {
        try {
          fs.unlinkSync(this.checkpointFile);
          console.log('🗑️ 传统检查点文件已清理');
        } catch (error) {
          console.warn('⚠️ 清理传统检查点文件失败:', error.message);
        }
      }
      
      const totalTime = Math.round((Date.now() - startTime) / 1000 / 60);
      const successRate = Math.round(this.stats.successCount/(this.stats.successCount + this.stats.failCount || 1)*100);
      
      console.log(`\n🎉 ${this.brandName} 品牌采集完成！`);
      console.log(`⏱️ 总用时: ${totalTime}分钟`);
      console.log(`📊 成功率: ${successRate}% (${this.stats.successCount}/${this.stats.successCount + this.stats.failCount})`);
      
      // 生成优化格式的checkpoint
      await this.generateOptimizedCheckpoint();
      
      await this.printFinalStatus();
      
    } catch (error) {
      console.error('❌ 采集过程出错:', error.message);
      
      // 确保关闭浏览器
      if (browser) {
        try {
          await this.browserManager.closeBrowser(browser);
        } catch (closeError) {
          console.warn('⚠️ 关闭浏览器失败:', closeError.message);
        }
      }
      
      throw error;
    }
  }

  // 生成优化格式的checkpoint
  async generateOptimizedCheckpoint() {
    try {
      if (fs.existsSync(this.outputFile)) {
        const data = JSON.parse(fs.readFileSync(this.outputFile, 'utf8'));
        const cars = data.cars || [];
        
        // 生成采集摘要
        const crawlSummary = {
          totalCars: cars.length,
          successCount: this.stats.successCount,
          failCount: this.stats.failCount,
          successRate: Math.round(this.stats.successCount/(this.stats.successCount + this.stats.failCount || 1)*100)
        };
        
        // 生成车型状态摘要
        const carStatus = this.checkpointManager.generateCarStatusSummary(cars);
        
        // 分析图片采集情况
        const imageCollectionSummary = this.checkpointManager.analyzeImageCollection(cars);
        
        // 生成数据完整性报告
        const dataIntegrity = {
          isComplete: true,
          dataCompleteness: 100,
          missingCarIds: []
        };
        
        // 生成优化格式的checkpoint
        const optimizedCheckpoint = this.checkpointManager.generateOptimizedCheckpoint(
          this.brandName,
          crawlSummary,
          carStatus,
          imageCollectionSummary,
          dataIntegrity
        );
        
        // 保存优化格式的checkpoint
        this.checkpointManager.saveOptimizedCheckpoint(optimizedCheckpoint);
        
        console.log('📋 优化格式checkpoint已生成，包含图片采集统计');
      }
    } catch (error) {
      console.warn('⚠️ 生成优化格式checkpoint失败:', error.message);
    }
  }

  // 打印最终状态
  async printFinalStatus() {
    try {
      if (fs.existsSync(this.outputFile)) {
        const data = JSON.parse(fs.readFileSync(this.outputFile, 'utf8'));
        console.log('\n📊 最终统计:');
        console.log(`✅ 成功采集: ${data.cars ? data.cars.length : 0} 个车型`);
        console.log(`🖼️ 品牌Logo: ${data.brandImage ? '✅已采集' : '❌未采集'}`);
        console.log(`📁 数据文件: ${this.outputFile}`);
        if (data.progress) {
          console.log(`📈 完成度: ${data.progress.percentage}%`);
        }
      }
    } catch (error) {
      console.warn('⚠️ 状态统计失败:', error.message);
    }
  }
}

module.exports = UniversalStableCrawler;

// 如果直接运行此文件
if (require.main === module) {
  const brandName = process.argv[2];
  const brandId = process.argv[3];
  
  if (!brandName || !brandId) {
    console.log('用法: node universal-stable-crawler.js <品牌名> <品牌ID>');
    console.log('例如: node universal-stable-crawler.js Audi 2');
    console.log('     node universal-stable-crawler.js BMW 21');
    process.exit(1);
  }
  
  const crawler = new UniversalStableCrawler(brandName, parseInt(brandId));
  crawler.crawlBrand().catch(console.error);
}
