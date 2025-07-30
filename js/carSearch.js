import { Utils } from './utils.js';

// 车辆搜索模块
export class CarSearch {
  constructor() {
    this.allCars = [];
    this.allCarsLoaded = false;
    this.searchHistory = this.loadSearchHistory();
  }
  
  // 初始化搜索功能
  async initialize() {
    await this.loadAllCars();
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
  
  // 绑定搜索事件
  bindSearchEvents() {
    const carInput = Utils.getElement('searchCarInput');
    const carResultBox = Utils.getElement('searchCarResults');
    
    if (!carInput || !carResultBox) return;
    
    // 输入事件
    carInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length >= 1) {
        this.performSearch(query);
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
      const results = carResultBox.querySelectorAll('.search-result-item');
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
          const selectedItem = carResultBox.querySelector('.search-result-item.bg-primary/10');
          if (selectedItem) {
            this.selectCar(selectedItem);
          }
          break;
        case 'Escape':
          this.hideResults();
          break;
      }
    });
  }
  
  // 执行搜索
  performSearch(query) {
    if (!this.allCarsLoaded) return;
    
    const results = this.allCars.filter(car => {
      const searchText = `${car.brand} ${car.name}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    }).slice(0, 10); // 限制结果数量
    
    this.displayResults(results);
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
      carResultBox.innerHTML = '<div class="p-4 text-center text-gray-500">未找到相关车型</div>';
    } else {
      carResultBox.innerHTML = results.map(car => this.createResultItem(car)).join('');
      
      // 为搜索结果项添加点击事件
      carResultBox.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectCar(item);
        });
      });
    }
    
    Utils.toggleElement('searchCarResults', true);
  }
  
  // 创建搜索结果项
  createResultItem(car) {
    return `
      <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors" data-car='${JSON.stringify(car)}'>
        <div class="flex items-center gap-3">
          <img src="${car.brandImage || '/placeholder.png'}" alt="${car.brand}" class="w-8 h-8 rounded object-cover">
          <div class="flex-1">
            <div class="font-medium text-gray-900">${car.name}</div>
            <div class="text-sm text-gray-500">${car.brand}</div>
          </div>
        </div>
      </div>
    `;
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
  selectCar(item) {
    const carData = JSON.parse(item.dataset.car);
    const carInput = Utils.getElement('searchCarInput');
    
    if (carInput) {
      carInput.value = `${carData.brand} ${carData.name}`;
      this.hideResults();
      this.addToSearchHistory(carData);
      
      // 填充车型详细信息
      this.fillCarDetails(carData);
    }
  }
  
  // 填充车型详细信息
  fillCarDetails(carData) {
    // 填充基础信息
    Utils.setElementValue('brandName2', carData.brand);
    Utils.setElementValue('carModel2', carData.name);
    Utils.setElementValue('fuelType2', carData.fuelType || '未知');
    Utils.setElementValue('size2', carData.size || '未知');
    Utils.setElementValue('price2', carData.price ? `${carData.price}万元` : '未知');
    
    // 显示基础信息区域
    Utils.toggleElement('baseInfoSection', true);
    
    // 设置品牌logo
    const brandLogoBox = Utils.getElement('brandLogoBox2');
    if (brandLogoBox && carData.brandImage) {
      brandLogoBox.innerHTML = `<img src="${carData.brandImage}" alt="${carData.brand}" class="w-12 h-12 object-contain">`;
    }
    
    // 设置车型图片
    const carMainImageBox = Utils.getElement('carMainImageBox');
    if (carMainImageBox && carData.image) {
      carMainImageBox.innerHTML = `<img src="${carData.image}" alt="${carData.name}" class="max-w-full max-h-full object-contain">`;
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
            <img src="${item.brandImage || '/placeholder.png'}" alt="${item.brand}" class="w-6 h-6 rounded object-cover">
            <div class="flex-1">
              <div class="font-medium text-gray-900 text-sm">${item.name}</div>
              <div class="text-xs text-gray-500">${item.brand}</div>
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
            carInput.value = `${carData.brand} ${carData.name}`;
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
} 