# Netlify 部署指南

## 概述

这个汽车报价系统已经配置为在 Netlify 上运行，包括：
- 静态网站托管
- Netlify Functions (API 服务)
- 自动部署

## 部署步骤

### 1. 连接 GitHub 仓库

1. 登录 [Netlify](https://netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub
4. 选择 `DTBknight/Car-Quote` 仓库

### 2. 配置构建设置

Netlify 会自动检测以下配置：

```toml
[build]
  publish = "."
  command = "npm install"

[build.environment]
  NODE_VERSION = "18"
```

### 3. 部署

点击 "Deploy site"，Netlify 将：
1. 安装依赖 (`npm install`)
2. 构建项目
3. 部署静态文件
4. 部署 Netlify Functions

## 项目结构

```
Car-Quote/
├── index.html              # 主页面
├── js/                     # JavaScript 模块
│   ├── app.js             # 主应用
│   ├── carSearch.js       # 搜索功能
│   ├── eventManager.js    # 事件管理
│   ├── calculationEngine.js # 计算引擎
│   ├── exchangeRate.js    # 汇率管理
│   ├── themeManager.js    # 主题管理
│   ├── utils.js           # 工具函数
│   └── config.js          # 配置
├── data/                   # 车型数据
│   ├── brands.json        # 品牌列表
│   ├── BMW.json           # 宝马车型
│   ├── Benz.json          # 奔驰车型
│   └── ...                # 其他品牌
├── functions/              # Netlify Functions
│   └── server.js          # API 服务器
├── netlify.toml           # Netlify 配置
└── package.json           # 项目依赖
```

## API 端点

部署后，以下 API 端点将可用：

- `GET /api/brands` - 获取所有品牌列表
- `GET /api/brands/:brandName` - 获取特定品牌的车型
- `GET /api/cars` - 获取所有车型数据
- `GET /api/health` - 健康检查

## 路由配置

### 静态文件
- `/data/*` - 车型数据文件
- `/js/*` - JavaScript 模块
- `/index.html` - 主页面

### API 路由
- `/api/*` → `/.netlify/functions/server`

### SPA 路由
- `/*` → `/index.html` (支持前端路由)

## 功能特性

### ✅ 已实现
- 车型搜索功能
- 表单切换 (新车/二手车/新能源车)
- FOB/CIF 报价类型切换
- 实时计算
- 汇率获取
- 主题切换
- 搜索历史记录

### 🔧 技术栈
- **前端**: HTML5, CSS3, JavaScript ES6+
- **样式**: Tailwind CSS
- **图标**: Font Awesome
- **后端**: Netlify Functions (Node.js)
- **数据**: JSON 文件

## 本地开发

### 启动本地服务器

```bash
# 安装依赖
npm install

# 启动 Netlify CLI (可选)
npm install -g netlify-cli
netlify dev
```

### 测试 API

```bash
# 测试品牌列表
curl https://your-site.netlify.app/api/brands

# 测试特定品牌
curl https://your-site.netlify.app/api/brands/宝马

# 测试所有车型
curl https://your-site.netlify.app/api/cars
```

## 故障排除

### 常见问题

1. **API 调用失败**
   - 检查 Netlify Functions 是否正常部署
   - 查看 Netlify 函数日志

2. **搜索功能不工作**
   - 确认数据文件已正确部署
   - 检查浏览器控制台错误

3. **页面加载缓慢**
   - 检查数据文件大小
   - 考虑启用缓存

### 日志查看

在 Netlify 控制台：
1. 进入你的站点
2. 点击 "Functions" 标签
3. 查看 `server` 函数的日志

## 更新部署

每次推送到 GitHub 主分支时，Netlify 会自动重新部署。

### 手动部署

```bash
# 使用 Netlify CLI
netlify deploy --prod
```

## 自定义域名

1. 在 Netlify 控制台进入站点设置
2. 点击 "Domain management"
3. 添加自定义域名
4. 配置 DNS 记录

## 性能优化

- 数据文件已压缩
- 使用内存缓存减少文件读取
- 支持浏览器缓存
- 图片使用 CDN

## 安全

- CORS 已配置
- 输入验证
- 错误处理
- 无敏感数据暴露

---

如有问题，请查看 [Netlify 文档](https://docs.netlify.com) 或提交 Issue。 