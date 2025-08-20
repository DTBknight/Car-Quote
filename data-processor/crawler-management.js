#!/usr/bin/env node

/**
 * 爬虫管理界面
 * 提供命令行界面来管理品牌爬虫
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');
const BrandScheduler = require('./brand-scheduler');
const BrandCrawler = require('./brand-crawler-template');
const { brandIdsMap } = require('./index-optimized');

class CrawlerManagement {
  constructor() {
    this.scheduler = new BrandScheduler();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.commands = {
      'help': this.showHelp.bind(this),
      'list': this.listBrands.bind(this),
      'status': this.showStatus.bind(this),
      'run': this.runBrand.bind(this),
      'run-all': this.runAllBrands.bind(this),
      'run-batch': this.runBatchBrands.bind(this),
      'stop': this.stopCrawlers.bind(this),
      'logs': this.showLogs.bind(this),
      'stats': this.showStats.bind(this),
      'clean': this.cleanLogs.bind(this),
      'monitor': this.monitorCrawlers.bind(this),
      'generate': this.generateCrawlers.bind(this),
      'validate': this.validateSetup.bind(this),
      'export': this.exportResults.bind(this),
      'exit': this.exit.bind(this)
    };
  }

  /**
   * 启动管理界面
   */
  async start() {
    console.log('🕷️ 汽车品牌爬虫管理系统');
    console.log('═══════════════════════════════════');
    console.log('输入 "help" 查看可用命令');
    console.log('输入 "exit" 退出系统');
    console.log('');
    
    await this.validateSetup();
    this.showPrompt();
  }

  /**
   * 显示提示符
   */
  showPrompt() {
    this.rl.question('爬虫管理 > ', async (input) => {
      await this.processCommand(input.trim());
      this.showPrompt();
    });
  }

  /**
   * 处理命令
   */
  async processCommand(input) {
    const [command, ...args] = input.split(' ');
    
    if (this.commands[command]) {
      try {
        await this.commands[command](args);
      } catch (error) {
        console.error(`❌ 命令执行失败: ${error.message}`);
      }
    } else if (input) {
      console.log(`❌ 未知命令: ${command}`);
      console.log('输入 "help" 查看可用命令');
    }
  }

  /**
   * 显示帮助信息
   */
  async showHelp() {
    console.log('📚 可用命令:');
    console.log('');
    console.log('📋 基础操作:');
    console.log('  help                    - 显示此帮助信息');
    console.log('  list [pattern]          - 列出所有品牌或匹配模式的品牌');
    console.log('  status [brand]          - 显示所有品牌或指定品牌状态');
    console.log('  validate                - 验证系统设置');
    console.log('');
    console.log('🚀 执行操作:');
    console.log('  run <brand>             - 运行指定品牌爬虫');
    console.log('  run-all                 - 运行所有品牌爬虫');
    console.log('  run-batch <brands...>   - 批量运行指定品牌');
    console.log('  stop                    - 停止所有运行中的爬虫');
    console.log('  generate                - 生成所有品牌爬虫文件');
    console.log('');
    console.log('📊 监控操作:');
    console.log('  monitor                 - 实时监控爬虫状态');
    console.log('  logs [brand]            - 查看日志');
    console.log('  stats                   - 显示统计信息');
    console.log('');
    console.log('🧹 维护操作:');
    console.log('  clean                   - 清理日志文件');
    console.log('  export                  - 导出结果数据');
    console.log('');
    console.log('💡 示例:');
    console.log('  run BYD                 - 运行比亚迪品牌爬虫');
    console.log('  run-batch BYD Tesla     - 批量运行比亚迪和特斯拉');
    console.log('  list tesla              - 查找包含"tesla"的品牌');
    console.log('  status BYD              - 查看比亚迪品牌状态');
    console.log('');
  }

  /**
   * 列出品牌
   */
  async listBrands(args) {
    const pattern = args[0];
    const brands = Object.keys(brandIdsMap);
    
    let filteredBrands = brands;
    if (pattern) {
      filteredBrands = brands.filter(brand => 
        brand.toLowerCase().includes(pattern.toLowerCase())
      );
    }
    
    console.log(`📋 品牌列表 ${pattern ? `(匹配: "${pattern}")` : ''}:`);
    console.log(`共 ${filteredBrands.length} 个品牌`);
    console.log('');
    
    filteredBrands.sort().forEach((brand, index) => {
      const id = brandIdsMap[brand];
      const idStr = Array.isArray(id) ? id.join(', ') : id;
      console.log(`${(index + 1).toString().padStart(3)}. ${brand.padEnd(15)} (ID: ${idStr})`);
    });
    console.log('');
  }

  /**
   * 显示状态
   */
  async showStatus(args) {
    const brandName = args[0];
    
    if (brandName) {
      await this.showBrandStatus(brandName);
    } else {
      await this.showAllStatus();
    }
  }

  /**
   * 显示单个品牌状态
   */
  async showBrandStatus(brandName) {
    if (!brandIdsMap[brandName]) {
      console.log(`❌ 未找到品牌: ${brandName}`);
      return;
    }
    
    try {
      const crawler = new BrandCrawler(brandName, brandIdsMap[brandName]);
      const status = await crawler.getStatus();
      const history = await crawler.getHistory();
      
      console.log(`📊 品牌状态: ${brandName}`);
      console.log('═══════════════════════════════════');
      console.log(`品牌ID: ${status.brandId.join(', ')}`);
      console.log(`数据状态: ${status.hasData ? '✅ 有数据' : '❌ 无数据'}`);
      console.log(`车型数量: ${status.carCount}`);
      console.log(`最后运行: ${status.lastRun || '从未运行'}`);
      console.log(`最后成功: ${status.lastSuccess || '从未成功'}`);
      console.log(`近期失败: ${status.recentFailures} 次`);
      console.log(`总运行次数: ${status.totalRuns}`);
      
      if (history.length > 0) {
        console.log('');
        console.log('📈 最近5次运行记录:');
        history.slice(-5).forEach((record, index) => {
          const statusIcon = record.success ? '✅' : '❌';
          const timestamp = new Date(record.timestamp).toLocaleString();
          console.log(`  ${statusIcon} ${timestamp} - ${record.duration} - ${record.carCount || 0} 车型`);
        });
      }
      
    } catch (error) {
      console.error(`❌ 获取品牌状态失败: ${error.message}`);
    }
  }

  /**
   * 显示所有品牌状态概览
   */
  async showAllStatus() {
    console.log('📊 所有品牌状态概览');
    console.log('═══════════════════════════════════');
    
    const brands = Object.keys(brandIdsMap);
    let hasDataCount = 0;
    let totalCarCount = 0;
    
    console.log('品牌'.padEnd(15) + '状态'.padEnd(8) + '车型数'.padEnd(8) + '最后运行');
    console.log('─'.repeat(50));
    
    for (const brandName of brands.slice(0, 20)) { // 只显示前20个，避免太长
      try {
        const crawler = new BrandCrawler(brandName, brandIdsMap[brandName]);
        const status = await crawler.getStatus();
        
        if (status.hasData) hasDataCount++;
        totalCarCount += status.carCount;
        
        const statusIcon = status.hasData ? '✅' : '❌';
        const lastRun = status.lastRun ? new Date(status.lastRun).toLocaleDateString() : '从未';
        
        console.log(
          brandName.padEnd(15) +
          statusIcon.padEnd(8) +
          status.carCount.toString().padEnd(8) +
          lastRun
        );
      } catch (error) {
        console.log(
          brandName.padEnd(15) +
          '⚠️'.padEnd(8) +
          '0'.padEnd(8) +
          '错误'
        );
      }
    }
    
    if (brands.length > 20) {
      console.log(`... 还有 ${brands.length - 20} 个品牌`);
    }
    
    console.log('─'.repeat(50));
    console.log(`📈 总计: ${hasDataCount}/${brands.length} 个品牌有数据，共 ${totalCarCount} 个车型`);
    console.log('');
  }

  /**
   * 运行单个品牌爬虫
   */
  async runBrand(args) {
    const brandName = args[0];
    
    if (!brandName) {
      console.log('❌ 请指定品牌名称');
      console.log('用法: run <品牌名>');
      return;
    }
    
    if (!brandIdsMap[brandName]) {
      console.log(`❌ 未找到品牌: ${brandName}`);
      console.log('输入 "list" 查看所有可用品牌');
      return;
    }
    
    console.log(`🚀 开始运行品牌爬虫: ${brandName}`);
    
    try {
      const crawler = new BrandCrawler(brandName, brandIdsMap[brandName]);
      const result = await crawler.crawlBrand();
      
      console.log('✅ 爬虫运行完成:');
      console.log(`   车型数量: ${result.carCount}`);
      console.log(`   耗时: ${result.duration}`);
      console.log(`   时间戳: ${result.timestamp}`);
      
    } catch (error) {
      console.error(`❌ 爬虫运行失败: ${error.message}`);
    }
  }

  /**
   * 运行所有品牌爬虫
   */
  async runAllBrands() {
    console.log('🚀 开始运行所有品牌爬虫...');
    console.log('这可能需要较长时间，建议使用调度器模式');
    
    // 询问确认
    const confirmed = await this.askConfirmation('确定要运行所有品牌爬虫吗？(y/N)');
    if (!confirmed) {
      console.log('❌ 操作已取消');
      return;
    }
    
    try {
      await this.scheduler.startScheduling();
    } catch (error) {
      console.error(`❌ 批量运行失败: ${error.message}`);
    }
  }

  /**
   * 批量运行指定品牌
   */
  async runBatchBrands(args) {
    if (args.length === 0) {
      console.log('❌ 请指定要运行的品牌');
      console.log('用法: run-batch <品牌1> <品牌2> ...');
      return;
    }
    
    // 验证品牌名称
    const invalidBrands = args.filter(brand => !brandIdsMap[brand]);
    if (invalidBrands.length > 0) {
      console.log(`❌ 未找到以下品牌: ${invalidBrands.join(', ')}`);
      return;
    }
    
    console.log(`🚀 开始批量运行 ${args.length} 个品牌爬虫...`);
    
    try {
      await this.scheduler.startScheduling(args);
    } catch (error) {
      console.error(`❌ 批量运行失败: ${error.message}`);
    }
  }

  /**
   * 停止爬虫
   */
  async stopCrawlers() {
    console.log('🛑 停止所有运行中的爬虫...');
    
    try {
      await this.scheduler.stopAllCrawlers();
      console.log('✅ 所有爬虫已停止');
    } catch (error) {
      console.error(`❌ 停止爬虫失败: ${error.message}`);
    }
  }

  /**
   * 显示日志
   */
  async showLogs(args) {
    const brandName = args[0];
    const logDir = path.join(__dirname, 'logs');
    
    if (brandName) {
      // 显示指定品牌日志
      const brandLogFile = path.join(logDir, 'brands', `${brandName}.json`);
      if (fs.existsSync(brandLogFile)) {
        const logs = JSON.parse(fs.readFileSync(brandLogFile, 'utf8'));
        console.log(`📋 ${brandName} 品牌日志 (最近10条):`);
        logs.slice(-10).forEach(log => {
          const statusIcon = log.success ? '✅' : '❌';
          const timestamp = new Date(log.timestamp).toLocaleString();
          console.log(`${statusIcon} ${timestamp} - ${log.duration} - ${log.carCount || 0} 车型`);
          if (log.error) {
            console.log(`    错误: ${log.error}`);
          }
        });
      } else {
        console.log(`❌ 未找到 ${brandName} 的日志文件`);
      }
    } else {
      // 显示调度器日志
      const schedulerLogDir = path.join(logDir, 'scheduler');
      if (fs.existsSync(schedulerLogDir)) {
        const files = fs.readdirSync(schedulerLogDir).sort().reverse();
        if (files.length > 0) {
          const latestReport = path.join(schedulerLogDir, files[0]);
          const report = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
          
          console.log(`📋 最新调度器报告 (${files[0]}):`);
          console.log(`执行时间: ${report.executionTime}`);
          console.log(`总耗时: ${report.totalDuration}`);
          console.log(`成功率: ${report.summary.successRate}`);
          console.log(`完成品牌: ${report.summary.completed}/${report.summary.total}`);
        }
      }
    }
  }

  /**
   * 显示统计信息
   */
  async showStats() {
    console.log('📊 爬虫系统统计信息');
    console.log('═══════════════════════════════════');
    
    const dataDir = path.join(__dirname, '..', 'data');
    const logDir = path.join(__dirname, 'logs');
    
    // 数据文件统计
    let dataFileCount = 0;
    let totalCarCount = 0;
    
    if (fs.existsSync(dataDir)) {
      const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');
      dataFileCount = dataFiles.length;
      
      dataFiles.forEach(file => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
          if (content.cars) {
            totalCarCount += content.cars.length;
          }
        } catch (e) {
          // 忽略读取错误
        }
      });
    }
    
    // 日志文件统计
    let logFileCount = 0;
    let totalRuns = 0;
    let successfulRuns = 0;
    
    const brandLogDir = path.join(logDir, 'brands');
    if (fs.existsSync(brandLogDir)) {
      const logFiles = fs.readdirSync(brandLogDir).filter(f => f.endsWith('.json'));
      logFileCount = logFiles.length;
      
      logFiles.forEach(file => {
        try {
          const logs = JSON.parse(fs.readFileSync(path.join(brandLogDir, file), 'utf8'));
          totalRuns += logs.length;
          successfulRuns += logs.filter(log => log.success).length;
        } catch (e) {
          // 忽略读取错误
        }
      });
    }
    
    console.log(`📁 数据文件: ${dataFileCount} 个`);
    console.log(`🚗 总车型数: ${totalCarCount} 个`);
    console.log(`📋 日志文件: ${logFileCount} 个`);
    console.log(`🎯 总运行次数: ${totalRuns} 次`);
    console.log(`✅ 成功运行: ${successfulRuns} 次`);
    console.log(`📈 成功率: ${totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0}%`);
    console.log('');
  }

  /**
   * 清理日志
   */
  async cleanLogs() {
    console.log('🧹 清理日志文件...');
    
    const confirmed = await this.askConfirmation('确定要清理所有日志文件吗？(y/N)');
    if (!confirmed) {
      console.log('❌ 操作已取消');
      return;
    }
    
    const logDir = path.join(__dirname, 'logs');
    
    try {
      if (fs.existsSync(logDir)) {
        const dirs = ['brands', 'scheduler', 'batch', 'single'];
        let cleanedCount = 0;
        
        dirs.forEach(dir => {
          const dirPath = path.join(logDir, dir);
          if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => {
              fs.unlinkSync(path.join(dirPath, file));
              cleanedCount++;
            });
          }
        });
        
        console.log(`✅ 已清理 ${cleanedCount} 个日志文件`);
      }
    } catch (error) {
      console.error(`❌ 清理日志失败: ${error.message}`);
    }
  }

  /**
   * 实时监控
   */
  async monitorCrawlers() {
    console.log('📡 启动实时监控模式...');
    console.log('按 Ctrl+C 退出监控');
    
    const statusFile = path.join(__dirname, 'status', 'scheduler-status.json');
    
    const monitor = setInterval(() => {
      console.clear();
      console.log('📡 爬虫系统实时监控');
      console.log('═══════════════════════════════════');
      console.log(`时间: ${new Date().toLocaleString()}`);
      console.log('');
      
      if (fs.existsSync(statusFile)) {
        try {
          const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          
          console.log(`🚀 运行中: ${status.running} 个`);
          console.log(`⏳ 队列中: ${status.queued} 个`);
          console.log(`✅ 已完成: ${status.completed} 个`);
          console.log(`❌ 失败: ${status.failed} 个`);
          console.log('');
          
          if (status.runningBrands.length > 0) {
            console.log('🚗 运行中的品牌:');
            status.runningBrands.forEach(brand => {
              console.log(`   • ${brand}`);
            });
          }
          
          if (status.queuedBrands.length > 0) {
            console.log('⏳ 队列中的品牌:');
            status.queuedBrands.slice(0, 5).forEach(brand => {
              console.log(`   • ${brand}`);
            });
            if (status.queuedBrands.length > 5) {
              console.log(`   ... 还有 ${status.queuedBrands.length - 5} 个`);
            }
          }
          
        } catch (error) {
          console.log('❌ 读取状态文件失败');
        }
      } else {
        console.log('ℹ️ 暂无活动的调度器');
      }
      
      console.log('');
      console.log('按 Ctrl+C 退出监控');
      
    }, 3000);
    
    // 监听退出信号
    process.once('SIGINT', () => {
      clearInterval(monitor);
      console.log('\n📡 监控已停止');
    });
  }

  /**
   * 生成爬虫文件
   */
  async generateCrawlers() {
    console.log('🏭 生成品牌爬虫文件...');
    
    try {
      const BrandCrawlerGenerator = require('./generate-brand-crawlers');
      const generator = new BrandCrawlerGenerator();
      
      const result = await generator.generateAllBrandCrawlers();
      console.log(`✅ 生成完成！成功: ${result.successCount}, 失败: ${result.failCount}`);
      
    } catch (error) {
      console.error(`❌ 生成失败: ${error.message}`);
    }
  }

  /**
   * 验证系统设置
   */
  async validateSetup() {
    const issues = [];
    
    // 检查必要文件
    const requiredFiles = [
      'brand-crawler-template.js',
      'brand-scheduler.js',
      'config.js',
      'browser-manager.js',
      'data-collector.js',
      'data-manager.js'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        issues.push(`❌ 缺少文件: ${file}`);
      }
    });
    
    // 检查必要目录
    const requiredDirs = ['logs', 'status'];
    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
        } catch (error) {
          issues.push(`❌ 无法创建目录: ${dir}`);
        }
      }
    });
    
    if (issues.length > 0) {
      console.log('⚠️ 系统验证发现问题:');
      issues.forEach(issue => console.log(issue));
      console.log('');
    } else {
      console.log('✅ 系统验证通过');
      console.log('');
    }
  }

  /**
   * 导出结果
   */
  async exportResults() {
    console.log('📤 导出结果数据...');
    
    // 这里可以实现数据导出逻辑
    console.log('ℹ️ 导出功能待实现');
  }

  /**
   * 请求确认
   */
  async askConfirmation(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * 退出系统
   */
  async exit() {
    console.log('👋 再见！');
    this.rl.close();
    process.exit(0);
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const management = new CrawlerManagement();
  management.start().catch(error => {
    console.error('💥 管理系统启动失败:', error.message);
    process.exit(1);
  });
}

module.exports = CrawlerManagement;
