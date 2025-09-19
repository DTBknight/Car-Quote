#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const DataCollector = require('./data-collector');
const BrowserManager = require('./managers/browser-manager');

async function collectSingleCar(brandName, brandId, carId, carName) {
  console.log(`🚗 开始采集单个车型: ${carName} (ID: ${carId})`);
  
  const browserManager = new BrowserManager();
  const dataCollector = new DataCollector(browserManager);
  
  try {
    // 启动浏览器
    const browser = await browserManager.createBrowser();
    console.log('🌐 浏览器启动成功');
    
    // 采集车型数据
    console.log(`⚡ 开始采集车型 ${carId}...`);
    const carData = await dataCollector.collectSingleCarData(browser, carId, brandName);
    
    if (carData && carData.configs && carData.configs.length > 0) {
      console.log(`✅ 车型 ${carName} 采集成功 - ${carData.configs.length} 个配置`);
      
      // 读取现有的 Toyota.json 文件
      const outputFile = path.join(__dirname, '..', 'data', `${brandName}.json`);
      let existingData = { brand: brandName, cars: [] };
      
      if (fs.existsSync(outputFile)) {
        const fileContent = fs.readFileSync(outputFile, 'utf8');
        existingData = JSON.parse(fileContent);
      }
      
      // 检查是否已存在该车型
      const existingIndex = existingData.cars.findIndex(car => car.carId === carId);
      if (existingIndex >= 0) {
        // 替换现有车型数据
        existingData.cars[existingIndex] = carData;
        console.log(`🔄 已更新现有车型数据: ${carName}`);
      } else {
        // 添加新车型数据
        existingData.cars.push(carData);
        console.log(`➕ 已添加新车型数据: ${carName}`);
      }
      
      // 保存文件
      fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
      console.log(`💾 数据已保存到: ${outputFile}`);
      console.log(`📊 总车型数量: ${existingData.cars.length}`);
      
    } else {
      console.log(`❌ 车型 ${carName} 采集失败 - 无有效数据`);
    }
    
    // 关闭浏览器
    await browser.close();
    console.log('🧹 浏览器已关闭');
    
  } catch (error) {
    console.error(`💥 采集过程出错: ${error.message}`);
    console.error(error.stack);
  }
}

// 主函数
async function main() {
  const brandName = process.argv[2];
  const brandId = process.argv[3];
  const carId = parseInt(process.argv[4]);
  const carName = process.argv[5] || `车型${carId}`;
  
  if (!brandName || !brandId || !carId) {
    console.error('❌ 请提供品牌名称、品牌ID和车型ID');
    console.log('📋 用法: node collect-single-car.js <品牌名> <品牌ID> <车型ID> [车型名称]');
    console.log('📋 示例: node collect-single-car.js Toyota 5 5858 格瑞维亚');
    process.exit(1);
  }
  
  await collectSingleCar(brandName, brandId, carId, carName);
}

if (require.main === module) {
  main();
}
