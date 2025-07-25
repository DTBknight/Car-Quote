// 爬虫测试脚本
const { collectCarData } = require('./index');
const fs = require('fs');
const path = require('path');

async function testDBTMessenger() {
  console.log('🚀 开始测试DBT Messenger...');
  
  try {
    // 执行DBT Messenger
    await collectCarData();
    
    // 检查数据文件
    const dataPath = path.join(__dirname, '..', 'data', 'cars.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log(`✅ DBT Messenger测试成功！`);
      console.log(`📊 获取到 ${data.length} 个车型数据`);
      console.log(`📁 数据文件位置: ${dataPath}`);
      
      // 显示前5个车型配置
      console.log('\n📋 前5个车型配置数据:');
      data.slice(0, 5).forEach((car, index) => {
        console.log(`${index + 1}. ${car.brand} ${car.carName}`);
        console.log(`   配置: ${car.configName}`);
        console.log(`   价格: ${car.price}`);
        console.log('');
      });
      
    } else {
      console.log('❌ 数据文件未生成');
    }
    
  } catch (error) {
    console.error('❌ DBT Messenger测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  testDBTMessenger()
    .then(() => {
      console.log('\n🎉 测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testDBTMessenger }; 