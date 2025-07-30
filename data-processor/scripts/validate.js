const fs = require('fs');
const path = require('path');

// 数据验证脚本
function validateData() {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('❌ 数据目录不存在');
    return;
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');
  let validCount = 0;
  let invalidCount = 0;
  let totalCars = 0;
  
  console.log('🔍 开始验证数据...\n');
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // 验证数据结构
      const isValid = validateBrandData(content, file);
      
      if (isValid) {
        validCount++;
        totalCars += content.cars.length;
        console.log(`✅ ${file}: ${content.cars.length} 个车型`);
      } else {
        invalidCount++;
        console.log(`❌ ${file}: 数据无效`);
      }
    } catch (e) {
      invalidCount++;
      console.log(`💥 ${file}: 文件损坏 - ${e.message}`);
    }
  }
  
  console.log('\n📊 验证结果:');
  console.log(`  有效文件: ${validCount}`);
  console.log(`  无效文件: ${invalidCount}`);
  console.log(`  总车型数: ${totalCars}`);
  console.log(`  平均每品牌: ${validCount > 0 ? Math.round(totalCars / validCount) : 0} 个车型`);
}

function validateBrandData(content, filename) {
  // 检查必需字段
  if (!content.brand && !content.name) {
    console.log(`  ⚠️ ${filename}: 缺少品牌名称`);
    return false;
  }
  
  if (!content.cars || !Array.isArray(content.cars)) {
    console.log(`  ⚠️ ${filename}: 缺少车型数组`);
    return false;
  }
  
  if (content.cars.length === 0) {
    console.log(`  ⚠️ ${filename}: 车型数组为空`);
    return false;
  }
  
  // 验证每个车型
  let validCars = 0;
  for (const car of content.cars) {
    if (validateCarData(car)) {
      validCars++;
    }
  }
  
  if (validCars === 0) {
    console.log(`  ⚠️ ${filename}: 没有有效车型`);
    return false;
  }
  
  if (validCars < content.cars.length) {
    console.log(`  ⚠️ ${filename}: ${content.cars.length - validCars} 个车型数据不完整`);
  }
  
  return true;
}

function validateCarData(car) {
  // 检查车型必需字段
  if (!car.carName) {
    return false;
  }
  
  if (!car.configs || !Array.isArray(car.configs) || car.configs.length === 0) {
    return false;
  }
  
  // 验证配置数据
  for (const config of car.configs) {
    if (!config.configName) {
      return false;
    }
  }
  
  return true;
}

// 生成验证报告
function generateReport() {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('❌ 数据目录不存在');
    return;
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');
  const report = {
    totalBrands: files.length,
    totalCars: 0,
    totalConfigs: 0,
    brands: []
  };
  
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
      const brandName = content.brand || content.name || file.replace('.json', '');
      
      const brandInfo = {
        name: brandName,
        file: file,
        carCount: content.cars ? content.cars.length : 0,
        configCount: 0,
        hasLogo: !!content.brandImage
      };
      
      if (content.cars) {
        for (const car of content.cars) {
          if (car.configs) {
            brandInfo.configCount += car.configs.length;
          }
        }
        report.totalCars += content.cars.length;
        report.totalConfigs += brandInfo.configCount;
      }
      
      report.brands.push(brandInfo);
    } catch (e) {
      console.log(`⚠️ 读取文件 ${file} 失败: ${e.message}`);
    }
  }
  
  // 保存报告
  const reportPath = path.join(dataDir, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('📊 数据统计报告:');
  console.log(`  品牌总数: ${report.totalBrands}`);
  console.log(`  车型总数: ${report.totalCars}`);
  console.log(`  配置总数: ${report.totalConfigs}`);
  console.log(`  平均每品牌车型: ${Math.round(report.totalCars / report.totalBrands)}`);
  console.log(`  平均每车型配置: ${Math.round(report.totalConfigs / report.totalCars)}`);
  console.log(`\n📄 详细报告已保存到: ${reportPath}`);
}

// 主函数
function main() {
  const action = process.argv[2] || 'validate';
  
  switch (action) {
    case 'validate':
      validateData();
      break;
    case 'report':
      generateReport();
      break;
    case 'all':
      validateData();
      console.log('\n' + '='.repeat(50) + '\n');
      generateReport();
      break;
    default:
      console.log('用法: node validate.js [validate|report|all]');
      console.log('  validate - 验证数据完整性');
      console.log('  report   - 生成统计报告');
      console.log('  all      - 验证并生成报告（默认）');
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateData, generateReport }; 