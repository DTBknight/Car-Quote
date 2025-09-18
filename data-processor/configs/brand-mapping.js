/**
 * 标准品牌ID映射表 - 统一的品牌映射配置
 * 所有采集工具都应该使用这个文件，确保品牌ID的一致性
 */

const brandIdsMap = {
  // 主流品牌
  Volkswagen: 1, // 大众
  Audi: [2, 10362], // 奥迪（多ID）
  Benz: 3, // 奔驰
  BMW: 4, // 宝马
  Toyota: 5, // 丰田
  Ford: 7, // 福特
  GWM: 8, // 长城
  Honda: 9, // 本田
  Nissan: 10, // 日产
  Suzuki: 11, // 铃木
  Buick: 12, // 别克
  Kia: 13, // 起亚
  Jeep: 14, // Jeep
  Mazda: 15, // 马自达
  BYD: 16, // 比亚迪
  Haval: 17, // 哈弗
  Chery: [18, 10409, 461], // 奇瑞（多ID）
  LandRover: 19, // 路虎
  Porsche: 20, // 保时捷
  Citroen: 21, // 雪铁龙
  Lexus: 22, // 雷克萨斯
  Skoda: 23, // 斯柯达
  Volvo: 24, // 沃尔沃
  Bestune: 27, // 奔腾
  Cadillac: 30, // 凯迪拉克
  Jaguar: 31, // 捷豹
  Subaru: 33, // 斯巴鲁
  MG: 34, // 名爵
  Changan: 35, // 长安
  Roewe: 36, // 荣威
  Aeolus: 37, // 东风风神
  Acura: 38, // 讴歌
  Wuling: 39, // 五菱
  Trumpchi: 40, // 广汽传祺
  RollsRoyce: 41, // 劳斯莱斯
  Lamborghini: 42, // 兰博基尼
  Ferrari: 44, // 法拉利
  Maserati: 45, // 玛莎拉蒂
  Bentley: 47, // 宾利
  Smart: 48, // Smart
  AlfaRomeo: 51, // 阿尔法·罗密欧
  BJSUV: 52, // 北京越野
  Hama: 53, // 海马
  DS: 55, // DS
  Foton: 57, // 福田
  Hongqi: 59, // 红旗
  Opel: 60, // 欧宝
  Peugeot: 61, // 标致
  Lincoln: 62, // 林肯
  Tesla: 63, // 特斯拉 *** 重要：正确的特斯拉ID
  Mini: 65, // MINI
  Wey: 66, // WEY
  Qoros: 67, // 观致
  BAIC: 68, // 北京汽车
  Forthing: 70, // 东风风行
  Geely: 73, // 吉利
  BAW: 78, // 北京汽车制造厂
  AstonMartin: 80, // 阿斯顿马丁
  Koenigsegg: 83, // 柯尼赛格
  Lotus: 85, // 莲花
  McLaren: 86, // 迈凯轮
  Dongfeng: 91, // 东风
  Fengon: 95, // 东风风光
  GMC: 96, // GMC
  JMC: 100, // 江铃
  Nio: 112, // 蔚来
  Kaiyi: 142, // 凯翼
  Kaicene: 171, // 长安凯程
  LynkCo: 174, // 领克
  Arcfox: 176, // 极狐
  Polestar: 196, // 极星
  Neta: 199, // 哪吒
  LiAuto: 202, // 理想
  Leapmotor: 207, // 零跑
  Jetour: [209, 10425], // 捷途（多ID）
  Kuayue: 210, // 长安跨越
  Aion: 242, // 埃安
  Jetta: 260, // 捷达
  Geome: 264, // 吉利几何
  Genesis: 273, // 捷尼赛思
  Hycan: 303, // 合创
  Baojun: 366, // 宝骏
  Skyworth: 368, // 创维
  Livan: 381, // 睿蓝
  Voyah: 395, // 岚图
  Hengchi: 399, // 恒驰
  RisingAuto: 401, // 飞凡
  Nami: 417, // 东风纳米
  IM: 419, // 智己
  Tank: 425, // 坦克
  Zeekr: 426, // 极氪
  Avatr: 475, // 阿维塔
  Aito: 483, // 问界
  Mhero: 527, // 猛士
  Yangwang: 546, // 仰望
  Xpeng: 195, // 小鹏
  Xiaomi: 535, // 小米汽车
  Ora: 238, // 欧拉
  Rox: 878, // 极石
  Hyper: 880, // 广汽昊铂
  Luxeed: 883, // 智界
  JAC: [882, 871], // 江淮（多ID）
  ChanganNevo: 870, // 长安启源
  GeelyGalaxy: 858, // 吉利银河
  FormulaLeopard: 861, // 方程豹
  Landian: 868, // 蓝电
  eπ: 891, // 东风奕派
  iCAR: 909, // iCAR
  Onvo: 918, // 乐道
  Stelato: 931, // 享界
  '212': 10012, // 北汽二一二
  Maextro: 10293, // 尊界
  Firefly: 10363, // 萤火虫
  Exceed: 9999, // 超越（如果需要）
  Infiniti: 46, // 英菲尼迪
  Hyundai: 28, // 现代
  Maxus: 58 // 上汽大通
};

// 品牌中文名映射
const brandChineseNames = {
  'Volkswagen': '大众',
  'Audi': '奥迪',
  'Benz': '奔驰',
  'BMW': '宝马',
  'Toyota': '丰田',
  'Ford': '福特',
  'GWM': '长城',
  'Honda': '本田',
  'Nissan': '日产',
  'Suzuki': '铃木',
  'Buick': '别克',
  'Kia': '起亚',
  'Jeep': 'Jeep',
  'Mazda': '马自达',
  'BYD': '比亚迪',
  'Haval': '哈弗',
  'Chery': '奇瑞',
  'LandRover': '路虎',
  'Porsche': '保时捷',
  'Citroen': '雪铁龙',
  'Lexus': '雷克萨斯',
  'Skoda': '斯柯达',
  'Volvo': '沃尔沃',
  'Bestune': '奔腾',
  'Cadillac': '凯迪拉克',
  'Jaguar': '捷豹',
  'Subaru': '斯巴鲁',
  'MG': '名爵',
  'Changan': '长安',
  'Roewe': '荣威',
  'Aeolus': '东风风神',
  'Acura': '讴歌',
  'Wuling': '五菱',
  'Trumpchi': '广汽传祺',
  'RollsRoyce': '劳斯莱斯',
  'Lamborghini': '兰博基尼',
  'Ferrari': '法拉利',
  'Maserati': '玛莎拉蒂',
  'Bentley': '宾利',
  'Smart': 'Smart',
  'AlfaRomeo': '阿尔法·罗密欧',
  'BJSUV': '北京越野',
  'Hama': '海马',
  'DS': 'DS',
  'Foton': '福田',
  'Hongqi': '红旗',
  'Opel': '欧宝',
  'Peugeot': '标致',
  'Lincoln': '林肯',
  'Tesla': '特斯拉',
  'Mini': 'MINI',
  'Wey': 'WEY',
  'Qoros': '观致',
  'BAIC': '北京汽车',
  'Forthing': '东风风行',
  'Geely': '吉利',
  'BAW': '北京汽车制造厂',
  'AstonMartin': '阿斯顿马丁',
  'Koenigsegg': '柯尼赛格',
  'Lotus': '莲花',
  'McLaren': '迈凯轮',
  'Dongfeng': '东风',
  'Fengon': '东风风光',
  'GMC': 'GMC',
  'JMC': '江铃',
  'Nio': '蔚来',
  'Kaiyi': '凯翼',
  'Kaicene': '长安凯程',
  'LynkCo': '领克',
  'Arcfox': '极狐',
  'Polestar': '极星',
  'Neta': '哪吒',
  'LiAuto': '理想',
  'Leapmotor': '零跑',
  'Jetour': '捷途',
  'Kuayue': '长安跨越',
  'Aion': '埃安',
  'Jetta': '捷达',
  'Geome': '吉利几何',
  'Genesis': '捷尼赛思',
  'Hycan': '合创',
  'Baojun': '宝骏',
  'Skyworth': '创维',
  'Livan': '睿蓝',
  'Voyah': '岚图',
  'Hengchi': '恒驰',
  'RisingAuto': '飞凡',
  'Nami': '东风纳米',
  'IM': '智己',
  'Tank': '坦克',
  'Zeekr': '极氪',
  'Avatr': '阿维塔',
  'Aito': '问界',
  'Mhero': '猛士',
  'Yangwang': '仰望',
  'Xpeng': '小鹏',
  'Xiaomi': '小米汽车',
  'Ora': '欧拉',
  'Rox': '极石',
  'Hyper': '广汽昊铂',
  'Luxeed': '智界',
  'JAC': '江淮',
  'ChanganNevo': '长安启源',
  'GeelyGalaxy': '吉利银河',
  'FormulaLeopard': '方程豹',
  'Landian': '蓝电',
  'eπ': '东风奕派',
  'iCAR': 'iCAR',
  'Onvo': '乐道',
  'Stelato': '享界',
  '212': '北汽二一二',
  'Maextro': '尊界',
  'Firefly': '萤火虫',
  'Exceed': '超越',
  'Infiniti': '英菲尼迪',
  'Hyundai': '现代',
  'Maxus': '上汽大通'
};

/**
 * 获取品牌ID，支持多ID品牌
 * @param {string} brandName 品牌英文名
 * @returns {number|array} 品牌ID或ID数组
 */
function getBrandId(brandName) {
  return brandIdsMap[brandName];
}

/**
 * 获取品牌中文名
 * @param {string} brandName 品牌英文名
 * @returns {string} 品牌中文名
 */
function getBrandChineseName(brandName) {
  return brandChineseNames[brandName] || brandName;
}

/**
 * 验证品牌名是否有效
 * @param {string} brandName 品牌英文名
 * @returns {boolean} 是否有效
 */
function isValidBrand(brandName) {
  return brandName in brandIdsMap;
}

/**
 * 获取所有品牌列表
 * @returns {array} 所有品牌英文名数组
 */
function getAllBrands() {
  return Object.keys(brandIdsMap);
}

module.exports = {
  brandIdsMap,
  brandChineseNames,
  getBrandId,
  getBrandChineseName,
  isValidBrand,
  getAllBrands
};
