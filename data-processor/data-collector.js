const pLimit = require('p-limit').default;
const pRetry = require('p-retry').default;
const pTimeout = require('p-timeout').default;
const cliProgress = require('cli-progress');
const { getSmartDelay, simulateHumanBehavior, smartWait } = require('./anti-detection');
const config = require('./config');

class DataCollector {
  // 新增：页面池管理，减少页面创建开销
  constructor(browserManager) {
    this.browserManager = browserManager;
    this.config = config;
    this.limit = pLimit(this.config.crawler.concurrency);
    this.pagePool = new Map(); // 页面池
    this.maxPoolSize = 5; // 最大页面池大小
  }

  // 新增：获取或创建页面
  async getOrCreatePage(browser, key = 'default') {
    if (this.pagePool.has(key) && this.pagePool.get(key).isClosed() === false) {
      return this.pagePool.get(key);
    }
    
    const page = await this.browserManager.createPage(browser);
    this.pagePool.set(key, page);
    
    // 限制页面池大小
    if (this.pagePool.size > this.maxPoolSize) {
      const oldestKey = this.pagePool.keys().next().value;
      const oldestPage = this.pagePool.get(oldestKey);
      if (!oldestPage.isClosed()) {
        await oldestPage.close();
      }
      this.pagePool.delete(oldestKey);
    }
    
    return page;
  }

  // 新增：智能重试机制，提升采集成功率
  async smartRetry(operation, maxRetries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`❌ 操作最终失败，已重试 ${maxRetries} 次: ${error.message}`);
          throw error;
        }
        console.log(`⚠️ 操作失败，第 ${attempt} 次重试 (${delay * attempt}ms 后): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  // 新增：强制超时保护机制
  async withTimeoutProtection(operation, timeoutMs = 120000, context = '') {
    return Promise.race([
      operation(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`操作超时 ${context}: ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  // 新增：协议超时错误处理（增强版）
  async handleProtocolTimeout(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      if (error.message.includes('protocolTimeout') || 
          error.message.includes('timed out') || 
          error.message.includes('Protocol error') ||
          error.message.includes('Network.enable') ||
          error.message.includes('Runtime.callFunctionOn')) {
        console.warn(`⚠️ 协议超时/网络错误 ${context}: ${error.message.substring(0, 100)}...`);
        console.log(`⏭️ 跳过当前操作，返回空结果`);
        // 直接返回空结果，不再重试
        return [];
      }
      throw error;
    }
  }

  // 清理车型名称，如果包含品牌名则只保留车型名称
  cleanCarName(carName, brand) {
    if (!carName || !brand) return carName;
    
    // 品牌名称映射（中文名称）
    const brandNameMap = {
      'Volkswagen': '大众',
      'Audi': '奥迪',
      'Benz': '奔驰',
      'BMW': '宝马',
      'Aion': '埃安',
      'Aito': '问界',
      'Avatr': '阿维塔',
      'AstonMartin': '阿斯顿马丁',
      'AlfaRomeo': '阿尔法·罗密欧',
      'Honda': '本田',
      'Buick': '别克',
      'BYD': '比亚迪',
      'Porsche': '保时捷',
      'Bestune': '奔腾',
      'Bentley': '宾利',
      'Baojun': '宝骏',
      'Peugeot': '标致',
      'BJSUV': '北京越野',
      'BAIC': '北京汽车',
      'BAW': '北京汽车制造厂',
      'Changan': '长安',
      'ChanganNevo': '长安启源',
      'GWM': '长城',
      'Kaicene': '长安凯程',
      'Kuayue': '长安跨越',
      'Skyworth': '创维',
      'Forthing': '东风风行',
      'Aeolus': '东风风神',
      'DS': 'DS',
      'Fengon': '东风风光',
      'eπ': '东风奕派',
      'Dongfeng': '东风',
      'Nami': '东风纳米',
      '212': '北汽二一二',
      'Toyota': '丰田',
      'Ford': '福特',
      'RisingAuto': '飞凡',
      'FormulaLeopard': '方程豹',
      'Ferrari': '法拉利',
      'Foton': '福田',
      'Trumpchi': '广汽传祺',
      'Hyper': '广汽昊铂',
      'GMC': 'GMC',
      'Haval': '哈弗',
      'Hongqi': '红旗',
      'Hycan': '合创',
      'Hama': '海马',
      'Hengchi': '恒驰',
      'iCAR': 'iCAR',
      'Geely': '吉利',
      'GeelyGalaxy': '吉利银河',
      'Zeekr': '极氪',
      'Jetour': '捷途',
      'Jaguar': '捷豹',
      'Jetta': '捷达',
      'Geome': '吉利几何',
      'Genesis': '捷尼赛思',
      'Jeep': 'Jeep',
      'JMC': '江铃',
      'Arcfox': '极狐',
      'JAC': '江淮',
      'Polestar': '极星',
      'Rox': '极石',
      'Cadillac': '凯迪拉克',
      'Kaiyi': '凯翼',
      'Koenigsegg': '柯尼赛格',
      'LandRover': '路虎',
      'Lexus': '雷克萨斯',
      'Lincoln': '林肯',
      'LiAuto': '理想',
      'LynkCo': '领克',
      'Leapmotor': '零跑',
      'Onvo': '乐道',
      'RollsRoyce': '劳斯莱斯',
      'Lamborghini': '兰博基尼',
      'Voyah': '岚图',
      'Lotus': '莲花',
      'Landian': '蓝电',
      'Mazda': '马自达',
      'MG': '名爵',
      'Maserati': '玛莎拉蒂',
      'Mini': 'MINI',
      'McLaren': '迈凯轮',
      'Mhero': '猛士',
      'Neta': '哪吒',
      'Ora': '欧拉',
      'Acura': '讴歌',
      'Chery': '奇瑞',
      'Kia': '起亚',
      'Nissan': '日产',
      'Nezha': '哪吒',
      'Nio': '蔚来',
      'Opel': '欧宝',
      'Qoros': '观致',
      'Renault': '雷诺',
      'Roewe': '荣威',
      'Skoda': '斯柯达',
      'Smart': 'Smart',
      'Subaru': '斯巴鲁',
      'Suzuki': '铃木',
      'Tesla': '特斯拉',
      'Volvo': '沃尔沃',
      'Wey': 'WEY',
      'Wuling': '五菱',
      'Xpeng': '小鹏',
      'Yangwang': '仰望',
      'Firefly': '萤火虫',
      'IM': '智己',
      'Luxeed': '智界',
      'Maextro': '尊界'
    };
    
    const brandName = brandNameMap[brand];
    if (!brandName) return carName;
    
    // 如果车型名称以品牌名开头，则移除品牌名
    if (carName.startsWith(brandName)) {
      const cleanedName = carName.substring(brandName.length).trim();
      // 如果移除品牌名后还有内容，则返回清理后的名称
      if (cleanedName) {
        return cleanedName;
      }
    }
    
    return carName;
  }

  async collectCarData(brand, brandIds) {
    let allCars = [];
    let brandInfo = null;
    let brandIdUsed = null;

    for (const brandId of brandIds) {
      const browser = await this.browserManager.createBrowser();
      
      try {
        const result = await pRetry(
          () => this.getBrandInfoAndCarIds(browser, brandId),
          { 
            retries: config.crawler.maxRetries,
            onFailedAttempt: error => {
              console.warn(`⚠️ 获取品牌信息失败，重试中... (${error.attemptNumber}/${config.crawler.maxRetries})`);
            }
          }
        );

        if (!brandInfo) {
          brandInfo = result.brandInfo;
          brandInfo.brand = brand;
          brandIdUsed = brandId;
        }

        // 获取品牌logo - 通过车型页面获取，一次性采集
        brandInfo.brandImage = await this.getBrandLogo(browser, result.carIds, brand);

        if (result.carIds.length > 0) {
          const cars = await this.collectCarsConcurrently(browser, result.carIds, brand);
          allCars = allCars.concat(cars);
        }
      } catch (error) {
        console.error(`❌ 处理品牌 ${brand} (ID: ${brandId}) 时发生错误:`, error.message);
      } finally {
        await this.browserManager.closeBrowser(browser);
      }
    }

    return { brandInfo, cars: allCars };
  }

  async getBrandInfoAndCarIds(browser, brandId) {
    const page = await this.browserManager.createPage(browser);
    
    try {
      const brandUrl = `https://www.dongchedi.com/auto/library-brand/${brandId}`;
      console.log(`🌐 访问品牌页面: ${brandUrl}`);
      
      if (config.crawler.timeout > 0) {
        await pTimeout(
          page.goto(brandUrl, { 
            waitUntil: config.crawler.pageLoadStrategy || 'load',
            timeout: config.crawler.maxWaitTime || 15000
          }),
          { milliseconds: config.crawler.timeout }
        );
      } else {
        await page.goto(brandUrl, { 
          waitUntil: config.crawler.pageLoadStrategy || 'load',
          timeout: config.crawler.maxWaitTime || 15000
        });
      }
      
      // 等待页面加载完成
      await new Promise(resolve => setTimeout(resolve, config.crawler.pageWaitTime || 2000));

      // 新的采集逻辑 - 基于您提供的页面结构
      let carIds = [];
      let carNames = [];
      
      console.log('🎯 开始执行新的车型采集逻辑...');
      
      // 方法一：优先尝试点击"在售"标签
      let onSaleClickResult = null;
      try {
        // 先调试页面结构
        const debugInfo = await page.evaluate(() => {
          const info = {
            categoryList: !!document.querySelector('ul.category_list__2j98c'),
            categoryItems: document.querySelectorAll('a.category_item__1bH-x').length,
            carList: !!document.querySelector('ul.car-list_root__3bcdu'),
            carItems: document.querySelectorAll('li.car-list_item__3nyEK').length,
            allCategories: [],
            allCarLinks: []
          };
          
          // 记录所有分类
          document.querySelectorAll('a[class*="category"]').forEach(a => {
            info.allCategories.push({
              text: a.textContent.trim(),
              href: a.href,
              className: a.className
            });
          });
          
          // 记录所有车型链接
          document.querySelectorAll('a[href*="/auto/series/"]').forEach(a => {
            const match = a.href.match(/\/auto\/series\/(\d+)/);
            if (match) {
              info.allCarLinks.push({
                text: a.textContent.trim(),
                href: a.href,
                id: match[1]
              });
            }
          });
          
          return info;
        });
        
        console.log('🔍 页面结构调试信息:');
        console.log(`   category_list容器: ${debugInfo.categoryList}`);
        console.log(`   category_item数量: ${debugInfo.categoryItems}`);
        console.log(`   car-list容器: ${debugInfo.carList}`);
        console.log(`   car-item数量: ${debugInfo.carItems}`);
        console.log(`   所有分类标签: ${debugInfo.allCategories.map(c => c.text).join(', ')}`);
        console.log(`   车型链接数量: ${debugInfo.allCarLinks.length}`);
        
        onSaleClickResult = await page.evaluate(() => {
          // 添加详细的调试信息
          const debugInfo = {
            allContainers: [],
            allLinks: [],
            foundContainer: null,
            foundOnSaleLink: null
          };
          
          // 查找类别列表容器 - 使用更灵活的选择器
          let categoryList = document.querySelector('ul.category_list__2j98c');
          if (!categoryList) {
            categoryList = document.querySelector('ul[class*="category"]');
          }
          
          // 记录所有可能的容器
          document.querySelectorAll('ul').forEach(ul => {
            debugInfo.allContainers.push({
              className: ul.className,
              childrenCount: ul.children.length,
              textContent: ul.textContent.trim().substring(0, 100)
            });
          });
          
          if (!categoryList) {
            return { 
              success: false, 
              reason: '未找到category_list容器',
              debug: debugInfo
            };
          }
          
          debugInfo.foundContainer = {
            className: categoryList.className,
            childrenCount: categoryList.children.length
          };
          
          // 记录容器中的所有链接
          const allLinks = categoryList.querySelectorAll('a');
          allLinks.forEach(link => {
            debugInfo.allLinks.push({
              href: link.href,
              textContent: link.textContent.trim(),
              className: link.className
            });
          });
          
          // 只查找包含"在售"文本的链接，不使用其他回退方式
          let onSaleLink = null;
          for (const link of allLinks) {
            if (link.textContent.includes('在售')) {
              onSaleLink = link;
              debugInfo.foundOnSaleLink = {
                href: link.href,
                textContent: link.textContent.trim(),
                className: link.className
              };
              break;
            }
          }
          
          if (!onSaleLink) {
            return { 
              success: false, 
              reason: '未找到在售标签',
              debug: debugInfo
            };
          }
          
          // 点击"在售"标签
          onSaleLink.click();
          return { 
            success: true, 
            reason: '成功点击在售标签',
            debug: debugInfo
          };
        });
        
        // 输出详细的调试信息
        if (onSaleClickResult.debug) {
          console.log('🔍 详细调试信息:');
          console.log('   找到的容器:', onSaleClickResult.debug.foundContainer);
          console.log('   容器中的所有链接:');
          onSaleClickResult.debug.allLinks.forEach((link, index) => {
            console.log(`     ${index + 1}. "${link.textContent}" - ${link.href}`);
          });
          if (onSaleClickResult.debug.foundOnSaleLink) {
            console.log('   找到的"在售"链接:', onSaleClickResult.debug.foundOnSaleLink);
          }
        }
        
        if (onSaleClickResult.success) {
          console.log('✅ 成功点击"在售"标签，等待页面更新...');
          await new Promise(resolve => setTimeout(resolve, config.crawler.pageWaitTime || 2000));
          
          // 在"在售"页面采集车型信息 - 使用更灵活的选择器
          const onSaleResult = await page.evaluate(() => {
            // 尝试多种容器选择器
            let carList = document.querySelector('ul.car-list_root__3bcdu');
            if (!carList) {
              carList = document.querySelector('ul[class*="car-list"]');
            }
            if (!carList) {
              carList = document.querySelector('[class*="car-list"]');
            }
            
            if (!carList) {
              // 如果没有找到容器，直接在页面查找车型链接
              const allCarLinks = document.querySelectorAll('a[href*="/auto/series/"]');
              const carIds = [];
              const carNames = [];
              
              allCarLinks.forEach(link => {
                const match = link.href.match(/\/auto\/series\/(\d+)/);
                if (match) {
                  const carId = parseInt(match[1]);
                  const carName = link.textContent.trim();
                  if (carId && carName && carName !== '图片' && carName !== '参数') {
                    carIds.push(carId);
                    carNames.push(carName);
                  }
                }
              });
              
              return { 
                carIds: [...new Set(carIds)], 
                carNames: [...new Set(carNames)], 
                reason: `在售页面备用方法找到${carIds.length}个车型` 
              };
            }
            
            // 如果找到了容器，使用原逻辑
            let carItems = carList.querySelectorAll('li.car-list_item__3nyEK');
            if (carItems.length === 0) {
              carItems = carList.querySelectorAll('li[class*="car-list"]');
            }
            if (carItems.length === 0) {
              carItems = carList.querySelectorAll('li, div');
            }
            
            const carIds = [];
            const carNames = [];
            
            carItems.forEach(item => {
              // 查找车型名称和链接 - 使用更灵活的选择器
              const linkSelectors = [
                'a.series-card_name__3QIlf',
                'a[class*="series-card"]',
                'a[href*="/auto/series/"]'
              ];
              
              for (const selector of linkSelectors) {
                const nameLink = item.querySelector(selector);
                if (nameLink && nameLink.href) {
                  const match = nameLink.href.match(/\/auto\/series\/(\d+)/);
                  if (match) {
                    const carId = parseInt(match[1]);
                    const carName = nameLink.textContent.trim();
                    if (carId && carName && carName !== '图片' && carName !== '参数') {
                      carIds.push(carId);
                      carNames.push(carName);
                      break;
                    }
                  }
                }
              }
            });
            
            return { carIds, carNames, reason: `在售页面找到${carIds.length}个车型` };
          });
          
          carIds = onSaleResult.carIds;
          carNames = onSaleResult.carNames;
          console.log(`🎯 方法一结果: ${onSaleResult.reason}`);
          
        } else {
          console.log(`⚠️ 方法一失败: ${onSaleClickResult.reason}`);
          // 如果没有"在售"标签，直接进入方法二，不需要等待
          console.log('🔄 没有"在售"标签，直接进入方法二采集...');
        }
      } catch (error) {
        console.warn('⚠️ 方法一异常:', error.message);
      }
      
      // 方法二：如果方法一失败，直接在原页面采集（增加"暂无报价"过滤）
      if (carIds.length === 0) {
        console.log('🔄 执行方法二：直接在品牌页面采集车型...');
        
        // 如果方法一点击了"在售"标签，需要回退到原始页面
        if (onSaleClickResult && onSaleClickResult.success) {
          console.log('⬅️ 回退到原始品牌页面...');
          try {
          await page.goBack();
          await new Promise(resolve => setTimeout(resolve, config.crawler.pageWaitTime || 2000));
            console.log('✅ 成功回退到原始页面');
          } catch (error) {
            console.warn('⚠️ 回退失败，重新加载原始页面:', error.message);
            const brandUrl = `https://www.dongchedi.com/auto/library-brand/${brandId}`;
            await page.goto(brandUrl, { 
              waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded',
              timeout: config.crawler.maxWaitTime || 10000
            });
          await new Promise(resolve => setTimeout(resolve, config.crawler.pageWaitTime || 2000));
          }
        }
        
        // 先检查页面是否有"在售"标签，如果没有且所有车型都"暂无报价"，则直接返回
        const pageStructureCheck = await page.evaluate(() => {
          // 检查是否有"在售"标签
          const hasOnSaleTab = Array.from(document.querySelectorAll('a')).some(a => 
            a.textContent.includes('在售')
          );
          
          // 检查所有车型的价格状态
          const allPriceElements = document.querySelectorAll('[class*="price"], .price, p');
          let totalCars = 0;
          let noPriceCars = 0;
          
          allPriceElements.forEach(el => {
            const text = el.textContent.trim();
            if (text === '暂无报价' || text === '暂无' || text === '-') {
              noPriceCars++;
            }
            if (text.includes('万') || text.includes('元') || text.includes('询底价')) {
              totalCars++;
            }
          });
          
          return {
            hasOnSaleTab,
            totalCars,
            noPriceCars,
            allCarsNoPrice: noPriceCars > 0 && totalCars === 0
          };
        });
        
        console.log(`🔍 页面结构检查结果:`);
        console.log(`   是否有"在售"标签: ${pageStructureCheck.hasOnSaleTab}`);
        console.log(`   总车型数: ${pageStructureCheck.totalCars}`);
        console.log(`   暂无报价车型数: ${pageStructureCheck.noPriceCars}`);
        console.log(`   是否所有车型都暂无报价: ${pageStructureCheck.allCarsNoPrice}`);
        
        // 如果没有"在售"标签且所有车型都"暂无报价"，直接返回空结果
        if (!pageStructureCheck.hasOnSaleTab && pageStructureCheck.allCarsNoPrice) {
          console.log('⚠️ 检测到特殊情况：没有"在售"标签且所有车型都显示"暂无报价"');
          console.log('🛑 跳过采集，返回空结果');
          return { brandInfo: { brand: '', brandImage: '' }, carIds: [] };
        }
        
        // 如果没有"在售"标签，但可能有部分车型有报价，继续执行正常采集逻辑
        if (!pageStructureCheck.hasOnSaleTab) {
          console.log('ℹ️ 没有"在售"标签，但继续执行正常采集逻辑，让过滤机制处理"暂无报价"车型');
        }
        
        // 对于没有"在售"标签的品牌，进行更严格的检查
        if (!pageStructureCheck.hasOnSaleTab) {
          console.log('🔍 对没有"在售"标签的品牌进行严格检查...');
          
          // 直接检查页面中所有车型的价格状态
          const strictCheck = await page.evaluate(() => {
            const allCarLinks = document.querySelectorAll('a[href*="/auto/series/"]');
            let validCars = 0;
            let noPriceCars = 0;
            
            allCarLinks.forEach(link => {
              const parent = link.closest('li, div');
              if (parent) {
                // 检查父元素中是否有价格信息
                const hasPrice = Array.from(parent.querySelectorAll('*')).some(el => {
                  const text = el.textContent.trim();
                  return text.includes('万') && !text.includes('暂无');
                });
                
                if (hasPrice) {
                  validCars++;
                } else {
                  noPriceCars++;
                }
              }
            });
            
            return { validCars, noPriceCars, totalCars: allCarLinks.length };
          });
          
          console.log(`🔍 严格检查结果: 有效车型${strictCheck.validCars}个，暂无报价${strictCheck.noPriceCars}个，总计${strictCheck.totalCars}个`);
          
          // 如果没有有效车型，直接返回空结果
          if (strictCheck.validCars === 0) {
            console.log('🛑 严格检查发现没有有效车型，返回空结果');
            return { brandInfo: { brand: '', brandImage: '' }, carIds: [] };
          }
        }
        
        const directResult = await page.evaluate(() => {
          // 使用更灵活的容器查找
          let carList = document.querySelector('ul.car-list_root__3bcdu');
          if (!carList) {
            carList = document.querySelector('ul[class*="car-list"]');
          }
          if (!carList) {
            carList = document.querySelector('[class*="car-list"]');
          }
          
          if (!carList) {
            // 如果没有找到容器，直接查找所有车型链接
            const allCarLinks = document.querySelectorAll('a[href*="/auto/series/"]');
            const carIds = [];
            const carNames = [];
            let filteredCount = 0;
            
            allCarLinks.forEach(link => {
                      const match = link.href.match(/\/auto\/series\/(\d+)/);
                      if (match) {
                        const carId = parseInt(match[1]);
                const carName = link.textContent.trim();
                
                // 检查链接父元素是否包含价格信息
                const parent = link.closest('li, div');
                if (parent) {
                  const priceElements = parent.querySelectorAll('[class*="price"]');
                  let hasNoPrice = false;
                  
                  for (const priceEl of priceElements) {
                    const priceText = priceEl.textContent.trim();
                    if (priceText === '暂无报价' || priceText === '暂无' || priceText === '-') {
                      hasNoPrice = true;
                      filteredCount++;
                        break;
                      }
                    }
                  
                  if (!hasNoPrice && carId && carName) {
                    carIds.push(carId);
                    carNames.push(carName);
                  }
                } else if (carId && carName) {
                  // 如果没有父元素，直接添加
                  carIds.push(carId);
                  carNames.push(carName);
                  }
                }
              });
            
            return { 
              carIds: [...new Set(carIds)], 
              carNames: [...new Set(carNames)], 
              reason: `备用方法找到${carIds.length}个车型，过滤掉${filteredCount}个暂无报价车型` 
            };
          }
          
          // 如果找到了容器，使用原逻辑
          let carItems = carList.querySelectorAll('li.car-list_item__3nyEK');
          if (carItems.length === 0) {
            carItems = carList.querySelectorAll('li[class*="car-list"]');
          }
          if (carItems.length === 0) {
            carItems = carList.querySelectorAll('li, div');
          }
          
          const carIds = [];
          const carNames = [];
          let filteredCount = 0;
          
          carItems.forEach(item => {
            // 检查是否有"暂无报价" - 使用更灵活的选择器
            const priceSelectors = [
              'p.series-card_price__1Pwwb',
              '[class*="price"]',
              '.price'
            ];
            
            let hasNoPrice = false;
            for (const selector of priceSelectors) {
              const priceElement = item.querySelector(selector);
                  if (priceElement) {
                    const priceText = priceElement.textContent.trim();
                if (priceText === '暂无报价' || priceText === '暂无' || priceText === '-') {
                  hasNoPrice = true;
                  filteredCount++;
                      break;
                    }
                  }
                }
                
            if (hasNoPrice) return;
                
            // 查找车型名称和链接 - 使用更灵活的选择器
                  const linkSelectors = [
              'a.series-card_name__3QIlf',
              'a[class*="series-card"]',
              'a[href*="/auto/series/"]'
            ];
            
            for (const selector of linkSelectors) {
              const nameLink = item.querySelector(selector);
              if (nameLink && nameLink.href) {
                const match = nameLink.href.match(/\/auto\/series\/(\d+)/);
                      if (match) {
                        const carId = parseInt(match[1]);
                  const carName = nameLink.textContent.trim();
                  if (carId && carName) {
                        carIds.push(carId);
                    carNames.push(carName);
                        break;
                      }
                    }
                  }
                }
              });
          
          return { 
            carIds, 
            carNames, 
            reason: `找到${carIds.length}个有效车型，过滤掉${filteredCount}个暂无报价车型` 
          };
        });
        
        carIds = directResult.carIds;
        carNames = directResult.carNames;
        console.log(`🎯 方法二结果: ${directResult.reason}`);
      }

      // 输出采集结果
      if (carIds.length > 0) {
        console.log(`✅ 成功采集到 ${carIds.length} 个车型:`);
        carNames.forEach((name, index) => {
          console.log(`   ${index + 1}. ${name} (ID: ${carIds[index]})`);
        });
      } else {
        console.log('❌ 未采集到任何车型');
      }

      const brandInfo = {
        brand: '',
        brandImage: ''
      };

      return { brandInfo, carIds: [...new Set(carIds)] };

    } finally {
      await page.close();
    }
  }

  async getBrandLogo(browser, carIds, brandName) {
    // 检查是否已经采集过logo - 一次性采集机制
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(__dirname, '..', 'data');
    const brandFile = path.join(dataDir, `${brandName}.json`);
    
    // 如果品牌文件存在且已有logo，直接返回
    if (fs.existsSync(brandFile)) {
      try {
        const brandData = JSON.parse(fs.readFileSync(brandFile, 'utf-8'));
        if (brandData.brandImage && brandData.brandImage.trim() !== '') {
          console.log(`🏷️ 品牌 ${brandName} 的logo已存在，跳过采集`);
          return brandData.brandImage;
        }
      } catch (error) {
        console.warn(`⚠️ 读取品牌文件失败: ${error.message}`);
      }
    }

    // 如果没有车型ID，无法采集logo
    if (!carIds || carIds.length === 0) {
      console.log(`⚠️ 品牌 ${brandName} 没有可用的车型ID，无法采集logo`);
        return '';
    }

    // 使用第一个车型ID访问车型页面获取品牌logo
    const firstCarId = carIds[0];
    console.log(`🏷️ 通过车型页面采集品牌 ${brandName} 的logo (使用车型ID: ${firstCarId})`);
    
      const page = await this.browserManager.createPage(browser);
    
      try {
      const seriesUrl = `https://www.dongchedi.com/auto/series/${firstCarId}`;
      console.log(`🌐 访问车型页面: ${seriesUrl}`);
      
          if (config.crawler.timeout > 0) {
        await pTimeout(
          page.goto(seriesUrl, { 
            waitUntil: config.crawler.pageLoadStrategy || 'load',
            timeout: config.crawler.maxWaitTime || 15000
          }),
          { milliseconds: config.crawler.timeout }
        );
          } else {
        await page.goto(seriesUrl, { 
          waitUntil: config.crawler.pageLoadStrategy || 'load',
          timeout: config.crawler.maxWaitTime || 15000
        });
      }
      
      // 等待页面加载
      await new Promise(resolve => setTimeout(resolve, config.crawler.pageWaitTime || 2000));
      
      // 提取品牌logo - 基于您提供的页面结构
      const logo = await page.evaluate(() => {
        // 优先使用指定的选择器 - 基于您提供的结构
        const logoImg = document.querySelector('img.header-left_logo__3_20J');
        if (logoImg && logoImg.src) {
          return logoImg.src;
        }
        
        // 查找新版页面结构中的品牌logo
        const newMainContainer = document.querySelector('div.new-main.tw-overflow-hidden.new');
        if (newMainContainer) {
          const logoInNewMain = newMainContainer.querySelector('img[class*="logo"]');
          if (logoInNewMain && logoInNewMain.src) {
            return logoInNewMain.src;
          }
        }
        
        // 备用选择器 - 基于懂车帝页面常见结构
        const fallbackSelectors = [
          'img[class*="header-left_logo"]',
          'div.new img[class*="logo"]',
          'img[alt*="logo" i]',
          'img[src*="motor-mis-img"]',
          '[class*="header-left"] img',
          '[class*="logo"] img'
        ];
        
        for (const selector of fallbackSelectors) {
          const img = document.querySelector(selector);
          if (img && img.src && img.src.includes('motor-mis-img')) {
            return img.src;
          }
        }
        
        return '';
      });
      
      if (logo) {
        console.log(`✅ 成功采集到品牌 ${brandName} 的logo: ${logo}`);
        return logo;
          } else {
        console.log(`❌ 未能在车型页面找到品牌 ${brandName} 的logo`);
        return '';
      }
      
      } catch (error) {
      console.warn(`⚠️ 采集品牌 ${brandName} logo失败:`, error.message);
      return '';
      } finally {
        await page.close();
      }
  }

  async collectCarsConcurrently(browser, carIds, brand) {
    const uniqueCarIds = [...new Set(carIds)];
    const progressBar = new cliProgress.SingleBar({
      format: '采集进度 |{bar}| {percentage}% | {value}/{total} | 剩余时间: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(uniqueCarIds.length, 0);

    const cars = [];
    const promises = uniqueCarIds.map((carId, index) => 
      this.limit(async () => {
        try {
          const carData = await pRetry(
            () => this.collectSingleCarData(browser, carId, brand),
            { 
              retries: config.crawler.maxRetries,
              onFailedAttempt: error => {
                console.warn(`⚠️ 采集车型 ${carId} 失败，重试中... (${error.attemptNumber}/${config.crawler.maxRetries})`);
              }
            }
          );
          
          if (carData) {
            cars.push(carData);
          }
          
          progressBar.update(index + 1);
          return carData;
        } catch (error) {
          console.error(`❌ 采集车型 ${carId} 最终失败:`, error.message);
          progressBar.update(index + 1);
          return null;
        }
      })
    );

    await Promise.all(promises);
    progressBar.stop();

    return cars;
  }

  async collectSingleCarData(browser, carId, brand) {
    const page = await this.browserManager.createPage(browser);
    
    try {
      // 添加页面状态监控
      let pageValid = true;
      page.on('close', () => {
        pageValid = false;
        console.warn(`⚠️ 车型 ${carId} 页面被关闭`);
      });
      
      page.on('crash', () => {
        pageValid = false;
        console.warn(`⚠️ 车型 ${carId} 页面崩溃`);
      });
      // 1. 采集车型基本信息
      const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
      // 更稳健的加载策略：networkidle2 -> load -> 无 waitUntil
      try {
              // 如果超时设置为0，则不使用超时
      if (config.crawler.timeout > 0) {
        await pTimeout(
          page.goto(urlSeries, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' }), 
          { milliseconds: config.crawler.timeout }
        );
      } else {
        await page.goto(urlSeries, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' });
      }
      } catch (e1) {
        console.warn(`⚠️ 车型 ${carId} networkidle2 超时，回退到 load: ${e1.message}`);
        try {
          if (config.crawler.timeout > 0) {
            await pTimeout(
              page.goto(urlSeries, { waitUntil: 'load' }),
              { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) }
            );
          } else {
            await page.goto(urlSeries, { waitUntil: 'load' });
          }
        } catch (e2) {
          console.warn(`⚠️ 车型 ${carId} load 仍超时，最后尝试不设置 waitUntil: ${e2.message}`);
          if (config.crawler.timeout > 0) {
            await pTimeout(
              page.goto(urlSeries),
              { milliseconds: Math.min(config.crawler.timeout + 15000, 40000) }
            );
          } else {
            await page.goto(urlSeries);
          }
        }
      }
      
      // 检查页面是否仍然有效
      if (!pageValid || page.isClosed()) {
        console.warn(`⚠️ 车型 ${carId} 页面已关闭，跳过采集`);
        return null;
      }
      
      // 采集车型基本信息前延长等待时间，确保页面渲染完成
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // 再次检查页面状态
      if (!pageValid || page.isClosed()) {
        console.warn(`⚠️ 车型 ${carId} 页面在等待后已关闭，跳过采集`);
        return null;
      }
      
      const carBasicInfo = await page.evaluate(() => {
        let carName = '';
        const selectors = [
          'h1[title]',
          'h1[class*="series-name"]',
          'h1[class*="line-1"]',
          'h1'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim().length > 1) {
            carName = el.textContent.trim();
            break;
          }
        }
        return { carName };
      });
      console.log('采集到车型名:', carBasicInfo.carName);

      // 验证数据
      if (!this.validateCarBasicInfo(carBasicInfo)) {
        return null;
      }

      // 2. 采集配置信息
      const urlParams = `https://www.dongchedi.com/auto/params-carIds-x-${carId}`;
      try {
        if (config.crawler.timeout > 0) {
          await pTimeout(
            page.goto(urlParams, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' }), // 使用配置的加载策略
            { milliseconds: config.crawler.timeout }
          );
        } else {
          await page.goto(urlParams, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' });
        }
      } catch (e3) {
        console.warn(`⚠️ 车型 ${carId} 参数页 networkidle2 超时，回退到 load: ${e3.message}`);
        if (config.crawler.timeout > 0) {
          await pTimeout(
            page.goto(urlParams, { waitUntil: 'load' }),
            { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) }
          );
        } else {
          await page.goto(urlParams, { waitUntil: 'load' });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000)); // 增加等待时间，确保异步渲染完成
      
      // 检查页面是否仍然有效
      if (page.isClosed()) {
        console.warn(`⚠️ 车型 ${carId} 参数页面已关闭，跳过配置采集`);
        return null;
      }

      // 采集基础参数信息
      const basicParams = await page.evaluate(() => {
        let manufacturer = '';
        let carClass = '';
        let size = '';
        let power = '';
        let fuelType = '';
        
        // 查找基本信息表格
        const basicInfoSection = Array.from(document.querySelectorAll('h3, h4, .title')).find(h => 
          h.textContent.includes('基本信息') || h.textContent.includes('基础信息')
        );
        
        if (basicInfoSection) {
          // 遍历基本信息部分的所有行
          let currentElement = basicInfoSection.nextElementSibling;
          const infoRows = [];
          
          while (currentElement && infoRows.length < 50) {
            const text = currentElement.textContent.trim();
            if (text) {
              infoRows.push(text);
            }
            currentElement = currentElement.nextElementSibling;
          }
          
          // 解析基础信息
          for (let i = 0; i < infoRows.length; i++) {
            const row = infoRows[i];
            
            if (row.includes('厂商') && i + 1 < infoRows.length) {
              manufacturer = infoRows[i + 1];
            } else if (row.includes('级别') && i + 1 < infoRows.length) {
              carClass = infoRows[i + 1];
            } else if (row.includes('长×宽×高') && i + 1 < infoRows.length) {
              size = infoRows[i + 1];
            } else if ((row.includes('发动机') || row.includes('电机')) && i + 1 < infoRows.length) {
              power = infoRows[i + 1];
            } else if ((row.includes('燃料类型') || row.includes('能源类型')) && i + 1 < infoRows.length) {
              fuelType = infoRows[i + 1];
            }
          }
        }
        
        // 如果基本信息表格没有找到，尝试其他选择器
        if (!manufacturer) {
          const manufacturerSelectors = [
            'td:contains("厂商") + td',
            '[data-field="manufacturer"]',
            '.manufacturer'
          ];
          
          for (const selector of manufacturerSelectors) {
            try {
              const element = document.querySelector(selector);
              if (element && element.textContent.trim()) {
                manufacturer = element.textContent.trim();
                break;
              }
            } catch (e) {
              // 继续尝试下一个选择器
            }
          }
        }
        
        return {
          manufacturer: manufacturer || '',
          class: carClass || '',
          size: size || '',
          power: power || '',
          fuelType: fuelType || ''
        };
      });
      
      console.log('📋 采集到基础参数:', basicParams);

      // 新的配置采集逻辑 - 基于懂车帝参数配置页面精确结构
      const configs = await page.evaluate(() => {
        const configData = [];
        
        console.log('🎯 使用懂车帝参数配置页面结构采集');
        
        // 检查页面是否仍然有效
        if (!document.body || document.body.children.length === 0) {
          console.log('❌ 页面内容为空，可能页面未完全加载');
          return [];
        }
        
        // 查找主表格容器
        const tableRoot = document.querySelector('div.table_root__14vH_.table_head__FNAvn');
        if (!tableRoot) {
          console.log('❌ 未找到主表格容器 table_root__14vH_');
          return [];
        }
        
        // 查找所有配置头部容器
        const configHeaders = tableRoot.querySelectorAll('div.cell_header-car__1Hrj6');
        console.log(`🔍 找到 ${configHeaders.length} 个配置头部`);
        
        configHeaders.forEach((header, index) => {
          try {
            // 提取配置名称和ID
            const configLink = header.querySelector('a.cell_car__28WzZ');
            if (!configLink) {
              console.log(`⚠️ 配置 ${index + 1} 未找到链接`);
              return;
            }
            
            const fullConfigText = configLink.textContent.trim();
            const configUrl = configLink.href;
            
            // 提取配置ID
            const modelMatch = configUrl.match(/model-(\d+)/);
            const configId = modelMatch ? modelMatch[1] : '';
            
            // 从完整配置名称中提取简化名称（去掉车型名称部分）
            let configName = fullConfigText;
            // 匹配格式：车型名 + 年款 + 配置名，提取年款+配置名部分
            const nameMatch = fullConfigText.match(/(\d{4}款.+)$/);
            if (nameMatch) {
              configName = nameMatch[1];
            }
            
            if (configId && configName) {
              configData.push({
                configName,
                configId,
                index
              });
              
              console.log(`✅ 配置 ${index + 1}: ${configName} (ID: ${configId})`);
            }
          } catch (error) {
            console.warn(`⚠️ 处理配置 ${index + 1} 时出错:`, error.message);
          }
        });
        
        // 现在查找配置主体部分并提取相关数据
        const configMain = document.querySelector('div.configuration_main__2NCwO');
        if (!configMain) {
          console.log('❌ 未找到配置主体容器 configuration_main__2NCwO');
          return configData.map(config => ({
            ...config,
            price: '',
            manufacturer: '',
            class: '',
            size: '',
            power: '',
            fuelType: ''
          }));
        }
        
        console.log('📊 开始提取配置详细数据...');
        
        // 提取指导价
        const priceRow = configMain.querySelector('div[data-row-anchor="official_price"]');
        if (priceRow) {
          const priceCells = priceRow.querySelectorAll('div.cell_official-price__1O2th');
          priceCells.forEach((cell, index) => {
            if (configData[index]) {
              const priceText = cell.textContent.trim();
              configData[index].price = priceText;
              console.log(`💰 配置 ${index + 1} 指导价: ${priceText}`);
            }
          });
        }
        
        // 提取厂商
        const manufacturerRow = configMain.querySelector('div[data-row-anchor="sub_brand_name"]');
        if (manufacturerRow) {
          const manufacturerCells = manufacturerRow.querySelectorAll('div.cell_normal__37nRi');
          manufacturerCells.forEach((cell, index) => {
            if (configData[index]) {
              const manufacturer = cell.textContent.trim();
              configData[index].manufacturer = manufacturer;
              console.log(`🏭 配置 ${index + 1} 厂商: ${manufacturer}`);
            }
          });
        }
        
        // 提取级别
        const classRow = configMain.querySelector('div[data-row-anchor="jb"]');
        if (classRow) {
          const classCells = classRow.querySelectorAll('div.cell_normal__37nRi');
          classCells.forEach((cell, index) => {
            if (configData[index]) {
              const carClass = cell.textContent.trim();
              configData[index].class = carClass;
              console.log(`📊 配置 ${index + 1} 级别: ${carClass}`);
            }
          });
        }
        
        // 提取能源类型
        const fuelTypeRow = configMain.querySelector('div[data-row-anchor="fuel_form"]');
        if (fuelTypeRow) {
          const fuelCells = fuelTypeRow.querySelectorAll('div.cell_normal__37nRi');
          fuelCells.forEach((cell, index) => {
            if (configData[index]) {
              const fuelType = cell.textContent.trim();
              configData[index].fuelType = fuelType;
              console.log(`⚡ 配置 ${index + 1} 能源类型: ${fuelType}`);
            }
          });
        }
        
        // 提取动力信息 - 优先engine_description，其次electric_description
        let powerRow = configMain.querySelector('div[data-row-anchor="engine_description"]');
        if (powerRow) {
          // 传统动力
          const powerCells = powerRow.querySelectorAll('div.cell_normal__37nRi');
          powerCells.forEach((cell, index) => {
            if (configData[index]) {
              const power = cell.textContent.trim();
              configData[index].power = power;
              console.log(`🔋 配置 ${index + 1} 动力: ${power}`);
            }
          });
        } else {
          // 电动力
          powerRow = configMain.querySelector('div[data-row-anchor="electric_description"]');
          if (powerRow) {
            const powerCells = powerRow.querySelectorAll('div.cell_normal__37nRi');
            powerCells.forEach((cell, index) => {
              if (configData[index]) {
                const fullPower = cell.textContent.trim();
                // 对于电动车，只采集后半字段（功率部分）
                const powerMatch = fullPower.match(/(\d+马力)$/);
                const power = powerMatch ? `纯电动 ${powerMatch[1]}` : fullPower;
                configData[index].power = power;
                console.log(`🔋 配置 ${index + 1} 动力: ${power}`);
              }
            });
          }
        }
        
        // 提取尺寸信息（长宽高）
        const sizeRow = configMain.querySelector('div[data-row-anchor="length_width_height"]');
        if (sizeRow) {
          const sizeCells = sizeRow.querySelectorAll('div.cell_normal__37nRi');
          sizeCells.forEach((cell, index) => {
            if (configData[index]) {
              const size = cell.textContent.trim();
              configData[index].size = size;
              console.log(`📏 配置 ${index + 1} 尺寸: ${size}`);
            }
          });
        }
        
        // 过滤和返回结果
        const validConfigs = configData.filter(config => {
          // 必须有配置名称、ID和价格
          if (!config.configName || !config.configId || !config.price) {
            return false;
          }
          
          // 过滤无效价格
          const price = config.price.trim();
          if (['暂无报价', '暂无', '-'].includes(price) || !/^[\d.]+万?/.test(price)) {
            return false;
          }
          
          // 过滤停产配置
          const discontinuedKeywords = ['停产', '停售', '已停售', '经典'];
          if (discontinuedKeywords.some(keyword => config.configName.includes(keyword))) {
            console.log(`⚠️ 过滤停产配置: ${config.configName}`);
            return false;
          }
          
          return true;
        });
        
        console.log(`✅ 成功采集到 ${validConfigs.length} 个有效配置`);
        return validConfigs;
      });

      // 配置信息已包含完整的基础参数，无需额外添加
      const configsWithParams = configs;

      // 为每个配置抓取专属图片
      console.log(`🖼️ 开始为 ${configsWithParams.length} 个配置采集图片...`);
      const configsWithImages = await this.getConfigImages(browser, configsWithParams, carId, brand);

      // 验证配置数量
      if (configsWithImages.length === 0) {
        console.warn(`⚠️ 车型 ${carId} 没有有效配置，尝试备用采集方法`);
        
        // 备用采集方法：直接访问车型页面获取基本信息
        try {
          const fallbackUrl = `https://www.dongchedi.com/auto/series/${carId}`;
          console.log(`🔄 尝试备用方法访问: ${fallbackUrl}`);
          
          if (config.crawler.timeout > 0) {
            await pTimeout(
              page.goto(fallbackUrl, { waitUntil: config.crawler.pageLoadStrategy || 'load' }),
              { milliseconds: config.crawler.timeout }
            );
          } else {
            await page.goto(fallbackUrl, { waitUntil: config.crawler.pageLoadStrategy || 'load' });
          }
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // 检查页面是否仍然有效
          if (page.isClosed()) {
            console.warn(`⚠️ 车型 ${carId} 备用页面已关闭`);
            return null;
          }
          
          // 尝试从车型页面获取基本信息
          const fallbackInfo = await page.evaluate(() => {
            const priceElements = document.querySelectorAll('[class*="price"], .price');
            let hasValidPrice = false;
            
            for (const el of priceElements) {
              const text = el.textContent.trim();
              if (text.includes('万') && !text.includes('暂无')) {
                hasValidPrice = true;
                break;
              }
            }
            
            return { hasValidPrice };
          });
          
          if (!fallbackInfo.hasValidPrice) {
            console.warn(`⚠️ 车型 ${carId} 备用方法也未找到有效价格信息，跳过采集`);
            return null;
          }
          
          // 如果找到有效价格，创建一个基础配置
          const basicConfig = {
            configName: `${carBasicInfo.carName} 基础版`,
            configId: carId.toString(),
            index: 0,
            price: '价格待确认',
            manufacturer: basicParams.manufacturer || '',
            class: basicParams.class || '',
            fuelType: basicParams.fuelType || '',
            power: basicParams.power || '',
            size: basicParams.size || '',
            exteriorImages: [],
            interiorImages: [],
            configImage: ''
          };
          
          console.log(`✅ 车型 ${carId} 使用备用方法创建基础配置`);
          return {
            carId: carId,
            carName: cleanedCarName,
            configs: [basicConfig]
          };
          
        } catch (fallbackError) {
          console.error(`❌ 车型 ${carId} 备用采集方法也失败:`, fallbackError.message);
          return null;
        }
      }

      // 清理车型名称，如果包含品牌名则只保留车型名称
      const cleanedCarName = this.cleanCarName(carBasicInfo.carName, brand);
      
      return {
        carId: carId,
        carName: cleanedCarName,
        configs: configsWithImages
      };
    } catch (error) {
      console.error(`❌ 采集车型 ${carId} 数据失败:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async getTypeImages(browser, config, carId, type) {
    // type: 'wg'（外观）或 'ns'（内饰）
    const page = await this.browserManager.createPage(browser);
    try {
      const imagePageUrl = `https://www.dongchedi.com/series-${carId}/images/${type}-${config.configId}-x-x`;
      console.log(`📸 访问${type === 'wg' ? '外观' : '内饰'}图片页面: ${imagePageUrl} (配置ID: ${config.configId})`);
      
      // 优化的超时处理 - 先尝试 domcontentloaded，失败后回退到 load
      const configCrawler = require('./config').crawler;
      const pageTimeout = Math.min(configCrawler.timeout || 180000, configCrawler.pageTimeout || 120000);
      
      try {
      if (pageTimeout > 0) {
        await pTimeout(
          page.goto(imagePageUrl, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' }),
          { milliseconds: pageTimeout }
        );
      } else {
        await page.goto(imagePageUrl, { waitUntil: config.crawler.pageLoadStrategy || 'domcontentloaded' });
        }
      } catch (timeoutError) {
        console.log(`⚠️ 车型 ${carId} 参数页 networkidle2 超时，回退到 load`);
        try {
          // 回退到 load 事件，使用更长的超时时间
          const fallbackTimeout = Math.min(pageTimeout * 2, 120000); // 最多2分钟
          await pTimeout(
            page.goto(imagePageUrl, { waitUntil: 'load' }),
            { milliseconds: fallbackTimeout }
          );
          console.log(`✅ 车型 ${carId} 使用 load 事件加载成功`);
        } catch (fallbackError) {
          console.warn(`⚠️ 车型 ${carId} 页面加载失败: ${fallbackError.message}`);
          // 继续执行，不中断整个流程
        }
      }
      
      // 新增：减少等待时间，提升速度
      const waitTime = Math.min(configCrawler.pageWaitTime || 3000, configCrawler.pageWaitTime || 2000);
      await new Promise(r => setTimeout(r, waitTime));

      // 抓取色块信息 - 基于懂车帝图片页面精确结构
      const colorBlocks = await page.evaluate((configId) => {
        const result = [];
        
        console.log('🎯 使用懂车帝图片页面精确结构采集色块信息');
        
        // 查找颜色过滤器容器
        const colorFiltersContainer = document.querySelector('div.filters_colors__2qAUB');
        if (!colorFiltersContainer) {
          console.log('❌ 未找到颜色过滤器容器 filters_colors__2qAUB');
          return [];
        }
        
                // 查找所有颜色项 - 修复为北汽212的实际结构
        const colorItems = colorFiltersContainer.querySelectorAll('a.filters_item__1S2ZR');
        console.log(`🔍 找到 ${colorItems.length} 个颜色项`);
        
        colorItems.forEach((colorItem, index) => {
          try {
            // 从href中提取颜色信息
            const href = colorItem.getAttribute('href');
            let hexColor = '';
            let colorLink = '';
            
            if (href) {
              // 从href提取十六进制颜色码，支持单色和双色组合
              // 单色格式：/series-20090/images/wg-80620-65664E_-0
              // 双色格式：/series-20090/images/wg-80620-FA5809_000000-0
              const singleColorMatch = href.match(/-([\dA-F]{6})_-\d+$/);
              const doubleColorMatch = href.match(/-([\dA-F]{6})_([\dA-F]{6})-\d+$/);
              
              if (doubleColorMatch) {
                // 双色组合
                hexColor = `${doubleColorMatch[1]}_${doubleColorMatch[2]}`;
                colorLink = `https://www.dongchedi.com${href}`;
              } else if (singleColorMatch) {
                // 单色
                hexColor = singleColorMatch[1];
                colorLink = `https://www.dongchedi.com${href}`;
              }
            }
            
            // 查找颜色名称 - 优先从多个可能的位置查找
            let colorName = '';
            
            // 方法1: 查找span.filters_color-wrapper__1t05S内的文本
            const colorWrapper = colorItem.querySelector('span.filters_color-wrapper__1t05S');
            if (colorWrapper) {
              // 获取直接文本内容，排除子元素文本
              colorName = colorWrapper.textContent.trim();
            }
            
            // 方法2: 如果没找到，尝试其他选择器
            if (!colorName) {
              const nameSelectors = [
                '.filters_name__9ioNp',
                '[class*="name"]',
                'span:last-child'
              ];
              
              for (const selector of nameSelectors) {
                const nameElement = colorItem.querySelector(selector);
                if (nameElement && nameElement.textContent.trim()) {
                  colorName = nameElement.textContent.trim();
                  break;
                }
              }
            }
            
            // 方法3: 如果还没找到，从整个item的文本中提取
            if (!colorName && colorItem.textContent) {
              colorName = colorItem.textContent.trim();
            }
            
            // 如果没有从href中获取到链接，尝试构建
            if (!colorLink && configId && hexColor) {
              const currentUrl = window.location.href;
              const urlMatch = currentUrl.match(/\/series-(\d+)\/images\/(wg|ns)-/);
              
              if (urlMatch) {
                const seriesId = urlMatch[1];
                const imageType = urlMatch[2];
                
                // 双色链接格式：series-20090/images/wg-80620-FA5809_000000-0
                // 单色链接格式：series-20090/images/wg-80620-65664E_-0
                if (hexColor.includes('_')) {
                  colorLink = `https://www.dongchedi.com/series-${seriesId}/images/${imageType}-${configId}-${hexColor}-0`;
                  } else {
                  colorLink = `https://www.dongchedi.com/series-${seriesId}/images/${imageType}-${configId}-${hexColor}_-0`;
                }
              }
            }
            
            if (colorName && hexColor) {
              // 处理双色组合
              let colorsArray;
              if (hexColor.includes('_')) {
                // 双色：FA5809_000000 -> ["#FA5809", "#000000"]
                const [color1, color2] = hexColor.split('_');
                colorsArray = [`#${color1}`, `#${color2}`];
              } else {
                // 单色：65664E -> ["#65664E"]
                colorsArray = [`#${hexColor}`];
              }
              
              result.push({
                name: colorName,
                hexColor: hexColor,
                colors: colorsArray,
                link: colorLink
              });
              
              console.log(`✅ 色块 ${index + 1}: ${colorName} (${hexColor}) - ${colorLink}`);
            } else {
              console.log(`⚠️ 色块 ${index + 1}: 名称="${colorName}" 颜色="${hexColor}" href="${href}"`);
            }
          } catch (e) {
            console.warn(`⚠️ 处理色块 ${index + 1} 时出错:`, e.message);
          }
        });
        
        return result;
      }, config.configId);
      console.log(`🎨 找到${type === 'wg' ? '外观' : '内饰'}色块:`, colorBlocks.map(c => c.name));
      
      // 新增：调试色块链接信息
      if (config.logging && config.logging.level === 'debug') {
        console.log(`🔍 色块链接详情:`);
        colorBlocks.forEach((color, index) => {
          console.log(`   ${index + 1}. ${color.name}: ${color.link || '无链接'}`);
        });
      }
      
      // 新增：调试色块链接信息（仅在调试模式下）
      if (config.logging && config.logging.level === 'debug') {
        console.log(`🔍 色块链接格式分析:`);
        colorBlocks.forEach((color, index) => {
          if (color.link) {
            console.log(`   ${index + 1}. ${color.name}: ${color.link}`);
          }
        });
      }

      // 优化的色块图片采集并发（基于奥迪成功案例）
      const colorBlocksWithImages = [];
      const colorConcurrency = Math.max(1, Math.min(configCrawler.colorConcurrency || 2, colorBlocks.length));
      const colorLimit = pLimit(colorConcurrency);
      
      const colorTasks = colorBlocks.map(async (color, index) => {
        return colorLimit(async () => {
          // 优化：使用页面池，减少创建开销
          const colorPage = await this.getOrCreatePage(browser, `color_${index}`);
          
          try {
            // 修复：验证色块链接有效性
            if (!color.link || color.link === '') {
              console.log(`ℹ️ 色块 ${color.name} 无有效链接，跳过图片采集`);
              return {
                name: color.name,
                colors: color.colors,
                mainImage: ''
              };
            }
            
            let colorPageUrl = color.link;
            
            // 修复：确保访问的URL使用正确的索引(-0)，而不是其他索引
            if (colorPageUrl && colorPageUrl.includes('dongchedi.com/series-')) {
              // 强制将URL中的索引重写为-0，确保访问第一张图片
              colorPageUrl = colorPageUrl.replace(/-\d+$/, '-0');
              console.log(`🔧 修正色块URL: ${color.link} → ${colorPageUrl}`);
            }
            
            // 新增：色块处理进度
            console.log(`🎨 处理色块 ${color.name}`);
            
            // 修复：色块页面使用更短的超时配置，避免卡住
            const colorPageTimeout = Math.min(configCrawler.colorPageTimeout || 60000, 60000); // 限制为60秒
            try {
              await this.withTimeoutProtection(async () => {
                if (colorPageTimeout > 0) {
                  await pTimeout(
                    colorPage.goto(colorPageUrl, { waitUntil: 'load' }), // 使用更稳定的load策略
                    { milliseconds: colorPageTimeout }
                  );
                } else {
                  await colorPage.goto(colorPageUrl, { waitUntil: 'load' }); // 使用更稳定的load策略
                }
              }, 90000, `色块 ${color.name} 页面加载`); // 90秒强制超时
            } catch (timeoutError) {
              console.warn(`⚠️ 色块 ${color.name} load 超时，尝试回退策略: ${timeoutError.message}`);
              try {
                // 回退策略：使用更短的超时时间，避免卡住
                const fallbackTimeout = Math.min(colorPageTimeout * 1.5, 90000); // 最多90秒
                await pTimeout(
                  colorPage.goto(colorPageUrl, { waitUntil: 'domcontentloaded' }),
                  { milliseconds: fallbackTimeout }
                );
                console.log(`✅ 色块 ${color.name} 使用 domcontentloaded 事件加载成功`);
              } catch (fallbackError) {
                console.warn(`⚠️ 色块 ${color.name} 页面加载失败: ${fallbackError.message}`);
                // 继续执行，不中断整个流程
              }
            }
            
            // 优化：减少等待时间，提升采集速度
            const imageWaitTime = Math.max(configCrawler.imageWaitTime || 1500, 1500); // 优化到1.5秒
            await new Promise(resolve => setTimeout(resolve, imageWaitTime));
            
            // 主图抓取 - 优化图片选择器，确保采集主图
            const mainImage = await colorPage.evaluate(() => {
              console.log('🔍 开始提取主图URL...');
              
              // 最高优先级：查找主图显示区域
              const primarySelectors = [
                'div.head-image_root__2SJX2 img', // 懂车帝主图容器中的图片
                'div[class*="head-image"] img',
                'div[class*="image-container"] img[style*="position: absolute"]', // 主图通常使用绝对定位
                'div[class*="main-image"] img',
                '.main-image img',
                '.image-container img'
              ];
              
              // 优先查找主图容器中的第一张大图
              for (const selector of primarySelectors) {
                const imgs = document.querySelectorAll(selector);
                console.log(`🎯 主图选择器 ${selector} 找到 ${imgs.length} 个图片`);
                
                for (const img of imgs) {
                  const imageUrl = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy') || '';
                  
                  // 严格的主图验证条件
                  if (imageUrl && 
                      imageUrl.startsWith('http') && 
                      (imageUrl.includes('dcarimg.com') || imageUrl.includes('motor-mis-img') || 
                       imageUrl.includes('p1-dcd.byteimg.com') || imageUrl.includes('p3-dcd.byteimg.com')) &&
                      !imageUrl.includes('logo') && 
                      !imageUrl.includes('placeholder') &&
                      !imageUrl.includes('avatar') &&
                      !imageUrl.includes('icon') &&
                      !imageUrl.includes('thumbnail') &&
                      !imageUrl.endsWith('.svg') &&
                      imageUrl.length > 50) { // 主图URL通常较长
                    
                    // 额外检查：确保图片尺寸合理（主图通常较大）
                    const width = img.naturalWidth || img.width || 0;
                    const height = img.naturalHeight || img.height || 0;
                    
                    if (width >= 400 || height >= 300) { // 主图尺寸阈值
                      console.log('✅ 找到主图:', imageUrl, `尺寸: ${width}x${height}`);
                      return imageUrl;
                    }
                  }
                }
              }
              
              // 次优选择：查找页面中最大的车型图片
              console.log('⚠️ 主图选择器未找到，使用尺寸优先策略');
              const allImages = document.querySelectorAll('img[src*="dcarimg.com"], img[src*="motor-mis-img"], img[src*="p1-dcd.byteimg.com"], img[src*="p3-dcd.byteimg.com"]');
              
              let bestImage = null;
              let maxSize = 0;
              
              for (const img of allImages) {
                const url = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('data-lazy') || '';
                
                if (url && 
                    url.startsWith('http') && 
                    !url.includes('logo') && 
                    !url.includes('placeholder') &&
                    !url.includes('avatar') &&
                    !url.includes('icon') &&
                    !url.includes('thumbnail') &&
                    !url.includes('fcf421caf44b23091eee') &&
                    !url.endsWith('.svg') &&
                    url.length > 50) {
                  
                  const width = img.naturalWidth || img.width || 0;
                  const height = img.naturalHeight || img.height || 0;
                  const size = width * height;
                  
                  if (size > maxSize && size >= 120000) { // 最小面积阈值 (400x300)
                    maxSize = size;
                    bestImage = url;
                    console.log(`🔍 发现更大图片: ${url}, 尺寸: ${width}x${height}`);
                  }
                }
              }
              
              if (bestImage) {
                console.log('✅ 使用最大尺寸图片:', bestImage);
                return bestImage;
              }
              
              console.log('❌ 未找到任何有效的主图');
              return '';
            });
            
            // 新增：更新心跳活动时间
            if (typeof global !== 'undefined' && global.lastActivityTime) {
              global.lastActivityTime = Date.now();
            }
            
            return {
              name: color.name,
              colors: color.colors,
              mainImage: mainImage
            };
            
          } catch (error) {
            console.warn(`⚠️ 色块 ${color.name} 图片采集失败:`, error.message);
            return {
              name: color.name,
              colors: color.colors,
              mainImage: ''
            };
          } finally {
            // 确保每个色块的页面都被关闭
            try {
              await colorPage.close();
            } catch (e) {
              // 忽略关闭页面的错误
            }
          }
        });
      });
      
      // 并发执行色块图片采集
      const colorResults = await Promise.all(colorTasks);
      colorBlocksWithImages.push(...colorResults);
      
      return colorBlocksWithImages;
    } catch (error) {
      console.warn(`⚠️ 获取${type === 'wg' ? '外观' : '内饰'}图片失败:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  // 优化：批量图片采集，减少串行等待
  async getConfigImages(browser, configs, carId, brand) {
    const configsWithImages = [];
    console.log(`🔄 开始为 ${configs.length} 个配置采集图片...`);
    
    // 优化：预处理配置，过滤无效配置
    const validConfigs = configs.filter(config => config.configId);
    const invalidConfigs = configs.filter(config => !config.configId);
    
    console.log(`✅ 有效配置: ${validConfigs.length}, 无效配置: ${invalidConfigs.length}`);
    
    // 新增：图片采集进度跟踪
    let processedCount = 0;
    const totalConfigs = configs.length;
    const startTime = Date.now();
    
    // 优化：动态并发控制，根据配置数量调整
    const baseConcurrency = config.crawler.imageConcurrency || 2;
    const concurrency = Math.min(baseConcurrency, Math.max(1, Math.floor(validConfigs.length / 2)));
    const limit = pLimit(concurrency);
    
    console.log(`🚀 使用 ${concurrency} 个并发进行图片采集`);
    
    // 先处理无效配置（无需网络请求）
    const invalidResults = invalidConfigs.map(config => {
      processedCount++;
      this.updateImageProgress(processedCount, totalConfigs, startTime);
      return {
        ...config,
        exteriorImages: [],
        interiorImages: [],
        configImage: ''
      };
    });
    
    // 创建有效配置的采集任务
    const imageCollectionTasks = validConfigs.map((config, index) => {
      return limit(async () => {
        try {
          console.log(`📸 采集配置 ${processedCount + index + 1}/${totalConfigs}: ${config.configName}`);
          console.log(`   指导价: ${config.price || '暂无'}`);
          console.log(`   配置ID: ${config.configId || '暂无'}`);
          
          // 优化：简化超时配置
          const configWithTimeout = {
            ...config,
            crawler: {
              timeout: 180000, // 3分钟超时
              pageWaitTime: 2000, // 2秒等待
              imageWaitTime: 1500 // 1.5秒图片等待
            }
          };
          
          // 外观图片
          console.log(`   🎨 采集外观图片...`);
          const exteriorImages = await this.handleProtocolTimeout(
            () => this.getTypeImages(browser, configWithTimeout, carId, 'wg'),
            '外观图片采集'
          );
          console.log(`   ✅ 外观图片采集完成，找到 ${exteriorImages.length} 个颜色`);
          
          // 内饰图片
          console.log(`   🎨 采集内饰图片...`);
          const interiorImages = await this.handleProtocolTimeout(
            () => this.getTypeImages(browser, configWithTimeout, carId, 'ns'),
            '内饰图片采集'
          );
          console.log(`   ✅ 内饰图片采集完成，找到 ${interiorImages.length} 个颜色`);
          
          // 过滤掉crawler字段
          const { crawler, ...pureConfig } = config;
          const result = {
            ...pureConfig,
            exteriorImages,
            interiorImages,
            configImage: exteriorImages.length > 0 ? exteriorImages[0].mainImage : ''
          };
          
          console.log(`   ✅ 配置 ${index + 1} 采集完成`);
          
          // 更新进度
          processedCount++;
          this.updateImageProgress(processedCount, totalConfigs, startTime);
          
          return result;
          
        } catch (error) {
          console.error(`❌ 配置 ${index + 1} 图片采集失败:`, error.message);
          
          // 即使失败也要返回基本信息
          const result = {
            ...config,
            exteriorImages: [],
            interiorImages: [],
            configImage: ''
          };
          
          processedCount++;
          this.updateImageProgress(processedCount, totalConfigs, startTime);
          
          return result;
        }
      });
    });
    
    // 并发执行所有图片采集任务
    const validResults = await Promise.all(imageCollectionTasks);
    
    // 合并所有结果：无效配置 + 有效配置结果
    const allResults = [...invalidResults, ...validResults];
    
    console.log(`🎉 所有配置图片采集完成，共 ${allResults.length} 个配置，耗时 ${Math.round((Date.now() - startTime) / 1000)} 秒`);
    
    return allResults;
  }

  // 新增：更新图片采集进度
  updateImageProgress(processed, total, startTime) {
    const progress = Math.round((processed / total) * 100);
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const remaining = total - processed;
    const avgTimePerConfig = elapsed / processed;
    const estimatedRemaining = Math.round(remaining * avgTimePerConfig);
    
    console.log(`📊 图片采集进度: ${progress}% (${processed}/${total}) - 已用 ${elapsed}s - 预计剩余 ${estimatedRemaining}s`);
    
    // 更新心跳活动时间（如果存在全局变量）
    if (typeof global !== 'undefined' && global.lastActivityTime) {
      global.lastActivityTime = Date.now();
    }
  }


  validateCarBasicInfo(carBasicInfo) {
    if (!carBasicInfo.carName) {
      console.warn('⚠️ 车型名称为空');
      return false;
    }
    
    // 检查车型名称是否过于简单（可能是抓取错误）
    if (carBasicInfo.carName.length < 2) {
      console.warn(`⚠️ 车型名称过短: "${carBasicInfo.carName}"`);
      return false;
    }
    
    // 检查车型名称是否包含真正有害的字符（文件系统不允许的字符）
    // 允许冒号、点号等常见特殊字符，这些在车型名称中很常见
    const invalidChars = ['/', '\\', '|', '*', '?', '"', '<', '>'];
    if (invalidChars.some(char => carBasicInfo.carName.includes(char))) {
      console.warn(`⚠️ 车型名称包含无效字符: "${carBasicInfo.carName}"`);
      return false;
    }
    
    // 过滤停产/停售车型名称
    const discontinuedKeywords = ['停产', '停售', '已停售', '已下架', '暂停销售', '不可购买', '经典'];
    if (discontinuedKeywords.some(keyword => carBasicInfo.carName.includes(keyword))) {
      console.warn(`⚠️ 车型名称包含停产/停售关键词: "${carBasicInfo.carName}"`);
      return false;
    }
    
    console.log(`✅ 车型名称验证通过: "${carBasicInfo.carName}"`);
    return true;
  }
  
  // 数据存储优化建议
  getStorageOptimizationStats(data) {
    const stats = {
      totalConfigs: 0,
      totalColors: 0,
      totalImages: 0,
      uniqueImageUrls: new Set(),
      estimatedSize: 0,
      optimizationSuggestions: []
    };
    
    if (data.configs) {
      data.configs.forEach(config => {
        stats.totalConfigs++;
        
        // 统计配置图片
        if (config.configImage) {
          stats.totalImages++;
          stats.uniqueImageUrls.add(config.configImage);
        }
        
        // 统计颜色图片
        if (config.colors) {
          config.colors.forEach(color => {
            stats.totalColors++;
            if (color.mainImage) {
              stats.totalImages++;
              stats.uniqueImageUrls.add(color.mainImage);
            }
          });
        }
      });
    }
    
    // 估算数据大小（粗略计算）
    stats.estimatedSize = this.estimateDataSize(data);
    
    // 生成优化建议
    if (stats.totalImages > stats.uniqueImageUrls.size * 2) {
      stats.optimizationSuggestions.push('🔄 存在大量重复图片URL，建议启用去重');
    }
    
    if (stats.estimatedSize > 1024 * 1024) { // 大于1MB
      stats.optimizationSuggestions.push('💾 数据文件较大，建议启用压缩');
    }
    
    if (stats.totalColors > stats.totalConfigs * 5) {
      stats.optimizationSuggestions.push('🎨 颜色数据较多，建议按需加载');
    }
    
    return stats;
  }
  
  // 估算数据大小
  estimateDataSize(data) {
    const jsonString = JSON.stringify(data);
    return jsonString.length;
  }
}

module.exports = DataCollector; 