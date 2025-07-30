#!/usr/bin/env node

console.log('🔍 GitHub Actions 调试工具');
console.log('========================');

// 1. 环境信息检查
console.log('\n📋 1. 环境信息检查');
console.log('- Node.js版本:', process.version);
console.log('- 平台:', process.platform);
console.log('- 架构:', process.arch);
console.log('- 工作目录:', process.cwd());
console.log('- 环境变量 NODE_ENV:', process.env.NODE_ENV || '未设置');

// 2. 依赖检查
console.log('\n📦 2. 依赖检查');
try {
  const fs = require('fs');
  const path = require('path');
  
  // 检查package.json
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('✅ package.json存在');
    console.log('- 项目名称:', packageJson.name);
    console.log('- 版本:', packageJson.version);
    console.log('- Node.js要求:', packageJson.engines?.node || '未指定');
  } else {
    console.log('❌ package.json不存在');
  }
  
  // 检查package-lock.json
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    console.log('✅ package-lock.json存在');
    const stats = fs.statSync(packageLockPath);
    console.log('- 文件大小:', (stats.size / 1024).toFixed(2), 'KB');
    console.log('- 最后修改:', stats.mtime);
  } else {
    console.log('❌ package-lock.json不存在');
  }
  
  // 检查node_modules
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules存在');
    const stats = fs.statSync(nodeModulesPath);
    console.log('- 目录大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
  } else {
    console.log('❌ node_modules不存在');
  }
  
} catch (error) {
  console.error('❌ 文件系统检查失败:', error.message);
}

// 3. 依赖加载测试
console.log('\n🔧 3. 依赖加载测试');
const dependencies = [
  'puppeteer',
  'p-limit',
  'p-retry', 
  'p-timeout',
  'cli-progress',
  'colors',
  'winston',
  'user-agents',
  'axios',
  'cheerio'
];

dependencies.forEach(dep => {
  try {
    require(dep);
    console.log(`✅ ${dep} - 加载成功`);
  } catch (error) {
    console.log(`❌ ${dep} - 加载失败:`, error.message);
  }
});

// 4. 配置检查
console.log('\n⚙️ 4. 配置检查');
try {
  const config = require('./config');
  console.log('✅ 配置文件加载成功');
  console.log('- 并发数:', config.crawler.concurrency);
  console.log('- 重试次数:', config.crawler.maxRetries);
  console.log('- 超时时间:', config.crawler.timeout);
  console.log('- 生产环境:', config.production.enabled);
} catch (error) {
  console.error('❌ 配置文件加载失败:', error.message);
}

// 5. 文件系统权限检查
console.log('\n📁 5. 文件系统权限检查');
try {
  const fs = require('fs');
  const path = require('path');
  
  // 检查数据目录
  const dataDir = path.join(__dirname, '../data');
  if (fs.existsSync(dataDir)) {
    console.log('✅ 数据目录存在');
    try {
      const testFile = path.join(dataDir, 'test-write.json');
      fs.writeFileSync(testFile, '{"test": true}');
      fs.unlinkSync(testFile);
      console.log('✅ 数据目录写入权限正常');
    } catch (error) {
      console.log('❌ 数据目录写入权限失败:', error.message);
    }
  } else {
    console.log('⚠️ 数据目录不存在，尝试创建');
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ 数据目录创建成功');
    } catch (error) {
      console.log('❌ 数据目录创建失败:', error.message);
    }
  }
  
  // 检查日志目录
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('✅ 日志目录创建成功');
    } catch (error) {
      console.log('❌ 日志目录创建失败:', error.message);
    }
  } else {
    console.log('✅ 日志目录存在');
  }
  
} catch (error) {
  console.error('❌ 文件系统权限检查失败:', error.message);
}

// 6. 网络连接测试
console.log('\n🌐 6. 网络连接测试');
const https = require('https');

function testConnection(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${name} - 连接成功 (状态码: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${name} - 连接失败: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${name} - 连接超时`);
      req.destroy();
      resolve(false);
    });
  });
}

Promise.all([
  testConnection('https://www.npmjs.com', 'npm注册表'),
  testConnection('https://www.dongchedi.com', '目标网站'),
  testConnection('https://registry.npmjs.org', 'npm CDN')
]).then(() => {
  console.log('\n🎉 调试完成！');
  console.log('如果发现问题，请根据上述信息进行修复。');
});

// 7. 内存使用情况
console.log('\n💾 7. 内存使用情况');
const memUsage = process.memoryUsage();
console.log('- RSS内存:', (memUsage.rss / 1024 / 1024).toFixed(2), 'MB');
console.log('- 堆内存:', (memUsage.heapUsed / 1024 / 1024).toFixed(2), 'MB');
console.log('- 堆总内存:', (memUsage.heapTotal / 1024 / 1024).toFixed(2), 'MB'); 