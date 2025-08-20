# 汽车品牌爬虫拆分系统

本系统将原有的单体爬虫系统拆分为每个品牌独立的爬虫实例，提供更好的并发性、可靠性和可维护性。

## 🏗️ 系统架构

### 核心组件

1. **品牌爬虫模板** (`brand-crawler-template.js`)
   - 单个品牌爬虫的基础模板
   - 包含品牌专属配置和优化逻辑
   - 支持独立运行和状态管理

2. **品牌调度器** (`brand-scheduler.js`)
   - 管理和调度所有品牌爬虫
   - 支持并发控制和优先级调度
   - 提供失败重试和健康检查

3. **爬虫生成器** (`generate-brand-crawlers.js`)
   - 自动生成所有品牌的独立爬虫文件
   - 创建执行脚本和配置文件
   - 支持品牌特定的优化配置

4. **管理界面** (`crawler-management.js`)
   - 命令行管理界面
   - 提供运行、监控、日志查看等功能
   - 支持批量操作和状态查询

## 📦 文件结构

```
data-processor/
├── brand-crawler-template.js    # 品牌爬虫模板
├── brand-scheduler.js           # 品牌调度器
├── generate-brand-crawlers.js   # 爬虫生成器
├── crawler-management.js        # 管理界面
├── brand-crawlers/              # 生成的品牌爬虫文件夹
│   ├── byd-crawler.js          # 比亚迪爬虫
│   ├── tesla-crawler.js        # 特斯拉爬虫
│   └── ...                     # 其他品牌爬虫
├── logs/                       # 日志文件夹
│   ├── brands/                 # 品牌日志
│   ├── scheduler/              # 调度器日志
│   └── batch/                  # 批量执行日志
├── status/                     # 状态文件夹
└── scripts/                    # 执行脚本
    ├── run-all-brands.sh       # 批量执行脚本
    └── run-single-brand.sh     # 单品牌执行脚本
```

## 🚀 快速开始

### 1. 生成品牌爬虫

```bash
# 生成所有品牌的独立爬虫文件
node generate-brand-crawlers.js
```

### 2. 启动管理界面

```bash
# 启动交互式管理界面
node crawler-management.js
```

### 3. 运行单个品牌爬虫

```bash
# 方法1：使用管理界面
# 在管理界面中输入: run BYD

# 方法2：直接运行
node brand-crawlers/byd-crawler.js

# 方法3：使用执行脚本
./run-single-brand.sh BYD
```

### 4. 运行所有品牌爬虫

```bash
# 方法1：使用调度器（推荐）
node brand-scheduler.js

# 方法2：使用管理界面
# 在管理界面中输入: run-all

# 方法3：使用批量脚本
./run-all-brands.sh 3  # 并发数为3
```

## 🛠️ 管理界面使用

启动管理界面后，可以使用以下命令：

### 基础操作
- `help` - 显示帮助信息
- `list` - 列出所有品牌
- `list tesla` - 搜索包含"tesla"的品牌
- `status` - 显示所有品牌状态概览
- `status BYD` - 显示比亚迪详细状态

### 执行操作
- `run BYD` - 运行比亚迪品牌爬虫
- `run-batch BYD Tesla BMW` - 批量运行指定品牌
- `run-all` - 运行所有品牌爬虫
- `stop` - 停止所有运行中的爬虫

### 监控操作
- `monitor` - 实时监控爬虫状态
- `logs` - 查看调度器日志
- `logs BYD` - 查看比亚迪品牌日志
- `stats` - 显示系统统计信息

### 维护操作
- `generate` - 重新生成品牌爬虫文件
- `clean` - 清理日志文件
- `validate` - 验证系统设置

## ⚙️ 配置说明

### 品牌专属配置

每个品牌可以有独立的配置优化：

```javascript
// 豪华品牌（如Ferrari, Lamborghini）
{
  timeout: 120000,        // 2分钟超时
  imageWaitTime: 8000,    // 更长的图片等待时间
  pageWaitTime: 10000     // 更长的页面等待时间
}

// 复杂品牌（如BYD, Tesla, BMW）
{
  concurrency: 1,         // 单线程处理
  maxRetries: 8,          // 更多重试次数
  retryDelay: 5000        // 更长的重试延迟
}

// 新能源品牌（如Tesla, BYD, Nio）
{
  specialHandling: true,  // 启用特殊处理
  priceStrategy: 'new_energy'  // 新能源价格策略
}
```

### 调度器配置

```javascript
{
  maxConcurrent: 3,           // 最大并发品牌数
  retryAttempts: 3,           // 失败重试次数
  retryDelay: 60000,          // 重试延迟（1分钟）
  timeoutPerBrand: 1800000,   // 单个品牌最大运行时间（30分钟）
  priorityBrands: ['BYD', 'Tesla', 'BMW']  // 优先处理的品牌
}
```

## 📊 监控和日志

### 日志结构

每个品牌的运行记录保存在 `logs/brands/<品牌名>.json`：

```json
[
  {
    "brand": "BYD",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "duration": "120秒",
    "success": true,
    "carCount": 45,
    "changes": {
      "added": 2,
      "removed": 0,
      "updated": 3
    }
  }
]
```

### 调度器报告

调度器执行完成后生成详细报告：

```json
{
  "executionTime": "2024-01-01T12:00:00.000Z",
  "totalDuration": "3600秒",
  "summary": {
    "total": 134,
    "completed": 130,
    "failed": 4,
    "successRate": "97%"
  },
  "completedBrands": [...],
  "failedBrands": [...]
}
```

### 实时监控

使用 `monitor` 命令可以实时查看：
- 运行中的品牌数量
- 队列中等待的品牌
- 已完成和失败的统计
- 当前运行状态

## 🔧 故障排除

### 常见问题

1. **品牌爬虫启动失败**
   ```bash
   # 检查品牌名称是否正确
   node crawler-management.js
   # 在管理界面中输入: list
   ```

2. **生成器无法创建文件**
   ```bash
   # 检查目录权限
   chmod 755 data-processor/
   mkdir -p data-processor/brand-crawlers
   ```

3. **爬虫运行超时**
   ```bash
   # 查看品牌状态和日志
   node crawler-management.js
   # 在管理界面中输入: status <品牌名>
   # 在管理界面中输入: logs <品牌名>
   ```

### 重新初始化

如果需要完全重新初始化系统：

```bash
# 1. 清理现有文件
rm -rf brand-crawlers/ logs/ status/

# 2. 重新生成
node generate-brand-crawlers.js

# 3. 验证系统
node crawler-management.js
# 在管理界面中输入: validate
```

## 📈 性能优化

### 并发控制

- **调度器级别**：控制同时运行的品牌数量（默认3个）
- **品牌级别**：每个品牌内部的并发控制
- **配置级别**：图片采集的并发控制

### 品牌优先级

可以设置优先处理的品牌：
```javascript
priorityBrands: ['BYD', 'Tesla', 'BMW', 'Audi', 'Benz']
```

### 资源管理

- 自动清理浏览器资源
- 日志文件大小控制
- 失败重试机制
- 超时保护机制

## 🎯 与原系统对比

| 功能 | 原系统 | 拆分系统 |
|------|--------|----------|
| 架构 | 单体爬虫 | 分布式品牌爬虫 |
| 并发性 | 有限 | 高度并发 |
| 失败恢复 | 全局影响 | 品牌隔离 |
| 可维护性 | 复杂 | 简单清晰 |
| 监控 | 基础 | 丰富的监控和日志 |
| 扩展性 | 困难 | 易于扩展 |

## 🚀 未来扩展

1. **Web界面**：开发基于Web的管理界面
2. **API接口**：提供RESTful API用于集成
3. **分布式部署**：支持多机器分布式执行
4. **智能调度**：基于历史数据的智能调度算法
5. **数据分析**：更丰富的数据分析和报告功能

## 💡 最佳实践

1. **定期运行**：建议每天或每周定期运行所有品牌爬虫
2. **监控日志**：定期查看失败日志，及时处理问题
3. **资源清理**：定期清理过期的日志文件
4. **配置优化**：根据品牌特点调整专属配置
5. **备份数据**：重要数据及时备份

---

**注意事项**：
- 请确保有足够的系统资源支持并发执行
- 建议在运行前先测试几个品牌确保系统正常
- 注意网络稳定性，避免在网络不稳定时大规模运行 [[memory:6495681]]
