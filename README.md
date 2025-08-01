# Car-Quote 汽车报价计算器

一个现代化的汽车报价计算器，支持新车、二手车和新能源车的价格计算。

## 🏗️ 项目结构

```
Car-Quote/
├── index.html              # 主页面
├── js/                     # JavaScript文件
│   ├── app.js             # 主应用逻辑
│   ├── config.js          # 配置文件
│   ├── calculationEngine.js # 计算引擎
│   └── ...
├── data/                   # 车辆数据
│   ├── brands.json        # 品牌数据
│   └── ...                # 各品牌车型数据
├── railway-deployment/     # Railway后端部署
│   ├── backend/           # 后端代码
│   └── README.md          # 部署指南
├── netlify.toml           # Netlify配置
└── README.md              # 项目说明
```

## 🚀 快速开始

### 本地开发
1. 克隆仓库
```bash
git clone https://github.com/DTBknight/Car-Quote.git
cd Car-Quote
```

2. 启动本地服务器
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .
```

3. 访问 http://localhost:8000

## 🌐 在线部署

### 生产环境
- **前端**: https://car-quote-dtbknight.netlify.app
- **后端**: https://dbtknight-production.up.railway.app
- **部署**: Netlify (前端), Railway (后端)

## 📝 开发指南

1. 前端修改在根目录进行
2. 后端修改在 `railway-deployment/backend/` 目录进行
3. 提交代码后自动部署

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Python Flask
- **部署**: Netlify (前端), Railway (后端)
- **数据**: JSON格式的车辆数据

## �� 许可证

MIT License 