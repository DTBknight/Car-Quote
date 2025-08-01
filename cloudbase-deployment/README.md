# 腾讯云CloudBase一体化部署指南

## 概述

本项目已适配腾讯云CloudBase（云开发）平台，支持Flask后端 + 静态前端的一体化部署，无需搭建服务器。

## 项目结构

```
cloudbase-deployment/
├── cloudbaserc.json          # CloudBase配置文件
├── deploy.sh                  # 部署脚本
├── README.md                  # 说明文档
├── public/                    # 静态网站文件
│   ├── index.html            # 主页面
│   ├── js/                   # JavaScript文件
│   │   ├── app.js
│   │   ├── config.js         # API配置（已适配CloudBase）
│   │   ├── contractManager.js
│   │   └── ...
│   └── data/                 # 汽车数据
└── functions/                # 云函数
    └── api/                  # API云函数
        ├── main.py           # Flask应用入口
        ├── requirements.txt  # Python依赖
        └── template.xlsx     # 合同模板
```

## 部署步骤

### 1. 准备工作

#### 1.1 安装CloudBase CLI
```bash
npm install -g @cloudbase/cli
```

#### 1.2 登录腾讯云
```bash
tcb login
```

#### 1.3 创建CloudBase环境
1. 访问 [腾讯云CloudBase控制台](https://console.cloud.tencent.com/tcb)
2. 创建新的云开发环境
3. 记录环境ID（如：`car-quote-123456`）

### 2. 配置项目

#### 2.1 设置环境ID
```bash
export CLOUDBASE_ENV_ID=your-env-id
```

或者直接修改 `cloudbaserc.json` 中的 `envId` 字段。

#### 2.2 检查配置
确保以下文件存在且配置正确：
- `cloudbaserc.json` - CloudBase配置文件
- `functions/api/main.py` - Flask应用
- `functions/api/requirements.txt` - Python依赖
- `functions/api/template.xlsx` - 合同模板

### 3. 部署

#### 3.1 使用部署脚本（推荐）
```bash
cd cloudbase-deployment
./deploy.sh
```

#### 3.2 手动部署
```bash
# 部署云函数
tcb fn deploy api --force

# 部署静态网站
tcb hosting deploy public/ --force
```

### 4. 验证部署

#### 4.1 检查静态网站
访问：`https://your-env-id.service.tcloudbase.com`

#### 4.2 检查云函数
访问：`https://your-env-id.service.tcloudbase.com/api/health`

## 配置说明

### cloudbaserc.json
```json
{
  "envId": "your-env-id",
  "functionRoot": "./functions",
  "functions": [
    {
      "name": "api",
      "runtime": "Python3.9",
      "memory": 512,
      "timeout": 60
    }
  ],
  "staticRoot": "./public",
  "static": {
    "hosting": {
      "public": "./public"
    }
  }
}
```

### API配置
前端会自动检测环境并选择对应的API配置：

- **开发环境**: `localhost:5001`
- **CloudBase环境**: `https://your-env-id.service.tcloudbase.com`
- **Render环境**: `https://dbtknight.onrender.com`

## 优势对比

| 特性 | 当前方案 | CloudBase方案 |
|------|----------|---------------|
| **部署复杂度** | 需要两个平台 | 一体化部署 |
| **管理成本** | 分别管理 | 统一管理 |
| **域名管理** | 两个域名 | 统一域名 |
| **CDN加速** | Netlify CDN | 腾讯云CDN |
| **成本** | 免费额度 | 按量计费 |
| **扩展性** | 有限 | 自动扩缩容 |

## 成本估算

### CloudBase免费额度
- **静态网站托管**: 1GB存储，1GB流量/月
- **云函数**: 100万次调用/月
- **数据库**: 1GB存储

### 超出免费额度后的费用
- **静态网站**: ¥0.1/GB/月
- **云函数**: ¥0.0001/万次调用
- **数据库**: ¥0.1/GB/月

## 故障排除

### 常见问题

#### 1. 云函数部署失败
```bash
# 检查Python依赖
cd functions/api
pip install -r requirements.txt

# 重新部署
tcb fn deploy api --force
```

#### 2. 静态网站部署失败
```bash
# 检查文件权限
chmod -R 755 public/

# 重新部署
tcb hosting deploy public/ --force
```

#### 3. API调用失败
- 检查云函数是否正常部署
- 检查CORS配置
- 检查网络连接

### 日志查看
```bash
# 查看云函数日志
tcb fn log api

# 查看部署日志
tcb hosting log
```

## 迁移指南

### 从当前方案迁移到CloudBase

1. **备份当前数据**
   - 导出汽车数据
   - 备份配置文件

2. **部署到CloudBase**
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
   - 关注云函数调用次数
   - 监控存储使用量

3. **备份重要数据**
   - 定期备份汽车数据
   - 备份配置文件

## 联系支持

- **腾讯云CloudBase文档**: https://cloud.tencent.com/document/product/876
- **CloudBase CLI文档**: https://cloud.tencent.com/document/product/876/41391
- **技术支持**: 通过腾讯云控制台提交工单 