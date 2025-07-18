// 加载环境变量
require('dotenv').config();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getRandomUserAgent, getRandomViewport, getRandomDelay } = require('./anti-detection');

// 品牌ID映射
const brandIdsMap = {
  Volkswagen: 1, // 大众
  Audi: 2,      // 奥迪
  Benz: 3,      // 奔驰
  BMW: 4,       // 宝马
  Aion: 242,    // 埃安
  Aito: 483,    // 问界
  Avatr: 475,   // 阿维塔
  AstonMartin: 80, // 阿斯顿马丁
  AlfaRomeo: 51,   // 阿尔法·罗密欧
  Honda: 9,     // 本田
  Buick: 12,    // 别克
  BYD: 16,      // 比亚迪
  Porsche: 20,  // 保时捷
  Besturn: 27,  // 奔腾
  Bentley: 47,  // 宾利
  Baojun: 366,  // 宝骏
  Peugeot: 61,  // 标致
  BJSUV: 52,    // 北京越野
  BAIC: 68,     // 北京汽车
  BAW: 78,      // 北京汽车制造厂
  Changan: 35,  // 长安
  ChanganNevo: 870, // 长安启源
  GWM: 8,       // 长城
  Kaicene: 171, // 长安凯程
  Kuayue: 210,  // 长安跨越
  Skyworth: 368, // 创维
  Forthing: 70, // 东风风行
  Aeolus: 37,   // 东风风神
  DS: 55,       // DS
  Fengon: 95,   // 东风风光
  eπ: 891,      // 东风奕派
  Dongfeng: 91, // 东风
  Nami: 417,    // 东风纳米
  _212: 10012,  // 212
  Toyota: 5,    // 丰田
  Ford: 7,      // 福特
  RisingAuto: 401, // 飞凡
  FormulaLeopard: 861, // 方程豹
  Ferrari: 44,   // 法拉利
  Foton: 57,     // 福田
  Trumpchi: 40,  // 广汽传祺
  Hyper: 880,    // 广汽昊铂
  GMC: 96,       // GMC
  Haval: 17,     // 哈弗
  Hongqi: 59,    // 红旗
  Hycan: 303,    // 合创
  Hama: 53,      // 海马
  Hengchi: 399,  // 恒驰
  iCAR: 909,     // iCAR
  Geely: 73,     // 吉利
  GeelyGalaxy: 858, // 吉利银河
  Zeekr: 426,    // 极氪
  Jetour: [209,10425],   // 捷途（多ID）
  Jaguar: 31,    // 捷豹
  Jetta: 260,    // 捷达
  Geome: 264,    // 吉利几何
  Genesis: 273,  // 捷尼赛思
  Jeep: 14,      // Jeep
  JMC: 100,      // 江铃
  Arcfox: 176,   // 极狐
  JAC: [882,871], // 江淮（多ID，已去除31）
  Polestar: 196, // 极星
  Rox: 878,      // 极石
  Cadillac: 30,  // 凯迪拉克
  Kaiyi: 142,    // 凯翼
  Koenigsegg: 83,// 柯尼赛格
  LandRover: 19, // 路虎
  Lexus: 22,     // 雷克萨斯
  Lincoln: 62,   // 林肯
  LiAuto: 202,   // 理想
  LynkCo: 174,   // 领克
  Leapmotor: 207,// 零跑
  Onvo: 918,     // 乐道
  RollsRoyce: 41,// 劳斯莱斯
  Lamborghini: 42,// 兰博基尼
  Voyah: 395, // 岚图
  Lotus: 85, // 莲花
  Landian: 868, // 蓝电
  Mazda: 15, // 马自达
  MG: 34, // 名爵
  Maserati: 45, // 玛莎拉蒂
  Mini: 65, // MINI
  McLaren: 86, // 迈凯轮
  Mhero: 527, // 猛士
  Neta: 199, // 哪吒
  Ora: 238, // 欧拉
  Acura: 38, // 讴歌
  Chery: [18,10409,461], // 奇瑞（多ID）
  Kia: 13, // 起亚
  Nissan: 10, // 日产
  Roewe: 36, // 荣威
  Livan: 381, // 睿蓝
  Deepal: 515, // 深蓝
  Skoda: 23, // 斯柯达
  Maxus: 108, // 上汽大通
  Smart: 48, // Smart
  Subaru: 33, // 斯巴鲁
  Saic: 10419, // 尚界
  Tesla: 63, // 特斯拉
  Tank: 425, // 坦克
  Denza: 159, // 腾势
  Wuling: 39, // 五菱
  Volvo: 24, // 沃尔沃
  Nio: 112, // 蔚来
  Wey: 66, // 魏牌
  Xiaomi: 535, // 小米
  Xpeng: 195, // 小鹏
  Chevrolet: 6, // 雪佛兰
  Hyundai: 11, // 现代
  Citroen: 21, // 雪铁龙
  Stelato: 931, // 享界
  Infiniti: 29, // 英菲尼迪
  FAW: 67, // 一汽
  Yangwang: 546, // 仰望
  Firefly: 10363, // 萤火虫
  IM: 419, // 智己
  Luxeed: 883, // 智界
  Maextro: 10293, // 尊界
};

// 品牌ID与中文名映射
const brandNameMap = {
  1: '大众',
  2: '奥迪',
  3: '奔驰',
  4: '宝马',
  242: '埃安',
  483: '问界',
  475: '阿维塔',
  80: '阿斯顿马丁',
  51: '阿尔法·罗密欧',
  9: '本田',
  12: '别克',
  16: '比亚迪',
  20: '保时捷',
  27: '奔腾',
  47: '宾利',
  366: '宝骏',
  61: '标致',
  52: '北京越野',
  68: '北京汽车',
  78: '北京汽车制造厂',
  35: '长安',
  870: '长安启源',
  8: '长城',
  171: '长安凯程',
  210: '长安跨越',
  368: '创维',
  70: '东风风行',
  37: '东风风神',
  55: 'DS',
  95: '东风风光',
  891: '东风奕派',
  91: '东风',
  417: '东风纳米',
  10012: '212',
  5: '丰田',
  7: '福特',
  401: '飞凡',
  861: '方程豹',
  44: '法拉利',
  57: '福田',
  40: '广汽传祺',
  880: '广汽昊铂',
  96: 'GMC',
  17: '哈弗',
  59: '红旗',
  303: '合创',
  53: '海马',
  399: '恒驰',
  909: 'iCAR',
  73: '吉利',
  858: '吉利银河',
  426: '极氪',
  209: '捷途',
  10425: '捷途',
  31: '捷豹',
  260: '捷达',
  264: '吉利几何',
  273: '捷尼赛思',
  14: 'Jeep',
  100: '江铃',
  176: '极狐',
  882: '江淮',
  871: '江淮',
  196: '极星',
  878: '极石',
  30: '凯迪拉克',
  142: '凯翼',
  83: '柯尼赛格',
  19: '路虎',
  22: '雷克萨斯',
  62: '林肯',
  202: '理想',
  174: '领克',
  207: '零跑',
  918: '乐道',
  41: '劳斯莱斯',
  42: '兰博基尼',
  395: '岚图',
  85: '莲花',
  868: '蓝电',
  15: '马自达',
  34: '名爵',
  45: '玛莎拉蒂',
  65: 'MINI',
  86: '迈凯轮',
  527: '猛士',
  199: '哪吒',
  238: '欧拉',
  38: '讴歌',
  18: '奇瑞',
  10409: '奇瑞',
  461: '奇瑞',
  13: '起亚',
  10: '日产',
  36: '荣威',
  381: '睿蓝',
  515: '深蓝',
  23: '斯柯达',
  108: '上汽大通',
  48: 'Smart',
  33: '斯巴鲁',
  10419: '尚界',
  63: '特斯拉',
  425: '坦克',
  159: '腾势',
  39: '五菱',
  24: '沃尔沃',
  112: '蔚来',
  66: '魏牌',
  535: '小米',
  195: '小鹏',
  6: '雪佛兰',
  11: '现代',
  21: '雪铁龙',
  931: '享界',
  29: '英菲尼迪',
  67: '一汽',
  546: '仰望',
  10363: '萤火虫',
  419: '智己',
  883: '智界',
  10293: '尊界',
};

async function collectCarData(brand) {
  const brandIds = Array.isArray(brandIdsMap[brand]) ? brandIdsMap[brand] : [brandIdsMap[brand]];
  if (!brandIds[0]) {
    console.error('未找到该品牌ID，请检查品牌名');
    process.exit(1);
  }
  let allCars = [];
  let brandInfo = null;
  let brandIdUsed = null;
  for (const brandId of brandIds) {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport(getRandomViewport());
    try {
      const result = await getBrandInfoAndCarIds(page, brandId);
      if (!brandInfo) {
        // 品牌名写死
        brandInfo = result.brandInfo;
        brandInfo.brand = brandNameMap[brandId] || '';
        brandIdUsed = brandId;
      }
      // 车型页面logo采集逻辑
      let brandLogo = '';
      if (result.carIds.length > 0) {
        const firstCarId = result.carIds[0];
        const urlSeries = `https://www.dongchedi.com/auto/series/${firstCarId}`;
        await page.goto(urlSeries, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000)));
        brandLogo = await page.evaluate(() => {
          const logoImg = document.querySelector('[class^="header-left_logo"]');
          return logoImg ? logoImg.src : '';
        });
        brandInfo.brandImage = brandLogo;
      } else {
        brandInfo.brandImage = '';
      }
      if (result.carIds.length > 0) {
        // 车型并发采集
        let cars = [];
        const uniqueCarIds = [...new Set(result.carIds)];
        const concurrency = 4;
        const pages = await Promise.all(Array(concurrency).fill(0).map(async () => {
          const p = await browser.newPage();
          await p.setUserAgent(getRandomUserAgent());
          await p.setViewport(getRandomViewport());
          await setupRequestInterception(p);
          return p;
        }));
        await Promise.all(pages.map(async (page, idx) => {
          for (let i = idx; i < uniqueCarIds.length; i += concurrency) {
            try {
              const carData = await collectSingleCarData(page, uniqueCarIds[i]);
              if (carData) {
                cars.push(carData);
              }
            } catch (error) {
              continue;
            }
          }
          await page.close();
        }));
        allCars = allCars.concat(cars);
      }
    } catch (error) {
      console.error('采集过程中发生错误:', error);
    } finally {
      await browser.close();
    }
  }
  // 保存数据
  if (allCars.length > 0 && brandInfo) {
    const dataPath = path.join(__dirname, '..', 'data', `${brand}.json`);
    const result = { ...brandInfo, cars: allCars };
    fs.writeFileSync(dataPath, JSON.stringify(result, null, 2));
    console.log(`采集完成！共采集 ${allCars.length} 个车型，数据已保存到 data/${brand}.json`);
  } else {
    console.log('没有成功采集到任何车型数据');
  }
}

// 从品牌页面获取品牌信息和车型ID列表
async function getBrandInfoAndCarIds(page, brandId) {
  const brandUrl = `https://www.dongchedi.com/auto/library-brand/${brandId}`;
  console.log(`访问品牌页面: ${brandUrl}`);
  
  await page.goto(brandUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000)));

  const result = await page.evaluate(() => {
    // 获取品牌信息（只采集一次）
    const brandInfo = {
      brand: '',
      brandImage: ''
    };
    
    // 只采集品牌名称，不采集logo
    const brandElements = document.querySelectorAll('h1, .brand-name, .brand-title');
    for (const element of brandElements) {
      const text = element.textContent.trim();
      if (text && text.length > 0 && text.length < 20) {
        brandInfo.brand = text;
        break;
      }
    }
    
    // 调试信息：输出页面结构
    console.log('=== 页面调试信息 ===');
    console.log('品牌信息:', brandInfo);
    
    // 查找所有可能的车型容器
    const possibleContainers = [
      '.car-list-item',
      '.series-card',
      '.car-item',
      '[class*="car"]',
      '[class*="series"]'
    ];
    
    let carIds = [];
    let foundContainer = false;
    
    for (const selector of possibleContainers) {
      const elements = document.querySelectorAll(selector);
      console.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);
      
      if (elements.length > 0 && !foundContainer) {
        foundContainer = true;
        console.log('使用选择器:', selector);
        
        elements.forEach((item, index) => {
          console.log(`元素 ${index}:`, item.outerHTML.substring(0, 200) + '...');
          
          // 检查价格信息
          const priceSelectors = ['.series-card-price', '.price', '[class*="price"]'];
          let hasPrice = false;
          
          for (const priceSelector of priceSelectors) {
            const priceElement = item.querySelector(priceSelector);
            if (priceElement) {
              const priceText = priceElement.textContent.trim();
              console.log(`价格元素 "${priceSelector}": "${priceText}"`);
              if (priceText && priceText !== '暂无报价') {
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
                  console.log(`找到车型ID: ${carId} (链接: ${link.href})`);
                  break;
                }
              }
            }
          }
        });
      }
    }
    
    console.log('最终找到的车型ID:', carIds);
    return { brandInfo, carIds };
  });

  return result;
}

// 采集单个车型的详细信息
async function collectSingleCarData(page, carId) {
  // 1. 采集车型基本信息（车型名、主图、厂商/级别）
  const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
  await page.goto(urlSeries, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000)));
  
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
    
    // 新增采集seriesName（厂商/级别）
    let seriesName = '';
    const seriesSpan = document.querySelector('span.tw-leading-50.tw-text-12');
    if (seriesSpan) {
      // 拼接所有纯文本内容，去除注释
      seriesName = Array.from(seriesSpan.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .filter(Boolean)
        .join('');
    }
    
    return { carName, mainImage, seriesName };
  });

  // 跳过无效车型
  if (!carBasicInfo.carName || !carBasicInfo.mainImage) {
    return null;
  }

  // 2. 采集配置名称和指导价等
  const urlParams = `https://www.dongchedi.com/auto/params-carIds-x-${carId}`;
  await page.goto(urlParams, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000)));
  
  const configs = await page.evaluate(() => {
    const configNames = Array.from(document.querySelectorAll('a[class^="cell_car__"]')).map(a => a.textContent.trim());
    const prices = Array.from(document.querySelectorAll('div[class*="official-price"]')).map(e => e.textContent.trim());
    const sizes = Array.from(document.querySelectorAll('div[data-row-anchor="length_width_height"] div[class*="table_col__"]')).slice(1).map(e => e.textContent.trim());
    const fuelTypes = Array.from(document.querySelectorAll('div[data-row-anchor="fuel_form"] div[class*="table_col__"]')).slice(1).map(e => e.textContent.trim());
    
    return configNames.map((name, idx) => ({
      configName: name,
      price: prices[idx] || '',
      fuelType: fuelTypes[idx] || '',
      size: sizes[idx] || ''
    }));
  });

  return {
    carName: carBasicInfo.carName,
    mainImage: carBasicInfo.mainImage,
    seriesName: carBasicInfo.seriesName,
    configs
  };
}

// 设置请求拦截，屏蔽图片等资源，减少流量和反爬
async function setupRequestInterception(page) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    // 屏蔽图片、字体、样式等静态资源，只保留文档和XHR
    const resourceType = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

// 自动同步brands.json脚本
if (require.main === module && process.argv[2] === 'autoSyncBrands') {
  const dataDir = path.join(__dirname, '..', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');
  const brands = [];
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
      brands.push({
        name: content.brand || content.name || file.replace('.json',''),
        brandImage: content.brandImage || '',
        file: file
      });
    } catch (e) {
      continue;
    }
  }
  fs.writeFileSync(path.join(dataDir, 'brands.json'), JSON.stringify(brands, null, 2));
  console.log('brands.json 已自动同步，包含', brands.length, '个品牌');
  process.exit(0);
}

if (require.main === module) {
  const brand = process.argv[2]; // node index.js Volkswagen
  if (!brand) {
    console.error('请在命令行参数中指定品牌名');
    console.log('可用品牌:', Object.keys(brandIdsMap).join(', '));
    process.exit(1);
  }
  
  collectCarData(brand)
    .then(() => {
      console.log('DBT Messenger执行成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('DBT Messenger执行失败:', error);
      process.exit(1);
    });
}

module.exports = { collectCarData }; 