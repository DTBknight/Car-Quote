// 缓存管理器 - 实现多层次缓存策略
export class CacheManager {
  constructor() {
    this.memoryCache = new Map(); // 内存缓存
    this.localStorageCache = new Map(); // localStorage缓存
    this.sessionStorageCache = new Map(); // sessionStorage缓存
    this.cacheConfig = {
      memory: {
        maxSize: 100, // 最大缓存条目数
        ttl: 30 * 60 * 1000 // 30分钟过期
      },
      localStorage: {
        maxSize: 50,
        ttl: 24 * 60 * 60 * 1000 // 24小时过期
      },
      sessionStorage: {
        maxSize: 20,
        ttl: 2 * 60 * 60 * 1000 // 2小时过期
      }
    };
    
    this.initCache();
  }

  // 初始化缓存
  initCache() {
    try {
      // 从localStorage恢复缓存
      const savedCache = localStorage.getItem('carQuoteCache');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        const now = Date.now();
        
        // 清理过期的缓存
        Object.keys(parsed).forEach(key => {
          if (parsed[key].expiresAt > now) {
            this.localStorageCache.set(key, parsed[key]);
          }
        });
      }
    } catch (error) {
      console.warn('缓存初始化失败:', error);
    }
  }

  // 生成缓存键
  generateKey(type, identifier) {
    return `${type}:${identifier}`;
  }

  // 设置缓存
  set(key, value, options = {}) {
    const {
      level = 'memory', // memory, sessionStorage, localStorage
      ttl = this.cacheConfig[level]?.ttl || 5 * 60 * 1000,
      priority = 1 // 优先级，用于LRU淘汰
    } = options;

    const cacheEntry = {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
      priority,
      accessCount: 0
    };

    switch (level) {
      case 'memory':
        this.setMemoryCache(key, cacheEntry);
        break;
      case 'sessionStorage':
        this.setSessionStorageCache(key, cacheEntry);
        break;
      case 'localStorage':
        this.setLocalStorageCache(key, cacheEntry);
        break;
    }
  }

  // 获取缓存
  get(key, level = 'memory') {
    let cacheEntry = null;

    // 按优先级查找：memory -> sessionStorage -> localStorage
    const levels = ['memory', 'sessionStorage', 'localStorage'];
    const startIndex = levels.indexOf(level);

    for (let i = startIndex; i < levels.length; i++) {
      cacheEntry = this.getFromLevel(key, levels[i]);
      if (cacheEntry) {
        // 更新访问统计
        cacheEntry.accessCount++;
        cacheEntry.lastAccessed = Date.now();
        
        // 如果从较低级别找到，提升到较高级别
        if (i > startIndex) {
          this.set(key, cacheEntry.value, { 
            level: levels[startIndex], 
            ttl: cacheEntry.expiresAt - Date.now() 
          });
        }
        break;
      }
    }

    return cacheEntry?.value || null;
  }

  // 从指定级别获取缓存
  getFromLevel(key, level) {
    let cache = null;
    
    switch (level) {
      case 'memory':
        cache = this.memoryCache;
        break;
      case 'sessionStorage':
        cache = this.sessionStorageCache;
        break;
      case 'localStorage':
        cache = this.localStorageCache;
        break;
    }

    const entry = cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry;
  }

  // 设置内存缓存
  setMemoryCache(key, entry) {
    // 检查容量限制
    if (this.memoryCache.size >= this.cacheConfig.memory.maxSize) {
      this.evictLRU('memory');
    }
    this.memoryCache.set(key, entry);
  }

  // 设置sessionStorage缓存
  setSessionStorageCache(key, entry) {
    if (this.sessionStorageCache.size >= this.cacheConfig.sessionStorage.maxSize) {
      this.evictLRU('sessionStorage');
    }
    this.sessionStorageCache.set(key, entry);
    
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('sessionStorage缓存设置失败:', error);
    }
  }

  // 设置localStorage缓存
  setLocalStorageCache(key, entry) {
    if (this.localStorageCache.size >= this.cacheConfig.localStorage.maxSize) {
      this.evictLRU('localStorage');
    }
    this.localStorageCache.set(key, entry);
    
    try {
      // 保存到localStorage
      const allCache = {};
      this.localStorageCache.forEach((value, key) => {
        allCache[key] = value;
      });
      localStorage.setItem('carQuoteCache', JSON.stringify(allCache));
    } catch (error) {
      console.warn('localStorage缓存设置失败:', error);
    }
  }

  // LRU淘汰策略
  evictLRU(level) {
    let cache = null;
    let maxSize = 0;
    
    switch (level) {
      case 'memory':
        cache = this.memoryCache;
        maxSize = this.cacheConfig.memory.maxSize;
        break;
      case 'sessionStorage':
        cache = this.sessionStorageCache;
        maxSize = this.cacheConfig.sessionStorage.maxSize;
        break;
      case 'localStorage':
        cache = this.localStorageCache;
        maxSize = this.cacheConfig.localStorage.maxSize;
        break;
    }

    if (cache.size < maxSize) return;

    // 找到最少使用的条目
    let lruKey = null;
    let lowestScore = Infinity;

    cache.forEach((entry, key) => {
      const score = entry.accessCount * 0.3 + (Date.now() - entry.lastAccessed) * 0.7;
      if (score < lowestScore) {
        lowestScore = score;
        lruKey = key;
      }
    });

    if (lruKey) {
      cache.delete(lruKey);
    }
  }

  // 删除缓存
  delete(key, level = 'all') {
    if (level === 'all' || level === 'memory') {
      this.memoryCache.delete(key);
    }
    if (level === 'all' || level === 'sessionStorage') {
      this.sessionStorageCache.delete(key);
      try {
        sessionStorage.removeItem(key);
      } catch (error) {
        console.warn('sessionStorage缓存删除失败:', error);
      }
    }
    if (level === 'all' || level === 'localStorage') {
      this.localStorageCache.delete(key);
      try {
        const savedCache = localStorage.getItem('carQuoteCache');
        if (savedCache) {
          const parsed = JSON.parse(savedCache);
          delete parsed[key];
          localStorage.setItem('carQuoteCache', JSON.stringify(parsed));
        }
      } catch (error) {
        console.warn('localStorage缓存删除失败:', error);
      }
    }
  }

  // 清空所有缓存
  clear(level = 'all') {
    if (level === 'all' || level === 'memory') {
      this.memoryCache.clear();
    }
    if (level === 'all' || level === 'sessionStorage') {
      this.sessionStorageCache.clear();
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn('sessionStorage清空失败:', error);
      }
    }
    if (level === 'all' || level === 'localStorage') {
      this.localStorageCache.clear();
      try {
        localStorage.removeItem('carQuoteCache');
      } catch (error) {
        console.warn('localStorage清空失败:', error);
      }
    }
  }

  // 获取缓存统计信息
  getStats() {
    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.cacheConfig.memory.maxSize
      },
      sessionStorage: {
        size: this.sessionStorageCache.size,
        maxSize: this.cacheConfig.sessionStorage.maxSize
      },
      localStorage: {
        size: this.localStorageCache.size,
        maxSize: this.cacheConfig.localStorage.maxSize
      }
    };
  }

  // 清理过期缓存
  cleanup() {
    const now = Date.now();
    
    // 清理内存缓存
    for (const [key, entry] of this.memoryCache) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
    
    // 清理sessionStorage缓存
    for (const [key, entry] of this.sessionStorageCache) {
      if (now > entry.expiresAt) {
        this.sessionStorageCache.delete(key);
        try {
          sessionStorage.removeItem(key);
        } catch (error) {
          console.warn('清理sessionStorage缓存失败:', error);
        }
      }
    }
    
    // 清理localStorage缓存
    for (const [key, entry] of this.localStorageCache) {
      if (now > entry.expiresAt) {
        this.localStorageCache.delete(key);
      }
    }
    
    // 保存更新后的localStorage缓存
    try {
      const allCache = {};
      this.localStorageCache.forEach((value, key) => {
        allCache[key] = value;
      });
      localStorage.setItem('carQuoteCache', JSON.stringify(allCache));
    } catch (error) {
      console.warn('保存localStorage缓存失败:', error);
    }
  }
}

// 创建全局缓存实例
export const cacheManager = new CacheManager();

// 定期清理过期缓存
setInterval(() => {
  cacheManager.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次 