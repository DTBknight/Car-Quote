# 🚗 汽车数据爬虫 - 优化版本

## 📋 概述

这是一个优化的汽车数据爬虫系统，用于从汽车网站采集车型信息。相比原版本，优化版本具有更好的性能、稳定性和可维护性。

## ✨ 主要优化

### 🚀 性能优化
- **并发控制**: 使用 `p-limit` 控制并发数量，避免过载
- **智能重试**: 使用 `p-retry` 实现指数退避重试机制
- **超时控制**: 使用 `p-timeout` 防止请求卡死
- **资源拦截**: 智能拦截图片、样式表等静态资源，减少带宽使用

### 🛡️ 反爬虫优化
- **智能用户代理**: 动态生成真实的用户代理字符串
- **人类行为模拟**: 模拟鼠标移动、滚动等人类行为
- **请求头伪装**: 根据浏览器类型生成对应的请求头
- **指纹伪装**: 伪装浏览器指纹，避免被检测

### 🔧 架构优化
- **模块化设计**: 将功能拆分为独立模块，便于维护
- **配置集中化**: 所有配置集中在 `config.js` 中
- **错误处理**: 完善的错误处理和日志记录
- **数据验证**: 自动验证采集数据的完整性

### 📊 监控优化
- **进度显示**: 实时显示采集进度和剩余时间
- **数据统计**: 自动生成数据统计报告
- **日志记录**: 详细的日志记录，便于调试

## 📁 文件结构

```
data-processor/
├── index.js              # 原始版本
├── index-optimized.js    # 优化版本主文件
├── browser-manager.js    # 浏览器管理器
├── data-collector.js     # 数据收集器
├── data-manager.js       # 数据管理器
├── anti-detection.js     # 反爬虫模块
├── config.js             # 配置文件
├── package.json          # 依赖配置
├── scripts/
│   ├── clean.js          # 清理脚本
│   └── validate.js       # 验证脚本
└── README.md             # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd data-processor
npm install
```

### 2. 配置环境

复制环境变量文件：
```bash
cp env.example .env
```

编辑 `.env` 文件，配置相关参数：
```env
# 爬虫配置
MAX_CONCURRENCY=4
MAX_RETRIES=3
TIMEOUT=60000
MIN_DELAY=2000
MAX_DELAY=5000

# 浏览器配置
HEADLESS=true
NO_SANDBOX=true

# 资源拦截
BLOCK_IMAGES=true
BLOCK_STYLESHEETS=true
BLOCK_FONTS=true

# 数据验证
MIN_CARS_PER_BRAND=1
REQUIRE_IMAGES=false
REQUIRE_PRICES=false
```

### 3. 运行爬虫

#### 采集单个品牌
```bash
# 使用优化版本
node index-optimized.js BYD

# 使用原始版本
node index.js BYD
```

#### 采集所有品牌
```bash
# 使用优化版本
node index-optimized.js all

# 使用原始版本
node index.js all
```

#### 同步品牌列表
```bash
node index-optimized.js autoSyncBrands
```

### 4. 数据管理

#### 清理无效数据
```bash
npm run clean
# 或
node scripts/clean.js
```

#### 验证数据完整性
```bash
npm run validate
# 或
node scripts/validate.js
```

## 📊 性能对比

| 指标 | 原版本 | 优化版本 | 提升 |
|------|--------|----------|------|
| 并发数 | 4 | 4-8 | 100% |
| 重试机制 | 无 | 智能重试 | 新增 |
| 错误处理 | 基础 | 完善 | 显著 |
| 反爬能力 | 基础 | 高级 | 显著 |
| 数据验证 | 无 | 自动验证 | 新增 |
| 进度显示 | 无 | 实时进度 | 新增 |
| 日志记录 | 基础 | 详细 | 显著 |

## 🔧 配置说明

### 爬虫配置
- `MAX_CONCURRENCY`: 最大并发数（默认4）
- `MAX_RETRIES`: 最大重试次数（默认3）
- `TIMEOUT`: 请求超时时间（默认60秒）
- `MIN_DELAY`/`MAX_DELAY`: 请求间隔范围

### 浏览器配置
- `HEADLESS`: 是否无头模式（默认true）
- `NO_SANDBOX`: 是否禁用沙盒（默认true）

### 资源拦截
- `BLOCK_IMAGES`: 是否拦截图片（默认true）
- `BLOCK_STYLESHEETS`: 是否拦截样式表（默认true）
- `BLOCK_FONTS`: 是否拦截字体（默认true）

### 数据验证
- `MIN_CARS_PER_BRAND`: 每品牌最少车型数（默认1）
- `REQUIRE_IMAGES`: 是否要求图片（默认false）
- `REQUIRE_PRICES`: 是否要求价格（默认false）

## 📈 使用建议

### 1. 性能调优
- 根据网络环境调整 `MAX_CONCURRENCY`
- 根据目标网站调整 `MIN_DELAY`/`MAX_DELAY`
- 根据服务器性能调整 `TIMEOUT`

### 2. 反爬虫策略
- 定期更新用户代理列表
- 调整人类行为模拟参数
- 监控被反爬情况，及时调整策略

### 3. 数据质量
- 定期运行数据验证脚本
- 清理无效和重复数据
- 监控数据完整性

### 4. 错误处理
- 查看日志文件了解错误详情
- 根据错误类型调整重试策略
- 定期清理日志文件

## 🐛 常见问题

### Q: 爬虫被反爬怎么办？
A: 
1. 降低并发数和请求频率
2. 更新用户代理列表
3. 增加随机延迟
4. 使用代理IP

### Q: 数据采集不完整怎么办？
A: 
1. 检查网络连接
2. 增加重试次数
3. 调整超时时间
4. 运行数据验证脚本

### Q: 内存使用过高怎么办？
A: 
1. 降低并发数
2. 启用资源拦截
3. 定期清理浏览器实例
4. 分批处理大量数据

### Q: 如何监控爬虫状态？
A: 
1. 查看实时进度条
2. 检查日志文件
3. 运行数据验证脚本
4. 查看统计报告

## 📝 更新日志

### v2.0.0 (当前版本)
- ✅ 模块化重构
- ✅ 智能反爬虫策略
- ✅ 并发控制和重试机制
- ✅ 数据验证和清理
- ✅ 进度显示和日志记录
- ✅ 配置集中化管理

### v1.0.0 (原版本)
- ✅ 基础爬虫功能
- ✅ 简单反爬虫策略
- ✅ 数据保存功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## �� 许可证

MIT License 