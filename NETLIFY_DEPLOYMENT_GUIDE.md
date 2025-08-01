# Netlify Functions 部署指南

## 🎉 部署准备完成！

您的汽车报价系统已经准备好部署到Netlify Functions了！

## 📋 已完成的配置

### ✅ 文件结构
```
Car-Quote/
├── netlify/
│   └── functions/
│       └── generate-contract.js    # Netlify函数
├── netlify.toml                    # Netlify配置
├── js/
│   └── config-netlify.js          # Netlify配置文件
├── deploy-netlify.sh              # 部署脚本
└── ... (其他项目文件)
```

### ✅ 功能特性
- **前端**: 静态网站 (HTML/CSS/JS)
- **后端**: Netlify Functions (Node.js)
- **数据**: JSON静态文件
- **API**: 合同生成接口

## 🚀 部署步骤

### 第一步：登录Netlify
```bash
netlify login
```

### 第二步：运行部署脚本
```bash
./deploy-netlify.sh
```

### 第三步：手动部署（如果脚本有问题）
```bash
# 初始化项目（如果是第一次）
netlify init --manual

# 部署到生产环境
netlify deploy --prod
```

## 🌐 部署完成后的访问

### 网站地址
```
https://your-site-name.netlify.app
```

### API端点
```
GET  https://your-site-name.netlify.app/api/generate-contract  # 健康检查
POST https://your-site-name.netlify.app/api/generate-contract  # 合同生成
```

## 💰 成本分析

### 免费额度
- **函数调用**: 125,000次/月
- **带宽**: 100GB/月
- **构建时间**: 300分钟/月
- **总成本**: ¥0/月

### 使用估算
- **小规模使用**: 完全免费
- **中等规模**: 完全免费
- **大规模使用**: 超出免费额度后付费

## 🔧 管理命令

### 查看状态
```bash
netlify status
```

### 查看函数日志
```bash
netlify functions:logs
```

### 重新部署
```bash
netlify deploy --prod
```

### 本地测试
```bash
netlify dev
```

## 📊 性能特点

### 优势
- ✅ **完全免费**: 125K次调用/月
- ✅ **全球CDN**: 快速访问
- ✅ **自动HTTPS**: 安全连接
- ✅ **自动扩展**: 按需扩展
- ✅ **简单部署**: 一键部署

### 限制
- ⚠️ **冷启动**: 首次调用较慢
- ⚠️ **执行时间**: 最大10秒
- ⚠️ **内存限制**: 1024MB
- ⚠️ **文件大小**: 50MB限制

## 🎯 测试API

### 健康检查
```bash
curl -X GET "https://your-site-name.netlify.app/api/generate-contract"
```

### 合同生成测试
```bash
curl -X POST "https://your-site-name.netlify.app/api/generate-contract" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerName": "测试买家",
    "contractNumber": "TEST001",
    "buyerPhone": "13800138000",
    "buyerAddress": "测试地址"
  }'
```

## 🔄 更新和维护

### 代码更新
1. 修改代码
2. 提交到GitHub
3. 运行 `netlify deploy --prod`

### 函数更新
1. 修改 `netlify/functions/generate-contract.js`
2. 重新部署

### 配置更新
1. 修改 `netlify.toml`
2. 重新部署

## 🆘 故障排除

### 常见问题

1. **函数调用失败**
   ```bash
   # 查看日志
   netlify functions:logs
   ```

2. **CORS错误**
   - 检查 `netlify.toml` 中的CORS配置
   - 确认函数返回正确的CORS头

3. **部署失败**
   ```bash
   # 重新部署
   netlify deploy --prod
   ```

### 技术支持
- Netlify文档: https://docs.netlify.com/
- 函数文档: https://docs.netlify.com/functions/overview/
- 社区支持: https://community.netlify.com/

## 🎉 部署完成

恭喜！您的汽车报价系统已成功部署到Netlify Functions。

### 优势总结
- ✅ **零成本**: 完全免费
- ✅ **高性能**: 全球CDN
- ✅ **易维护**: 自动部署
- ✅ **可扩展**: 按需扩展
- ✅ **高可用**: 99.9%可用性

现在您可以开始为用户提供服务了！ 