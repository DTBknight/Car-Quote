#!/usr/bin/env node

/**
 * 懂车帝每日新车采集工具
 * 专门用于GitHub Actions定时采集新上市车型
 * 
 * 功能：
 * 1. 采集懂车帝"在售"板块的新车型
 * 2. 检测新车型和改款车型
 * 3. 更新现有品牌JSON文件
 * 4. 生成变更报告
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const pTimeout = require('p-timeout').default;
const DataCollector = require('./data-collector');
const BrowserManager = require('./browser-manager');

class DailyCarCrawler {
  constructor() {
    this.browser = null;
    this.page = null;
    this.dataDir = path.join(__dirname, '../data');
    this.brands = {};
    this.newCars = [];
    this.updatedCars = [];
    this.errors = [];
    
    // 初始化主采集工具
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
  }

  async init() {
    console.log('🚀 初始化每日采集器...');
    
    // 使用主采集工具的浏览器管理器
    this.browser = await this.browserManager.createBrowser();
    this.page = await this.browserManager.createPage(this.browser);

    console.log('✅ 浏览器初始化完成');
  }

  async loadExistingBrands() {
    console.log('📂 加载现有品牌数据...');
    
    try {
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'brands.json');
      
      for (const file of jsonFiles) {
        const brandName = file.replace('.json', '');
        const filePath = path.join(this.dataDir, file);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          this.brands[brandName] = data;
          console.log(`  ✅ 加载品牌: ${brandName} (${data.cars?.length || 0} 车型)`);
        } catch (error) {
          console.warn(`  ⚠️ 加载品牌 ${brandName} 失败: ${error.message}`);
        }
      }
      
      console.log(`📊 共加载 ${Object.keys(this.brands).length} 个品牌`);
    } catch (error) {
      console.error('❌ 加载品牌数据失败:', error.message);
    }
  }

  async crawlNewCars() {
    console.log('🔍 开始采集新车型...');
    
    try {
      // 直接访问新车页面
      const newCarUrl = 'https://www.dongchedi.com/newcar';
      console.log(`📱 访问新车页面: ${newCarUrl}`);
      
      await this.page.goto(newCarUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 等待页面加载
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 直接采集新车模块，不需要点击在售标签
      console.log('🔍 开始采集新车模块...');

      // 采集车型信息 - 按照指定的路径
      const cars = await this.page.evaluate(async () => {
        const carList = [];
        
        console.log('🔍 查找新车页面结构...');
        
        // 按照指定路径查找
        const newMainDiv = document.querySelector('div.new-main.full.auto-nav');
        if (!newMainDiv) {
          console.log('❌ 未找到 div.new-main.full.auto-nav');
          return carList;
        }
        
        console.log('✅ 找到 new-main 容器');
        
        const contentDiv = newMainDiv.querySelector('div.jsx-80687187.content.fl');
        if (!contentDiv) {
          console.log('❌ 未找到 div.jsx-80687187.content.fl');
          return carList;
        }
        
        console.log('✅ 找到 content 容器');
        
        // 查找所有车型链接
        const carLinks = contentDiv.querySelectorAll('a[href*="/auto/series/"]');
        console.log(`🎯 找到 ${carLinks.length} 个车型链接`);
        
        carLinks.forEach((link, index) => {
          const match = link.href.match(/\/auto\/series\/(\d+)/);
          if (match) {
            const carName = link.textContent.trim();
            if (carName && carName.length > 0) {
              console.log(`  ${index + 1}. ${carName} (ID: ${match[1]})`);
              carList.push({
                id: match[1],
                name: carName,
                href: link.href
              });
            }
          }
        });

        console.log(`✅ 采集到 ${carList.length} 个新上市车型`);
        return carList;
      });

      console.log(`📊 采集到 ${cars.length} 个新上市车型`);
      
      // 处理每个车型
      for (const car of cars) {
        await this.processCar(car);
      }

    } catch (error) {
      console.error('❌ 采集新车型失败:', error.message);
      this.errors.push({ type: 'crawl_error', message: error.message });
    }
  }

  async processCar(carInfo) {
    try {
      console.log(`🔍 处理车型: ${carInfo.name} (ID: ${carInfo.id})`);
      
      // 访问车型页面确定品牌
      const brandName = await this.determineBrandFromPage(carInfo.id);
      
      if (!brandName) {
        console.warn(`⚠️ 无法确定车型 ${carInfo.name} 的品牌，跳过`);
        return;
      }

      console.log(`  🔍 识别品牌: ${carInfo.name} -> ${brandName}`);

      // 检查品牌是否存在
      if (!this.brands[brandName]) {
        console.warn(`⚠️ 品牌 ${brandName} 不存在，跳过车型 ${carInfo.name}`);
        return;
      }

      // 检查是否为新车型
      const existingCar = this.findExistingCar(carInfo.id);
      
      if (existingCar) {
        console.log(`  📝 发现改款车型: ${carInfo.name}`);
        await this.updateExistingCarWithMainTool(carInfo.id, brandName);
      } else {
        console.log(`  🆕 发现新车型: ${carInfo.name}`);
        await this.addNewCarWithMainTool(carInfo.id, brandName);
      }
      
    } catch (error) {
      console.error(`❌ 处理车型 ${carInfo.name} 失败:`, error.message);
      this.errors.push({ 
        type: 'process_error', 
        car: carInfo.name, 
        message: error.message 
      });
    }
  }

  findExistingCar(carId) {
    for (const [brandName, brandData] of Object.entries(this.brands)) {
      if (brandData.cars) {
        const existingCar = brandData.cars.find(car => car.carId === carId);
        if (existingCar) {
          return { ...existingCar, brandName };
        }
      }
    }
    return null;
  }

  async updateExistingCarWithMainTool(carId, brandName) {
    try {
      console.log(`  🔄 使用主采集工具更新车型 ${carId}...`);
      
      // 使用主采集工具的完整方法采集车型数据
      const carData = await this.dataCollector.collectSingleCarData(this.browser, carId, brandName);
      
      if (carData) {
        // 更新现有车型数据
        const brandData = this.brands[brandName];
        const carIndex = brandData.cars.findIndex(car => car.carId === carId);
        
        if (carIndex !== -1) {
          brandData.cars[carIndex] = {
            ...carData,
            lastUpdated: new Date().toISOString()
          };
          
          this.updatedCars.push({
            carId: carId,
            name: carData.carName || carData.name,
            brand: brandName,
            changes: Object.keys(carData)
          });
          
          console.log(`  ✅ 已更新车型: ${carData.carName || carData.name}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 更新车型 ${carId} 失败:`, error.message);
    }
  }

  async addNewCarWithMainTool(carId, brandName) {
    try {
      console.log(`  🔄 使用主采集工具添加新车型 ${carId}...`);
      
      // 使用主采集工具的完整方法采集车型数据
      const carData = await this.dataCollector.collectSingleCarData(this.browser, carId, brandName);
      
      if (carData) {
        // 添加到对应品牌
        this.brands[brandName].cars.push({
          ...carData,
          addedDate: new Date().toISOString()
        });
        
        this.newCars.push({
          carId: carId,
          name: carData.carName || carData.name,
          brand: brandName
        });
        
        console.log(`  ✅ 已添加新车型: ${carData.carName || carData.name} 到品牌 ${brandName}`);
      }
      
    } catch (error) {
      console.error(`❌ 添加新车型 ${carId} 失败:`, error.message);
    }
  }


  async determineBrandFromPage(carId) {
    try {
      console.log(`  🔍 访问车型页面确定品牌: ${carId}`);
      
      const carUrl = `https://www.dongchedi.com/auto/series/${carId}`;
      await this.page.goto(carUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const brandName = await this.page.evaluate(() => {
        // 查找包含品牌信息的面包屑span（有icon-arrow-ic-r类的）
        const brandSpans = document.querySelectorAll('span.pos-item.icon.icon-arrow-ic-r');
        console.log(`找到 ${brandSpans.length} 个包含箭头的span`);
        
        for (const span of brandSpans) {
          const brandLink = span.querySelector('a[href*="/auto/library/"]');
          if (brandLink) {
            const brandText = brandLink.textContent.trim();
            console.log(`找到品牌链接: ${brandText}`);
            
            // 品牌名称映射
            const brandMapping = {
              '埃安': 'Aion',
              '大众': 'Volkswagen',
              '领克': 'LynkCo',
              '五菱': 'Wuling',
              '比亚迪': 'BYD',
              '理想': 'LiAuto',
              '蔚来': 'Nio',
              '小鹏': 'Xpeng',
              '极氪': 'Zeekr',
              '问界': 'Aito',
              '阿维塔': 'Avatr',
              '深蓝': 'Deepal',
              '岚图': 'Voyah',
              '魏牌': 'Wey',
              '坦克': 'Tank',
              '哈弗': 'Haval',
              '长城': 'GWM',
              '吉利': 'Geely',
              '奇瑞': 'Chery',
              '长安': 'Changan',
              '红旗': 'Hongqi',
              '传祺': 'Trumpchi',
              '广汽': 'Trumpchi',
              '东风': 'Dongfeng',
              '北汽': 'BAIC',
              '上汽': 'Roewe',
              '荣威': 'Roewe',
              '名爵': 'MG',
              '别克': 'Buick',
              '雪佛兰': 'Chevrolet',
              '凯迪拉克': 'Cadillac',
              '林肯': 'Lincoln',
              '福特': 'Ford',
              '特斯拉': 'Tesla',
              '奔驰': 'Benz',
              '宝马': 'BMW',
              '奥迪': 'Audi',
              '保时捷': 'Porsche',
              '大众': 'Volkswagen',
              '斯柯达': 'Skoda',
              '捷达': 'Jetta',
              '丰田': 'Toyota',
              '本田': 'Honda',
              '日产': 'Nissan',
              '马自达': 'Mazda',
              '斯巴鲁': 'Subaru',
              '雷克萨斯': 'Lexus',
              '英菲尼迪': 'Infiniti',
              '讴歌': 'Acura',
              '现代': 'Hyundai',
              '起亚': 'Kia',
              '捷尼赛思': 'Genesis',
              '星途': 'Exceed'
            };
            
            return brandMapping[brandText] || brandText;
          }
        }
        
        console.log('未找到品牌信息');
        return null;
      });

      if (brandName) {
        console.log(`  ✅ 确定品牌: ${brandName}`);
        return brandName;
      } else {
        console.log(`  ⚠️ 无法确定品牌`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ 确定品牌失败: ${error.message}`);
      return null;
    }
  }

  determineBrand(carName) {
    // 从车型名称中提取品牌信息
    const brandMapping = {
      '小鹏': 'Xpeng',
      '蔚来': 'Nio', 
      '理想': 'LiAuto',
      '极氪': 'Zeekr',
      '比亚迪': 'BYD',
      '特斯拉': 'Tesla',
      '奔驰': 'Benz',
      '宝马': 'BMW',
      '奥迪': 'Audi',
      '大众': 'Volkswagen',
      '速腾': 'Volkswagen', // 速腾属于大众
      '丰田': 'Toyota',
      '本田': 'Honda',
      '日产': 'Nissan',
      '现代': 'Hyundai',
      '起亚': 'Kia',
      '福特': 'Ford',
      '雪佛兰': 'Chevrolet',
      '别克': 'Buick',
      '凯迪拉克': 'Cadillac',
      '林肯': 'Lincoln',
      '雷克萨斯': 'Lexus',
      '英菲尼迪': 'Infiniti',
      '讴歌': 'Acura',
      '沃尔沃': 'Volvo',
      '捷豹': 'Jaguar',
      '路虎': 'LandRover',
      '保时捷': 'Porsche',
      '玛莎拉蒂': 'Maserati',
      '法拉利': 'Ferrari',
      '兰博基尼': 'Lamborghini',
      '迈凯伦': 'McLaren',
      '阿斯顿马丁': 'AstonMartin',
      '宾利': 'Bentley',
      '劳斯莱斯': 'RollsRoyce',
      '布加迪': 'Bugatti',
      '柯尼塞格': 'Koenigsegg',
      '领克': 'LynkCo',
      '五菱': 'Wuling',
      '扬光': 'Wuling' // 五菱扬光属于五菱
    };

    // 从车型名称中提取品牌
    for (const [chineseName, englishName] of Object.entries(brandMapping)) {
      if (carName.includes(chineseName)) {
        return englishName;
      }
    }

    // 如果没有找到匹配的品牌，返回null
    return null;
  }

  async saveBrands() {
    console.log('💾 保存品牌数据...');
    
    // 只保存有变更的品牌
    const changedBrands = new Set();
    
    // 记录新车型的品牌
    this.newCars.forEach(car => {
      if (car.brand) {
        changedBrands.add(car.brand);
      }
    });
    
    // 记录更新车型的品牌
    this.updatedCars.forEach(car => {
      if (car.brand) {
        changedBrands.add(car.brand);
      }
    });
    
    console.log(`📝 需要保存的品牌: ${Array.from(changedBrands).join(', ')}`);
    
    for (const brandName of changedBrands) {
      const brandData = this.brands[brandName];
      if (brandData && brandData.cars && brandData.cars.length > 0) {
        const filePath = path.join(this.dataDir, `${brandName}.json`);
        await fs.writeFile(filePath, JSON.stringify(brandData, null, 2), 'utf8');
        console.log(`  ✅ 已保存品牌: ${brandName} (${brandData.cars.length} 车型)`);
      }
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        newCars: this.newCars.length,
        updatedCars: this.updatedCars.length,
        errors: this.errors.length
      },
      newCars: this.newCars,
      updatedCars: this.updatedCars,
      errors: this.errors
    };

    const reportPath = path.join(__dirname, `daily-report-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    console.log('📊 生成采集报告:');
    console.log(`  🆕 新车型: ${this.newCars.length}`);
    console.log(`  📝 更新车型: ${this.updatedCars.length}`);
    console.log(`  ❌ 错误: ${this.errors.length}`);
    console.log(`  📄 报告文件: ${reportPath}`);
  }

  async cleanup() {
    if (this.browserManager) {
      await this.browserManager.cleanup();
    }
  }
}

// 主函数
async function main() {
  const crawler = new DailyCarCrawler();
  
  try {
    await crawler.init();
    await crawler.loadExistingBrands();
    await crawler.crawlNewCars();
    await crawler.saveBrands();
    await crawler.generateReport();
    
    console.log('🎉 每日采集完成！');
    
  } catch (error) {
    console.error('❌ 采集失败:', error.message);
    process.exit(1);
  } finally {
    await crawler.cleanup();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DailyCarCrawler;
