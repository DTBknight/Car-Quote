const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 