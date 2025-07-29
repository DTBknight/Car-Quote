const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 静态托管根目录下所有文件（如 index.html、js、css、图片等）
app.use(express.static(__dirname));

// 允许跨域，方便本地前端调试
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/cars', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: '读取数据目录失败' });
    
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'brands.json');
    const allCars = [];
    
    let processedFiles = 0;
    jsonFiles.forEach(file => {
      const filePath = path.join(dataDir, file);
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (!err) {
          try {
            const carData = JSON.parse(data);
            if (Array.isArray(carData)) {
              allCars.push(...carData);
            } else if (carData.cars && Array.isArray(carData.cars)) {
              allCars.push(...carData.cars);
            }
          } catch (parseErr) {
            console.error(`解析文件 ${file} 失败:`, parseErr);
          }
        }
        
        processedFiles++;
        if (processedFiles === jsonFiles.length) {
          res.json(allCars);
        }
      });
    });
  });
});

// 获取所有品牌列表
app.get('/api/brands', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: '读取数据目录失败' });
    
    const brands = files
      .filter(file => file.endsWith('.json') && file !== 'brands.json')
      .map(file => file.replace('.json', ''));
    
    res.json(brands);
  });
});

// 获取特定品牌的车数据
app.get('/api/brands/:brand', (req, res) => {
  const brand = req.params.brand;
  const dataPath = path.join(__dirname, 'data', `${brand}.json`);
  
  fs.readFile(dataPath, 'utf-8', (err, data) => {
    if (err) return res.status(404).json({ error: '品牌不存在' });
    
    try {
      const carData = JSON.parse(data);
      res.json(carData);
    } catch (parseErr) {
      res.status(500).json({ error: '数据格式错误' });
    }
  });
});

// 首页路由，返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 导出app实例供Vercel使用
module.exports = app;

// 只在非Vercel环境下启动服务器
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
} 