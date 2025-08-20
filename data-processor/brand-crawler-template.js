#!/usr/bin/env node

/**
 * 单品牌爬虫模板（包含完整图片采集功能）
 * 这个文件是每个品牌独立爬虫的基础模板，继承原系统的所有采集能力
 */

const fs = require('fs');
const path = require('path');
const BrowserManager = require('./browser-manager');
const DataCollector = require('./data-collector');
const DataManager = require('./data-manager');
const config = require('./config');

class BrandCrawler {
  constructor(brandName, brandId) {
    this.brandName = brandName;
    this.brandId = Array.isArray(brandId) ? brandId : [brandId];
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
    this.dataManager = new DataManager();
    
    // 品牌专属配置
    this.brandConfig = {
      ...config,
      // 每个品牌可以有独立的配置
      crawler: {
        ...config.crawler,
        // 根据品牌复杂度调整配置
        concurrency: this.getBrandConcurrency(),
        timeout: this.getBrandTimeout(),
        // 确保图片采集功能启用
        blockImages: false, // 允许图片加载用于采集
        imageConcurrency: this.getImageConcurrency(),
        colorConcurrency: this.getColorConcurrency()
      }
    };
  }

  /**
   * 根据品牌特点调整并发数
   */
  getBrandConcurrency() {
    // 复杂品牌（车型多）使用较低并发
    const complexBrands = ['BYD', 'Tesla', 'BMW', 'Audi', 'Benz', 'Volkswagen', 'Toyota'];
    if (complexBrands.includes(this.brandName)) {
      return 1;
    }
    // 简单品牌可以使用更高并发
    return 2;
  }

  /**
   * 根据品牌特点调整超时时间
   */
  getBrandTimeout() {
    // 图片较多的豪华品牌需要更长超时
    const luxuryBrands = ['Ferrari', 'Lamborghini', 'RollsRoyce', 'Bentley', 'AstonMartin'];
    if (luxuryBrands.includes(this.brandName)) {
      return 90000; // 90秒
    }
    return config.crawler.timeout;
  }

  /**
   * 根据品牌特点调整图片采集并发数
   */
  getImageConcurrency() {
    // 豪华品牌图片质量高，采用较低并发
    const luxuryBrands = ['Ferrari', 'Lamborghini', 'RollsRoyce', 'Bentley', 'AstonMartin', 'McLaren'];
    if (luxuryBrands.includes(this.brandName)) {
      return 2;
    }
    return config.crawler.imageConcurrency || 3;
  }

  /**
   * 根据品牌特点调整色块采集并发数
   */
  getColorConcurrency() {
    // 复杂品牌使用较低并发
    const complexBrands = ['BYD', 'Tesla', 'BMW', 'Audi', 'Benz'];
    if (complexBrands.includes(this.brandName)) {
      return 1;
    }
    return config.crawler.colorConcurrency || 2;
  }

  /**
   * 爬取单个品牌数据（包含完整的图片采集）
   */
  async crawlBrand() {
    const startTime = Date.now();
    console.log(`🚗 开始爬取品牌: ${this.brandName} (ID: ${this.brandId.join(', ')})`);
    console.log(`📸 启用完整图片采集功能（外观图片、内饰图片、色块信息）`);
    
    try {
      // 检查现有数据
      const existingData = this.dataManager.checkExistingData(this.brandName);
      if (existingData.exists && existingData.hasData) {
        console.log(`🔄 品牌 ${this.brandName} 已存在数据，将更新数据`);
      }
      
      // 使用原系统的完整数据收集器（包含图片采集）
      console.log(`📊 开始采集品牌 ${this.brandName} 的完整数据...`);
      console.log(`   - 车型基本信息`);
      console.log(`   - 配置详细信息`);
      console.log(`   - 外观图片和色块`);
      console.log(`   - 内饰图片和色块`);
      
      const data = await this.dataCollector.collectCarData(this.brandName, this.brandId);
      
      // 验证数据完整性（包括图片数据）
      if (await this.validateBrandDataWithImages(data)) {
        // 保存数据
        const { changeSummary } = await this.dataManager.saveBrandData(this.brandName, data);
        
        // 统计图片采集结果
        const imageStats = this.calculateImageStats(data);
        
        // 记录爬取结果
        const duration = Math.round((Date.now() - startTime) / 1000);
        const result = {
          brand: this.brandName,
          timestamp: new Date().toISOString(),
          duration: `${duration}秒`,
          success: true,
          carCount: data.cars.length,
          changes: changeSummary,
          imageStats: imageStats
        };
        
        await this.saveResult(result);
        console.log(`✅ 品牌 ${this.brandName} 爬取完成，耗时 ${duration} 秒`);
        console.log(`   📊 车型数量: ${data.cars.length}`);
        console.log(`   🖼️ 图片统计: 外观${imageStats.exteriorImages}张, 内饰${imageStats.interiorImages}张, 色块${imageStats.colorBlocks}个`);
        console.log(`   📈 数据变更: 新增${changeSummary.counts.added}, 删除${changeSummary.counts.removed}, 更新${changeSummary.counts.updated}`);
        return result;
        
      } else {
        throw new Error(`品牌 ${this.brandName} 数据验证失败`);
      }
      
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000);
      const result = {
        brand: this.brandName,
        timestamp: new Date().toISOString(),
        duration: `${duration}秒`,
        success: false,
        error: error.message,
        carCount: 0,
        imageStats: { exteriorImages: 0, interiorImages: 0, colorBlocks: 0 }
      };
      
      await this.saveResult(result);
      console.error(`❌ 品牌 ${this.brandName} 爬取失败: ${error.message}`);
      throw error;
      
    } finally {
      // 清理资源
      await this.cleanup();
    }
  }

  /**
   * 验证品牌数据完整性（包括图片数据）
   */
  async validateBrandDataWithImages(data) {
    // 首先使用原有的验证逻辑
    const basicValidation = await this.dataManager.validateBrandData(this.brandName, data);
    if (!basicValidation) {
      console.warn(`⚠️ 品牌 ${this.brandName} 基础数据验证失败`);
      return false;
    }

    // 额外验证图片数据
    let hasImages = false;
    let totalConfigs = 0;
    let configsWithImages = 0;
    
    if (data.cars && data.cars.length > 0) {
      for (const car of data.cars) {
        if (car.configs && car.configs.length > 0) {
          for (const config of car.configs) {
            totalConfigs++;
            
            // 检查是否有外观图片或内饰图片
            const hasExterior = config.exteriorImages && config.exteriorImages.length > 0;
            const hasInterior = config.interiorImages && config.interiorImages.length > 0;
            
            if (hasExterior || hasInterior) {
              hasImages = true;
              configsWithImages++;
            }
          }
        }
      }
    }

    console.log(`📊 图片验证结果: ${configsWithImages}/${totalConfigs} 个配置包含图片数据`);
    
    if (!hasImages && totalConfigs > 0) {
      console.warn(`⚠️ 品牌 ${this.brandName} 所有配置都缺少图片数据，但基础数据验证通过`);
      // 不强制要求图片，但记录警告
    }

    return true;
  }

  /**
   * 计算图片统计信息
   */
  calculateImageStats(data) {
    let exteriorImages = 0;
    let interiorImages = 0;
    let colorBlocks = 0;
    let configsWithImages = 0;

    if (data.cars && data.cars.length > 0) {
      for (const car of data.cars) {
        if (car.configs && car.configs.length > 0) {
          for (const config of car.configs) {
            let hasImages = false;
            
            if (config.exteriorImages && config.exteriorImages.length > 0) {
              exteriorImages += config.exteriorImages.length;
              colorBlocks += config.exteriorImages.length; // 每个外观图片对应一个色块
              hasImages = true;
            }
            
            if (config.interiorImages && config.interiorImages.length > 0) {
              interiorImages += config.interiorImages.length;
              hasImages = true;
            }
            
            if (hasImages) {
              configsWithImages++;
            }
          }
        }
      }
    }

    return {
      exteriorImages,
      interiorImages,
      colorBlocks,
      configsWithImages
    };
  }

  /**
   * 保存爬取结果到日志
   */
  async saveResult(result) {
    try {
      const logDir = path.join(__dirname, 'logs', 'brands');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, `${this.brandName}.json`);
      
      // 读取现有日志
      let logs = [];
      if (fs.existsSync(logFile)) {
        try {
          logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (e) {
          logs = [];
        }
      }
      
      // 添加新记录
      logs.push(result);
      
      // 只保留最近100条记录
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }
      
      // 保存日志
      fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      console.warn(`⚠️ 保存爬取结果失败: ${error.message}`);
    }
  }

  /**
   * 获取品牌爬取历史
   */
  async getHistory() {
    try {
      const logFile = path.join(__dirname, 'logs', 'brands', `${this.brandName}.json`);
      if (fs.existsSync(logFile)) {
        return JSON.parse(fs.readFileSync(logFile, 'utf8'));
      }
      return [];
    } catch (error) {
      console.warn(`⚠️ 读取爬取历史失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取品牌状态信息
   */
  async getStatus() {
    const history = await this.getHistory();
    const lastRun = history[history.length - 1];
    const dataExists = this.dataManager.checkExistingData(this.brandName);
    
    // 计算图片统计
    let imageStats = { exteriorImages: 0, interiorImages: 0, colorBlocks: 0 };
    if (dataExists.content && dataExists.content.cars) {
      imageStats = this.calculateImageStats(dataExists.content);
    }
    
    return {
      brand: this.brandName,
      brandId: this.brandId,
      hasData: dataExists.hasData,
      carCount: dataExists.content?.cars?.length || 0,
      imageStats: imageStats,
      lastRun: lastRun?.timestamp || null,
      lastSuccess: history.filter(h => h.success).pop()?.timestamp || null,
      recentFailures: history.slice(-10).filter(h => !h.success).length,
      totalRuns: history.length
    };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      await this.browserManager.cleanup();
    } catch (error) {
      console.warn(`⚠️ 清理资源失败: ${error.message}`);
    }
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const brandName = process.argv[2];
  const brandId = process.argv[3];
  
  if (!brandName || !brandId) {
    console.error('用法: node brand-crawler-template.js <品牌名> <品牌ID>');
    console.error('示例: node brand-crawler-template.js BYD 16');
    process.exit(1);
  }
  
  const crawler = new BrandCrawler(brandName, parseInt(brandId));
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = BrandCrawler;
