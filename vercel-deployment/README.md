# Vercel一体化部署指南

## 概述

本项目已适配Vercel平台，支持Flask后端 + 静态前端的一体化部署，完全免费且无需搭建服务器。

## 项目结构

```
vercel-deployment/
├── vercel.json              # Vercel配置文件
├── README.md                # 说明文档
├── public/                  # 静态网站文件
│   ├── index.html          # 主页面
│   ├── js/                 # JavaScript文件
│   │   ├── app.js
│   │   ├── config.js       # API配置（已适配Vercel）
│   │   ├── contractManager.js
│   │   └── ...
│   └── data/               # 汽车数据
└── api/                    # 云函数
    ├── main.py             # Flask应用入口
    ├── requirements.txt    # Python依赖
    └── template.xlsx       # 合同模板
```

## 部署步骤

### 1. 准备工作

#### 1.1 安装Vercel CLI
```bash
npm install -g vercel
```

#### 1.2 登录Vercel
```bash
vercel login
```

### 2. 部署

#### 2.1 进入项目目录
```bash
cd vercel-deployment
```

#### 2.2 一键部署
```bash
vercel --prod
```

#### 2.3 或使用交互式部署
```bash
vercel
```

### 3. 验证部署

部署完成后，Vercel会提供以下地址：
- **生产环境**: `https://your-project.vercel.app`
- **预览环境**: `https://your-project-git-main.vercel.app`

## 配置说明

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/*.py",
      "use": "@vercel/python"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### API配置
前端会自动检测环境并选择对应的API配置：

- **开发环境**: `localhost:5001`
- **Vercel环境**: 自动使用当前域名
- **其他环境**: 使用Render后端

## 优势对比

| 特性 | 腾讯云CloudBase | Vercel |
|------|----------------|--------|
| **免费额度** | 需要激活HTTP服务 | 完全免费 |
| **部署复杂度** | 需要CLI工具 | 非常简单 |
| **全球CDN** | 腾讯云CDN | 全球CDN |
| **自动部署** | 需要配置 | GitHub自动部署 |
| **域名管理** | 需要配置 | 自动分配 |
| **开发者体验** | 一般 | 优秀 |

## 成本对比

### Vercel免费额度
- **静态网站**: 100GB带宽/月
- **云函数**: 1000万次调用/月
- **域名**: 自动分配，支持自定义
- **CDN**: 全球CDN加速

### 超出免费额度后的费用
- **带宽**: $20/100GB
- **函数调用**: $40/100万次
- **域名**: 免费

## 部署优势

1. **完全免费**: 免费额度足够个人和小型项目使用
2. **全球CDN**: 自动全球CDN加速
3. **自动部署**: 连接GitHub后自动部署
4. **简单易用**: 部署过程非常简单
5. **性能优秀**: 全球边缘网络，访问速度快

## 故障排除

### 常见问题

#### 1. 部署失败
```bash
# 检查Python依赖
cd api
pip install -r requirements.txt

# 重新部署
vercel --prod
```

#### 2. API调用失败
- 检查云函数是否正常部署
- 检查CORS配置
- 检查网络连接

#### 3. 静态文件404
- 检查文件路径是否正确
- 检查vercel.json配置

### 日志查看
```bash
# 查看部署日志
vercel logs

# 查看函数日志
vercel logs --function=api/main
```

## 迁移指南

### 从其他平台迁移到Vercel

1. **备份数据**
   - 导出汽车数据
   - 备份配置文件

2. **部署到Vercel**
   - 按照上述步骤部署
   - 测试功能完整性

3. **更新域名**
   - 配置自定义域名
   - 更新DNS记录

4. **切换流量**
   - 逐步切换用户流量
   - 监控系统稳定性

## 维护建议

1. **定期更新依赖**
   - 更新Python包
   - 更新前端库

2. **监控使用量**
   - 关注函数调用次数
   - 监控带宽使用量

3. **备份重要数据**
   - 定期备份汽车数据
   - 备份配置文件

## 联系支持

- **Vercel文档**: https://vercel.com/docs
- **Vercel CLI文档**: https://vercel.com/docs/cli
- **技术支持**: 通过Vercel控制台提交工单

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/your-username/Car-Quote.git

# 2. 进入Vercel部署目录
cd Car-Quote/vercel-deployment

# 3. 安装Vercel CLI
npm install -g vercel

# 4. 登录Vercel
vercel login

# 5. 部署
vercel --prod

# 6. 访问网站
# 部署完成后会显示访问地址
``` 