const fs = require('fs');
const path = require('path');
const config = require('./config');

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
    
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2));
    console.log(`✅ 品牌 ${brand} 数据已保存: ${data.cars.length} 个车型`);
    
    return filePath;
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