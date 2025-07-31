# 🚀 部署指南

## 📋 部署方案

### 方案1：分离部署（推荐）

#### 前端部署到Netlify/GitHub Pages
```bash
# 1. 修改API地址为生产环境
# 在 js/contractManager.js 中修改API地址
const API_BASE_URL = 'https://your-backend-domain.com';

# 2. 部署到Netlify
# - 连接GitHub仓库
# - 构建命令：无（静态文件）
# - 发布目录：根目录

# 3. 部署到GitHub Pages
# - 在仓库设置中启用GitHub Pages
# - 选择main分支作为源
```

#### 后端部署到支持Python的平台
- **Heroku**：支持Python，免费额度有限
- **Railway**：支持Python，有免费额度
- **Render**：支持Python，有免费额度
- **Vercel**：支持Python函数
- **AWS/GCP/Azure**：云服务器

### 方案2：全栈平台部署

#### Vercel（推荐）
```bash
# 1. 创建vercel.json配置
{
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}

# 2. 将后端代码移到api/目录
# 3. 部署到Vercel
```

#### Railway
```bash
# 1. 连接GitHub仓库
# 2. 自动检测Python项目
# 3. 设置环境变量
# 4. 部署
```

### 方案3：Docker容器化

#### 创建Dockerfile
```dockerfile
# 多阶段构建
FROM python:3.9-slim as backend

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ .
EXPOSE 5001

CMD ["python", "app.py"]

# 前端构建
FROM nginx:alpine as frontend
COPY . /usr/share/nginx/html
EXPOSE 80
```

## 🔧 部署步骤

### 步骤1：准备环境变量
```bash
# 创建.env文件
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend-domain.com
```

### 步骤2：修改前端配置
```javascript
// 在 js/contractManager.js 中
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.com' 
  : 'http://localhost:5001';
```

### 步骤3：部署后端
```bash
# 选择平台并部署
# 获取后端URL
```

### 步骤4：部署前端
```bash
# 更新API地址
# 部署到Netlify/GitHub Pages
```

## 🌐 推荐的部署组合

### 免费方案
- **前端**：Netlify（免费）
- **后端**：Railway（免费额度）

### 生产方案
- **前端**：Netlify Pro
- **后端**：AWS EC2 或 Google Cloud Run

## 📝 注意事项

### 跨域问题
- 确保后端CORS配置正确
- 允许前端域名访问

### 文件存储
- 考虑使用云存储（AWS S3、Google Cloud Storage）
- 避免在服务器本地存储文件

### 安全性
- 添加API认证
- 限制文件大小
- 验证文件类型

## 🔗 相关链接

- [Netlify部署指南](https://docs.netlify.com/)
- [GitHub Pages部署](https://pages.github.com/)
- [Vercel部署指南](https://vercel.com/docs)
- [Railway部署指南](https://docs.railway.app/) 