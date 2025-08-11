// 加载环境变量
require('dotenv').config();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cliProgress = require('cli-progress');
const colors = require('colors');
const { getRandomUserAgent, getRandomViewport, getRandomDelay } = require('./anti-detection');

// 品牌ID映射
const brandIdsMap = {
  Volkswagen: 1, // 大众
  Audi: [2, 10362],      // 奥迪
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
  Bestune: 27,  // 奔腾
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
  10362: '奥迪', // 奥迪的第二个ID
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
  
  console.log(colors.cyan(`🚗 开始采集品牌: ${brand}`));
  
  let allCars = [];
  let brandInfo = null;
  let brandIdUsed = null;
  
  for (const brandId of brandIds) {
    console.log(colors.yellow(`📡 正在连接浏览器...`));
    
    // 根据环境自动检测Chrome路径
    let executablePath = null;
    if (process.platform === 'darwin') {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (process.platform === 'linux') {
      executablePath = '/usr/bin/google-chrome-stable';
    } else if (process.platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    }
    
    const browser = await puppeteer.launch({ 
      headless: true, 
      executablePath: executablePath,
      args: ['--no-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport(getRandomViewport());
    
    try {
      console.log(colors.blue(`🔍 正在获取品牌信息和车型列表...`));
      const result = await getBrandInfoAndCarIds(page, brandId);
      
      if (!brandInfo) {
        brandInfo = result.brandInfo;
        brandInfo.brand = brandNameMap[brandId] || '';
        brandIdUsed = brandId;
      }
      
      console.log(colors.green(`✅ 找到 ${result.carIds.length} 个车型`));
      
      // 车型页面logo采集逻辑
      let brandLogo = '';
      if (result.carIds.length > 0) {
        console.log(colors.blue(`🖼️  正在获取品牌Logo...`));
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
        
        console.log(colors.blue(`🔄 正在并发采集车型数据 (并发数: ${concurrency})...`));
        
        // 创建进度条
        const progressBar = new cliProgress.SingleBar({
          format: '📊 车型采集进度 |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total} | 当前: {currentCar}',
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        });
        
        progressBar.start(uniqueCarIds.length, 0, { currentCar: '准备中...' });
        
        const pages = await Promise.all(Array(concurrency).fill(0).map(async () => {
          const p = await browser.newPage();
          await p.setUserAgent(getRandomUserAgent());
          await p.setViewport(getRandomViewport());
          await setupRequestInterception(p);
          return p;
        }));
        
        let completedCount = 0;
        await Promise.all(pages.map(async (page, idx) => {
          for (let i = idx; i < uniqueCarIds.length; i += concurrency) {
            try {
              const carId = uniqueCarIds[i];
              progressBar.update(completedCount, { currentCar: `车型ID: ${carId}` });
              
              const carData = await collectSingleCarData(page, carId);
              if (carData) {
                cars.push(carData);
              }
              
              completedCount++;
              progressBar.update(completedCount, { currentCar: carData ? carData.carName : `车型ID: ${carId}` });
              
            } catch (error) {
              completedCount++;
              progressBar.update(completedCount, { currentCar: `错误: ${error.message}` });
              continue;
            }
          }
          await page.close();
        }));
        
        progressBar.stop();
        allCars = allCars.concat(cars);
        
        console.log(colors.green(`✅ 成功采集 ${cars.length} 个车型数据`));
      }
    } catch (error) {
      console.error(colors.red(`❌ 采集过程中发生错误: ${error.message}`));
    } finally {
      await browser.close();
    }
  }
  
  // 保存数据
  if (allCars.length > 0 && brandInfo) {
    const dataPath = path.join(__dirname, '..', 'data', `${brand}.json`);
    const result = { ...brandInfo, cars: allCars };
    fs.writeFileSync(dataPath, JSON.stringify(result, null, 2));
    console.log(colors.green(`🎉 采集完成！共采集 ${allCars.length} 个车型，数据已保存到 data/${brand}.json`));
  } else {
    console.log(colors.yellow(`⚠️  没有成功采集到任何车型数据`));
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
    
    return { carName, mainImage };
  });

  // 跳过无效车型
  if (!carBasicInfo.carName || !carBasicInfo.mainImage) {
    console.log(colors.yellow(`⚠️  车型 ${carId} 基本信息不完整，跳过`));
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
    
    // 新增：采集厂商信息
    const manufacturers = Array.from(document.querySelectorAll('div[data-row-anchor="sub_brand_name"] div[class*="table_col__"]')).slice(1).map(e => e.textContent.trim());
    
    // 新增：采集车型级别
    const classes = Array.from(document.querySelectorAll('div[data-row-anchor="jb"] div[class*="table_col__"]')).slice(1).map(e => e.textContent.trim());
    
    // 新增：采集发动机信息（尝试多个可能的字段）
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
    
    // 新增：采集电动机信息
    const motors = Array.from(document.querySelectorAll('div[data-row-anchor="electric_description"] div[class*="table_col__"]')).slice(1).map(e => e.textContent.trim());
    
    return configNames.map((name, idx) => {
      const fuelType = fuelTypes[idx] || '';
      
      // 根据能源类型决定抓取发动机还是电动机
      let power = '';
      if (fuelType === '汽油' || fuelType === '柴油') {
        // 燃油车：使用发动机信息
        power = engines[idx] || '';
      } else if (fuelType === '纯电动' || fuelType === '插电式混合动力' || fuelType === '增程式') {
        // 新能源车：使用电动机信息
        power = motors[idx] || '';
      } else {
        // 其他类型：尝试获取发动机信息，如果没有则获取电动机信息
        power = engines[idx] || motors[idx] || '';
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

  return {
    carName: carBasicInfo.carName,
    mainImage: carBasicInfo.mainImage,
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
  const brand = process.argv[2]; // node index.js Volkswagen 或 node index.js all
  if (!brand) {
    console.error('请在命令行参数中指定品牌名或 all');
    console.log('可用品牌:', Object.keys(brandIdsMap).join(', '));
    process.exit(1);
  }

  if (brand === 'all') {
    // 全品牌采集
    (async () => {
      const brandList = Object.keys(brandIdsMap);
      const total = brandList.length;
      
      console.log(colors.cyan(`🚀 开始全品牌采集，共 ${total} 个品牌`));
      
      // 创建品牌采集进度条
      const brandProgressBar = new cliProgress.SingleBar({
        format: '📊 品牌采集进度 |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total} | 当前: {currentBrand}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });
      
      brandProgressBar.start(total, 0, { currentBrand: '准备中...' });
      
      for (let idx = 0; idx < total; idx++) {
        const brandName = brandList[idx];
        const dest = path.join(__dirname, '..', 'data', `${brandName}.json`);
        
        brandProgressBar.update(idx, { currentBrand: brandName });
        
        if (fs.existsSync(dest)) {
          try {
            const content = JSON.parse(fs.readFileSync(dest, 'utf-8'));
            if (content && content.cars && content.cars.length > 0) {
              console.log(colors.yellow(`\n⚠️  ${brandName} 已存在且有数据，跳过处理`));
              continue;
            } else {
              fs.unlinkSync(dest);
              console.log(colors.yellow(`\n⚠️  ${brandName} 已存在但无有效数据，重新处理`));
            }
          } catch (e) {
            fs.unlinkSync(dest);
            console.log(colors.yellow(`\n⚠️  ${brandName} 已存在但读取失败，重新处理`));
          }
        }
        
        try {
          console.log(colors.blue(`\n🔄 [${idx + 1}/${total}] 正在处理: ${brandName}`));
          await collectCarData(brandName);
          
          const newPath = path.join(dataDir, 'cars.json');
          if (fs.existsSync(newPath)) {
            let shouldSave = true;
            if (fs.existsSync(dest)) {
              try {
                const oldContent = JSON.parse(fs.readFileSync(dest, 'utf-8'));
                const newContent = JSON.parse(fs.readFileSync(newPath, 'utf-8'));
                // 简单对比：车型数量或内容不同则覆盖
                const oldCars = oldContent.cars || [];
                const newCars = newContent.cars || [];
                if (oldCars.length === newCars.length) {
                  // 进一步对比内容
                  const isSame = JSON.stringify(oldCars) === JSON.stringify(newCars);
                  if (isSame) {
                    shouldSave = false;
                    console.log(colors.blue(`🟡 [${idx + 1}/${total}] ${brandName} 新旧数据一致，跳过保存`));
                  }
                }
              } catch (e) {
                // 旧文件损坏，强制覆盖
                shouldSave = true;
                console.log(colors.yellow(`⚠️  [${idx + 1}/${total}] ${brandName} 旧数据读取失败，强制覆盖`));
              }
            }
            if (shouldSave) {
              fs.renameSync(newPath, dest);
              console.log(colors.green(`✅ [${idx + 1}/${total}] ${brandName} 新数据已保存到 ${dest}`));
            } else {
              fs.unlinkSync(newPath);
            }
          } else {
            console.log(colors.red(`❌ [${idx + 1}/${total}] ${brandName} 未获取到数据`));
          }
        } catch (e) {
          console.error(colors.red(`💥 [${idx + 1}/${total}] 处理品牌 ${brandName} 失败: ${e.message}`));
        }
      }
      
      brandProgressBar.stop();
      console.log(colors.green('\n🎉 全部品牌处理完成！'));
      process.exit(0);
    })();
  } else {
    collectCarData(brand)
      .then(() => {
        console.log('数据处理完成！');
        process.exit(0);
      })
      .catch((error) => {
        console.error('数据处理失败:', error);
        process.exit(1);
      });
  }
}

module.exports = { collectCarData };
// 导出品牌ID映射供排序使用
module.exports.brandIdsMap = brandIdsMap;