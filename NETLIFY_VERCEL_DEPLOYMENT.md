# 🌐 Netlify前端 + Vercel后端混合部署指南

## 🎯 部署架构

```
用户浏览器
    ↓
Netlify (前端静态文件)
    ↓
Vercel (后端API函数)
    ↓
Excel文件生成和下载
```

## 📋 部署步骤

### 步骤1：部署Vercel后端

#### 1.1 准备Vercel项目
```bash
# 确保项目包含以下文件
api/
├── generate-contract.py    # Vercel函数
├── requirements.txt        # Python依赖
└── template.xlsx          # Excel模板

vercel.json                # Vercel配置
```

#### 1.2 部署到Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 连接GitHub仓库
3. 自动部署完成
4. 获取Vercel域名：`https://your-app.vercel.app`

#### 1.3 测试Vercel后端
```bash
# 测试健康检查
curl https://your-app.vercel.app/api/health

# 测试合同生成
curl -X POST https://your-app.vercel.app/api/generate-contract \
  -H "Content-Type: application/json" \
  -d '{"buyerName":"测试","contractNumber":"TEST001","goodsData":[]}'
```

### 步骤2：配置前端API地址

#### 2.1 修改配置文件
编辑 `js/config.js`：
```javascript
PRODUCTION: {
  BASE_URL: 'https://your-app.vercel.app', // 替换为您的Vercel域名
  ENDPOINTS: {
    GENERATE_CONTRACT: '/api/generate-contract',
    HEALTH: '/api/health'
  }
}
```

#### 2.2 更新Netlify配置
编辑 `netlify.toml`：
```toml
[[redirects]]
  from = "/api/*"
  to = "https://your-app.vercel.app/api/:splat"  # 替换为您的Vercel域名
  status = 200
  force = true
  headers = {Access-Control-Allow-Origin = "*"}
```

### 步骤3：部署Netlify前端

#### 3.1 部署到Netlify
1. 访问 [netlify.com](https://netlify.com)
2. 连接GitHub仓库
3. 设置：
   - **构建命令**：留空（静态文件）
   - **发布目录**：`.`（根目录）
4. 点击"部署站点"

#### 3.2 获取Netlify域名
- 自动生成：`https://random-name.netlify.app`
- 自定义域名：`https://your-domain.com`

## 🔧 配置说明

### 环境检测
```javascript
// 自动检测环境
const getEnvironment = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'DEVELOPMENT';  // 本地开发
  }
  return 'PRODUCTION';     // 生产环境
};
```

### API路由
```javascript
// 开发环境
http://localhost:5001/generate-contract

// 生产环境
https://your-app.vercel.app/api/generate-contract
```

### CORS配置
- **Vercel**：自动处理CORS
- **Netlify**：通过`netlify.toml`配置

## 🚀 优势

### Netlify优势
- ✅ 优秀的静态文件托管
- ✅ 全球CDN加速
- ✅ 自动HTTPS
- ✅ 免费额度充足
- ✅ 自定义域名支持

### Vercel优势
- ✅ 强大的后端函数支持
- ✅ 自动扩展
- ✅ 冷启动优化
- ✅ 免费额度充足
- ✅ 全球边缘网络

### 混合部署优势
- ✅ 最佳性能：前端静态文件 + 后端函数
- ✅ 成本优化：两个平台都有免费额度
- ✅ 扩展性：可以独立扩展前后端
- ✅ 灵活性：可以轻松切换后端服务

## 🔍 故障排除

### 常见问题

#### 1. CORS错误
```javascript
// 确保Vercel函数返回正确的CORS头
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

#### 2. API地址错误
```javascript
// 检查配置文件中的Vercel域名
BASE_URL: 'https://your-app.vercel.app'
```

#### 3. 文件下载失败
```javascript
// 确保Vercel函数返回正确的文件头
headers: {
  'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'Content-Disposition': 'attachment; filename="contract.xlsx"'
}
```

### 调试步骤
1. 检查浏览器控制台错误
2. 验证Vercel函数是否正常
3. 测试API端点是否可访问
4. 确认CORS配置正确

## 📊 性能优化

### 前端优化
- 静态文件CDN加速
- 图片压缩和优化
- 代码分割和懒加载

### 后端优化
- 函数冷启动优化
- 数据库连接池
- 缓存策略

## 🔐 安全考虑

### 生产环境安全
- 添加API认证
- 限制请求频率
- 验证文件类型
- 使用HTTPS

### 环境变量
```bash
# Vercel环境变量
FLASK_ENV=production
CORS_ORIGINS=https://your-netlify-domain.netlify.app

# Netlify环境变量
NODE_ENV=production
```

## 📈 监控和分析

### Vercel监控
- 函数执行时间
- 错误率统计
- 请求量监控

### Netlify分析
- 页面访问统计
- 性能指标
- 用户行为分析

## 🎉 部署完成

部署成功后，您的应用将具有：
- 🌐 全球CDN加速的前端
- ⚡ 高性能的后端API
- 📄 完整的合同生成功能
- 🔄 自动扩展能力

访问您的Netlify域名即可使用完整功能！ 