// 缓存监控工具
import { cacheManager } from './cacheManager.js';

export class CacheMonitor {
  constructor() {
    this.isVisible = false;
    this.createMonitorUI();
    this.bindEvents();
  }

  // 创建监控UI
  createMonitorUI() {
    const monitorHTML = `
      <div id="cacheMonitor" class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80 z-50 hidden">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">缓存监控</h3>
          <button id="closeCacheMonitor" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="space-y-3">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-blue-800 dark:text-blue-200">内存缓存</span>
              <span id="memoryCacheSize" class="text-sm text-blue-600 dark:text-blue-300">0/100</span>
            </div>
            <div class="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2 mt-1">
              <div id="memoryCacheBar" class="bg-blue-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          
          <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-green-800 dark:text-green-200">会话缓存</span>
              <span id="sessionCacheSize" class="text-sm text-green-600 dark:text-green-300">0/20</span>
            </div>
            <div class="w-full bg-green-200 dark:bg-green-700 rounded-full h-2 mt-1">
              <div id="sessionCacheBar" class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
          
          <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-purple-800 dark:text-purple-200">本地存储</span>
              <span id="localCacheSize" class="text-sm text-purple-600 dark:text-purple-300">0/50</span>
            </div>
            <div class="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-2 mt-1">
              <div id="localCacheBar" class="bg-purple-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>
        </div>
        
        <div class="mt-4 space-y-2">
          <button id="clearAllCache" class="w-full bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition-colors">
            清空所有缓存
          </button>
          <button id="clearExpiredCache" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-3 rounded transition-colors">
            清理过期缓存
          </button>
          <button id="refreshCacheStats" class="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors">
            刷新统计
          </button>
        </div>
        
        <div class="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <div>内存缓存: 30分钟过期</div>
          <div>会话缓存: 2小时过期</div>
          <div>本地存储: 24小时过期</div>
        </div>
      </div>
      
      <button id="showCacheMonitor" class="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg z-40 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      </button>
    `;

    // 添加到页面
    const container = document.createElement('div');
    container.innerHTML = monitorHTML;
    document.body.appendChild(container);
  }

  // 绑定事件
  bindEvents() {
    // 显示监控器
    document.getElementById('showCacheMonitor')?.addEventListener('click', () => {
      this.show();
    });

    // 关闭监控器
    document.getElementById('closeCacheMonitor')?.addEventListener('click', () => {
      this.hide();
    });

    // 清空所有缓存
    document.getElementById('clearAllCache')?.addEventListener('click', () => {
      this.clearAllCache();
    });

    // 清理过期缓存
    document.getElementById('clearExpiredCache')?.addEventListener('click', () => {
      this.clearExpiredCache();
    });

    // 刷新统计
    document.getElementById('refreshCacheStats')?.addEventListener('click', () => {
      this.updateStats();
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      const monitor = document.getElementById('cacheMonitor');
      const showButton = document.getElementById('showCacheMonitor');
      
      if (this.isVisible && monitor && !monitor.contains(e.target) && !showButton.contains(e.target)) {
        this.hide();
      }
    });
  }

  // 显示监控器
  show() {
    const monitor = document.getElementById('cacheMonitor');
    if (monitor) {
      monitor.classList.remove('hidden');
      this.isVisible = true;
      this.updateStats();
    }
  }

  // 隐藏监控器
  hide() {
    const monitor = document.getElementById('cacheMonitor');
    if (monitor) {
      monitor.classList.add('hidden');
      this.isVisible = false;
    }
  }

  // 更新统计信息
  updateStats() {
    const stats = cacheManager.getStats();
    
    // 更新内存缓存
    const memorySize = document.getElementById('memoryCacheSize');
    const memoryBar = document.getElementById('memoryCacheBar');
    if (memorySize && memoryBar) {
      const percentage = (stats.memory.size / stats.memory.maxSize) * 100;
      memorySize.textContent = `${stats.memory.size}/${stats.memory.maxSize}`;
      memoryBar.style.width = `${percentage}%`;
    }

    // 更新会话缓存
    const sessionSize = document.getElementById('sessionCacheSize');
    const sessionBar = document.getElementById('sessionCacheBar');
    if (sessionSize && sessionBar) {
      const percentage = (stats.sessionStorage.size / stats.sessionStorage.maxSize) * 100;
      sessionSize.textContent = `${stats.sessionStorage.size}/${stats.sessionStorage.maxSize}`;
      sessionBar.style.width = `${percentage}%`;
    }

    // 更新本地存储
    const localSize = document.getElementById('localCacheSize');
    const localBar = document.getElementById('localCacheBar');
    if (localSize && localBar) {
      const percentage = (stats.localStorage.size / stats.localStorage.maxSize) * 100;
      localSize.textContent = `${stats.localStorage.size}/${stats.localStorage.maxSize}`;
      localBar.style.width = `${percentage}%`;
    }
  }

  // 清空所有缓存
  clearAllCache() {
    if (confirm('确定要清空所有缓存吗？这将清除所有已缓存的车型数据。')) {
      cacheManager.clear('all');
      this.updateStats();
      this.showNotification('所有缓存已清空', 'success');
    }
  }

  // 清理过期缓存
  clearExpiredCache() {
    cacheManager.cleanup();
    this.updateStats();
    this.showNotification('过期缓存已清理', 'info');
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    const colors = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white'
    };
    
    notification.className += ` ${colors[type] || colors.info}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // 获取缓存详情
  getCacheDetails() {
    const details = {
      memory: Array.from(cacheManager.memoryCache.entries()).map(([key, entry]) => ({
        key,
        size: JSON.stringify(entry.value).length,
        expiresAt: new Date(entry.expiresAt).toLocaleString(),
        accessCount: entry.accessCount
      })),
      sessionStorage: Array.from(cacheManager.sessionStorageCache.entries()).map(([key, entry]) => ({
        key,
        size: JSON.stringify(entry.value).length,
        expiresAt: new Date(entry.expiresAt).toLocaleString(),
        accessCount: entry.accessCount
      })),
      localStorage: Array.from(cacheManager.localStorageCache.entries()).map(([key, entry]) => ({
        key,
        size: JSON.stringify(entry.value).length,
        expiresAt: new Date(entry.expiresAt).toLocaleString(),
        accessCount: entry.accessCount
      }))
    };
    
    return details;
  }

  // 导出缓存统计
  exportStats() {
    const stats = cacheManager.getStats();
    const details = this.getCacheDetails();
    
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      details
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 创建全局缓存监控实例
export const cacheMonitor = new CacheMonitor();

// 定期更新统计信息
setInterval(() => {
  if (cacheMonitor.isVisible) {
    cacheMonitor.updateStats();
  }
}, 5000); // 每5秒更新一次 