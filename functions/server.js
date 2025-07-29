const express = require('express');
const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');

const app = express();

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 获取所有汽车数据
app.get('/api/cars', (req, res) => {
  const dataDir = path.join(__dirname, '..', 'data');
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: '读取数据目录失败' });
    
    const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'brands.json');
    const allCars = [];
    
    let processedFiles = 0;
    if (jsonFiles.length === 0) {
      return res.json(allCars);
    }
    
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
  const dataDir = path.join(__dirname, '..', 'data');
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
  const dataPath = path.join(__dirname, '..', 'data', `${brand}.json`);
  
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

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports.handler = serverless(app); 