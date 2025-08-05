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
      // 从网络加载
      console.log('🔄 开始加载车型数据...');
      
      // 测试网络连接
      const testRes = await fetch('https://dbtknight.netlify.app/data/brands.json', {
        method: 'HEAD'
      });
      console.log('🌐 网络连接测试:', testRes.ok ? '成功' : '失败');
      
      const brandsRes = await fetch('https://dbtknight.netlify.app/data/brands.json');
      
      if (!brandsRes.ok) {
        throw new Error(`加载brands.json失败: ${brandsRes.status} ${brandsRes.statusText}`);
      }
      
      const brands = await brandsRes.json();
      console.log(`📋 找到 ${brands.length} 个品牌`);
      
      if (brands.length === 0) {
        throw new Error('brands.json 为空或格式错误');
      }
      
      // 加载所有品牌
      console.log(`📥 开始加载 ${brands.length} 个品牌的数据`);
      
      // 并行加载品牌数据
      const carPromises = brands.map(async (brand) => {
        const cacheKey = `brand:${brand.name}`;
        let brandData = cacheManager.get(cacheKey, 'memory');
        
        if (!brandData) {
          try {
            console.log(`📥 加载品牌: ${brand.name} (${brand.file})`);
            const res = await fetch(`https://dbtknight.netlify.app/data/${brand.file}`);
            
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
              brand: brandData.brand || brand.name,
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
      
      console.log(`✅ 成功加载并缓存 ${this.allCars.length} 个车型数据`);
      
      // 测试搜索索引
      this.buildSearchIndex();
      console.log(`🔍 搜索索引构建完成，包含 ${this.searchIndex.size} 个索引项`);
      
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
      
      // 索引品牌名
      if (car.brand) {
        const brandLower = car.brand.toLowerCase();
        this.addToIndex(brandLower, carIndex);
      }
      
      // 索引品牌名+车型名的组合
      if (car.brand && car.carName) {
        const brandCarCombination = `${car.brand.toLowerCase()} ${car.carName.toLowerCase()}`;
        this.addToIndex(brandCarCombination, carIndex);
        
        // 索引品牌名+车型名的每个词组合
        const brandWords = car.brand.toLowerCase().split(/\s+/);
        const carWords = car.carName.toLowerCase().split(/\s+/);
        
        // 生成品牌词和车型词的组合
        brandWords.forEach(brandWord => {
          if (brandWord.length > 1) {
            carWords.forEach(carWord => {
              if (carWord.length > 1) {
                const combination = `${brandWord} ${carWord}`;
                this.addToIndex(combination, carIndex);
              }
            });
          }
        });
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
          const selectedItem = carResultBox.querySelector('div[onmousedown].bg-primary/10');
          if (selectedItem) {
            selectedItem.click();
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
    
    // 完全匹配查询字符串
    if (this.searchIndex.has(queryLower)) {
      this.searchIndex.get(queryLower).forEach(carIndex => {
        carScores.set(carIndex, (carScores.get(carIndex) || 0) + 20);
      });
    }
    
    queryWords.forEach(word => {
      // 完全匹配单个词
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
      
      // 包含匹配
      for (const [term, carIndices] of this.searchIndex) {
        if (term.includes(word)) {
          carIndices.forEach(carIndex => {
            carScores.set(carIndex, (carScores.get(carIndex) || 0) + 3);
          });
        }
      }
    });
    
    // 构建结果
    const results = [];
    carScores.forEach((score, carIndex) => {
      const car = this.allCars[carIndex];
      if (car && score > 0) {
        if (car.configs && car.configs.length > 0) {
          car.configs.forEach(config => {
            let configScore = score;
            
            // 配置名匹配加分
            if (config.configName) {
              const configNameLower = config.configName.toLowerCase();
              if (configNameLower.includes(queryLower)) {
                configScore += 8;
              } else if (queryWords.some(word => configNameLower.includes(word))) {
                configScore += 4;
              }
            }
            
            results.push({ 
              car, 
              config, 
              displayText: config.configName,
              score: configScore
            });
          });
        } else {
          let carScore = score;
          
          // 车型名匹配加分
          if (car.carName) {
            const carNameLower = car.carName.toLowerCase();
            if (carNameLower.includes(queryLower)) {
              carScore += 8;
            } else if (queryWords.some(word => carNameLower.includes(word))) {
              carScore += 4;
            }
          }
          
          results.push({ 
            car, 
            config: null, 
            displayText: car.carName,
            score: carScore
          });
        }
      }
    });
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }
  
  // 显示搜索结果
  displayResults(results) {
    const carResultBox = Utils.getElement('searchCarResults');
    const searchInput = Utils.getElement('searchCarInput');
    if (!carResultBox || !searchInput) return;
    
    // 定位下拉菜单 - 相对定位，固定在搜索栏下方
    const inputRect = searchInput.getBoundingClientRect();
    carResultBox.style.position = 'absolute';
    carResultBox.style.top = `${inputRect.bottom + 5}px`;
    carResultBox.style.left = `${inputRect.left}px`;
    carResultBox.style.width = `${inputRect.width}px`;
    carResultBox.style.zIndex = '999999';
    
    if (results.length === 0) {
      carResultBox.innerHTML = '<div class="px-4 py-2 text-gray-400 text-center">未找到相关车型</div>';
    } else {
      carResultBox.innerHTML = '';
      results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0';
        
        // 品牌logo
        if (result.car.brandImage) {
          const img = document.createElement('img');
          img.src = result.car.brandImage;
          img.alt = result.car.brand;
          img.className = 'w-8 h-8 object-contain rounded';
          div.appendChild(img);
        }
        
        // 创建内容容器
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1 min-w-0';
        
        // 品牌名
        const brandName = result.car.brand || result.car.seriesName || '';
        
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
        
        displayContent = parts.join(' <span class="text-gray-400">-</span> ');
        
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
        
        carResultBox.appendChild(div);
      });
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
    
    // 确保displayText不为undefined
    let displayText = '';
    if (config && config.configName) {
      displayText = config.configName;
    } else if (car && car.carName) {
      displayText = car.carName;
    } else if (car && car.name) {
      displayText = car.name;
    } else {
      displayText = '未知车型';
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
    
    // 设置车型图片
    const carMainImageBox = Utils.getElement('carMainImageBox');
    if (carMainImageBox && (carData.image || carData.mainImage)) {
      const imageUrl = carData.image || carData.mainImage;
      const imageAlt = carData.name || carData.carName;
      carMainImageBox.innerHTML = `<img src="${imageUrl}" alt="${imageAlt}" class="w-full h-full object-contain rounded bg-gray-50 scale-150 -z-10">`;
    } else {
      // 如果没有图片，显示占位符
      carMainImageBox.innerHTML = `
        <div class="flex flex-col items-center justify-center text-gray-400 w-full h-full">
          <i class="fa fa-car text-4xl mb-2"></i>
          <span class="text-sm">暂无图片</span>
        </div>
      `;
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
        // 处理历史记录显示数据
        const brandName = item.brand || item.seriesName || '';
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
  
  // 处理历史记录项点击
  handleHistoryItemClick(carData) {
    const carInput = Utils.getElement('searchCarInput');
    if (!carInput) return;
    
    // 获取品牌和车型信息
    const brand = carData.brand || carData.seriesName || '';
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
      const carBrand = car.brand || car.seriesName || '';
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
} 