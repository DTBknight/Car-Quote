const fs = require('fs');
const path = require('path');

// 清理脚本
function cleanData() {
  const dataDir = path.join(__dirname, '..', '..', 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log('📁 数据目录不存在，无需清理');
    return;
  }
  
  const files = fs.readdirSync(dataDir);
  let cleanedCount = 0;
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dataDir, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // 检查数据是否有效
        if (!content.cars || content.cars.length === 0) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ 删除无效文件: ${file}`);
          cleanedCount++;
        }
      } catch (e) {
        // 文件损坏，删除
        fs.unlinkSync(filePath);
        console.log(`🗑️ 删除损坏文件: ${file}`);
        cleanedCount++;
      }
    }
  }
  
  console.log(`✅ 清理完成，共删除 ${cleanedCount} 个文件`);
}

// 清理日志
function cleanLogs() {
  const logsDir = path.join(__dirname, '..', 'logs');
  
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    for (const file of files) {
      if (file.endsWith('.log')) {
        const filePath = path.join(logsDir, file);
        fs.unlinkSync(filePath);
        console.log(`🗑️ 删除日志文件: ${file}`);
      }
    }
  }
  
  console.log('✅ 日志清理完成');
}

// 主函数
function main() {
  const action = process.argv[2] || 'all';
  
  switch (action) {
    case 'data':
      cleanData();
      break;
    case 'logs':
      cleanLogs();
      break;
    case 'all':
      cleanData();
      cleanLogs();
      break;
    default:
      console.log('用法: node clean.js [data|logs|all]');
      console.log('  data  - 清理无效数据文件');
      console.log('  logs  - 清理日志文件');
      console.log('  all   - 清理所有文件（默认）');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanData, cleanLogs }; 