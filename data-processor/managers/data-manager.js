const fs = require('fs');
const path = require('path');
const config = require('../configs/config');

class DataManager {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async saveBrandData(brand, data) {
    const filePath = path.join(this.dataDir, `${brand}.json`);
    const result = { ...data.brandInfo, cars: data.cars };
    
    // 检查是否为更新操作
    const existingData = this.checkExistingData(brand);
    const isUpdate = existingData.exists && existingData.hasData;

    // 计算变更摘要
    const summarizeChanges = (oldContent, newContent) => {
      const oldCars = (oldContent && Array.isArray(oldContent.cars)) ? oldContent.cars : [];
      const newCars = Array.isArray(newContent.cars) ? newContent.cars : [];
      const toConfigSig = (c) => (c.configs || []).map(cfg => `${cfg.configName}::${cfg.price}`).sort();
      const oldMap = new Map(oldCars.map(c => [c.carName, toConfigSig(c)]));
      const newMap = new Map(newCars.map(c => [c.carName, toConfigSig(c)]));
      const oldNames = new Set(oldMap.keys());
      const newNames = new Set(newMap.keys());
      const addedCars = [...newNames].filter(n => !oldNames.has(n));
      const removedCars = [...oldNames].filter(n => !newNames.has(n));
      const updatedCars = [...newNames]
        .filter(n => oldNames.has(n))
        .filter(n => JSON.stringify(oldMap.get(n)) !== JSON.stringify(newMap.get(n)));
      return {
        addedCars,
        removedCars,
        updatedCars,
        counts: {
          added: addedCars.length,
          removed: removedCars.length,
          updated: updatedCars.length,
          total: newCars.length,
        }
      };
    };
    const changeSummary = summarizeChanges(existingData.content, result);
    
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    
    if (isUpdate) {
      console.log(`✅ 品牌 ${brand} 数据已更新: ${data.cars.length} 个车型 (新增 ${changeSummary.counts.added} / 删除 ${changeSummary.counts.removed} / 变更 ${changeSummary.counts.updated})`);
    } else {
      console.log(`✅ 品牌 ${brand} 数据已保存: ${data.cars.length} 个车型`);
    }
    
    return { filePath, changeSummary };
  }

  async validateBrandData(brand, data) {
    if (!data.cars || data.cars.length < config.validation.minCarsPerBrand) {
      console.warn(`⚠️ 品牌 ${brand} 车型数量不足: ${data.cars?.length || 0}`);
      return false;
    }
    
    return true;
  }

  async syncBrandsJson() {
    const files = fs.readdirSync(this.dataDir)
      .filter(f => f.endsWith('.json') && f !== 'brands.json');
    
    const brands = [];
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(this.dataDir, file), 'utf-8'));
        brands.push({
          name: content.brand || content.name || file.replace('.json',''),
          brandImage: content.brandImage || '',
          file: file
        });
      } catch (e) {
        console.error(`❌ 读取文件 ${file} 失败:`, e.message);
        continue;
      }
    }
    
    const brandsPath = path.join(this.dataDir, 'brands.json');
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    console.log(`✅ brands.json 已同步，包含 ${brands.length} 个品牌`);
    
    return brands;
  }

  checkExistingData(brand) {
    const filePath = path.join(this.dataDir, `${brand}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (content && content.cars && content.cars.length > 0) {
          return { exists: true, hasData: true, content };
        } else {
          return { exists: true, hasData: false, content };
        }
      } catch (e) {
        return { exists: true, hasData: false, content: null };
      }
    }
    return { exists: false, hasData: false, content: null };
  }
}

module.exports = DataManager; 