import { CONFIG } from './config.js';
import { Utils } from './utils.js';
import { cacheManager } from './cacheManager.js';

// 车辆搜索模块
export class CarSearch {
  constructor() {
    this.allCars = [];
    this.allCarsLoaded = false;
    this.searchHistory = this.loadSearchHistory();
    this.searchIndex = new Map(); // 搜索索引
    this.debouncedSearch = Utils.debounce(this.performSearch.bind(this), 300); // 防抖搜索
  }
  
  // 初始化搜索功能
  async initialize() {
    await this.loadAllCars();
    this.buildSearchIndex();
    this.bindSearchEvents();
    this.bindHistoryEvents();
  }
  
  // 加载所有车型数据
  async loadAllCars() {
    if (this.allCarsLoaded) return;
    
    try {
      // 从网络加载（带多源与超时回退）
      if (CONFIG.APP.DEBUG) console.log('🔄 开始加载车型数据...');

      // 智能选择数据源：本地开发使用本地数据，生产环境使用线上数据
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      
      const overrideBase = (typeof window !== 'undefined' && window.__CARQUOTE_DATA_BASE__)
        ? (window.__CARQUOTE_DATA_BASE__.endsWith('/') ? window.__CARQUOTE_DATA_BASE__ : `${window.__CARQUOTE_DATA_BASE__}/`)
        : null;
      
      const dataBases = [
        overrideBase || (isLocalhost ? 'http://localhost:8000/data/' : 'https://dbtknight.netlify.app/data/')
      ];

      const fetchWithTimeout = async (url, options = {}, timeoutMs = 12000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, { ...options, signal: controller.signal });
        } finally {
          clearTimeout(id);
        }
      };

      const loadBrandsJson = async () => {
        const base = dataBases[0];
        const url = `${base}brands.json`;
        if (CONFIG.APP.DEBUG) console.log(`🌐 加载: ${url}`);
        const res = await fetchWithTimeout(url, {}, 15000);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const json = await res.json();
        if (!Array.isArray(json) || json.length === 0) throw new Error('brands.json 为空或格式错误');
        return { base, brands: json };
      };

      const { base: dataBaseUrl, brands } = await loadBrandsJson();
      if (!Array.isArray(brands) || brands.length === 0) {
        throw new Error('brands.json 为空或格式错误');
      }
      if (CONFIG.APP.DEBUG) console.log(`📋 找到 ${brands.length} 个品牌，数据源: ${dataBaseUrl}`);

      // 并行加载品牌数据（基于选定的数据源）
      if (CONFIG.APP.DEBUG) console.log(`📥 开始加载 ${brands.length} 个品牌的数据`);
      const carPromises = brands.map(async (brand) => {
        const cacheKey = `brand:${brand.name}`;
        let brandData = cacheManager.get(cacheKey, 'memory');
        
        if (!brandData) {
          try {
            if (CONFIG.APP.DEBUG) console.log(`📥 加载品牌: ${brand.name} (${brand.file})`);
            const res = await fetchWithTimeout(`${dataBaseUrl}${brand.file}`, {}, 15000);
            
            if (!res.ok) {
              console.error(`加载品牌文件 ${brand.file} 失败: ${res.status} ${res.statusText}`);
              return [];
            }
            
            brandData = await res.json();
            
            // 缓存品牌数据
            cacheManager.set(cacheKey, brandData, {
              level: 'memory',
              ttl: 30 * 60 * 1000, // 30分钟
              priority: 2
            });
          } catch (e) {
            console.error(`加载品牌 ${brand.name} 失败:`, e);
            return [];
          }
        }
        
        if (brandData.cars && Array.isArray(brandData.cars)) {
          return brandData.cars.map(car => {
            // 移除seriesName字段，确保数据结构正确
            const { seriesName, ...carWithoutSeriesName } = car;
            return {
              ...carWithoutSeriesName,
              // 优先使用 brands.json 内的中文名称作为展示与存储字段
              brand: brand.name || brandData.brand,
              // 同时保留中英文两个字段以便搜索
              brandCn: brand.name || '',
              brandEn: brandData.brand || '',
              brandImage: brandData.brandImage || brand.brandImage
            };
          });
        }
        return [];
      });
      
      const carsArr = await Promise.all(carPromises);
      this.allCars = carsArr.flat();
      this.allCarsLoaded = true;
      
      // 缓存所有车型数据
      cacheManager.set('allCars', this.allCars, {
        level: 'localStorage',
        ttl: 24 * 60 * 60 * 1000, // 24小时
        priority: 3
      });
      
      if (CONFIG.APP.DEBUG) console.log(`✅ 成功加载并缓存 ${this.allCars.length} 个车型数据`);
      
      // 测试搜索索引
      this.buildSearchIndex();
      if (CONFIG.APP.DEBUG) console.log(`🔍 搜索索引构建完成，包含 ${this.searchIndex.size} 个索引项`);
      
    } catch (e) {
      console.error('❌ 加载所有车型失败:', e);
      console.error('错误详情:', e.stack);
      // 如果加载失败，设置一个标志避免无限重试
      this.allCarsLoaded = true;
    }
  }
  
  // 构建搜索索引
  buildSearchIndex() {
    this.searchIndex.clear();
    
    this.allCars.forEach((car, carIndex) => {
      // 索引车型名
      if (car.carName) {
        const carNameLower = car.carName.toLowerCase();
        this.addToIndex(carNameLower, carIndex);
        
        // 索引车型名的每个词
        carNameLower.split(/\s+/).forEach(word => {
          if (word.length > 1) {
            this.addToIndex(word, carIndex);
          }
        });
      }
      
      // 索引品牌名（中英文都加入索引）
      if (car.brand) {
        const brandLower = (car.brand || '').toLowerCase();
        if (brandLower) this.addToIndex(brandLower, carIndex);
      }
      if (car.brandCn) {
        const brandCnLower = (car.brandCn || '').toLowerCase();
        if (brandCnLower) this.addToIndex(brandCnLower, carIndex);
      }
      if (car.brandEn) {
        const brandEnLower = (car.brandEn || '').toLowerCase();
        if (brandEnLower) this.addToIndex(brandEnLower, carIndex);
      }
      
      // 索引配置名
      if (car.configs && Array.isArray(car.configs)) {
        car.configs.forEach((config, configIndex) => {
          if (config.configName) {
            const configNameLower = config.configName.toLowerCase();
            this.addToIndex(configNameLower, carIndex);
            
            // 索引配置名的每个词
            configNameLower.split(/\s+/).forEach(word => {
              if (word.length > 1) {
                this.addToIndex(word, carIndex);
              }
            });
          }
        });
      }
    });
  }
  
  // 添加到搜索索引
  addToIndex(term, carIndex) {
    if (!this.searchIndex.has(term)) {
      this.searchIndex.set(term, new Set());
    }
    this.searchIndex.get(term).add(carIndex);
  }
  
  // 绑定搜索事件
  bindSearchEvents() {
    const carInput = Utils.getElement('searchCarInput');
    const carResultBox = Utils.getElement('searchCarResults');
    
    if (!carInput || !carResultBox) return;
    
    // 输入事件（使用防抖）
    carInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 1) {
        this.debouncedSearch(query);
      } else {
        this.hideResults();
        // 清空搜索框时重置车型图片和颜色选择器
        this.resetCarDisplay();
      }
    });
    
    // 焦点事件
    carInput.addEventListener('focus', () => {
      if (carInput.value.trim().length >= 1) {
        this.performSearch(carInput.value.trim());
      }
    });
    
    // 点击外部关闭搜索结果
    document.addEventListener('click', (e) => {
      if (!carInput.contains(e.target) && !carResultBox.contains(e.target)) {
        this.hideResults();
      }
    });
    
    // 键盘导航
    carInput.addEventListener('keydown', (e) => {
      const results = carResultBox.querySelectorAll('div[onmousedown]');
      // 不能直接在选择器中使用包含斜杠的类名，改为运行时检查
      const currentIndex = Array.from(results).findIndex(item => item.classList.contains('bg-primary/10'));
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.navigateResults(results, currentIndex, 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.navigateResults(results, currentIndex, -1);
          break;
        case 'Enter':
          e.preventDefault();
          const selectedItem = Array.from(results).find(item => item.classList.contains('bg-primary/10'));
          if (selectedItem) {
            selectedItem.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          }
          break;
        case 'Escape':
          this.hideResults();
          break;
      }
    });
  }
  
  // 执行搜索（优化版本）
  performSearch(query) {
    if (!this.allCarsLoaded) return;
    
    // 检查缓存
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = cacheManager.get(cacheKey, 'memory');
    if (cached) {
      this.displayResults(cached);
      return;
    }
    
    const results = this.searchWithIndex(query);
    const limitedResults = results.slice(0, 20);
    
    // 缓存搜索结果
    cacheManager.set(cacheKey, limitedResults, {
      level: 'memory',
      ttl: 10 * 60 * 1000, // 10分钟
      priority: 1
    });
    
    this.displayResults(limitedResults);
  }
  
  // 使用索引进行搜索
  searchWithIndex(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    // 计算每个车型的匹配分数
    const carScores = new Map();
    
    // 特殊处理：品牌+车型组合搜索（如"大众途岳"）
    if (queryWords.length >= 2) {
      // 尝试将前两个词作为品牌+车型组合
      const brandCandidate = queryWords[0];
      const modelCandidate = queryWords[1];
      const combinedSearch = `${brandCandidate}${modelCandidate}`;
      
      // 在所有车型中搜索品牌+车型组合
      this.allCars.forEach((car, carIndex) => {
        const carBrand = (car.brand || car.brandCn || car.brandEn || '').toLowerCase();
        const carName = (car.carName || car.name || '').toLowerCase();
        const fullCarName = `${carBrand}${carName}`;
        
        // 检查是否匹配品牌+车型组合
        if (fullCarName.includes(combinedSearch) || combinedSearch.includes(fullCarName)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 50); // 高优先级
        }
        
        // 检查品牌和车型分别匹配
        if (carBrand.includes(brandCandidate) && carName.includes(modelCandidate)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 30); // 中等优先级
        }
        
        // 模糊匹配：检查品牌和车型的部分匹配
        if (this.fuzzyMatch(carBrand, brandCandidate) && this.fuzzyMatch(carName, modelCandidate)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 20); // 模糊匹配优先级
        }
      });
    }
    
    // 处理单个查询词的情况（如只输入"途岳"）
    if (queryWords.length === 1) {
      const singleWord = queryWords[0];
      
      this.allCars.forEach((car, carIndex) => {
        const carBrand = (car.brand || car.brandCn || car.brandEn || '').toLowerCase();
        const carName = (car.carName || car.name || '').toLowerCase();
        
        // 检查车型名是否包含查询词
        if (carName.includes(singleWord)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 25);
        }
        
        // 检查品牌名是否包含查询词
        if (carBrand.includes(singleWord)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 15);
        }
        
        // 模糊匹配
        if (this.fuzzyMatch(carName, singleWord)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 10);
        }
      });
    }
    
    // 处理连续字符搜索（如"大众途岳"作为一个整体）
    if (queryLower.length >= 4) {
      this.allCars.forEach((car, carIndex) => {
        const carBrand = (car.brand || '').toLowerCase();
        const carName = (car.carName || car.name || '').toLowerCase();
        const fullCarName = `${carBrand}${carName}`;
        
        // 检查连续字符匹配
        if (fullCarName.includes(queryLower)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 40); // 高优先级
        }
        
        // 检查车型名中的连续匹配
        if (carName.includes(queryLower)) {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 35);
        }
      });
    }
    
    // 原有的索引搜索逻辑
    queryWords.forEach(word => {
      // 完全匹配
      if (this.searchIndex.has(word)) {
        this.searchIndex.get(word).forEach(carIndex => {
          carScores.set(carIndex, (carScores.get(carIndex) || 0) + 10);
        });
      }
      
      // 前缀匹配
      for (const [term, carIndices] of this.searchIndex) {
        if (term.startsWith(word)) {
          carIndices.forEach(carIndex => {
            carScores.set(carIndex, (carScores.get(carIndex) || 0) + 5);
          });
        }
      }
    });
    
    // 额外搜索：在所有车型中直接搜索
    this.allCars.forEach((car, carIndex) => {
      const carBrand = (car.brand || car.brandCn || car.brandEn || '').toLowerCase();
      const carName = (car.carName || car.name || '').toLowerCase();
      const fullCarName = `${carBrand}${carName}`;
      
      // 检查完整查询是否包含在车型名中
      if (fullCarName.includes(queryLower) || carName.includes(queryLower) || carBrand.includes(queryLower)) {
        carScores.set(carIndex, (carScores.get(carIndex) || 0) + 15);
      }
      
      // 检查配置名
      if (car.configs && Array.isArray(car.configs)) {
        car.configs.forEach(config => {
          const configName = (config.configName || '').toLowerCase();
          if (configName.includes(queryLower)) {
            carScores.set(carIndex, (carScores.get(carIndex) || 0) + 8);
          }
        });
      }
    });
    
    // 构建结果
    const results = [];
    carScores.forEach((score, carIndex) => {
      const car = this.allCars[carIndex];
      if (car && score > 0) {
        if (car.configs && car.configs.length > 0) {
          car.configs.forEach(config => {
            results.push({ 
              car, 
              config, 
              displayText: config.configName,
              score: score + (config.configName.toLowerCase().includes(queryLower) ? 5 : 0)
            });
          });
        } else {
          results.push({ 
            car, 
            config: null, 
            displayText: car.carName,
            score: score + (car.carName.toLowerCase().includes(queryLower) ? 5 : 0)
          });
        }
      }
    });
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }
  
  // 模糊匹配函数
  fuzzyMatch(text, pattern) {
    if (!text || !pattern) return false;
    
    const textLower = text.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    // 完全包含
    if (textLower.includes(patternLower)) return true;
    
    // 检查模式中的字符是否按顺序出现在文本中
    let patternIndex = 0;
    for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
      if (textLower[i] === patternLower[patternIndex]) {
        patternIndex++;
      }
    }
    
    return patternIndex === patternLower.length;
  }
  
  // 显示搜索结果
  displayResults(results) {
    const carResultBox = Utils.getElement('searchCarResults');
    const searchInput = Utils.getElement('searchCarInput');
    if (!carResultBox || !searchInput) return;
    
    // 定位下拉菜单 - 考虑滚动偏移，确保滚动后位置正确
    const inputRect = searchInput.getBoundingClientRect();
    const top = window.scrollY + inputRect.bottom + 5;
    const left = window.scrollX + inputRect.left;
    carResultBox.style.position = 'absolute';
    carResultBox.style.top = `${top}px`;
    carResultBox.style.left = `${left}px`;
    carResultBox.style.width = `${inputRect.width}px`;
    carResultBox.style.zIndex = '999999';
    
    if (results.length === 0) {
      carResultBox.innerHTML = '<div class="px-4 py-2 text-gray-400 text-center">未找到相关车型</div>';
    } else {
      carResultBox.innerHTML = '';
      const frag = document.createDocumentFragment();
      results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0';
        
        // 品牌logo
        if (result.car.brandImage) {
          const img = document.createElement('img');
          img.src = result.car.brandImage;
          img.alt = result.car.brand;
          img.className = 'w-8 h-8 object-contain rounded';
          img.loading = 'lazy';
          img.decoding = 'async';
          div.appendChild(img);
        }
        
        // 创建内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1 min-w-0';
        
        // 品牌名
        const brandName = result.car.brand || result.car.brandCn || result.car.brandEn || result.car.seriesName || '';
        
        // 车型名（去重处理）
        let carName = result.car.carName || result.car.name || '';
        if (brandName && carName.includes(brandName)) {
          carName = carName.replace(brandName, '').trim();
        }
        
        // 配置名
        let configName = '';
        if (result.config && result.config.configName) {
          configName = result.config.configName;
          // 如果配置名包含车型名，则只显示配置名的差异部分
          if (carName && configName.includes(carName)) {
            configName = configName.replace(carName, '').trim();
          }
          // 如果配置名包含品牌名，也去除品牌名
          if (brandName && configName.includes(brandName)) {
            configName = configName.replace(brandName, '').trim();
          }
        }
        
        // 构建显示内容 - 为不同字段设置不同颜色
        let displayContent = '';
        const parts = [];
        
        if (brandName) {
          parts.push(`<span class="text-black font-medium">${brandName}</span>`);
        }
        if (carName) {
          parts.push(`<span class="text-gray-900 font-semibold">${carName}</span>`);
        }
        if (configName) {
          parts.push(`<span class="text-gray-600">${configName}</span>`);
        }
        
        // 使用空格分隔，而不是短横线，与输入框显示保持一致
        displayContent = parts.join(' ');
        
        contentDiv.innerHTML = `<div class="text-sm truncate">${displayContent}</div>`;
        div.appendChild(contentDiv);
        
        // 指导价
        if (result.config && result.config.price) {
          const priceSpan = document.createElement('span');
          priceSpan.textContent = result.config.price;
          priceSpan.className = 'text-red-500 text-sm font-medium whitespace-nowrap';
          div.appendChild(priceSpan);
        }
        
        // 点击选择
        div.onmousedown = (e) => {
          e.preventDefault();
          this.selectCar(result.car, result.config);
        };
        
        frag.appendChild(div);
      });
      carResultBox.appendChild(frag);
    }
    
    Utils.toggleElement('searchCarResults', true);
  }
  
  // 隐藏搜索结果
  hideResults() {
    Utils.toggleElement('searchCarResults', false);
  }
  
  // 导航搜索结果
  navigateResults(results, currentIndex, direction) {
    const newIndex = Math.max(0, Math.min(results.length - 1, currentIndex + direction));
    
    // 移除当前选中状态
    results.forEach(item => item.classList.remove('bg-primary/10'));
    
    // 添加新的选中状态
    if (results[newIndex]) {
      results[newIndex].classList.add('bg-primary/10');
      results[newIndex].scrollIntoView({ block: 'nearest' });
    }
  }
  
  // 选择车型
  selectCar(car, config) {
    
    // 构建完整的显示文本：品牌+车型+配置
    let displayText = '';
    const parts = [];
    
    // 获取品牌名称
    const brandName = car.brand || car.brandCn || car.brandEn || car.seriesName || '';
    if (brandName) {
      parts.push(brandName);
    }
    
    // 获取车型名称
    let carName = car.carName || car.name || '';
    if (carName) {
      // 如果车型名包含品牌名，则去除品牌名部分
      if (brandName && carName.includes(brandName)) {
        carName = carName.replace(brandName, '').trim();
      }
      if (carName) {
        parts.push(carName);
      }
    }
    
    // 获取配置名称
    let configName = '';
    if (config && config.configName) {
      configName = config.configName;
      // 如果配置名包含车型名，则只显示配置名的差异部分
      if (carName && configName.includes(carName)) {
        configName = configName.replace(carName, '').trim();
      }
      // 如果配置名包含品牌名，也去除品牌名
      if (brandName && configName.includes(brandName)) {
        configName = configName.replace(brandName, '').trim();
      }
      if (configName) {
        parts.push(configName);
      }
    }
    
    // 组合显示文本
    displayText = parts.join(' ');
    
    // 如果没有构建出有效文本，使用默认值
    if (!displayText.trim()) {
    if (config && config.configName) {
      displayText = config.configName;
    } else if (car && car.carName) {
      displayText = car.carName;
    } else if (car && car.name) {
      displayText = car.name;
    } else {
      displayText = '未知车型';
      }
    }
    
    const carInput = Utils.getElement('searchCarInput');
    
    if (carInput) {
      carInput.value = displayText;
      this.hideResults();
      
      // 修复数据合并逻辑：确保config的字段优先于car的字段
      const mergedData = { 
        ...car, 
        ...config,
        // 确保这些关键字段来自config（如果存在）
        class: config?.class || car?.class || '未知',
        power: config?.power || car?.power || '未知',
        fuelType: config?.fuelType || car?.fuelType || '未知',
        size: config?.size || car?.size || '未知',
        manufacturer: config?.manufacturer || car?.manufacturer || '',
        price: config?.price || car?.price || '未知'
      };
      
      this.addToSearchHistory(mergedData);
      
      // 填充车型详细信息
      this.fillCarDetails(mergedData);
      
      // 触发车型选择事件，通知其他模块重置计算
      this.triggerCarSelectionEvent(mergedData);
    }
  }

  // 触发车型选择事件
  triggerCarSelectionEvent(carData) {
    const event = new CustomEvent('carSelected', {
      detail: { carData }
    });
    document.dispatchEvent(event);
  }
  
  // 填充车型详细信息
  fillCarDetails(carData) {
    
    // 填充基础信息 - 修复映射逻辑
    const manufacturer = carData.manufacturer || '';  // 厂商
    const carClass = carData.class || '未知';        // 级别
    const carModel = carData.name || carData.carName || '';
    const fuelType = carData.fuelType || '未知';
    const power = carData.power || '未知';           // 动力
    const size = carData.size || '未知';
    
    // 设置元素值 - 修复映射逻辑
    Utils.setElementValue('brandName2', manufacturer);  // 厂商输入框
    Utils.setElementValue('carClass2', carClass);       // 级别输入框
    Utils.setElementValue('carModel2', carModel);
    Utils.setElementValue('fuelType2', fuelType);
    Utils.setElementValue('power2', power);             // 动力输入框
    Utils.setElementValue('size2', size);
    
    // 计算并填充CBM
    const cbm = this.calculateCBM(carData.size);
    Utils.setElementValue('cbm2', cbm);
    
    Utils.setElementValue('price2', carData.price || '未知');
    
    // 解析价格并填充指导价格
    const priceNum = this.parsePriceToNumber(carData.price);
    if (priceNum) {
      Utils.setElementValue('guidePrice', priceNum);
      Utils.setElementValue('usedGuidePrice', priceNum);
      Utils.setElementValue('newEnergyGuidePrice', priceNum);
    }
    
    // 显示基础信息区域
    Utils.toggleElement('baseInfoSection', true);
    
    // 设置品牌logo - 保持brandImage映射
    const brandLogoBox = Utils.getElement('brandLogoBox2');
    if (brandLogoBox && carData.brandImage) {
      brandLogoBox.innerHTML = `<img src="${carData.brandImage}" alt="${manufacturer || carData.brand}" class="w-12 h-12 object-contain">`;
    }
    
    // 设置外观和内饰图片 - 支持新的exteriorImages和interiorImages数据结构
    const exteriorImageBox = Utils.getElement('exteriorImageBox');
    const interiorImageBox = Utils.getElement('interiorImageBox');
    const colorSwatchesContainer = Utils.getElement('colorSwatches');
    
    // 设置外观图片
    if (exteriorImageBox) {
      let exteriorImageUrl = '';
      let imageAlt = carData.name || carData.carName || '';
      
      if (carData.exteriorImages && carData.exteriorImages.length > 0) {
        exteriorImageUrl = carData.exteriorImages[0].mainImage;
      } else if (carData.configImage) {
        exteriorImageUrl = carData.configImage;
      } else if (carData.image || carData.mainImage) {
        exteriorImageUrl = carData.image || carData.mainImage;
      }
      
      if (exteriorImageUrl) {
        exteriorImageBox.innerHTML = `<img src="${exteriorImageUrl}" alt="${imageAlt}" class="w-full h-full object-cover cursor-pointer" data-image-type="exterior" data-image-url="${exteriorImageUrl}" data-image-alt="${imageAlt}">`;
        // 添加双击事件
        const exteriorImg = exteriorImageBox.querySelector('img');
        if (exteriorImg) {
          exteriorImg.addEventListener('dblclick', () => this.openImageModal(exteriorImageUrl, imageAlt, '外观图片'));
        }
      } else {
        exteriorImageBox.innerHTML = `
          <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
            <i class="fa fa-car text-2xl mb-1"></i>
            <span class="text-xs">暂无外观图片</span>
          </div>
        `;
      }
    }
    
    // 设置内饰图片
    if (interiorImageBox) {
      let interiorImageUrl = '';
      let imageAlt = carData.name || carData.carName || '';
      
      if (carData.interiorImages && carData.interiorImages.length > 0) {
        interiorImageUrl = carData.interiorImages[0].mainImage;
      }
      
      if (interiorImageUrl) {
        interiorImageBox.innerHTML = `<img src="${interiorImageUrl}" alt="${imageAlt}" class="w-full h-full object-cover cursor-pointer" data-image-type="interior" data-image-url="${interiorImageUrl}" data-image-alt="${imageAlt}">`;
        // 添加双击事件
        const interiorImg = interiorImageBox.querySelector('img');
        if (interiorImg) {
          interiorImg.addEventListener('dblclick', () => this.openImageModal(interiorImageUrl, imageAlt, '内饰图片'));
        }
      } else {
        interiorImageBox.innerHTML = `
          <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
            <i class="fa fa-car-side text-2xl mb-1"></i>
            <span class="text-xs">暂无内饰图片</span>
          </div>
        `;
      }
    }
    
    // 设置外观颜色选择器
    if (carData.exteriorImages && carData.exteriorImages.length > 0) {
      this.setupExteriorColorSelector(carData);
    }
    
    // 设置内饰颜色选择器
    if (carData.interiorImages && carData.interiorImages.length > 0) {
      this.setupInteriorColorSelector(carData);
    }
  }
  
  // 计算CBM (立方米)
  calculateCBM(sizeStr) {
    if (!sizeStr || typeof sizeStr !== 'string') return '未知';
    
    // 解析尺寸字符串，格式如: "4053x1740x1449"
    const sizeMatch = sizeStr.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
    if (!sizeMatch) return '未知';
    
    const length = parseFloat(sizeMatch[1]);
    const width = parseFloat(sizeMatch[2]);
    const height = parseFloat(sizeMatch[3]);
    
    // 检查数值是否有效
    if (isNaN(length) || isNaN(width) || isNaN(height)) return '未知';
    
    // 将毫米转换为米，然后计算体积
    const lengthM = length / 1000;
    const widthM = width / 1000;
    const heightM = height / 1000;
    
    const cbm = lengthM * widthM * heightM;
    
    // 保留两位小数
    return cbm.toFixed(2);
  }
  
  // 解析价格字符串为数字
  parsePriceToNumber(priceStr) {
    if (!priceStr) return '';
    priceStr = priceStr.trim();
    if (priceStr.endsWith('万')) {
      return Math.round(parseFloat(priceStr.replace('万', '')) * 10000);
    } else {
      return Math.round(parseFloat(priceStr.replace(/[^\d.]/g, '')));
    }
  }
  
  // 绑定历史记录事件
  bindHistoryEvents() {
    const historyBtn = Utils.getElement('showHistoryBtn');
    const historyPanel = Utils.getElement('searchHistoryPanel');
    const clearHistoryBtn = Utils.getElement('clearHistoryBtn');
    
    if (historyBtn) {
      historyBtn.addEventListener('click', () => {
        this.toggleHistoryPanel();
      });
    }
    
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        this.clearSearchHistory();
      });
    }
    
    // 点击外部关闭历史面板
    document.addEventListener('click', (e) => {
      if (historyPanel && !historyBtn?.contains(e.target) && !historyPanel.contains(e.target)) {
        Utils.toggleElement('searchHistoryPanel', false);
      }
    });
  }
  
  // 切换历史面板
  toggleHistoryPanel() {
    const historyPanel = Utils.getElement('searchHistoryPanel');
    const historyBtn = Utils.getElement('showHistoryBtn');
    if (!historyPanel || !historyBtn) return;
    
    const isVisible = !historyPanel.classList.contains('hidden');
    if (isVisible) {
      Utils.toggleElement('searchHistoryPanel', false);
    } else {
      // 定位历史面板 - 相对定位，固定在历史记录按钮下方
      const btnRect = historyBtn.getBoundingClientRect();
      historyPanel.style.position = 'absolute';
      historyPanel.style.top = `${btnRect.bottom + 5}px`;
      historyPanel.style.right = `${window.innerWidth - btnRect.right}px`;
      historyPanel.style.width = '300px';
      historyPanel.style.zIndex = '999999';
      
      this.displaySearchHistory();
      Utils.toggleElement('searchHistoryPanel', true);
    }
  }
  
  // 显示搜索历史
  displaySearchHistory() {
    const historyList = Utils.getElement('searchHistoryList');
    const noHistoryMessage = Utils.getElement('noHistoryMessage');
    
    if (!historyList || !noHistoryMessage) return;
    
    if (this.searchHistory.length === 0) {
      Utils.toggleElement('searchHistoryList', false);
      Utils.toggleElement('noHistoryMessage', true);
    } else {
      Utils.toggleElement('searchHistoryList', true);
      Utils.toggleElement('noHistoryMessage', false);
      
      historyList.innerHTML = this.searchHistory.map(item => {
        // 处理历史记录显示数据 - 修复品牌名称映射
        let brandName = item.brand || item.seriesName || '';
        
        // 将英文品牌名映射到中文品牌名
        brandName = this.mapBrandNameToChinese(brandName);
        
        const brandImage = item.brandImage || '/placeholder.png';
        
        // 车型名（去重处理）
        let carName = item.carName || item.name || item.configName || '';
        if (brandName && carName.includes(brandName)) {
          carName = carName.replace(brandName, '').trim();
        }
        
        // 指导价
        const price = item.price || '';
        
        return `
          <div class="history-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" data-car='${JSON.stringify(item)}'>
            <div class="flex items-center gap-3">
              <img src="${brandImage}" alt="${brandName}" class="w-8 h-8 object-contain rounded">
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-600">${brandName}</div>
                <div class="font-medium text-gray-900">${carName || '未知车型'}</div>
              </div>
              ${price ? `<span class="text-red-500 text-sm font-medium whitespace-nowrap">${price}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
      
      // 绑定历史项点击事件
      historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const carData = JSON.parse(item.dataset.car);
          this.handleHistoryItemClick(carData);
        });
      });
    }
  }

  // 将英文品牌名映射到中文品牌名
  mapBrandNameToChinese(englishBrandName) {
    const brandMapping = {
      'Skoda': '斯柯达',
      'Subaru': '斯巴鲁',
      'BMW': '宝马',
      'Mercedes-Benz': '奔驰',
      'Audi': '奥迪',
      'Volkswagen': '大众',
      'Toyota': '丰田',
      'Honda': '本田',
      'Nissan': '日产',
      'Hyundai': '现代',
      'Kia': '起亚',
      'Ford': '福特',
      'Chevrolet': '雪佛兰',
      'Buick': '别克',
      'Cadillac': '凯迪拉克',
      'Lexus': '雷克萨斯',
      'Infiniti': '英菲尼迪',
      'Acura': '讴歌',
      'Volvo': '沃尔沃',
      'Saab': '萨博',
      'Jaguar': '捷豹',
      'Land Rover': '路虎',
      'Mini': 'MINI',
      'Rolls-Royce': '劳斯莱斯',
      'Bentley': '宾利',
      'Aston Martin': '阿斯顿马丁',
      'Ferrari': '法拉利',
      'Lamborghini': '兰博基尼',
      'Maserati': '玛莎拉蒂',
      'Porsche': '保时捷',
      'Alfa Romeo': '阿尔法罗密欧',
      'Fiat': '菲亚特',
      'Peugeot': '标致',
      'Citroen': '雪铁龙',
      'Renault': '雷诺',
      'Opel': '欧宝',
      'Skoda': '斯柯达',
      'Seat': '西雅特',
      'Dacia': '达契亚',
      'Lada': '拉达',
      'BYD': '比亚迪',
      'Geely': '吉利',
      'Changan': '长安',
      'Chery': '奇瑞',
      'Great Wall': '长城',
      'Haval': '哈弗',
      'Wuling': '五菱',
      'Hongqi': '红旗',
      'Nio': '蔚来',
      'Xpeng': '小鹏',
      'Li Auto': '理想',
      'Tesla': '特斯拉'
    };
    
    return brandMapping[englishBrandName] || englishBrandName;
  }
  
  // 处理历史记录项点击
  handleHistoryItemClick(carData) {
    const carInput = Utils.getElement('searchCarInput');
    if (!carInput) return;
    
    // 获取品牌和车型信息
    const brand = carData.brand || carData.brandCn || carData.brandEn || carData.seriesName || '';
    const carName = carData.carName || carData.name || '';
    const price = carData.price || '';
    
    // 查找匹配的车型和配置
    const matchedResult = this.findMatchingCarConfig(brand, carName, price);
    
    if (matchedResult) {
      // 找到匹配的配置，使用完整的车型和配置信息
      const displayText = matchedResult.config?.configName || matchedResult.car?.carName || carName;
      carInput.value = displayText;
      
      // 修复数据合并逻辑：确保config的字段优先于car的字段
      const mergedData = { 
        ...matchedResult.car, 
        ...matchedResult.config,
        // 确保这些关键字段来自config（如果存在）
        class: matchedResult.config?.class || matchedResult.car?.class || '未知',
        power: matchedResult.config?.power || matchedResult.car?.power || '未知',
        fuelType: matchedResult.config?.fuelType || matchedResult.car?.fuelType || '未知',
        size: matchedResult.config?.size || matchedResult.car?.size || '未知',
        manufacturer: matchedResult.config?.manufacturer || matchedResult.car?.manufacturer || '',
        price: matchedResult.config?.price || matchedResult.car?.price || '未知'
      };
      
      // 填充车型详细信息
      this.fillCarDetails(mergedData);
      
      // 触发车型选择事件
      this.triggerCarSelectionEvent(mergedData);
    } else {
      // 没有找到匹配的配置，使用原始数据
      const displayText = carData.configName || carData.carName || carData.name || '';
      carInput.value = displayText;
      
      // 尝试填充基础信息（如果有的话）
      if (carData.brand || carData.carName) {
        this.fillCarDetails(carData);
      }
    }
    
    // 关闭历史记录面板
    Utils.toggleElement('searchHistoryPanel', false);
  }
  
  // 根据品牌、车型和价格查找匹配的配置
  findMatchingCarConfig(brand, carName, price) {
    if (!brand || !carName || !price) return null;
    
    // 在所有车型中查找匹配的
    for (const car of this.allCars) {
      // 检查品牌和车型是否匹配
      const carBrand = car.brand || car.brandCn || car.brandEn || car.seriesName || '';
      const carModelName = car.carName || car.name || '';
      
      if (carBrand === brand && carModelName === carName) {
        // 找到匹配的车型，现在查找匹配价格的配置
        if (car.configs && Array.isArray(car.configs)) {
          for (const config of car.configs) {
            if (config.price === price) {
              return { car, config };
            }
          }
        }
      }
    }
    
    return null;
  }
  
  // 添加到搜索历史
  addToSearchHistory(carData) {
    // 移除重复项
    this.searchHistory = this.searchHistory.filter(item => 
      !(item.brand === carData.brand && item.name === carData.name)
    );
    
    // 添加到开头
    this.searchHistory.unshift(carData);
    
    // 限制历史记录数量
    if (this.searchHistory.length > 10) {
      this.searchHistory = this.searchHistory.slice(0, 10);
    }
    
    this.saveSearchHistory();
  }
  
  // 清除搜索历史
  clearSearchHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
    this.displaySearchHistory();
  }
  
  // 保存搜索历史到本地存储
  saveSearchHistory() {
    try {
      localStorage.setItem('carSearchHistory', JSON.stringify(this.searchHistory));
    } catch (e) {
      console.error('保存搜索历史失败:', e);
    }
  }
  
  // 从本地存储加载搜索历史
  loadSearchHistory() {
    try {
      const history = localStorage.getItem('carSearchHistory');
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('加载搜索历史失败:', e);
      return [];
    }
  }
  
  // 清理资源
  cleanup() {
    this.searchCache.clear();
    this.searchIndex.clear();
    Utils.clearElementCache();
  }
  
  // 重置车型显示
  resetCarDisplay() {
    // 重置外观图片
    const exteriorImageBox = Utils.getElement('exteriorImageBox');
    if (exteriorImageBox) {
      exteriorImageBox.innerHTML = `
        <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
          <i class="fa fa-car text-2xl mb-1"></i>
          <span class="text-xs">请选择车型</span>
        </div>
      `;
    }
    
    // 重置内饰图片
    const interiorImageBox = Utils.getElement('interiorImageBox');
    if (interiorImageBox) {
      interiorImageBox.innerHTML = `
        <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
          <i class="fa fa-car-side text-2xl mb-1"></i>
          <span class="text-xs">请选择车型</span>
        </div>
      `;
    }
    
    // 重置颜色选择器
    const colorSwatchesContainer = Utils.getElement('colorSwatches');
    if (colorSwatchesContainer) {
      colorSwatchesContainer.innerHTML = '';
      colorSwatchesContainer.style.display = 'none'; // 隐藏主色块容器
    }
    
    const exteriorColorSwatches = Utils.getElement('exteriorColorSwatches');
    if (exteriorColorSwatches) {
      exteriorColorSwatches.innerHTML = '';
      exteriorColorSwatches.style.display = 'none'; // 隐藏外观色块容器
    }
    
    const interiorColorSwatches = Utils.getElement('interiorColorSwatches');
    if (interiorColorSwatches) {
      interiorColorSwatches.innerHTML = '';
      interiorColorSwatches.style.display = 'none'; // 隐藏内饰色块容器
    }
    
    // 重置颜色名称
    const exteriorColorName = Utils.getElement('exteriorColorName');
    if (exteriorColorName) {
      exteriorColorName.textContent = '';
      exteriorColorName.style.display = 'none'; // 隐藏外观颜色名称
    }
    
    const interiorColorName = Utils.getElement('interiorColorName');
    if (interiorColorName) {
      interiorColorName.textContent = '';
      interiorColorName.style.display = 'none'; // 隐藏内饰颜色名称
    }
    
    // 重置基础信息区域
    Utils.toggleElement('baseInfoSection', false);
    
    // 重置品牌logo
    const brandLogoBox = Utils.getElement('brandLogoBox2');
    if (brandLogoBox) {
      brandLogoBox.innerHTML = `
        <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
          <i class="fa fa-image text-2xl mb-1"></i>
          <span class="text-xs">品牌Logo</span>
        </div>
      `;
    }
  }
  
  // 设置颜色选择器
  setupColorSelector(carData, colorSwatchesContainer, carMainImageBox) {
    if (!carData.exteriorImages || carData.exteriorImages.length === 0) {
      colorSwatchesContainer.innerHTML = '';
      colorSwatchesContainer.style.display = 'none'; // 完全隐藏容器
      return;
    }
    
    // 有数据时显示容器
    colorSwatchesContainer.style.display = 'flex';
    
    const exteriorImages = carData.exteriorImages;
      const maxVisible = 5; // 默认显示5个色块
      const totalColors = exteriorImages.length;
    
    // 创建颜色选择器HTML
    let colorSwatchesHTML = '';
    
    // 添加左箭头（如果颜色数量超过5个）
      if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn left-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="-1">
          <i class="fa fa-chevron-left"></i>
        </button>
      `;
    }
    
    // 添加颜色块容器 - 智能宽度计算和居中显示
    const swatchWidth = 24; // 色块宽度
    const swatchGap = 8; // 色块间距
    const hasPagination = totalColors > maxVisible;
    
    // 根据色块数量计算容器宽度
    let containerWidth;
    let innerStyle;
    
    const containerPadding = 16; // 容器左右内边距
    
    if (hasPagination) {
      // 有分页时，固定显示5个色块的宽度 + 左右内边距
      containerWidth = 176; // 调整为176px，确保5个色块完全显示
      innerStyle = 'position: absolute; left: 8px; width: calc(100% - 16px);'; // 左边距8px，右边距8px，确保色块不贴边
    } else {
      // 无分页时，根据实际色块数量计算宽度并居中 + 左右内边距
      containerWidth = totalColors * swatchWidth + (totalColors - 1) * swatchGap + containerPadding;
      innerStyle = 'position: static; justify-content: center;';
    }
    
    colorSwatchesHTML += `
      <div class="color-swatches-wrapper flex items-center justify-center" style="width: ${containerWidth}px; height: 40px; overflow: hidden; padding: 0 8px;">
        <div class="color-swatches-inner flex items-center space-x-2 transition-transform duration-300" style="transform: translateX(0px); ${innerStyle}">
    `;
    
    // 添加所有颜色块
    exteriorImages.forEach((colorData, index) => {
      const isActive = index === 0; // 第一个颜色为默认选中
      const colorCode = colorData.colors && colorData.colors.length > 0 ? colorData.colors[0] : '#ccc';
      const colorName = colorData.name || `颜色${index + 1}`;
      
      colorSwatchesHTML += `
        <div class="color-swatch ${isActive ? 'active' : ''}" 
             data-index="${index}" 
             data-image="${colorData.mainImage}"
             data-color-name="${colorName}"
             style="background-color: ${colorCode}; cursor: pointer;">
        </div>
      `;
    });
    
    colorSwatchesHTML += `
        </div>
      </div>
    `;
    
    // 添加右箭头（如果颜色数量超过5个）
    if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn right-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="1">
          <i class="fa fa-chevron-right"></i>
        </button>
      `;
    }
    
    // 添加颜色名称显示
    colorSwatchesHTML += `
      <div id="selectedColorName" class="text-sm text-gray-600 mt-2 text-center w-full">
        ${exteriorImages[0]?.name || ''}
      </div>
    `;
    
    colorSwatchesContainer.innerHTML = colorSwatchesHTML;
    
    // 设置样式
    colorSwatchesContainer.style.display = 'flex';
    colorSwatchesContainer.style.flexDirection = 'column';
    colorSwatchesContainer.style.alignItems = 'center';
    colorSwatchesContainer.style.gap = '8px';
    
    // 设置颜色块的样式
    const colorSwatches = colorSwatchesContainer.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch, index) => {
      swatch.style.width = '24px';
      swatch.style.height = '24px';
      swatch.style.borderRadius = '50%';
      swatch.style.border = '2px solid #fff';
      swatch.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      swatch.style.transition = 'all 0.2s ease';
      swatch.style.flexShrink = '0'; // 防止色块被压缩
      
      // 绑定点击事件
      swatch.addEventListener('click', () => {
        this.selectColorSwatch(swatch, exteriorImages[index].mainImage, exteriorImages[index].name);
      });
    });
    
    // 设置活动状态的样式
    const activeSwatch = colorSwatchesContainer.querySelector('.color-swatch.active');
    if (activeSwatch) {
      activeSwatch.style.border = '2px solid #3b82f6';
      activeSwatch.style.transform = 'scale(1.1)';
    }
    
    // 绑定箭头按钮事件
    const leftArrow = colorSwatchesContainer.querySelector('.left-arrow');
    const rightArrow = colorSwatchesContainer.querySelector('.right-arrow');
    
    if (leftArrow) {
      leftArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollColorSwatches(-1, colorSwatchesContainer);
      });
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollColorSwatches(1, colorSwatchesContainer);
      });
    }
    
    // 存储当前滚动位置
    colorSwatchesContainer.currentPage = 0;
    colorSwatchesContainer.maxPages = Math.ceil(totalColors / maxVisible);
    
    // 绑定实例引用
    colorSwatchesContainer.carSearchInstance = this;
  }
  
      // 滚动色块显示
    scrollColorSwatches(direction, container) {
      if (!container) return;
      
      const inner = container.querySelector('.color-swatches-inner');
      const maxVisible = 5; // 默认显示5个色块
      const totalColors = container.querySelectorAll('.color-swatch').length;
      const maxPages = Math.ceil(totalColors / maxVisible);
      
      if (direction === -1 && container.currentPage > 0) {
        container.currentPage--;
      } else if (direction === 1 && container.currentPage < maxPages - 1) {
        container.currentPage++;
      }
      
      // 计算偏移量，确保每次显示完整的5个色块
      const swatchWidth = 24; // 色块宽度
      const swatchGap = 8; // 色块间距
      const swatchTotalWidth = swatchWidth + swatchGap; // 每个色块的总宽度
      const translateX = -(container.currentPage * maxVisible * swatchTotalWidth);
      inner.style.transform = `translateX(${translateX}px)`;
    
      // 更新箭头状态
      const leftArrow = container.querySelector('.left-arrow');
      const rightArrow = container.querySelector('.right-arrow');
      
      if (leftArrow) {
        leftArrow.style.opacity = container.currentPage === 0 ? '0.3' : '1';
        leftArrow.style.pointerEvents = container.currentPage === 0 ? 'none' : 'auto';
      }
      
      if (rightArrow) {
        rightArrow.style.opacity = container.currentPage === maxPages - 1 ? '0.3' : '1';
        rightArrow.style.pointerEvents = container.currentPage === maxPages - 1 ? 'none' : 'auto';
      }
    }
  
  // 选择色块
  selectColorSwatch(swatch, imageUrl, colorName) {
    // 移除其他色块的活动状态
    const container = swatch.closest('#colorSwatches');
    const allSwatches = container.querySelectorAll('.color-swatch');
    allSwatches.forEach(s => {
      s.classList.remove('active');
      s.style.border = '2px solid #fff';
      s.style.transform = 'scale(1)';
    });
    
    // 设置当前色块为活动状态
    swatch.classList.add('active');
    swatch.style.border = '2px solid #3b82f6';
    swatch.style.transform = 'scale(1.1)';
    
    // 更新图片和颜色名称
    const imageBox = container.parentElement.querySelector('#exteriorImageBox img');
    if (imageBox) {
      imageBox.src = imageUrl;
    }
    
    const colorNameElement = container.querySelector('#selectedColorName');
    if (colorNameElement) {
      colorNameElement.textContent = colorName;
    }
  }
  
  // 生成双色色块的CSS样式
  generateColorSwatchStyle(colorData, isActive) {
    const colors = colorData.colors || [];
    const colorName = colorData.name || '';
    
    if (colors.length === 0) {
      // 没有颜色信息，使用默认灰色
      return `width: 20px; height: 20px; border-radius: 50%; background-color: #ccc; cursor: pointer; border: 1px solid #000; ${isActive ? 'border: 2px solid #3b82f6; transform: scale(1.1);' : ''}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;`;
    }
    
    if (colors.length === 1) {
      // 单色
      return `width: 20px; height: 20px; border-radius: 50%; background-color: ${colors[0]}; cursor: pointer; border: 1px solid #000; ${isActive ? 'border: 2px solid #3b82f6; transform: scale(1.1);' : ''}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;`;
    }
    
    if (colors.length === 2) {
      // 双色 - 使用CSS渐变创建一半一半的效果
      const color1 = colors[0] || '#ccc';
      const color2 = colors[1] || '#ccc';
      return `width: 20px; height: 20px; border-radius: 50%; background: linear-gradient(90deg, ${color1} 50%, ${color2} 50%); cursor: pointer; border: 1px solid #000; ${isActive ? 'border: 2px solid #3b82f6; transform: scale(1.1);' : ''}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;`;
    }
    
    // 多色 - 使用径向渐变
    const gradientColors = colors.map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    }).join(', ');
    
    return `width: 20px; height: 20px; border-radius: 50%; background: radial-gradient(circle, ${gradientColors}); cursor: pointer; border: 1px solid #000; ${isActive ? 'border: 2px solid #3b82f6; transform: scale(1.1);' : ''}; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s ease;`;
  }
  
  // 设置外观颜色选择器
  setupExteriorColorSelector(carData) {
    const colorSwatchesContainer = Utils.getElement('exteriorColorSwatches');
    const colorNameContainer = Utils.getElement('exteriorColorName');
    
    if (!colorSwatchesContainer || !colorNameContainer) return;
    
    const exteriorImages = carData.exteriorImages;
    if (!exteriorImages || exteriorImages.length === 0) {
      colorSwatchesContainer.innerHTML = '';
      colorNameContainer.textContent = '';
      colorSwatchesContainer.style.display = 'none'; // 完全隐藏容器
      return;
    }
    
    // 确保色块名称容器可见并重置
    colorNameContainer.style.display = 'block';
    colorNameContainer.textContent = '';
    
    // 有数据时显示容器
    colorSwatchesContainer.style.display = 'flex';
    
    const maxVisible = 5; // 默认显示5个颜色块
    const totalColors = exteriorImages.length;
    
    // 创建颜色选择器HTML
    let colorSwatchesHTML = '';
    
    // 添加左箭头（如果颜色数量超过5个）
    if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn left-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="-1">
          <i class="fa fa-chevron-left"></i>
        </button>
      `;
    }
    
    // 添加颜色块容器 - 智能宽度计算和居中显示
    const swatchWidth = 24; // 色块宽度
    const swatchGap = 8; // 色块间距
    const hasPagination = totalColors > maxVisible;
    
    // 根据色块数量计算容器宽度
    let containerWidth;
    let innerStyle;
    
    const containerPadding = 16; // 容器左右内边距
    
    if (hasPagination) {
      // 有分页时，固定显示5个色块的宽度 + 左右内边距
      containerWidth = 176; // 调整为176px，确保5个色块完全显示
      innerStyle = 'position: absolute; left: 8px; width: calc(100% - 16px);'; // 左边距8px，右边距8px，确保色块不贴边
    } else {
      // 无分页时，根据实际色块数量计算宽度并居中 + 左右内边距
      containerWidth = totalColors * swatchWidth + (totalColors - 1) * swatchGap + containerPadding;
      innerStyle = 'position: static; justify-content: center;';
    }
    
    colorSwatchesHTML += `
      <div class="color-swatches-wrapper flex items-center justify-center" style="width: ${containerWidth}px; height: 40px; overflow: hidden; padding: 0 8px;">
        <div class="color-swatches-inner flex items-center space-x-2 transition-transform duration-300" style="transform: translateX(0px); ${innerStyle}">
    `;
    
    // 添加所有颜色块
    exteriorImages.forEach((colorData, index) => {
      const isActive = index === 0; // 第一个颜色为默认选中
      const colorName = colorData.name || `颜色${index + 1}`;
      
      // 获取配置信息
      const configInfo = this.getConfigInfoForColor(carData, colorData);
      
      colorSwatchesHTML += `
        <div class="color-swatch ${isActive ? 'active' : ''}" 
             data-index="${index}" 
             data-image="${colorData.mainImage}"
             data-color-name="${colorName}"
             data-config-info="${configInfo}"
             style="${this.generateColorSwatchStyle(colorData, isActive)}">
        </div>
      `;
    });
    
    colorSwatchesHTML += `
        </div>
      </div>
    `;
    
    // 添加右箭头（如果颜色数量超过5个）
    if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn right-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="1">
          <i class="fa fa-chevron-right"></i>
        </button>
      `;
    }
    
    colorSwatchesContainer.innerHTML = colorSwatchesHTML;
    
    // 确保色块名称正确显示
    const firstColorName = exteriorImages[0]?.name || '未知颜色';
    colorNameContainer.textContent = firstColorName;
    console.log('🎨 外观色块名称设置:', firstColorName);
    
    // 设置颜色块的样式并绑定事件
    const colorSwatches = colorSwatchesContainer.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch, index) => {
      swatch.style.flexShrink = '0'; // 防止色块被压缩
      
      // 绑定点击事件
      swatch.addEventListener('click', () => {
        this.selectExteriorColorSwatch(swatch, exteriorImages[index].mainImage, exteriorImages[index].name);
      });
    });
    
    // 绑定箭头按钮事件
    const leftArrow = colorSwatchesContainer.querySelector('.left-arrow');
    const rightArrow = colorSwatchesContainer.querySelector('.right-arrow');
    
    if (leftArrow) {
      leftArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollExteriorColorSwatches(-1, colorSwatchesContainer);
      });
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollExteriorColorSwatches(1, colorSwatchesContainer);
      });
    }
    
    // 存储当前滚动位置
    colorSwatchesContainer.currentPage = 0;
    colorSwatchesContainer.maxPages = Math.ceil(totalColors / maxVisible);
    
    // 绑定实例引用
    colorSwatchesContainer.carSearchInstance = this;
  }
  
  // 滚动外观颜色色块显示
  scrollExteriorColorSwatches(direction, container) {
    if (!container) return;
    
    const inner = container.querySelector('.color-swatches-inner');
    const maxVisible = 5; // 默认显示5个色块
    const totalColors = container.querySelectorAll('.color-swatch').length;
    const maxPages = Math.ceil(totalColors / maxVisible);
    
    if (direction === -1 && container.currentPage > 0) {
      container.currentPage--;
    } else if (direction === 1 && container.currentPage < maxPages - 1) {
      container.currentPage++;
    }
    
    // 计算偏移量，确保每次显示完整的5个色块
    const swatchWidth = 24; // 色块宽度
    const swatchGap = 8; // 色块间距
    const swatchTotalWidth = swatchWidth + swatchGap; // 每个色块的总宽度
    const translateX = -(container.currentPage * maxVisible * swatchTotalWidth);
    inner.style.transform = `translateX(${translateX}px)`;
    
    // 更新箭头状态
    const leftArrow = container.querySelector('.left-arrow');
    const rightArrow = container.querySelector('.right-arrow');
    
    if (leftArrow) {
      leftArrow.style.opacity = container.currentPage === 0 ? '0.3' : '1';
      leftArrow.style.pointerEvents = container.currentPage === 0 ? 'none' : 'auto';
    }
    
    if (rightArrow) {
      rightArrow.style.opacity = container.currentPage === maxPages - 1 ? '0.3' : '1';
      rightArrow.style.pointerEvents = container.currentPage === maxPages - 1 ? 'none' : 'auto';
    }
  }
  
  // 选择外观颜色色块
  selectExteriorColorSwatch(swatch, imageUrl, colorName) {
    // 移除其他色块的活动状态
    const container = swatch.closest('#exteriorColorSwatches');
    const allSwatches = container.querySelectorAll('.color-swatch');
    allSwatches.forEach(s => {
      s.classList.remove('active');
      s.style.border = '1px solid #000';
      s.style.transform = 'scale(1)';
    });
    
    // 设置当前色块为活动状态
    swatch.classList.add('active');
    swatch.style.border = '2px solid #3b82f6';
    swatch.style.transform = 'scale(1.1)';
    
    // 更新图片和颜色名称
    const imageBox = document.querySelector('#exteriorImageBox img');
    if (imageBox) {
      imageBox.src = imageUrl;
      // 更新双击事件
      imageBox.addEventListener('dblclick', () => this.openImageModal(imageUrl, colorName, '外观图片'));
    }
    
    const colorNameElement = document.querySelector('#exteriorColorName');
    if (colorNameElement) {
      colorNameElement.textContent = colorName;
      console.log('🎨 外观色块名称更新:', colorName);
    }
  }
  
  // 设置内饰颜色选择器
  setupInteriorColorSelector(carData) {
    const colorSwatchesContainer = Utils.getElement('interiorColorSwatches');
    const colorNameContainer = Utils.getElement('interiorColorName');
    
    if (!colorSwatchesContainer || !colorNameContainer) return;
    
    const interiorImages = carData.interiorImages;
    if (!interiorImages || interiorImages.length === 0) {
      colorSwatchesContainer.innerHTML = '';
      colorNameContainer.textContent = '';
      colorSwatchesContainer.style.display = 'none'; // 完全隐藏容器
      return;
    }
    
    // 确保色块名称容器可见并重置
    colorNameContainer.style.display = 'block';
    colorNameContainer.textContent = '';
    
    // 有数据时显示容器
    colorSwatchesContainer.style.display = 'flex';
    
    const maxVisible = 5; // 默认显示5个颜色块
    const totalColors = interiorImages.length;
    
    // 创建颜色选择器HTML
    let colorSwatchesHTML = '';
    
    // 添加左箭头（如果颜色数量超过5个）
    if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn left-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="-1">
          <i class="fa fa-chevron-left"></i>
        </button>
      `;
    }
    
    // 添加颜色块容器 - 智能宽度计算和居中显示
    const swatchWidth = 24; // 色块宽度
    const swatchGap = 8; // 色块间距
    const hasPagination = totalColors > maxVisible;
    
    // 根据色块数量计算容器宽度
    let containerWidth;
    let innerStyle;
    
    const containerPadding = 16; // 容器左右内边距
    
    if (hasPagination) {
      // 有分页时，固定显示5个色块的宽度 + 左右内边距
      containerWidth = 176; // 调整为176px，确保5个色块完全显示
      innerStyle = 'position: absolute; left: 8px; width: calc(100% - 16px);'; // 左边距8px，右边距8px，确保色块不贴边
    } else {
      // 无分页时，根据实际色块数量计算宽度并居中 + 左右内边距
      containerWidth = totalColors * swatchWidth + (totalColors - 1) * swatchGap + containerPadding;
      innerStyle = 'position: static; justify-content: center;';
    }
    
    colorSwatchesHTML += `
      <div class="color-swatches-wrapper flex items-center justify-center" style="width: ${containerWidth}px; height: 40px; overflow: hidden; padding: 0 8px;">
        <div class="color-swatches-inner flex items-center space-x-2 transition-transform duration-300" style="transform: translateX(0px); ${innerStyle}">
    `;
    
    // 添加所有颜色块
    interiorImages.forEach((colorData, index) => {
      const isActive = index === 0; // 第一个颜色为默认选中
      const colorName = colorData.name || `颜色${index + 1}`;
      
      // 获取配置信息
      const configInfo = this.getConfigInfoForInteriorColor(carData, colorData);
      
      colorSwatchesHTML += `
        <div class="color-swatch ${isActive ? 'active' : ''}" 
             data-index="${index}" 
             data-image="${colorData.mainImage}"
             data-color-name="${colorName}"
             data-config-info="${configInfo}"
             style="${this.generateColorSwatchStyle(colorData, isActive)}">
        </div>
      `;
    });
    
    colorSwatchesHTML += `
        </div>
      </div>
    `;
    
    // 添加右箭头（如果颜色数量超过5个）
    if (totalColors > maxVisible) {
      colorSwatchesHTML += `
        <button class="color-nav-btn right-arrow text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
                type="button" data-direction="1">
          <i class="fa fa-chevron-right"></i>
        </button>
      `;
    }
    
    colorSwatchesContainer.innerHTML = colorSwatchesHTML;
    
    // 确保色块名称正确显示
    const firstColorName = interiorImages[0]?.name || '未知颜色';
    colorNameContainer.textContent = firstColorName;
    console.log('🎨 内饰色块名称设置:', firstColorName);
    
    // 设置颜色块的样式并绑定事件
    const colorSwatches = colorSwatchesContainer.querySelectorAll('.color-swatch');
    colorSwatches.forEach((swatch, index) => {
      swatch.style.flexShrink = '0'; // 防止色块被压缩
      
      // 绑定点击事件
      swatch.addEventListener('click', () => {
        this.selectInteriorColorSwatch(swatch, interiorImages[index].mainImage, interiorImages[index].name);
      });
    });
    
    // 绑定箭头按钮事件
    const leftArrow = colorSwatchesContainer.querySelector('.left-arrow');
    const rightArrow = colorSwatchesContainer.querySelector('.right-arrow');
    
    if (leftArrow) {
      leftArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollInteriorColorSwatches(-1, colorSwatchesContainer);
      });
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.scrollInteriorColorSwatches(1, colorSwatchesContainer);
      });
    }
    
    // 存储当前滚动位置
    colorSwatchesContainer.currentPage = 0;
    colorSwatchesContainer.maxPages = Math.ceil(totalColors / maxVisible);
    
    // 绑定实例引用
    colorSwatchesContainer.carSearchInstance = this;
  }
  
  // 滚动内饰颜色色块显示
  scrollInteriorColorSwatches(direction, container) {
    if (!container) return;
    
    const inner = container.querySelector('.color-swatches-inner');
    const maxVisible = 5; // 默认显示5个色块
    const totalColors = container.querySelectorAll('.color-swatch').length;
    const maxPages = Math.ceil(totalColors / maxVisible);
    
    if (direction === -1 && container.currentPage > 0) {
      container.currentPage--;
    } else if (direction === 1 && container.currentPage < maxPages - 1) {
      container.currentPage++;
    }
    
    // 计算偏移量，确保每次显示完整的5个色块
    const swatchWidth = 24; // 色块宽度
    const swatchGap = 8; // 色块间距
    const swatchTotalWidth = swatchWidth + swatchGap; // 每个色块的总宽度
    const translateX = -(container.currentPage * maxVisible * swatchTotalWidth);
    inner.style.transform = `translateX(${translateX}px)`;
    
    // 更新箭头状态
    const leftArrow = container.querySelector('.left-arrow');
    const rightArrow = container.querySelector('.right-arrow');
    
    if (leftArrow) {
      leftArrow.style.opacity = container.currentPage === 0 ? '0.3' : '1';
      leftArrow.style.pointerEvents = container.currentPage === 0 ? 'none' : 'auto';
    }
    
    if (rightArrow) {
      rightArrow.style.opacity = container.currentPage === maxPages - 1 ? '0.3' : '1';
      rightArrow.style.pointerEvents = container.currentPage === maxPages - 1 ? 'none' : 'auto';
    }
  }
  
  // 选择内饰颜色色块
  selectInteriorColorSwatch(swatch, imageUrl, colorName) {
    // 移除其他色块的活动状态
    const container = swatch.closest('#interiorColorSwatches');
    const allSwatches = container.querySelectorAll('.color-swatch');
    allSwatches.forEach(s => {
      s.classList.remove('active');
      s.style.border = '1px solid #000';
      s.style.transform = 'scale(1)';
    });
    
    // 设置当前色块为活动状态
    swatch.classList.add('active');
    swatch.style.border = '2px solid #3b82f6';
    swatch.style.transform = 'scale(1.1)';
    
    // 更新图片和颜色名称
    const imageBox = document.querySelector('#interiorImageBox img');
    if (imageBox) {
      imageBox.src = imageUrl;
      // 更新双击事件
      imageBox.addEventListener('dblclick', () => this.openImageModal(imageUrl, colorName, '内饰图片'));
    }
    
    const colorNameElement = document.querySelector('#interiorColorName');
    if (colorNameElement) {
      colorNameElement.textContent = colorName;
      console.log('🎨 内饰色块名称更新:', colorName);
    }
  }
  
  // 打开图片弹窗
  openImageModal(imageUrl, imageAlt, imageType) {
    const modal = Utils.getElement('imageModal');
    const modalImage = Utils.getElement('modalImage');
    const modalImageTitle = Utils.getElement('modalImageTitle');
    const modalImageSubtitle = Utils.getElement('modalImageSubtitle');
    
    if (modal && modalImage && modalImageTitle && modalImageSubtitle) {
      // 设置图片
      modalImage.src = imageUrl;
      modalImage.alt = imageAlt;
      
      // 获取当前车型数据
      const currentCar = this.getCurrentCarData();
      let titleText = imageAlt;
      let subtitleText = imageType;
      
      if (currentCar) {
        // 第一行：品牌+车型+配置
        const brandName = currentCar.brand || '未知品牌';
        const carName = currentCar.name || currentCar.carName || '未知车型';
        const configName = this.getCurrentConfigName(imageType);
        titleText = `${brandName} ${carName}`;
        if (configName) {
          titleText += ` ${configName}`;
        }
        
        // 第二行：色块+颜色名称
        const colorName = this.getCurrentColorName(imageType);
        subtitleText = `${imageType} | ${colorName}`;
      }
      
      // 设置标题和副标题
      modalImageTitle.textContent = titleText;
      modalImageSubtitle.textContent = subtitleText;
      
      // 显示弹窗
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      // 绑定关闭事件
      this.bindModalEvents();
      
      // 阻止页面滚动
      document.body.style.overflow = 'hidden';
    }
  }
  
  // 获取当前车型数据
  getCurrentCarData() {
    // 从搜索历史或当前显示中获取车型数据
    if (this.searchHistory && this.searchHistory.length > 0) {
      const lastSearch = this.searchHistory[this.searchHistory.length - 1];
      if (lastSearch && lastSearch.carData) {
        return lastSearch.carData;
      }
    }
    
    // 如果没有搜索历史，尝试从当前页面获取
    const searchInput = Utils.getElement('searchInput');
    if (searchInput && searchInput.value) {
      // 尝试从当前页面状态获取车型数据
      const currentCarName = searchInput.value;
      
      // 在所有车型中查找匹配的车型
      for (const brand of this.allCars) {
        if (brand.cars && Array.isArray(brand.cars)) {
          for (const car of brand.cars) {
            if (car.name === currentCarName || car.carName === currentCarName) {
              return {
                ...car,
                brand: brand.name || brand.brandName || '未知品牌'
              };
            }
          }
        }
      }
    }
    
    return null;
  }
  
  // 获取当前配置名称
  getCurrentConfigName(imageType) {
    // 根据图片类型获取对应的配置名称
    if (imageType === '外观图片') {
      const exteriorSelector = Utils.getElement('exteriorColorSelector');
      if (exteriorSelector) {
        const activeSwatch = exteriorSelector.querySelector('.color-swatch.active');
        if (activeSwatch) {
          const configInfo = activeSwatch.getAttribute('data-config-info');
          if (configInfo) {
            return configInfo;
          }
        }
      }
    } else if (imageType === '内饰图片') {
      const interiorSelector = Utils.getElement('interiorColorSelector');
      if (interiorSelector) {
        const activeSwatch = interiorSelector.querySelector('.color-swatch.active');
        if (activeSwatch) {
          const configInfo = activeSwatch.getAttribute('data-config-info');
          if (configInfo) {
            return configInfo;
          }
        }
      }
    }
    
    // 如果没有找到配置信息，尝试从当前车型数据获取
    const currentCar = this.getCurrentCarData();
    if (currentCar && currentCar.configs && Array.isArray(currentCar.configs)) {
      // 返回第一个配置的名称作为默认值
      return currentCar.configs[0]?.name || '';
    }
    
    return '';
  }
  
  // 获取当前颜色名称
  getCurrentColorName(imageType) {
    if (imageType === '外观图片') {
      const colorNameElement = Utils.getElement('exteriorColorName');
      if (colorNameElement && colorNameElement.textContent) {
        return colorNameElement.textContent;
      }
    } else if (imageType === '内饰图片') {
      const colorNameElement = Utils.getElement('interiorColorName');
      if (colorNameElement && colorNameElement.textContent) {
        return colorNameElement.textContent;
      }
    }
    
    return '未知颜色';
  }
  
  // 关闭图片弹窗
  closeImageModal() {
    const modal = Utils.getElement('imageModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      
      // 恢复页面滚动
      document.body.style.overflow = 'auto';
    }
  }
  
  // 绑定弹窗事件
  bindModalEvents() {
    const modal = Utils.getElement('imageModal');
    const closeBtn = Utils.getElement('closeImageModal');
    
    if (modal && closeBtn) {
      // 关闭按钮点击事件
      closeBtn.addEventListener('click', () => this.closeImageModal());
      
      // 点击弹窗背景关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeImageModal();
        }
      });
      
      // ESC键关闭弹窗
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeImageModal();
        }
      });
    }
  }

  // 获取配置信息
  getConfigInfoForColor(carData, colorData) {
    // 尝试从车型数据中获取配置信息
    if (carData.configs && Array.isArray(carData.configs)) {
      // 查找包含当前颜色的配置
      for (const config of carData.configs) {
        if (config.exteriorImages && Array.isArray(config.exteriorImages)) {
          const hasColor = config.exteriorImages.some(img => 
            img.name === colorData.name || img.mainImage === colorData.mainImage
          );
          if (hasColor && config.name) {
            return config.name;
          }
        }
      }
    }
    
    // 如果没有找到具体配置，返回车型名称
    return carData.name || carData.carName || '';
  }

  // 获取内饰颜色配置信息
  getConfigInfoForInteriorColor(carData, colorData) {
    // 尝试从车型数据中获取配置信息
    if (carData.configs && Array.isArray(carData.configs)) {
      // 查找包含当前颜色的配置
      for (const config of carData.configs) {
        if (config.interiorImages && Array.isArray(config.interiorImages)) {
          const hasColor = config.interiorImages.some(img => 
            img.name === colorData.name || img.mainImage === colorData.mainImage
          );
          if (hasColor && config.name) {
            return config.name;
          }
        }
      }
    }
    
    // 如果没有找到具体配置，返回车型名称
    return carData.name || carData.carName || '';
  }
} 