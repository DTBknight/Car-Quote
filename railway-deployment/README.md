# Railway 后端部署指南

## 概述

本项目使用Railway部署后端API，前端继续使用Netlify部署。

## 部署架构

```
部署架构
├── 后端 (Railway Python Flask应用)
│   ├── app.py (Flask应用)
│   ├── requirements.txt
│   └── api/template.xlsx
└── 前端 (Netlify静态网站)
    ├── index.html
    ├── js/
    └── data/
```

## 部署步骤

### 1. 准备工作

#### 1.1 安装Railway CLI
```bash
# 使用npm安装
npm install -g @railway/cli

# 或使用yarn安装
yarn global add @railway/cli
```

#### 1.2 登录Railway
```bash
railway login
```

### 2. 部署后端

#### 2.1 进入后端目录
```bash
cd railway-deployment/backend
```

#### 2.2 初始化Railway项目
```bash
railway init
```

#### 2.3 部署后端
```bash
railway up
```

#### 2.4 获取部署URL
```bash
railway domain
```

### 3. 更新前端配置

部署完成后，前端会自动使用Railway后端：

1. 前端配置文件 `js/config.js` 已更新
2. 生产环境自动使用Railway后端
3. 无需额外配置

## 验证部署

### 1. 测试后端API
```bash
# 健康检查
curl https://dbtknight-production.up.railway.app/health

# 测试合同API
curl https://dbtknight-production.up.railway.app/api/generate-contract
```

### 2. 测试前端网站
访问Netlify前端：`https://your-netlify-site.netlify.app`

## 成本估算

### Railway费用
- **免费额度**: $5/月
- **超出费用**: 按使用量计费
- **预估月费用**: $5-20/月

## 监控和维护

### 1. 查看日志
```bash
# 查看后端日志
cd railway-deployment/backend
railway logs
```

### 2. 性能监控
- 在Railway控制台查看服务状态
- 监控请求量和响应时间
- 设置告警规则

### 3. 更新部署
```bash
# 更新后端
cd railway-deployment/backend
railway up
```

## 故障排除

### 常见问题

#### 1. 部署失败
- 检查Python依赖是否正确
- 确认文件路径正确
- 查看部署日志

#### 2. API调用失败
- 检查后端服务是否正常运行
- 确认CORS配置
- 验证API端点

#### 3. 前端无法连接后端
- 检查前端配置中的API地址
- 确认后端服务正常运行
- 验证CORS设置

### 联系支持
- **Railway文档**: https://docs.railway.app/
- **技术支持**: 通过Railway控制台提交工单

## 优势对比

| 特性 | Railway后端 + Netlify前端 | 其他方案 |
|------|---------------------------|----------|
| **易用性** | 简单易用、快速部署 | 复杂 |
| **性能** | 全球CDN、自动扩缩容 | 一般 |
| **成本** | 免费额度、按量计费 | 固定费用 |
| **集成** | GitHub集成、自动部署 | 手动部署 |
| **支持** | 社区支持 | 企业支持 |

## 下一步

1. **配置域名**: 绑定自定义域名
2. **设置SSL**: 配置HTTPS证书
3. **优化性能**: 启用CDN缓存
4. **监控告警**: 配置详细的监控 