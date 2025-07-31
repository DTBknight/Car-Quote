# 混合部署指南 - 前端Netlify + 后端Vercel

## 概述

本项目采用混合部署架构：
- **前端**: 部署在Netlify（静态文件托管）
- **后端**: 部署在Vercel（Serverless函数）

## 架构说明

### 前端 (Netlify)
- 静态文件：HTML、CSS、JavaScript
- 汽车数据文件：JSON格式的品牌和车型数据
- 通过重定向规则将API请求转发到Vercel后端

### 后端 (Vercel)
- **合同生成功能**: `api/generate-contract.py` (Python Flask)
- **数据API功能**: `functions/server.js` (Node.js Express)

## 部署步骤

### 1. 环境准备

```bash
# 安装Vercel CLI
npm i -g vercel

# 安装Netlify CLI
npm i -g netlify-cli

# 登录到Vercel
vercel login

# 登录到Netlify
netlify login
```

### 2. 自动部署

使用提供的部署脚本：

```bash
./deploy.sh
```

### 3. 手动部署

#### 部署后端到Vercel

```bash
# 部署到Vercel
vercel --prod

# 获取部署URL
vercel ls
```

#### 更新配置文件

将获取到的Vercel URL更新到以下文件：
- `js/config.js` - 前端API配置
- `netlify.toml` - Netlify重定向规则

#### 部署前端到Netlify

```bash
# 部署到Netlify
netlify deploy --prod
```

## 配置文件说明

### vercel.json
```json
{
  "version": 2,
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### netlify.toml
```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/api/*"
  to = "https://your-vercel-app.vercel.app/api/:splat"
  status = 200
  force = true
  headers = {Access-Control-Allow-Origin = "*"}

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### js/config.js
```javascript
PRODUCTION: {
  BASE_URL: 'https://your-vercel-app.vercel.app',
  ENDPOINTS: {
    GENERATE_CONTRACT: '/api/generate-contract',
    HEALTH: '/api/health'
  }
}
```

## API端点

### 合同生成
- **URL**: `https://your-vercel-app.vercel.app/api/generate-contract`
- **方法**: POST
- **功能**: 生成Excel格式的合同文件

### 数据API
- **URL**: `https://your-vercel-app.vercel.app/api/cars`
- **方法**: GET
- **功能**: 获取所有汽车数据

- **URL**: `https://your-vercel-app.vercel.app/api/brands`
- **方法**: GET
- **功能**: 获取品牌列表

## 故障排除

### Vercel部署错误
1. 检查Python依赖：确保`api/requirements.txt`包含所有必要依赖
2. 检查函数入口点：确保Python函数有正确的`handler`函数
3. 检查文件路径：确保模板文件`template.xlsx`存在

### CORS错误
1. 检查Vercel配置中的CORS头设置
2. 检查Netlify重定向规则
3. 确保前端配置中的API URL正确

### 网络错误
1. 检查Vercel函数是否正常部署
2. 检查Netlify重定向是否配置正确
3. 测试API端点是否可访问

## 监控和维护

### 查看Vercel日志
```bash
vercel logs [deployment-url]
```

### 查看Netlify日志
```bash
netlify logs
```

### 健康检查
访问 `https://your-vercel-app.vercel.app/api/health` 检查后端状态

## 优势

1. **成本优化**: 静态文件免费托管在Netlify，动态功能按需付费在Vercel
2. **性能优化**: 静态资源CDN分发，API就近访问
3. **扩展性**: 可以根据需求独立扩展前端和后端
4. **维护性**: 前后端分离，便于独立维护和更新 