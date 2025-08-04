# 数据同步工具说明

## 概述

本项目已配置自动化数据同步任务，定期更新车型信息。

## 执行时间

- **频率**: 定期执行
- **时间**: 每周一凌晨0点 (UTC时间，北京时间上午8点)
- **触发方式**: 
  - 自动定时执行
  - 手动触发 (workflow_dispatch)

### 时间说明
- **UTC时间**: 每周一 00:00 (凌晨0点)
- **北京时间**: 每周一 08:00 (上午8点)
- **时差**: UTC+8 (北京时间比UTC快8小时)

## 文件结构

```
data-processor/
├── index-sync.js            # 数据同步主脚本
├── weekly-execution.log     # 执行日志
├── weekly-progress.json     # 执行进度
├── weekly-report-*.json     # 执行报告
└── DATA_SYNC_GUIDE.md       # 本文档
```

## 功能特点

### 1. 数据更新
- 定期处理所有品牌数据
- 确保数据最新
- 完整更新所有信息

### 2. 执行日志
- 记录执行过程
- 保存到 `weekly-execution.log`
- 包含时间戳和状态信息

### 3. 进度管理
- 保存执行进度到 `weekly-progress.json`
- 记录处理结果
- 包含最后执行时间

### 4. 执行报告
- 生成执行报告
- 包含处理统计信息
- 文件名格式: `weekly-report-YYYY-MM-DD.json`

## 配置参数

### 环境配置 (config.js)
```javascript
production: {
  enabled: process.env.NODE_ENV === 'production',
  skipExisting: false,        // 处理策略
  maxBrands: 100,             // 最大处理数量
  saveProgress: true,         // 保存进度
  progressFile: 'progress.json'
}
```

### 处理配置
```javascript
crawler: {
  concurrency: 8,             // 并发处理数
  maxRetries: 2,              // 最大重试次数
  timeout: 30000,             // 超时时间 (30秒)
  delays: {
    min: 500,                 // 最小延迟
    max: 1500                 // 最大延迟
  }
}
```

## 监控和维护

### 1. 查看执行状态
- 访问 GitHub Actions 页面
- 查看 `Data Sync Task` 工作流
- 检查执行日志和报告

### 2. 手动触发
```bash
# 在GitHub仓库页面
Actions > Data Sync Task > Run workflow

# 或使用npm脚本
npm run sync
```

### 3. 查看日志
```bash
# 查看执行日志
cat data-processor/weekly-execution.log

# 查看最新报告
ls -la data-processor/weekly-report-*.json
```

### 4. 检查数据更新
```bash
# 检查数据文件修改时间
ls -la data/*.json | head -10
```

## 故障排除

### 1. 执行失败
- 检查网络连接
- 查看错误日志
- 验证数据源可访问性

### 2. 数据不完整
- 检查失败记录
- 查看执行报告
- 考虑手动重试

### 3. 超时问题
- 调整延迟设置
- 减少并发数
- 分批处理数据

## 性能优化

### 1. 并发控制
- 当前并发数: 8
- 可根据服务器性能调整
- 避免对数据源造成压力

### 2. 延迟设置
- 最小延迟: 500ms
- 最大延迟: 1500ms
- 平衡速度和稳定性

### 3. 超时处理
- 请求超时: 30秒
- 自动重试: 2次
- 失败记录处理

## 注意事项

1. **资源使用**: 定期执行会消耗计算资源
2. **网络依赖**: 依赖数据源的可访问性
3. **数据质量**: 定期检查数据完整性
4. **存储空间**: 日志和报告文件会占用存储空间

## 联系信息

如有问题或建议，请通过GitHub Issues联系。 