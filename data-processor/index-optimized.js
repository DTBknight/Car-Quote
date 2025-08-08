// 优化的数据处理器

const cliProgress = require('cli-progress');
const BrowserManager = require('./browser-manager');
const DataCollector = require('./data-collector');
const DataManager = require('./data-manager');
const { getSmartDelay } = require('./anti-detection');

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
  Nezha: 199, // 哪吒
  Nio: 201, // 蔚来
  Opel: 60, // 欧宝
  Peugeot: 61, // 标致
  Porsche: 20, // 保时捷
  Qoros: 67, // 观致
  Renault: 63, // 雷诺
  Roewe: 36, // 荣威
  Skoda: 6, // 斯柯达
  Smart: 66, // Smart
  Subaru: 23, // 斯巴鲁
  Suzuki: 11, // 铃木
  Tesla: 200, // 特斯拉
  Toyota: 5, // 丰田
  Volkswagen: 1, // 大众
  Volvo: 21, // 沃尔沃
  Wey: 24, // WEY
  Wuling: 39, // 五菱
  Xpeng: 203, // 小鹏
  Yangwang: 546, // 仰望
  Firefly: 10363, // 萤火虫
  IM: 419, // 智己
  Luxeed: 883, // 智界
  Maextro: 10293, // 尊界
};

// 主处理器
class CarDataProcessor {
  constructor() {
    this.browserManager = new BrowserManager();
    this.dataCollector = new DataCollector(this.browserManager);
    this.dataManager = new DataManager();
  }

  async processBrand(brand) {
    console.log(`🚗 开始处理品牌: ${brand}`);
    
    // 检查现有数据
    const existingData = this.dataManager.checkExistingData(brand);
    if (existingData.exists && existingData.hasData) {
      console.log(`🔄 品牌 ${brand} 已存在数据，将抓取最新数据进行更新`);
    }
    
    const brandIds = Array.isArray(brandIdsMap[brand]) ? brandIdsMap[brand] : [brandIdsMap[brand]];
    if (!brandIds[0]) {
      console.error(`❌ 未找到品牌 ${brand} 的ID`);
      return false;
    }
    
    try {
      const data = await this.dataCollector.collectCarData(brand, brandIds);
      
      if (await this.dataManager.validateBrandData(brand, data)) {
        await this.dataManager.saveBrandData(brand, data);
        return true;
      } else {
        console.warn(`⚠️ 品牌 ${brand} 数据验证失败`);
        return false;
      }
    } catch (error) {
      console.error(`❌ 处理品牌 ${brand} 失败:`, error.message);
      return false;
    }
  }

  async processAllBrands() {
    const brandList = Object.keys(brandIdsMap);
    const total = brandList.length;
    
    console.log(`🎯 开始处理所有品牌，共 ${total} 个`);
    
    const progressBar = new cliProgress.SingleBar({
      format: '总进度 |{bar}| {percentage}% | {value}/{total} | 剩余时间: {eta}s | 当前: {brand}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(total, 0, { brand: '准备中...' });

    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < total; idx++) {
      const brandName = brandList[idx];
      progressBar.update(idx, { brand: brandName });

      try {
        console.log(`🚗 开始处理品牌: ${brandName}`);
        const success = await this.processBrand(brandName);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error(`❌ 处理品牌 ${brandName} 时发生错误:`, error.message);
        failCount++;
      }

      // 品牌间延迟 - 大幅减少延迟时间
      if (idx < total - 1) {
        const delay = getSmartDelay(1000, 2000); // 从3-5秒减少到1-2秒
        console.log(`⏳ 等待 ${delay/1000} 秒后处理下一个品牌...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    progressBar.stop();
    
    console.log(`🎉 所有品牌处理完成！成功: ${successCount}, 失败: ${failCount}`);
    
    // 同步brands.json
    await this.dataManager.syncBrandsJson();
  }

  async cleanup() {
    // 清理资源
    for (const browser of this.browserManager.browsers.values()) {
      await this.browserManager.closeBrowser(browser);
    }
    this.browserManager.browsers.clear();
  }
}

// 主函数
async function main() {
  const processor = new CarDataProcessor();
  
  try {
    const brand = process.argv[2];
    
    if (!brand) {
      console.error('❌ 请在命令行参数中指定品牌名或 all');
      console.log('📋 可用品牌:', Object.keys(brandIdsMap).join(', '));
      process.exit(1);
    }

    if (brand === 'all') {
      await processor.processAllBrands();
    } else {
      await processor.processBrand(brand);
    }
  } catch (error) {
    console.error('💥 程序执行失败:', error);
    process.exit(1);
  } finally {
    await processor.cleanup();
  }
}

// 自动同步brands.json
if (require.main === module && process.argv[2] === 'autoSyncBrands') {
  const dataManager = new DataManager();
  dataManager.syncBrandsJson()
    .then(() => {
      console.log('✅ brands.json 同步完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 同步brands.json失败:', error);
      process.exit(1);
    });
}

// 运行主程序
if (require.main === module && process.argv[2] !== 'autoSyncBrands') {
  main();
}

module.exports = { CarDataProcessor }; 