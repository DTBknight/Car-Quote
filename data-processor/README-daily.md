# 懂车帝每日新车采集工具

这是一个专门用于GitHub Actions的定时采集工具，用于自动采集懂车帝"在售"板块的新上市车型。

## 🚀 功能特性

- **自动检测新车型**: 识别新上市的车型
- **智能更新改款**: 检测现有车型的改款信息
- **品牌自动分类**: 根据车型名称自动分配到对应品牌
- **变更报告生成**: 生成详细的采集报告
- **GitHub Actions集成**: 支持定时自动执行

## 📋 页面元素分析

### 懂车帝页面结构

```javascript
// 分类容器
ul.category_list__2j98c
  ├── a.category_item__1bH-x (在售标签)

// 新车模块容器
section[data-log-view*="recent_car_module"]
  └── ul.new-car_new-car-list__26isX
      ├── li (车型项目)
          └── a[href*="/auto/series/"] (车型链接)
```

### 关键选择器

```css
/* 分类标签 */
.category_list__2j98c .category_item__1bH-x

/* 新车模块容器 */
section[data-log-view*="recent_car_module"]

/* 新车列表 */
.new-car_new-car-list__26isX

/* 车型链接 */
a[href*="/auto/series/"]
```

## 🛠️ 使用方法

### 1. 本地测试

```bash
cd data-processor
npm install puppeteer
node daily-crawler.js
```

### 2. GitHub Actions部署

1. 将代码推送到GitHub仓库
2. 在仓库设置中启用GitHub Actions
3. 工作流将每天北京时间上午9点自动执行

### 3. 手动触发

在GitHub仓库的Actions页面可以手动触发采集任务。

## 📊 采集逻辑

### 新车型检测
1. 访问懂车帝首页
2. 点击"在售"标签
3. 采集所有车型链接和ID
4. 与现有数据对比，识别新车型

### 改款车型更新
1. 通过车型ID匹配现有数据
2. 访问车型详情页面
3. 采集最新配置和参数信息
4. 更新现有车型数据

### 品牌分类
```javascript
const brandMapping = {
  '小鹏': 'Xpeng',
  '蔚来': 'Nio', 
  '理想': 'LiAuto',
  '极氪': 'Zeekr',
  // ... 更多品牌映射
};
```

## 📁 文件结构

```
data-processor/
├── daily-crawler.js          # 主采集脚本
├── package-daily.json        # 依赖配置
└── daily-report-YYYY-MM-DD.json # 采集报告

.github/workflows/
└── daily-crawl.yml           # GitHub Actions配置

data/
├── brands.json              # 品牌列表
├── Xpeng.json              # 品牌车型数据
├── Nio.json
└── ...
```

## 🔧 配置说明

### 采集参数
- **页面超时**: 30秒
- **等待时间**: 3-5秒
- **重试次数**: 3次
- **并发控制**: 单线程（避免被封）

### 错误处理
- 网络超时自动重试
- 页面加载失败回退策略
- 详细的错误日志记录

## 📈 报告格式

```json
{
  "timestamp": "2024-01-01T09:00:00.000Z",
  "summary": {
    "newCars": 5,
    "updatedCars": 3,
    "errors": 0
  },
  "newCars": [
    {
      "carId": "12345",
      "name": "小鹏G9",
      "brand": "Xpeng"
    }
  ],
  "updatedCars": [
    {
      "carId": "67890", 
      "name": "蔚来ES8",
      "brand": "Nio",
      "changes": ["configs", "price"]
    }
  ],
  "errors": []
}
```

## 🚨 注意事项

1. **反爬虫策略**: 使用随机延迟和用户代理轮换
2. **资源优化**: 禁用图片、CSS等非必要资源
3. **数据备份**: 每次更新前自动备份现有数据
4. **错误恢复**: 支持断点续传和错误重试

## 🔍 调试技巧

### 查看页面结构
```javascript
// 在浏览器控制台运行
console.log('分类容器:', document.querySelector('ul.category_list__2j98c'));
console.log('车型列表:', document.querySelector('ul.car-list_root__3bcdu'));
console.log('车型链接:', document.querySelectorAll('a[href*="/auto/series/"]'));
```

### 检查采集结果
```bash
# 查看最新报告
ls -la data-processor/daily-report-*.json | tail -1

# 查看品牌数据更新
git log --oneline -10
```

## 📞 技术支持

如有问题，请提交Issue或联系开发团队。
