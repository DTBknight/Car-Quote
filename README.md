# 汽车报价计算器 - DBT Messenger

这是一个基于 GitHub Actions 的DBT Messenger项目，自动收集车型信息并更新数据文件。

## 项目结构

```
├── frontend/                    # 前端文件 (GitHub Pages)
│   └── index.html              # 汽车报价计算器
├── dbt-messenger/              # DBT Messenger代码
│   ├── index.js                # DBT Messenger主文件
│   ├── config.js               # 配置文件
│   ├── anti-detection.js       # 反检测配置
│   ├── package.json            # DBT Messenger依赖
│   ├── env.example             # 环境变量示例
│   └── .gitignore              # Git忽略文件
├── data/                       # 数据文件
│   └── cars.json              # 车型数据
├── .github/
│   └── workflows/
│       └── dbt-messenger.yml  # GitHub Actions 配置
└── README.md
```

## 功能特点

- 🕷️ **自动收集**: 使用 Puppeteer 收集车型配置数据
- 🛡️ **反检测伪装**: 高级浏览器指纹伪装，避免被检测
- ⏰ **定时执行**: 每天凌晨2点自动执行DBT Messenger
- 🔄 **自动更新**: 收集完成后自动提交数据更新
- 🚀 **手动触发**: 支持手动触发DBT Messenger执行
- 📊 **数据去重**: 自动去除重复的车型配置数据
- 🔄 **多重策略**: 网页收集 + API接口双重数据获取
- 📋 **详细配置**: 获取车型名称、配置名称、指导价格、车型图片

## 如何使用

### 1. 设置 GitHub 仓库

1. 将代码推送到 GitHub 仓库
2. 确保仓库是公开的（GitHub Actions 需要访问权限）

### 2. 配置环境变量

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下环境变量：

- `TARGET_BASE_URL`: 目标网站的基础URL
- `TARGET_API_BASE_URL`: 目标网站的API基础URL

**示例配置：**
```
TARGET_BASE_URL=https://www.dongchedi.com
TARGET_API_BASE_URL=https://www.dongchedi.com
```

**本地测试时：**
创建 `dbt-messenger/.env` 文件并设置相同的环境变量。

### 3. 配置 GitHub Actions

GitHub Actions 会自动检测 `.github/workflows/dbt-messenger.yml` 文件并启用工作流。

### 4. 手动触发DBT Messenger

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "DBT Messenger - Car Data Collector" 工作流
4. 点击 "Run workflow" 按钮

### 5. 查看执行结果

- 在 Actions 页面查看执行日志
- 收集的数据会保存在 `data/cars.json` 文件中
- 每次执行后会自动提交数据更新

## 数据格式

收集的车型配置数据格式如下：

```json
{
  "id": 1,
  "carName": "比亚迪秦PLUS DM",
  "brand": "比亚迪",
  "configName": "2025款 智驾版 DM-i 55KM 领先型",
  "price": "79800元",
  "carImage": "车型图片URL",
  "category": "新能源车",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### 数据字段说明

- **carName**: 车型名称（如：比亚迪秦PLUS DM）
- **brand**: 品牌名称（如：比亚迪）
- **configName**: 具体配置名称（如：2025款 智驾版 DM-i 55KM 领先型）
- **price**: 指导价格（如：79800元）
- **carImage**: 车型图片URL
- **category**: 车型分类（新车/新能源车/二手车）

## 定时执行

DBT Messenger会在以下时间自动执行：

- **每天凌晨2点** (UTC时间)
- **代码更新时** (当 dbt-messenger 目录下的文件有更新)
- **手动触发时** (通过 GitHub Actions 界面)

## 反检测技术

本DBT Messenger采用了多种反检测技术：

1. **浏览器指纹伪装**: 
   - 删除 webdriver 属性
   - 伪装 navigator、screen、window 属性
   - 随机用户代理和视口大小

2. **行为模拟**:
   - 随机延迟和滚动行为
   - 模拟人类浏览习惯
   - 随机鼠标移动轨迹

3. **请求头伪装**:
   - 随机生成请求头
   - 模拟真实浏览器请求
   - 添加必要的安全头部

4. **多重数据源**:
   - 网页爬取 + API接口
   - 备用数据机制
   - 错误重试机制

## 注意事项

1. **反检测处理**: DBT Messenger已配置高级反检测技术，避免被检测
2. **数据备份**: 每次更新前会自动备份原有数据
3. **错误处理**: 如果某个品牌收集失败，会继续收集其他品牌
4. **资源优化**: 只加载必要的页面资源，提高收集速度
5. **频率控制**: 随机延迟避免请求过于频繁

## 本地测试

如果需要本地测试DBT Messenger：

1. 创建环境变量文件：
```bash
cd dbt-messenger
cp env.example .env
# 编辑 .env 文件，设置实际的目标网站URL
```

2. 安装依赖并运行：
```bash
npm install
npm test
```

或者运行开发模式：

```bash
npm run dev
```

## 故障排除

### DBT Messenger执行失败

1. 检查 GitHub Actions 日志
2. 确认网络连接正常
3. 检查目标网站是否有变化

### 数据未更新

1. 检查是否有新的车型数据
2. 确认DBT Messenger成功执行
3. 查看提交历史

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 许可证

MIT License 