import { Utils } from './utils.js';

// 车辆搜索模块
export class CarSearch {
  constructor() {
    this.allCars = [];
    this.allCarsLoaded = false;
    this.searchHistory = this.loadSearchHistory();
    this.searchIndex = new Map(); // 搜索索引
    this.searchCache = new Map(); // 搜索结果缓存
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
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
      const brandsRes = await fetch('/api/brands');
      const brands = await brandsRes.json();
      
      let carPromises = brands.map(async (brand) => {
        try {
          const res = await fetch(`/api/brands/${brand.name}`);
          const data = await res.json();
          if (data.cars && Array.isArray(data.cars)) {
            return data.cars.map(car => ({
              ...car,
              brand: data.brand,
              brandImage: data.brandImage
            }));
          }
        } catch (e) {
          console.error(`加载品牌 ${brand.name} 失败:`, e);
          return [];
        }
        return [];
      });
      
      const carsArr = await Promise.all(carPromises);
      this.allCars = carsArr.flat();
      this.allCarsLoaded = true;
    } catch (e) {
      console.error('加载所有车型失败', e);
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
    const cacheKey = query.toLowerCase();
    const cached = this.searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      this.displayResults(cached.results);
      return;
    }
    
    const results = this.searchWithIndex(query);
    
    // 缓存结果
    this.searchCache.set(cacheKey, {
      results: results.slice(0, 20),
      timestamp: Date.now()
    });
    
    this.displayResults(results.slice(0, 20));
  }
  
  // 使用索引进行搜索
  searchWithIndex(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    // 计算每个车型的匹配分数
    const carScores = new Map();
    
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
  
  // 显示搜索结果
  displayResults(results) {
    const carResultBox = Utils.getElement('searchCarResults');
    const searchInput = Utils.getElement('searchCarInput');
    if (!carResultBox || !searchInput) return;
    
    // 定位下拉菜单
    const inputRect = searchInput.getBoundingClientRect();
    carResultBox.style.position = 'fixed';
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
          img.className = 'w-8 h-8 object-contain rounded mr-2';
          div.appendChild(img);
        }
        
        // 车型和配置名称分色显示
        let mainName = '';
        let subName = '';
        if (result.config && result.car && result.config.configName && result.car.carName && result.config.configName.startsWith(result.car.carName)) {
          mainName = result.car.carName;
          subName = result.config.configName.slice(result.car.carName.length);
        } else if (result.car && result.car.carName) {
          mainName = result.car.carName;
          subName = '';
        } else {
          mainName = result.displayText;
          subName = '';
        }
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium flex-1';
        nameSpan.innerHTML = `<span>${mainName}</span><span class='text-gray-400'>${subName}</span>`;
        div.appendChild(nameSpan);
        
        // 指导价
        if (result.config && result.config.price) {
          const priceSpan = document.createElement('span');
          priceSpan.textContent = result.config.price;
          priceSpan.className = 'text-red-500 text-sm font-medium';
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
      this.addToSearchHistory({ ...car, ...config });
      
      // 填充车型详细信息
      this.fillCarDetails({ ...car, ...config });
    }
  }
  
  // 填充车型详细信息
  fillCarDetails(carData) {
    // 填充基础信息
    Utils.setElementValue('brandName2', carData.brand || carData.seriesName || '');
    Utils.setElementValue('carModel2', carData.name || carData.carName || '');
    Utils.setElementValue('fuelType2', carData.fuelType || '未知');
    Utils.setElementValue('size2', carData.size || '未知');
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
    
    // 设置品牌logo
    const brandLogoBox = Utils.getElement('brandLogoBox2');
    if (brandLogoBox && carData.brandImage) {
      brandLogoBox.innerHTML = `<img src="${carData.brandImage}" alt="${carData.brand || carData.seriesName}" class="w-12 h-12 object-contain">`;
    }
    
    // 设置车型图片
    const carMainImageBox = Utils.getElement('carMainImageBox');
    if (carMainImageBox && (carData.image || carData.mainImage)) {
      const imageUrl = carData.image || carData.mainImage;
      const imageAlt = carData.name || carData.carName;
      carMainImageBox.innerHTML = `<img src="${imageUrl}" alt="${imageAlt}" class="max-w-full max-h-full object-contain">`;
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
      // 定位历史面板
      const btnRect = historyBtn.getBoundingClientRect();
      historyPanel.style.position = 'fixed';
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
      
      historyList.innerHTML = this.searchHistory.map(item => `
        <div class="history-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" data-car='${JSON.stringify(item)}'>
          <div class="flex items-center gap-3">
            <img src="${item.brandImage || '/placeholder.png'}" alt="${item.brand || item.seriesName || ''}" class="w-6 h-6 rounded object-cover">
            <div class="flex-1">
              <div class="font-medium text-gray-900 text-sm">${item.name || item.carName || item.configName || '未知车型'}</div>
              <div class="text-xs text-gray-500">${item.brand || item.seriesName || '未知品牌'}</div>
            </div>
          </div>
        </div>
      `).join('');
      
      // 绑定历史项点击事件
      historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
          const carData = JSON.parse(item.dataset.car);
          const carInput = Utils.getElement('searchCarInput');
          if (carInput) {
            const brand = carData.brand || carData.seriesName || '';
            const name = carData.name || carData.carName || carData.configName || '';
            carInput.value = `${brand} ${name}`.trim();
            Utils.toggleElement('searchHistoryPanel', false);
          }
        });
      });
    }
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