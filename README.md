# DTB Calculator - 汽车报价计算器

一个现代化的汽车报价计算器，支持新车、二手车和新能源车的报价计算。

## 功能特性

### 🚗 支持车型
- **新车报价**：支持EXW、FOB、CIF等报价方式
- **二手车报价**：包含购置税、退税等复杂计算
- **新能源车报价**：支持购置税免征政策

### 💰 计算功能
- 实时汇率获取（支持USD、EUR、GBP）
- 自动计算购车成本、利润、最终报价
- 支持港杂费、海运费等国际运输费用
- 智能退税计算

### 🎨 用户体验
- 响应式设计，支持移动端
- 主题切换（新车蓝色、二手车橙色、新能源绿色）
- 车型智能搜索
- 搜索历史记录

## 项目结构

```
Car-Quote/
├── index.html              # 主页面
├── js/                     # JavaScript模块
│   ├── config.js           # 配置文件
│   ├── utils.js            # 工具函数
│   ├── api.js              # API服务
│   ├── calculator.js       # 计算器核心
│   ├── ui.js               # UI管理
│   └── main.js             # 主入口文件
├── data/                   # 车型数据
├── functions/              # Netlify函数
├── data-processor/         # 数据处理工具
└── README.md              # 项目说明
```

## 模块化设计

### 📁 js/config.js
配置文件，包含所有常量和配置项：
- API配置（汇率服务）
- 主题颜色配置
- 税率配置
- 货币配置
- 表单类型枚举

### 📁 js/utils.js
工具函数模块：
- 货币格式化函数
- 数字解析和验证
- 防抖和节流函数
- 本地存储工具
- 深拷贝等通用函数

### 📁 js/api.js
API服务模块：
- 汇率获取服务
- 车型数据获取
- 错误处理和重试机制
- 备用API支持

### 📁 js/calculator.js
计算器核心模块：
- 新车计算逻辑
- 二手车计算逻辑
- 新能源车计算逻辑
- 最终报价计算
- 利润计算

### 📁 js/ui.js
UI管理模块：
- 表单切换
- 主题管理
- 搜索功能
- 事件绑定
- 搜索历史管理

### 📁 js/main.js
主入口文件：
- 应用初始化
- 全局事件绑定
- 结果卡片管理
- 模块整合

## 技术栈

- **前端框架**：原生JavaScript (ES6+)
- **样式框架**：Tailwind CSS
- **图标库**：Font Awesome
- **字体**：Inter
- **部署平台**：Netlify

## 开发指南

### 本地开发
1. 克隆项目
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

### 模块开发
- 所有JavaScript代码都采用ES6模块化设计
- 使用import/export进行模块间通信
- 遵循单一职责原则
- 支持热重载开发

### 代码规范
- 使用ES6+语法
- 函数和变量使用驼峰命名
- 常量使用大写字母
- 添加适当的注释

## 部署

项目已配置Netlify部署：
- 自动构建和部署
- 支持函数服务
- CDN加速
- HTTPS支持

## 更新日志

### v2.0.0 (当前版本)
- ✅ 完成代码模块化重构
- ✅ 修复二手车和新能源车加价字段计算循环
- ✅ 优化汇率获取服务
- ✅ 改进搜索功能
- ✅ 增强错误处理

### v1.0.0
- 🎉 初始版本发布
- 🚗 支持新车报价计算
- 💰 集成汇率服务
- 🎨 响应式设计

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者：DTBKnight
- 项目链接：[https://github.com/DTBknight/Car-Quote](https://github.com/DTBknight/Car-Quote)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 