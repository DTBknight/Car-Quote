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
      '_212': '212',
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
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 固定1秒等待
      
      // 跳过人类行为模拟以提升速度
      // await simulateHumanBehavior(page);

      const carBasicInfo = await page.evaluate(() => {
        function getByXpath(xpath) {
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          return result.singleNodeValue;
        }
        
        const carNameH1 = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[1]/div[1]/div[1]/h1');
        let carName = carNameH1 ? carNameH1.textContent.trim() : '';
        
        let mainImage = '';
        const mainImg = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[2]/div/div/div[2]/img');
        if (mainImg) mainImage = mainImg.src;
        
        return { carName, mainImage };
      });

      // 验证数据
      if (!this.validateCarBasicInfo(carBasicInfo)) {
        return null;
      }

      // 2. 采集可选颜色及对应主图
      let colorImages = [];
      try {
        colorImages = await page.evaluate(async () => {
          const sleep = (ms) => new Promise(r => setTimeout(r, ms));
          const getMainImg = () => {
            // 优先系列页主图
            const img1 = document.querySelector('img[src^="http"]');
            return img1?.src || '';
          };
          // 选取可能的颜色可点击元素
          let candidates = Array.from(document.querySelectorAll('button,li,div,span,a'))
            .filter(el => {
              const cls = (el.className || '').toString();
              const hasColorCls = /color|paint|外观|内饰|颜色/i.test(cls);
              const title = el.getAttribute('title') || '';
              const txt = el.textContent.trim();
              const style = window.getComputedStyle(el);
              const isCircle = (style.borderRadius && parseFloat(style.borderRadius) >= 8);
              const clickable = el.onclick || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || style.cursor === 'pointer' || el.getAttribute('tabindex') !== null;
              return (hasColorCls || title.includes('色') || /色$/.test(txt) || isCircle) && clickable;
            });
          // 去重
          candidates = Array.from(new Set(candidates)).slice(0, 12);
          const base = getMainImg();
          const results = [];
          for (const el of candidates) {
            const before = getMainImg();
            const label = el.getAttribute('title') || el.textContent.trim();
            try { el.click(); } catch (_) {}
            await sleep(400);
            const after = getMainImg();
            if (after && after !== before && after !== base) {
              results.push({ colorName: label || '颜色', image: after });
            }
          }
          // 去重（按图片地址）
          const seen = new Set();
          const uniq = [];
          for (const r of results) {
            if (!seen.has(r.image)) { seen.add(r.image); uniq.push(r); }
          }
          return uniq.slice(0, 12);
        });
      } catch (e) {
        console.warn(`⚠️ 提取颜色图片失败: ${e.message}`);
      }

      // 3. 采集配置信息
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
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // 固定1秒等待

      const configs = await page.evaluate(() => {
        const configNames = Array.from(document.querySelectorAll('a[class^="cell_car__"]'))
          .map(a => a.textContent.trim());
        const prices = Array.from(document.querySelectorAll('div[class*="official-price"]'))
          .map(e => e.textContent.trim());
        const sizes = Array.from(document.querySelectorAll('div[data-row-anchor="length_width_height"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        const fuelTypes = Array.from(document.querySelectorAll('div[data-row-anchor="fuel_form"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        
        // 抓取厂商信息
        const manufacturers = Array.from(document.querySelectorAll('div[data-row-anchor="sub_brand_name"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        
        // 抓取级别信息
        const classes = Array.from(document.querySelectorAll('div[data-row-anchor="jb"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        
        // 抓取发动机信息（尝试多个可能的字段）
        const engineSelectors = [
          'div[data-row-anchor="engine"]',
          'div[data-row-anchor="displacement"]',
          'div[data-row-anchor="engine_description"]',
          'div[data-row-anchor="engine_type"]'
        ];
        
        let engines = [];
        for (const selector of engineSelectors) {
          const elements = document.querySelectorAll(selector + ' div[class*="table_col__"]');
          if (elements.length > 0) {
            engines = Array.from(elements).slice(1).map(e => e.textContent.trim());
            break;
          }
        }
        
        // 抓取电动机信息
        const motors = Array.from(document.querySelectorAll('div[data-row-anchor="electric_description"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        
        // 过滤掉没有价格或价格为"暂无报价"的配置
        return configNames.map((name, idx) => {
          const fuelType = fuelTypes[idx] || '';
          const isGasoline = fuelType === '汽油';
          
          // 根据能源类型决定抓取发动机还是电动机
          let power = '';
          if (isGasoline) {
            power = engines[idx] || '';
          } else {
            power = motors[idx] || '';
          }
          
          return {
            configName: name,
            price: prices[idx] || '',
            fuelType: fuelType,
            size: sizes[idx] || '',
            manufacturer: manufacturers[idx] || '',
            class: classes[idx] || '',
            power: power
          };
        }).filter(config => {
          const price = config.price.trim();
          return price && price !== '暂无报价' && price !== '暂无' && price !== '-';
        });
      });

      // 清理车型名称，如果包含品牌名则只保留车型名称
      const cleanedCarName = this.cleanCarName(carBasicInfo.carName, brand);
      
      return {
        carName: cleanedCarName,
        mainImage: carBasicInfo.mainImage,
        colorImages,
        configs
      };
    } catch (error) {
      console.error(`❌ 采集车型 ${carId} 数据失败:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  validateCarBasicInfo(carBasicInfo) {
    if (!carBasicInfo.carName) {
      console.warn('⚠️ 车型名称为空');
      return false;
    }
    
    if (config.validation.requireImages && !carBasicInfo.mainImage) {
      console.warn('⚠️ 车型主图为空');
      return false;
    }
    
    return true;
  }
}

module.exports = DataCollector; 