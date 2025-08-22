// 智能断点续传管理器 - 增强版
const fs = require('fs');
const path = require('path');

class CheckpointManager {
  constructor(brand) {
    this.brand = brand;
    this.checkpointDir = path.join(__dirname, 'checkpoints');
    this.checkpointFile = path.join(this.checkpointDir, `${brand}-checkpoint.json`);
    this.ensureCheckpointDir();
    this.startTime = Date.now();
    this.maxExecutionTime = 3300000; // 55分钟
  }

  ensureCheckpointDir() {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  // 创建完整的车型ID追踪记录
  createCarIdTracking(carIds, carNames) {
    // 确保 carNames 是数组，并且长度与 carIds 匹配
    const safeCarNames = Array.isArray(carNames) ? carNames : [];
    
    // 确保所有状态都有初始值
    const summary = {
      pending: carIds.length,
      inProgress: 0,
      completed: 0,
      failed: 0,
      total: carIds.length
    };
    
    return {
      totalCarIds: carIds.length,
      carIdMapping: carIds.map((id, index) => ({
        carId: id,
        carName: (safeCarNames[index] && safeCarNames[index] !== undefined) ? safeCarNames[index] : `车型${id}`,
        status: 'pending', // pending, in_progress, completed, failed
        startTime: null,
        endTime: null,
        configCount: 0,
        imageCount: 0,
        errorMessage: null
      })),
      summary: summary
    };
  }

  // 更新车型采集状态
  updateCarStatus(carId, status, additionalData = {}) {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const checkpoint = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf8'));
        const carTracking = checkpoint.progress.carIdTracking;
        
        if (carTracking) {
          const carIndex = carTracking.carIdMapping.findIndex(car => car.carId === carId);
          if (carIndex !== -1) {
            const car = carTracking.carIdMapping[carIndex];
            const oldStatus = car.status;
            
            // 更新状态
            car.status = status;
            car.endTime = status === 'completed' || status === 'failed' ? new Date().toISOString() : null;
            
            // 更新其他数据
            Object.assign(car, additionalData);
            
            // 更新统计 - 添加安全检查
            if (oldStatus !== status) {
              // 安全地减少旧状态数量
              if (checkpoint.progress.summary && checkpoint.progress.summary.hasOwnProperty(oldStatus)) {
                checkpoint.progress.summary[oldStatus] = Math.max(0, (checkpoint.progress.summary[oldStatus] || 0) - 1);
              }
              // 安全地增加新状态数量
              if (checkpoint.progress.summary && checkpoint.progress.summary.hasOwnProperty(status)) {
                checkpoint.progress.summary[status] = (checkpoint.progress.summary[status] || 0) + 1;
              }
            }
            
            // 保存更新后的断点
            fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
            
            console.log(`📊 车型 ${carId} 状态更新: ${oldStatus} → ${status}`);
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 更新车型状态失败:', error.message);
      // 添加更详细的错误信息
      if (error.stack) {
        console.warn('错误堆栈:', error.stack.split('\n').slice(0, 3).join('\n'));
      }
    }
    return false;
  }

  // 保存断点（增强版，包含完整的车型ID追踪）
  saveCheckpoint(data, dataManager = null) {
    const checkpoint = {
      brand: this.brand,
      timestamp: new Date().toISOString(),
      progress: data,
      elapsedTime: Date.now() - this.startTime,
      // 新增：完整的车型ID追踪
      carIdTracking: data.carIdTracking || null,
      // 新增：数据完整性验证
      dataIntegrity: {
        totalCarIds: data.totalCarIds || 0,
        completedCarIds: data.completedCarIds || [],
        missingCarIds: data.missingCarIds || [],
        dataCompleteness: data.dataCompleteness || 0
      }
    };

    try {
      // 1. 保存断点文件
      fs.writeFileSync(this.checkpointFile, JSON.stringify(checkpoint, null, 2));
      console.log(`💾 断点已保存: ${data.completedCars}/${data.totalCars} 车型完成`);
      
      // 2. 显示详细进度
      if (data.carIdTracking) {
        const summary = data.carIdTracking.summary;
        console.log(`📊 详细进度: 待采集(${summary.pending}) | 进行中(${summary.inProgress}) | 已完成(${summary.completed}) | 失败(${summary.failed})`);
      }
      
      // 3. 如果有已采集的数据，立即保存到品牌JSON文件
      if (data.completedData && data.completedData.length > 0 && dataManager) {
        const partialBrandData = {
          brandInfo: data.brandInfo || { brand: this.brand },
          cars: data.completedData,
          isPartial: true, // 标记为部分数据
          lastUpdated: new Date().toISOString(),
          progress: {
            completed: data.completedCars,
            total: data.totalCars,
            percentage: Math.round((data.completedCars / data.totalCars) * 100)
          },
          // 新增：车型ID追踪信息
          carIdTracking: data.carIdTracking
        };
        
        dataManager.saveBrandData(this.brand, partialBrandData);
        console.log(`✅ 已采集数据已保存至 ${this.brand}.json (${data.completedData.length}个车型)`);
      }
    } catch (error) {
      console.warn('⚠️ 断点保存失败:', error.message);
    }
  }

  // 加载断点（增强版）
  loadCheckpoint() {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        const checkpoint = JSON.parse(fs.readFileSync(this.checkpointFile, 'utf8'));
        
        // 兼容新旧断点格式
        if (checkpoint.progress && checkpoint.progress.completedCars !== undefined) {
          console.log(`🔄 发现断点: ${checkpoint.progress.completedCars}/${checkpoint.progress.totalCars} 车型已完成`);
          
          // 显示详细状态
          if (checkpoint.carIdTracking) {
            const summary = checkpoint.carIdTracking.summary;
            console.log(`📊 断点状态: 待采集(${summary.pending}) | 进行中(${summary.inProgress}) | 已完成(${summary.completed}) | 失败(${summary.failed})`);
            
            // 显示待采集的车型ID
            const pendingCars = checkpoint.carIdTracking.carIdMapping.filter(car => car.status === 'pending');
            if (pendingCars.length > 0) {
              console.log(`🎯 待采集车型: ${pendingCars.map(car => `${car.carName}(${car.carId})`).join(', ')}`);
            }
          }
          
          return checkpoint.progress;
        } else {
          console.log('🔄 发现断点文件，但格式不兼容，将重新开始采集');
          return null;
        }
      }
    } catch (error) {
      console.warn('⚠️ 断点加载失败:', error.message);
    }
    return null;
  }

  // 验证数据完整性
  validateDataCompleteness(completedData, expectedCarIds) {
    const completedCarIds = completedData.map(car => car.carId);
    const missingCarIds = expectedCarIds.filter(id => !completedCarIds.includes(id));
    const dataCompleteness = Math.round((completedCarIds.length / expectedCarIds.length) * 100);
    
    return {
      completedCarIds,
      missingCarIds,
      dataCompleteness,
      isComplete: missingCarIds.length === 0
    };
  }

  // 生成数据完整性报告
  generateIntegrityReport(carIdTracking, completedData) {
    const expectedCarIds = carIdTracking.carIdMapping.map(car => car.carId);
    const integrity = this.validateDataCompleteness(completedData, expectedCarIds);
    
    console.log(`\n📋 数据完整性报告:`);
    console.log(`✅ 已完成: ${integrity.completedCarIds.length}/${expectedCarIds.length} (${integrity.dataCompleteness}%)`);
    
    if (integrity.missingCarIds.length > 0) {
      console.log(`❌ 缺失车型ID: ${integrity.missingCarIds.join(', ')}`);
      console.log(`⚠️ 数据不完整，需要继续采集`);
    } else {
      console.log(`🎉 所有车型数据采集完成！`);
    }
    
    return integrity;
  }

  // 删除断点（采集完成后）
  clearCheckpoint() {
    try {
      if (fs.existsSync(this.checkpointFile)) {
        fs.unlinkSync(this.checkpointFile);
        console.log('✅ 断点已清理');
      }
    } catch (error) {
      console.warn('⚠️ 断点清理失败:', error.message);
    }
  }

  // 检查是否应该停止（时间限制）
  shouldStop() {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxExecutionTime) {
      console.log('⏰ 达到最大执行时间限制，保存断点并退出');
      return true;
    }
    return false;
  }

  // 获取剩余时间
  getRemainingTime() {
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.maxExecutionTime - elapsed);
    return Math.floor(remaining / 1000 / 60); // 返回分钟数
  }

  // 创建进度数据（增强版）
  createProgressData(carIds, carNames, completedCarIds, completedData) {
    // 确保参数是安全的
    const safeCarNames = Array.isArray(carNames) ? carNames : [];
    const safeCompletedCarIds = Array.isArray(completedCarIds) ? completedCarIds : [];
    const safeCompletedData = Array.isArray(completedData) ? completedData : [];
    
    // 创建车型ID追踪
    const carIdTracking = this.createCarIdTracking(carIds, safeCarNames);
    
    // 验证数据完整性
    const dataIntegrity = this.validateDataCompleteness(safeCompletedData, carIds);
    
    return {
      totalCars: carIds.length,
      completedCars: safeCompletedCarIds.length,
      remainingCarIds: carIds.filter(id => !safeCompletedCarIds.includes(id)),
      remainingCarNames: safeCarNames.filter((name, idx) => !safeCompletedCarIds.includes(carIds[idx])),
      completedCarIds: safeCompletedCarIds,
      completedData: safeCompletedData,
      brandInfo: null, // 将在第一次保存时更新
      // 新增：车型ID追踪
      carIdTracking,
      // 新增：数据完整性信息
      dataIntegrity,
      // 新增：缺失的车型ID
      missingCarIds: dataIntegrity.missingCarIds
    };
  }

  // 生成优化的checkpoint格式（用于最终记录）
  generateOptimizedCheckpoint(brand, crawlSummary, carStatus, imageCollectionSummary, dataIntegrity, issues = [], recommendations = "") {
    const elapsedTime = Date.now() - this.startTime;
    const totalMinutes = Math.floor(elapsedTime / 1000 / 60);
    
    return {
      brand: brand,
      timestamp: new Date().toISOString(),
      crawlSummary: {
        totalCars: crawlSummary.totalCars,
        successCount: crawlSummary.successCount,
        failCount: crawlSummary.failCount,
        totalTime: `${totalMinutes}分钟`,
        successRate: `${crawlSummary.successRate}%`
      },
      carStatus: {
        completed: carStatus.completed || [],
        failed: carStatus.failed || [],
        missing: carStatus.missing || []
      },
      imageCollectionSummary: imageCollectionSummary || {
        totalExteriorColors: 0,
        totalInteriorColors: 0,
        exteriorColorTypes: [],
        interiorColorTypes: [],
        imageQuality: "未知",
        notes: "图片采集状态未知"
      },
      dataIntegrity: {
        isComplete: dataIntegrity.isComplete,
        completeness: `${dataIntegrity.dataCompleteness}%`,
        missingData: dataIntegrity.missingCarIds || [],
        notes: dataIntegrity.isComplete ? "所有车型数据采集完整" : "部分车型数据缺失，需要补采集"
      },
      issues: issues,
      recommendations: recommendations || (dataIntegrity.isComplete ? "数据完整，无需补采集" : "需要补采集缺失的车型数据")
    };
  }

  // 保存优化格式的checkpoint（用于最终记录）
  saveOptimizedCheckpoint(optimizedData) {
    try {
      const optimizedFile = this.checkpointFile.replace('.json', '-optimized.json');
      fs.writeFileSync(optimizedFile, JSON.stringify(optimizedData, null, 2));
      console.log(`📋 优化格式checkpoint已保存: ${optimizedFile}`);
      return true;
    } catch (error) {
      console.warn('⚠️ 保存优化格式checkpoint失败:', error.message);
      return false;
    }
  }

  // 分析图片采集情况
  analyzeImageCollection(completedData) {
    const exteriorColors = new Set();
    const interiorColors = new Set();
    let totalExteriorColors = 0;
    let totalInteriorColors = 0;

    completedData.forEach(car => {
      if (car.configs && Array.isArray(car.configs)) {
        car.configs.forEach(config => {
          if (config.exteriorImages && Array.isArray(config.exteriorImages)) {
            totalExteriorColors += config.exteriorImages.length;
            config.exteriorImages.forEach(img => {
              if (img.name) exteriorColors.add(img.name);
            });
          }
          if (config.interiorImages && Array.isArray(config.interiorImages)) {
            totalInteriorColors += config.interiorImages.length;
            config.interiorImages.forEach(img => {
              if (img.name) interiorColors.add(img.name);
            });
          }
        });
      }
    });

    return {
      totalExteriorColors,
      totalInteriorColors,
      exteriorColorTypes: Array.from(exteriorColors),
      interiorColorTypes: Array.from(interiorColors),
      imageQuality: completedData.length > 0 ? "完整" : "未知",
      notes: completedData.length > 0 ? "所有车型的外观色块和内饰色块图片均已采集完成" : "图片采集状态未知"
    };
  }

  // 生成车型状态摘要
  generateCarStatusSummary(completedData, failedData = []) {
    const completed = completedData.map(car => {
      let exteriorColorCount = 0;
      let interiorColorCount = 0;
      
      if (car.configs && Array.isArray(car.configs)) {
        car.configs.forEach(config => {
          if (config.exteriorImages) exteriorColorCount += config.exteriorImages.length;
          if (config.interiorImages) interiorColorCount += config.interiorImages.length;
        });
      }
      
      return {
        carId: car.carId,
        carName: car.carName || `车型${car.carId}`,
        configCount: car.configs ? car.configs.length : 0,
        exteriorColorCount,
        interiorColorCount,
        status: 'completed'
      };
    });

    const failed = failedData.map(car => ({
      carId: car.carId,
      carName: car.carName || `车型${car.carId}`,
      errorMessage: car.errorMessage || '未知错误',
      status: 'failed'
    }));

    return { completed, failed, missing: [] };
  }
}

module.exports = CheckpointManager;
