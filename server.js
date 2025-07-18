const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// 静态托管根目录下所有文件（如 index.html、js、css、图片等）
app.use(express.static(__dirname));

// 允许跨域，方便本地前端调试
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/cars', (req, res) => {
  const dataPath = path.join(__dirname, 'data', 'cars.json');
  fs.readFile(dataPath, 'utf-8', (err, data) => {
    if (err) return res.status(500).json({ error: '读取数据失败' });
    res.json(JSON.parse(data));
  });
});

// 首页路由，返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 