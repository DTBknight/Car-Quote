#!/usr/bin/env node

console.log('🧪 开始GitHub Actions环境测试...');

// 测试基本环境
console.log('📋 环境信息:');
console.log('- Node.js版本:', process.version);
console.log('- 平台:', process.platform);
console.log('- 架构:', process.arch);
console.log('- 工作目录:', process.cwd());

// 测试依赖
try {
  console.log('\n📦 测试依赖...');
  
  const puppeteer = require('puppeteer');
  console.log('✅ Puppeteer加载成功');
  
  const pLimit = require('p-limit');
  console.log('✅ p-limit加载成功');
  
  const pRetry = require('p-retry');
  console.log('✅ p-retry加载成功');
  
  const pTimeout = require('p-timeout');
  console.log('✅ p-timeout加载成功');
  
  const cliProgress = require('cli-progress');
  console.log('✅ cli-progress加载成功');
  
  const colors = require('colors');
  console.log('✅ colors加载成功');
  
  const winston = require('winston');
  console.log('✅ winston加载成功');
  
  const userAgents = require('user-agents');
  console.log('✅ user-agents加载成功');
  
  const axios = require('axios');
  console.log('✅ axios加载成功');
  
  const cheerio = require('cheerio');
  console.log('✅ cheerio加载成功');
  
} catch (error) {
  console.error('❌ 依赖测试失败:', error.message);
  process.exit(1);
}

// 测试配置
try {
  console.log('\n⚙️ 测试配置...');
  const config = require('./config');
  console.log('✅ 配置加载成功');
  console.log('- 并发数:', config.crawler.concurrency);
  console.log('- 重试次数:', config.crawler.maxRetries);
  console.log('- 超时时间:', config.crawler.timeout);
} catch (error) {
  console.error('❌ 配置测试失败:', error.message);
  process.exit(1);
}

// 测试文件系统
try {
  console.log('\n📁 测试文件系统...');
  const fs = require('fs');
  const path = require('path');
  
  const dataDir = path.join(__dirname, '../data');
  if (fs.existsSync(dataDir)) {
    console.log('✅ 数据目录存在');
    const files = fs.readdirSync(dataDir);
    console.log('- 数据文件数量:', files.length);
  } else {
    console.log('⚠️ 数据目录不存在，将创建');
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (error) {
  console.error('❌ 文件系统测试失败:', error.message);
  process.exit(1);
}

console.log('\n🎉 GitHub Actions环境测试完成！');
console.log('所有依赖和配置都正常工作。'); 