const express = require('express');
const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');

const app = express();

// 内存缓存
let brandsCache = null;
let carsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 获取所有汽车数据
app.get('/api/cars', async (req, res) => {
  // 检查缓存
  const now = Date.now();
  if (carsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json(carsCache);
  }

  try {
    // 首先获取品牌列表
    const brandsPath = path.join(__dirname, '..', 'data', 'brands.json');
    const brandsData = fs.readFileSync(brandsPath, 'utf8');
    const brands = JSON.parse(brandsData);
    
    // 并行读取所有品牌文件
    const readPromises = brands.map(async (brand) => {
      try {
        const brandPath = path.join(__dirname, '..', 'data', brand.file);
        if (!fs.existsSync(brandPath)) {
          console.error(`文件不存在: ${brand.file}`);
          return [];
        }
        
        const data = fs.readFileSync(brandPath, 'utf8');
        const carData = JSON.parse(data);
        
        if (Array.isArray(carData)) {
          return carData.map(car => ({
            ...car,
            brand: brand.name,
            brandImage: brand.image
          }));
        } else if (carData.cars && Array.isArray(carData.cars)) {
          return carData.cars.map(car => ({
            ...car,
            brand: carData.brand || brand.name,
            brandImage: carData.brandImage || brand.image
          }));
        }
        return [];
      } catch (err) {
        console.error(`解析文件 ${brand.file} 失败:`, err);
        return [];
      }
    });

    const results = await Promise.all(readPromises);
    const allCars = results.flat();

    // 更新缓存
    carsCache = allCars;
    cacheTimestamp = now;
    
    res.json(allCars);
  } catch (err) {
    console.error('读取所有汽车数据失败:', err);
    res.status(500).json({ error: '读取数据失败' });
  }
});

// 获取所有品牌列表
app.get('/api/brands', async (req, res) => {
  // 检查缓存
  const now = Date.now();
  if (brandsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return res.json(brandsCache);
  }

  try {
    // 从本地文件读取brands.json
    const brandsPath = path.join(__dirname, '..', 'data', 'brands.json');
    const brandsData = fs.readFileSync(brandsPath, 'utf8');
    const brands = JSON.parse(brandsData);
    
    // 更新缓存
    brandsCache = brands;
    cacheTimestamp = now;
    
    res.json(brands);
  } catch (err) {
    console.error('读取brands.json失败:', err);
    res.status(500).json({ error: '读取品牌数据失败' });
  }
});

// 获取特定品牌的车数据
app.get('/api/brands/:brand', async (req, res) => {
  const brand = req.params.brand;
  const { page = 1, limit = 20, search = '' } = req.query;
  
  try {
    // 首先从本地文件获取brands.json
    const brandsPath = path.join(__dirname, '..', 'data', 'brands.json');
    const brandsData = fs.readFileSync(brandsPath, 'utf8');
    const brands = JSON.parse(brandsData);
    
    // 查找匹配的品牌
    const brandInfo = brands.find(b => b.name === brand);
    if (!brandInfo) {
      return res.status(404).json({ error: '品牌不存在' });
    }
    
    // 从本地文件获取品牌数据
    const brandPath = path.join(__dirname, '..', 'data', brandInfo.file);
    if (!fs.existsSync(brandPath)) {
      return res.status(404).json({ error: '品牌数据文件不存在' });
    }
    
    const data = fs.readFileSync(brandPath, 'utf8');
    const carData = JSON.parse(data);
    
    // 保持原始数据结构，添加品牌信息
    const result = {
      brand: brand,
      brandImage: carData.brandImage || brandInfo.image || '',
      cars: carData.cars || carData || []
    };
    
    // 如果有搜索参数，进行过滤
    if (search) {
      result.cars = result.cars.filter(car => 
        car.name && car.name.toLowerCase().includes(search.toLowerCase()) ||
        car.configName && car.configName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // 暂时禁用分页，返回所有数据
    // 如果有分页参数，进行分页
    if (page && limit && false) { // 暂时禁用分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      result.cars = result.cars.slice(startIndex, endIndex);
      result.total = result.cars.length;
      result.page = parseInt(page);
      result.limit = parseInt(limit);
    }
    
    res.json(result);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: '品牌不存在' });
    } else {
      res.status(500).json({ error: '数据格式错误' });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

module.exports.handler = serverless(app); 