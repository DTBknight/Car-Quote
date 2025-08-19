const pLimit = require('p-limit').default;
const pRetry = require('p-retry').default;
const pTimeout = require('p-timeout').default;
const cliProgress = require('cli-progress');
const { getSmartDelay, simulateHumanBehavior, smartWait } = require('./anti-detection');
const config = require('./config');

class DataCollector {
  constructor(browserManager) {
    this.browserManager = browserManager;
    this.limit = pLimit(config.crawler.concurrency);
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
      '212': '212',
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

        // 获取品牌logo，优先从车型详情页；失败则回退到品牌页
        brandInfo.brandImage = await this.getBrandLogo(browser, result.carIds[0], brandId);

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
      
      await pTimeout(
        page.goto(brandUrl, { waitUntil: 'domcontentloaded' }), // 改为更快的加载策略
        { milliseconds: config.crawler.timeout }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 固定1秒等待

      // 首先尝试点击"在售"标签
      let carIds = [];
      
      let onSaleLink = null;
      try {
        // 动态查找"在售"标签
        onSaleLink = await page.evaluateHandle(() => {
          const categoryLinks = document.querySelectorAll('a.category_item__1bH-x');
          for (const link of categoryLinks) {
            if (link.textContent.trim() === '在售') {
              return link;
            }
          }
          return null;
        });
        
        if (onSaleLink && !(await onSaleLink.evaluate(el => el === null))) {
          console.log('找到"在售"标签，点击进入...');
          await onSaleLink.click();
          await new Promise(resolve => setTimeout(resolve, 1000)); // 减少等待时间到1秒
          
          // 在"在售"页面收集车型ID - 只获取车型主链接，排除评分和图片链接
          carIds = await page.evaluate(() => {
            const carLinks = document.querySelectorAll('a[href*="/auto/series/"]');
            const ids = Array.from(carLinks)
              .map(a => {
                const href = a.href;
                // 只匹配纯车型链接，排除评分和图片链接
                const match = href.match(/^https:\/\/www\.dongchedi\.com\/auto\/series\/(\d+)$/);
                return match ? parseInt(match[1]) : null;
              })
              .filter(id => id);
            return [...new Set(ids)];
          });
          
          console.log(`在"在售"页面找到 ${carIds.length} 个车型ID`);
        } else {
          console.log('未找到"在售"标签，使用原有方法...');
        }
      } catch (error) {
        console.warn('点击"在售"标签失败，使用原有方法:', error.message);
      }
      
      // 如果"在售"方法失败或没有找到车型，使用原有方法
      if (carIds.length === 0) {
        console.log('"在售"页面没有找到车型，使用原有价格过滤方法...');
        
        // 回到原始页面（如果之前点击了"在售"标签）
        if (onSaleLink && !(await onSaleLink.evaluate(el => el === null))) {
          await page.goBack();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        const result = await page.evaluate(() => {
          const brandInfo = {
            brand: '',
            brandImage: ''
          };

          // 查找所有可能的车型容器
          const possibleContainers = [
            '.series-card',
            '[class*="series-card"]',
            '[class*="car-item"]',
            '.car-item',
            'div[class*="card"]'
          ];

          let carIds = [];
          let foundContainer = false;
          
          for (const selector of possibleContainers) {
            const elements = document.querySelectorAll(selector);
            
            if (elements.length > 0 && !foundContainer) {
              foundContainer = true;
              console.log('使用选择器:', selector);
              
              elements.forEach((item, index) => {
                // 检查价格信息
                const priceSelectors = ['.series-card-price', '.price', '[class*="price"]'];
                let hasPrice = false;
                
                for (const priceSelector of priceSelectors) {
                  const priceElement = item.querySelector(priceSelector);
                  if (priceElement) {
                    const priceText = priceElement.textContent.trim();
                    if (priceText && priceText !== '暂无报价' && priceText !== '暂无') {
                      hasPrice = true;
                      break;
                    }
                  }
                }
                
                if (hasPrice) {
                  // 查找车型链接
                  const linkSelectors = [
                    '.series-card_name__3QIlf',
                    'a[href*="/auto/series/"]',
                    '[class*="name"] a',
                    'a'
                  ];
                  
                  for (const linkSelector of linkSelectors) {
                    const link = item.querySelector(linkSelector);
                    if (link && link.href) {
                      const match = link.href.match(/\/auto\/series\/(\d+)/);
                      if (match) {
                        const carId = parseInt(match[1]);
                        carIds.push(carId);
                        break;
                      }
                    }
                  }
                }
              });
            }
          }
          
          // 如果没有找到容器，使用备用方法
          if (carIds.length === 0) {
            console.log('使用备用方法采集车型ID');
            carIds = Array.from(document.querySelectorAll('a[href*="/auto/series/"]'))
              .map(a => {
                const match = a.href.match(/\/auto\/series\/(\d+)/);
                return match ? parseInt(match[1]) : null;
              })
              .filter(id => id);
          }

          return { brandInfo, carIds: [...new Set(carIds)] };
        });
        
        carIds = result.carIds;
      }

      const brandInfo = {
        brand: '',
        brandImage: ''
      };

      return { brandInfo, carIds: [...new Set(carIds)] };

      return result;
    } finally {
      await page.close();
    }
  }

  async getBrandLogo(browser, carId, brandId) {
    const tryExtractLogo = async (page) => {
      return page.evaluate(() => {
        const extractFromImg = (img) => {
          if (!img) return '';
          // 优先 data-src / srcset / src
          const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original');
          if (dataSrc && /\.(png|jpg|jpeg|webp)/i.test(dataSrc)) return dataSrc;
          const srcset = img.getAttribute('srcset');
          if (srcset) {
            const first = srcset.split(',')[0]?.trim().split(' ')?.[0];
            if (first) return first;
          }
          return img.src || '';
        };

        const extractFromBg = (el) => {
          if (!el) return '';
          const style = window.getComputedStyle(el);
          const bg = style.backgroundImage || '';
          const match = bg.match(/url\(("|')?(.*?)("|')?\)/);
          return match ? match[2] : '';
        };

        // 1) 常见 logo 图片选择器
        const imgSelectors = [
          'img[class*="logo"]',
          '[class*="logo"] img',
          'img[alt*="logo" i]',
          'img[src*="motor-mis-img"]',
          'img[srcset*="motor-mis-img"]',
          'img[class*="brand" i]',
        ];
        for (const sel of imgSelectors) {
          const img = document.querySelector(sel);
          const url = extractFromImg(img);
          if (url) return url;
        }

        // 2) 常见 logo 容器（背景图）
        const bgSelectors = [
          '[class^="header-left_logo"]',
          '[class*="logo"]',
          '[class*="brand"]',
        ];
        for (const sel of bgSelectors) {
          const el = document.querySelector(sel);
          const url = extractFromBg(el);
          if (url) return url;
          // 尝试子元素图片
          if (el) {
            const img = el.querySelector('img');
            const imgUrl = extractFromImg(img);
            if (imgUrl) return imgUrl;
          }
        }
        return '';
      });
    };

    // 优先从车型详情页尝试
    if (carId) {
      const page = await this.browserManager.createPage(browser);
      try {
        const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
        try {
          await pTimeout(page.goto(urlSeries, { waitUntil: 'domcontentloaded' }), { milliseconds: config.crawler.timeout });
        } catch (_) {
          try {
            await pTimeout(page.goto(urlSeries, { waitUntil: 'load' }), { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) });
          } catch (_) {
            await pTimeout(page.goto(urlSeries), { milliseconds: Math.min(config.crawler.timeout + 15000, 40000) });
          }
        }
        await new Promise(r => setTimeout(r, 800));
        const logo1 = await tryExtractLogo(page);
        if (logo1) return logo1;
      } catch (error) {
        console.warn(`⚠️ 车型页获取品牌logo失败: ${error.message}`);
      } finally {
        await page.close();
      }
    }

    // 回退到品牌页尝试
    if (brandId) {
      const page = await this.browserManager.createPage(browser);
      try {
        const brandUrl = `https://www.dongchedi.com/auto/library-brand/${brandId}`;
        try {
          await pTimeout(page.goto(brandUrl, { waitUntil: 'domcontentloaded' }), { milliseconds: config.crawler.timeout });
        } catch (_) {
          await pTimeout(page.goto(brandUrl, { waitUntil: 'load' }), { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) });
        }
        await new Promise(r => setTimeout(r, 800));
        const logo2 = await tryExtractLogo(page);
        if (logo2) return logo2;
      } catch (error) {
        console.warn(`⚠️ 品牌页获取品牌logo失败: ${error.message}`);
      } finally {
        await page.close();
      }
    }

    return '';
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
      // 1. 采集车型基本信息
      const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
      // 更稳健的加载策略：domcontentloaded -> load -> 无 waitUntil
      try {
        await pTimeout(
          page.goto(urlSeries, { waitUntil: 'domcontentloaded' }),
          { milliseconds: config.crawler.timeout }
        );
      } catch (e1) {
        console.warn(`⚠️ 车型 ${carId} domcontentloaded 超时，回退到 load: ${e1.message}`);
        try {
          await pTimeout(
            page.goto(urlSeries, { waitUntil: 'load' }),
            { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) }
          );
        } catch (e2) {
          console.warn(`⚠️ 车型 ${carId} load 仍超时，最后尝试不设置 waitUntil: ${e2.message}`);
          await pTimeout(
            page.goto(urlSeries),
            { milliseconds: Math.min(config.crawler.timeout + 15000, 40000) }
          );
        }
      }
      
      // 采集车型基本信息前延长等待时间，确保页面渲染完成
      await new Promise(resolve => setTimeout(resolve, 2500));
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
        await pTimeout(
          page.goto(urlParams, { waitUntil: 'domcontentloaded' }), // 更快的加载策略
          { milliseconds: config.crawler.timeout }
        );
      } catch (e3) {
        console.warn(`⚠️ 车型 ${carId} 参数页 domcontentloaded 超时，回退到 load: ${e3.message}`);
        await pTimeout(
          page.goto(urlParams, { waitUntil: 'load' }),
          { milliseconds: Math.min(config.crawler.timeout + 10000, 35000) }
        );
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // 增加等待时间，确保异步渲染完成

      // 统一配置采集逻辑 - 兼容所有结构
      const configs = await page.evaluate(() => {
        let configNames = [];
        let configIds = [];
        let prices = [];
        
        // 方法1：优先采集参数配置页面的结构
        // 从页面顶部的车型标题获取配置名称
        const titleElements = Array.from(document.querySelectorAll('h1, h2, h3')).filter(el => 
          el.textContent.includes('款') && el.textContent.length > 10
        );
        
        if (titleElements.length > 0) {
          console.log('使用参数配置页面结构采集配置信息');
          configNames = titleElements.map(el => el.textContent.trim());
          
          // 从页面URL或其他地方提取配置ID（暂时使用索引作为占位符）
          configIds = Array(configNames.length).fill('').map((_, idx) => `config_${idx + 1}`);
          
          // 从"基本信息"部分的"官方指导价"行获取价格
          const basicInfoSection = Array.from(document.querySelectorAll('h3')).find(h3 => 
            h3.textContent.includes('基本信息')
          );
          
          if (basicInfoSection) {
            const nextElements = [];
            let currentElement = basicInfoSection.nextElementSibling;
            while (currentElement && nextElements.length < 20) {
              if (currentElement.textContent.includes('官方指导价')) {
                // 找到官方指导价行，获取下一行的价格
                let priceElement = currentElement.nextElementSibling;
                while (priceElement && nextElements.length < configNames.length) {
                  const priceText = priceElement.textContent.trim();
                  if (/^[\d.]+万(?:元)?$/.test(priceText)) {
                    nextElements.push(priceText);
                    priceElement = priceElement.nextElementSibling;
                  } else {
                    priceElement = priceElement.nextElementSibling;
                  }
                }
                break;
              }
              currentElement = currentElement.nextElementSibling;
            }
            prices = nextElements;
          }
        }
        
        // 方法2：Fallback到索奈等特殊结构 - ul > li
        if (configNames.length === 0) {
          console.log('常规结构未找到，使用索奈等特殊结构');
          const liNodes = Array.from(document.querySelectorAll('ul > li'));
          configNames = liNodes.map(li => {
            const a = li.querySelector('a[href*="model-"]');
            return a ? a.textContent.trim() : '';
          });
          configIds = liNodes.map(li => {
            const a = li.querySelector('a[href*="model-"]');
            if (a && a.href) {
              const match = a.href.match(/model-(\d+)/);
              return match ? match[1] : '';
            }
            return '';
          });
          
          // 使用索奈页面的价格选择器
          prices = liNodes.map(li => {
            const priceDiv = li.querySelector('div.tw-text-color-gray-800.tw-text-16');
            if (priceDiv) {
              const priceText = priceDiv.textContent.trim();
              // 提取纯数字价格，过滤掉"询底价"等额外文字
              const priceMatch = priceText.match(/^([\d.]+万(?:元)?)/);
              return priceMatch ? priceMatch[1] : priceText;
            }
            return '';
          });
        }
        
        // 方法3：兜底搜索页面文本中的价格信息
        if (prices.length === 0) {
          console.log('特殊结构未找到价格，搜索页面文本');
          const allDivs = Array.from(document.querySelectorAll('div, span')).map(e => e.textContent.trim());
          const priceIndex = allDivs.findIndex(t => t === '官方指导价');
          if (priceIndex !== -1) {
            for (let i = priceIndex + 1; i < allDivs.length && prices.length < configNames.length; i++) {
              const text = allDivs[i];
              // 提取纯数字价格，过滤掉"询底价"等额外文字
              const priceMatch = text.match(/^([\d.]+万(?:元)?)/);
              if (priceMatch) {
                prices.push(priceMatch[1]);
              }
            }
          }
        }
        
        // 长度对齐
        const maxLen = Math.max(configNames.length, configIds.length, prices.length);
        while (configNames.length < maxLen) configNames.push('');
        while (configIds.length < maxLen) configIds.push('');
        while (prices.length < maxLen) prices.push('');
        
        // 返回结构（统一过滤机制）
        return configNames.map((name, idx) => ({
          configName: name,
          configId: configIds[idx],
          price: prices[idx]
        })).filter(cfg => {
          // 统一过滤机制：必须有配置名、配置ID和有效价格
          return cfg.configName && 
                 cfg.configId && 
                 cfg.price && 
                 !['暂无报价', '暂无', '-'].includes(cfg.price.trim());
        });
      });

      // 为每个配置抓取专属图片
      const configsWithImages = await this.getConfigImages(browser, configs, carId, brand);

      // 验证配置数量
      if (configsWithImages.length === 0) {
        console.warn(`⚠️ 车型 ${carId} 没有有效配置，跳过抓取`);
        return null;
      }

      // 清理车型名称，如果包含品牌名则只保留车型名称
      const cleanedCarName = this.cleanCarName(carBasicInfo.carName, brand);
      
      return {
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
      await pTimeout(
        page.goto(imagePageUrl, { waitUntil: 'domcontentloaded' }),
        { milliseconds: config.crawler?.timeout || 60000 }
      );
      await new Promise(r => setTimeout(r, config.crawler?.pageWaitTime || 3000));

      // 抓取色块信息
      const colorBlocks = await page.evaluate(() => {
        const result = [];
        const colorFilters = document.querySelectorAll('.filters_colors__2qAUB .filters_item__1S2ZR');
        colorFilters.forEach(filter => {
          try {
            // 色块名
            const colorNameElement = filter.querySelector('.filters_name__9ioNp');
            const colorName = colorNameElement ? colorNameElement.textContent.trim() : '';
            // 色块色号（支持多色）
            const colorElements = filter.querySelectorAll('.filters_color__2W_py');
            const colorCodes = Array.from(colorElements).map(el => el.style.backgroundColor);
            // 色块链接
            const colorLink = filter.href || '';
            if (colorName && colorCodes.length > 0) {
              result.push({
                name: colorName,
                colors: colorCodes,
                link: colorLink
              });
            }
          } catch (e) {
            // 忽略单个色块异常
          }
        });
        return result;
      });
      console.log(`🎨 找到${type === 'wg' ? '外观' : '内饰'}色块:`, colorBlocks.map(c => c.name));

      // 抓取每个色块的主图
      const colorBlocksWithImages = [];
      for (const color of colorBlocks) {
        try {
          let colorPageUrl = color.link;
          if (color.link && !color.link.startsWith('http')) {
            colorPageUrl = `https://www.dongchedi.com${color.link}`;
          }
          await pTimeout(
            page.goto(colorPageUrl, { waitUntil: 'domcontentloaded' }),
            { milliseconds: config.crawler?.timeout || 60000 }
          );
          await new Promise(r => setTimeout(r, config.crawler?.imageWaitTime || 2000));
          // 主图抓取
          const mainImage = await page.evaluate(() => {
            const imageSelectors = [
              'img[src*="motor-mis-img"][src*="~2508x0"]',
              'img[src*="motor-mis-img"][src*="~1200x0"]',
              'img[src*="motor-mis-img"][src*="~1000x0"]',
              'img[src*="motor-mis-img"][src*="~700x0"]',
              'img[src*="motor-mis-img"][src*="~500x0"]',
              'img[src*="motor-mis-img"]',
              'img'
            ];
            for (const selector of imageSelectors) {
              const imgs = document.querySelectorAll(selector);
              if (imgs.length > 0) {
                let bestImg = null;
                let bestResolution = 0;
                for (const img of imgs) {
                  const url = img.src || img.getAttribute('data-src') || '';
                  if (url) {
                    const resolutionMatch = url.match(/~(\d+)x\d+/);
                    if (resolutionMatch) {
                      const resolution = parseInt(resolutionMatch[1]);
                      if (resolution > bestResolution) {
                        bestResolution = resolution;
                        bestImg = img;
                      }
                    } else if (!bestImg) {
                      bestImg = img;
                    }
                  }
                }
                if (bestImg) {
                  return bestImg.src || bestImg.getAttribute('data-src') || '';
                }
              }
            }
            return '';
          });
          colorBlocksWithImages.push({
            name: color.name,
            colors: color.colors,
            mainImage: mainImage
          });
        } catch (error) {
          colorBlocksWithImages.push({
            name: color.name,
            colors: color.colors,
            mainImage: ''
          });
        }
      }
      return colorBlocksWithImages;
    } catch (error) {
      console.warn(`⚠️ 获取${type === 'wg' ? '外观' : '内饰'}图片失败:`, error.message);
      return [];
    } finally {
      await page.close();
    }
  }

  async getConfigImages(browser, configs, carId, brand) {
    const configsWithImages = [];
    for (const config of configs) {
      // 如果没有配置ID，跳过图片采集，但保留基本信息
      if (!config.configId) {
        configsWithImages.push({
          ...config,
          exteriorImages: [],
          interiorImages: [],
          configImage: ''
        });
        continue;
      }
      
      // 确保每个配置都有正确的超时配置
      const configWithTimeout = {
        ...config,
        crawler: {
          timeout: config.crawler?.timeout || 60000,
          pageWaitTime: config.crawler?.pageWaitTime || 3000,
          imageWaitTime: config.crawler?.imageWaitTime || 2000
        }
      };
      
      // 外观图片
      const exteriorImages = await this.getTypeImages(browser, configWithTimeout, carId, 'wg');
      // 内饰图片
      const interiorImages = await this.getTypeImages(browser, configWithTimeout, carId, 'ns');
      // 过滤掉crawler字段
      const { crawler, ...pureConfig } = config;
      configsWithImages.push({
        ...pureConfig,
        exteriorImages,
        interiorImages,
        configImage: exteriorImages.length > 0 ? exteriorImages[0].mainImage : ''
      });
    }
    return configsWithImages;
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
    
    // 检查车型名称是否包含无效字符
    const invalidChars = ['/', '\\', '|', ':', '*', '?', '"', '<', '>'];
    if (invalidChars.some(char => carBasicInfo.carName.includes(char))) {
      console.warn(`⚠️ 车型名称包含无效字符: "${carBasicInfo.carName}"`);
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