# 🚀 Vercel部署指南

## 📋 部署步骤

### 步骤1：准备Vercel账户
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账户登录
3. 创建新项目

### 步骤2：连接GitHub仓库
1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 选择 `DTBknight/Car-Quote` 仓库
4. 点击 "Import"

### 步骤3：配置项目设置
1. **项目名称**：`car-quote` (或您喜欢的名称)
2. **框架预设**：选择 "Other"
3. **根目录**：`./` (保持默认)
4. **构建命令**：留空
5. **输出目录**：留空

### 步骤4：环境变量设置
在项目设置中添加以下环境变量：
```
FLASK_ENV=production
NODE_ENV=production
```

### 步骤5：部署
1. 点击 "Deploy"
2. 等待部署完成
3. 获取部署URL

## 🔧 部署后配置

### 验证部署
1. 访问健康检查端点：`https://your-project.vercel.app/api/health`
2. 应该返回：
```json
{
  "status": "healthy",
  "timestamp": "2025-08-01T00:00:00.000000",
  "message": "合同管理后端服务运行正常",
  "service": "Vercel Functions"
}
```

### 测试合同生成
1. 访问前端页面：`https://your-project.vercel.app`
2. 点击"合同"标签
3. 填写合同信息
4. 点击"生成合同Excel文件"
5. 验证文件下载

## 📁 项目结构

```
Car-Quote/
├── api/                    # Vercel函数目录
│   ├── generate-contract.py  # 合同生成API
│   ├── health.py            # 健康检查API
│   ├── requirements.txt     # Python依赖
│   └── template.xlsx        # Excel模板
├── js/                     # 前端JavaScript
├── index.html             # 主页面
├── vercel.json            # Vercel配置
└── README.md              # 项目说明
```

## 🌐 API端点

### 生产环境
- **健康检查**：`https://your-project.vercel.app/api/health`
- **合同生成**：`https://your-project.vercel.app/api/generate-contract`

### 开发环境
- **健康检查**：`http://localhost:5001/health`
- **合同生成**：`http://localhost:5001/generate-contract`

## 🔍 故障排除

### 常见问题

#### 1. 函数超时
- **原因**：Excel处理时间过长
- **解决**：Vercel函数有10秒超时限制，当前实现已优化

#### 2. 文件大小限制
- **原因**：Vercel有4MB响应限制
- **解决**：使用Base64编码和压缩

#### 3. 依赖问题
- **原因**：Python包未正确安装
- **解决**：检查 `api/requirements.txt`

#### 4. CORS错误
- **原因**：跨域请求被阻止
- **解决**：已配置CORS头

### 调试方法

#### 查看日志
1. 在Vercel仪表板中
2. 选择项目
3. 点击 "Functions" 标签
4. 查看函数日志

#### 本地测试
```bash
# 安装Vercel CLI
npm i -g vercel

# 本地运行
vercel dev
```

## 📊 性能优化

### 已实现的优化
- ✅ 使用临时文件避免磁盘存储
- ✅ Base64编码减少传输大小
- ✅ 自动清理临时文件
- ✅ 错误处理和日志记录

### 进一步优化建议
- 🔄 使用CDN缓存静态文件
- 🔄 实现文件压缩
- 🔄 添加请求缓存

## 🔐 安全考虑

### 已实现的安全措施
- ✅ 输入验证和清理
- ✅ 文件名安全处理
- ✅ CORS配置
- ✅ 错误信息过滤

### 建议的安全增强
- 🔒 添加API认证
- 🔒 限制请求频率
- 🔒 文件类型验证
- 🔒 环境变量加密

## 📈 监控和维护

### 监控指标
- 函数执行时间
- 错误率
- 请求量
- 内存使用

### 维护任务
- 定期更新依赖
- 监控日志
- 备份模板文件
- 性能优化

## 🎯 部署检查清单

- [ ] GitHub仓库已推送最新代码
- [ ] Vercel项目已创建
- [ ] 环境变量已配置
- [ ] 健康检查端点正常
- [ ] 合同生成功能正常
- [ ] 前端页面正常显示
- [ ] 文件下载功能正常
- [ ] 错误处理正常

## 📞 支持

如果遇到问题：
1. 检查Vercel函数日志
2. 验证API端点响应
3. 确认环境变量配置
4. 查看浏览器控制台错误

## 🔗 相关链接

- [Vercel文档](https://vercel.com/docs)
- [Vercel函数指南](https://vercel.com/docs/functions)
- [Python运行时](https://vercel.com/docs/functions/runtimes/python)
- [项目GitHub](https://github.com/DTBknight/Car-Quote) 