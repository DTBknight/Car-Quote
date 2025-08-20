#!/usr/bin/env node

/**
 * 测试自动模式功能
 */

const BrandScheduler = require('./brand-scheduler');

async function testAutoMode() {
  console.log('🧪 测试分布式品牌爬虫自动模式...');
  
  // 设置环境变量模拟GitHub Actions
  process.env.AUTO_MODE = 'true';
  process.env.MAX_BRANDS_PER_SESSION = '5'; // 测试时只处理5个品牌
  
  const scheduler = new BrandScheduler();
  
  try {
    console.log('\n📋 测试进度管理功能...');
    
    // 测试加载进度
    const progress = scheduler.loadProgress();
    console.log('当前进度:', progress);
    
    // 测试获取下一批品牌
    const batchInfo = scheduler.getNextBrandBatch();
    console.log('下一批品牌信息:', {
      brandCount: batchInfo.brands.length,
      startIndex: batchInfo.startIndex,
      totalBrands: batchInfo.totalBrands,
      remainingBrands: batchInfo.remainingBrands
    });
    
    console.log('\n📦 当前批次品牌列表:');
    batchInfo.brands.forEach((brand, index) => {
      console.log(`  ${index + 1}. ${brand.name} (ID: ${brand.id})`);
    });
    
    console.log('\n✅ 自动模式测试完成');
    
    // 如果想要实际运行调度器，取消注释下面的代码
    // console.log('\n🚀 开始实际运行（测试模式）...');
    // await scheduler.startScheduling();
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testAutoMode();
}

module.exports = testAutoMode;
