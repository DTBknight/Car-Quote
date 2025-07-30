# 🤖 爬虫自动化部署指南

## 🚀 自动化方案

### 1. GitHub Actions (推荐)

**优势:**
- ✅ 完全免费
- ✅ 与GitHub集成
- ✅ 支持定时任务
- ✅ 自动提交更新
- ✅ 详细的执行日志

**配置:**
- 每天凌晨2点自动运行
- 支持手动触发
- 自动安装Chrome和依赖
- 自动提交数据更新

**使用方法:**
1. 推送代码到GitHub
2. 在Actions页面查看运行状态
3. 数据会自动更新到仓库

### 2. 其他云平台方案

#### Vercel Cron Jobs
```bash
# 需要Vercel Pro账户
# 支持定时任务，但限制较多
```

#### Railway
```bash
# 付费服务
# 支持Node.js环境
# 有免费额度
```

#### Heroku
```bash
# 付费服务
# 支持定时任务
# 需要信用卡验证
```

## 📋 部署步骤

### GitHub Actions 部署

1. **推送代码**
```bash
git add .
git commit -m "添加GitHub Actions自动化"
git push
```

2. **启用Actions**
- 进入GitHub仓库
- 点击"Actions"标签
- 启用GitHub Actions

3. **查看运行状态**
- 在Actions页面查看工作流运行情况
- 查看详细日志和错误信息

### 手动触发

在GitHub Actions页面点击"Run workflow"按钮可以手动触发爬虫任务。

## ⚙️ 配置说明

### 环境变量
```bash
NODE_ENV=production  # 生产环境模式
```

### 定时配置
```yaml
# .github/workflows/crawler.yml
schedule:
  - cron: '0 18 * * *'  # 每天UTC 18:00 (北京时间凌晨2点)
```

### 生产环境配置
```javascript
// config.js
production: {
  enabled: true,
  skipExisting: true,    // 跳过已存在的品牌
  maxBrands: 50,         // 每次最多处理50个品牌
  saveProgress: true,    // 保存进度
  progressFile: 'progress.json'
}
```

## 📊 监控和日志

### 执行日志
- GitHub Actions提供详细的执行日志
- 包含每个步骤的输出信息
- 错误时会发送通知

### 数据统计
```bash
# 查看数据统计
npm run validate

# 生成详细报告
npm run validate report
```

### 进度跟踪
- 自动保存进度到 `progress.json`
- 支持断点续传
- 失败重试机制

## 🔧 故障排除

### 常见问题

1. **Chrome安装失败**
```bash
# 解决方案：使用系统Chrome
executablePath: '/usr/bin/google-chrome'
```

2. **内存不足**
```bash
# 解决方案：减少并发数
concurrency: 2
```

3. **超时问题**
```bash
# 解决方案：增加超时时间
timeout: 120000
```

### 调试方法

1. **本地测试**
```bash
npm run test
```

2. **查看日志**
```bash
tail -f logs/crawler.log
```

3. **验证数据**
```bash
npm run validate
```

## 📈 性能优化

### 并发控制
- 默认4个并发线程
- 可根据服务器性能调整

### 资源优化
- 拦截图片和样式表
- 使用无头模式
- 智能延迟

### 数据质量
- 自动过滤无价格车型
- 验证数据完整性
- 错误重试机制

## 🎯 最佳实践

1. **定期监控**
   - 检查GitHub Actions运行状态
   - 验证数据更新情况
   - 查看错误日志

2. **数据备份**
   - 重要数据定期备份
   - 使用Git版本控制
   - 保留历史版本

3. **性能调优**
   - 根据实际需求调整并发数
   - 优化延迟时间
   - 监控资源使用

4. **错误处理**
   - 设置合理的重试次数
   - 记录详细错误信息
   - 建立告警机制 