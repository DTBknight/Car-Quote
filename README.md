# Car-Quote 汽车报价计算器

一个支持新车、二手车、新能源车报价计算的Web应用。

## 项目结构

```
Car-Quote/
├── index.html              # 主页面（Netlify部署）
├── js/                     # 前端JavaScript模块
├── data/                   # 车辆数据
├── render-backend/         # Render后端API
│   ├── render.py          # 主应用文件
│   ├── render.yaml        # Render配置
│   ├── requirements.txt   # Python依赖
│   ├── runtime.txt        # Python版本
│   └── api/               # API模块
├── data-processor/         # 数据处理工具
├── netlify.toml           # Netlify配置
├── package.json           # Node.js配置
└── .netlifyignore         # Netlify忽略文件
```

## 部署方式

### 前端部署 (Netlify)
- **URL**: https://dbtknight.netlify.app/
- **文件**: 静态HTML/CSS/JS文件
- **配置**: `netlify.toml`, `package.json`

### 后端部署 (Render)
- **URL**: https://dbtknight.onrender.com/
- **文件**: `render-backend/` 目录下的Python文件
- **配置**: `render-backend/render.yaml`

## 功能特性

- ✅ 新车报价计算
- ✅ 二手车报价计算  
- ✅ 新能源车报价计算
- ✅ 实时汇率获取
- ✅ 合同生成功能
- ✅ 响应式设计

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Python, Flask
- **部署**: Netlify (前端), Render (后端)
- **数据**: JSON格式车辆数据

## 开发说明

1. 前端修改在根目录进行
2. 后端修改在 `render-backend/` 目录进行
3. 两个平台独立部署，互不影响 