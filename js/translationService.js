// 翻译服务模块 - 支持多个免费翻译API
export class TranslationService {
  constructor() {
    this.currentProvider = 'google'; // 默认使用Google翻译
    this.providers = {
      google: this.googleTranslate,
      libre: this.libreTranslate,
      mymemory: this.myMemoryTranslate,
      yandex: this.yandexTranslate
    };
  }

  // 设置翻译提供商
  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
      console.log(`🔄 翻译提供商已切换到: ${provider}`);
    } else {
      console.error(`❌ 不支持的翻译提供商: ${provider}`);
    }
  }

  // 主要翻译方法
  async translate(text, fromLang = 'zh', toLang = 'en') {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      const result = await this.providers[this.currentProvider].call(this, text, fromLang, toLang);
      console.log(`✅ 翻译成功 [${this.currentProvider}]: ${text} → ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ 翻译失败 [${this.currentProvider}]:`, error);
      
      // 尝试备用提供商
      for (const [provider, method] of Object.entries(this.providers)) {
        if (provider !== this.currentProvider) {
          try {
            const result = await method.call(this, text, fromLang, toLang);
            console.log(`✅ 备用翻译成功 [${provider}]: ${text} → ${result}`);
            return result;
          } catch (backupError) {
            console.error(`❌ 备用翻译失败 [${provider}]:`, backupError);
          }
        }
      }
      
      return text; // 如果所有翻译都失败，返回原文本
    }
  }

  // 1. Google Translate (免费，但有配额限制)
  async googleTranslate(text, fromLang = 'zh', toLang = 'en') {
    // 使用Google Translate的免费API端点
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google翻译请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data[0][0][0];
  }

  // 2. LibreTranslate (完全免费，开源)
  async libreTranslate(text, fromLang = 'zh', toLang = 'en') {
    // 使用公共LibreTranslate服务器
    const url = 'https://libretranslate.de/translate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      })
    });
    
    if (!response.ok) {
      throw new Error(`LibreTranslate请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translatedText;
  }

  // 3. MyMemory (免费，每日1000次请求)
  async myMemoryTranslate(text, fromLang = 'zh', toLang = 'en') {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MyMemory翻译请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.responseData.translatedText;
  }

  // 4. Yandex Translate (免费，每月10000字符)
  async yandexTranslate(text, fromLang = 'zh', toLang = 'en') {
    // 注意：Yandex需要API密钥，这里提供示例
    const apiKey = 'your_yandex_api_key'; // 需要申请
    const url = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=${encodeURIComponent(text)}&lang=${fromLang}-${toLang}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yandex翻译请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.text[0];
  }

  // 5. 本地翻译缓存
  getLocalTranslation(text) {
    const localTranslations = {
      // 中国城市
      '北京': 'Beijing', '上海': 'Shanghai', '广州': 'Guangzhou', '深圳': 'Shenzhen',
      '天津': 'Tianjin', '重庆': 'Chongqing', '成都': 'Chengdu', '武汉': 'Wuhan',
      '西安': 'Xi\'an', '南京': 'Nanjing', '杭州': 'Hangzhou', '苏州': 'Suzhou',
      '青岛': 'Qingdao', '大连': 'Dalian', '厦门': 'Xiamen', '宁波': 'Ningbo',
      '福州': 'Fuzhou', '济南': 'Jinan', '郑州': 'Zhengzhou', '长沙': 'Changsha',
      '哈尔滨': 'Harbin', '沈阳': 'Shenyang', '昆明': 'Kunming', '合肥': 'Hefei',
      '南昌': 'Nanchang', '太原': 'Taiyuan', '石家庄': 'Shijiazhuang', '兰州': 'Lanzhou',
      '贵阳': 'Guiyang', '南宁': 'Nanning', '海口': 'Haikou', '银川': 'Yinchuan',
      '西宁': 'Xining', '拉萨': 'Lhasa', '乌鲁木齐': 'Urumqi', '呼和浩特': 'Hohhot',
      
      // 新疆及中亚贸易重要城市
      '霍尔果斯': 'Khorgos', '喀什': 'Kashgar', '阿拉山口': 'Alashankou', '巴克图': 'Bakhtu',
      '吉木乃': 'Jeminay', '塔城': 'Tacheng', '伊宁': 'Yining', '阿勒泰': 'Altay',
      '博乐': 'Bole', '石河子': 'Shihezi', '奎屯': 'Kuitun', '克拉玛依': 'Karamay',
      '吐鲁番': 'Turpan', '哈密': 'Hami', '库尔勒': 'Korla', '阿克苏': 'Aksu',
      '和田': 'Hotan', '阿图什': 'Artux', '图木舒克': 'Tumxuk', '五家渠': 'Wujiaqu',
      '北屯': 'Beitun', '铁门关': 'Tiemenguan', '双河': 'Shuanghe', '可克达拉': 'Kokdala',
      '胡杨河': 'Huyanghe', '新星': 'Xinxing', '白杨': 'Baiyang', '昆玉': 'Kunyu',
      '胡杨': 'Huyang', '阿拉尔': 'Aral', '图木舒克': 'Tumxuk', '五家渠': 'Wujiaqu',
      
      // 中亚国家及主要城市
      '哈萨克斯坦': 'Kazakhstan', '阿拉木图': 'Almaty', '阿斯塔纳': 'Astana', '努尔苏丹': 'Nur-Sultan',
      '奇姆肯特': 'Shymkent', '阿克套': 'Aktau', '阿特劳': 'Atyrau', '卡拉干达': 'Karaganda',
      '巴甫洛达尔': 'Pavlodar', '塞米伊': 'Semey', '乌斯季卡缅诺戈尔斯克': 'Ust-Kamenogorsk',
      '塔拉兹': 'Taraz', '科斯塔奈': 'Kostanay', '彼得罗巴甫洛夫斯克': 'Petropavl',
      '乌拉尔': 'Oral', '阿克托别': 'Aktobe', '克孜洛尔达': 'Kyzylorda', '科克舍套': 'Kokshetau',
      
      '吉尔吉斯斯坦': 'Kyrgyzstan', '比什凯克': 'Bishkek', '奥什': 'Osh', '贾拉拉巴德': 'Jalal-Abad',
      '卡拉科尔': 'Karakol', '托克马克': 'Tokmok', '纳伦': 'Naryn', '塔拉斯': 'Talas',
      '巴特肯': 'Batken', '伊塞克湖': 'Issyk-Kul', '楚河': 'Chuy', '纳伦': 'Naryn',
      
      '乌兹别克斯坦': 'Uzbekistan', '塔什干': 'Tashkent', '撒马尔罕': 'Samarkand', '布哈拉': 'Bukhara',
      '纳曼干': 'Namangan', '安集延': 'Andijan', '费尔干纳': 'Fergana', '卡什卡达里亚': 'Kashkadarya',
      '苏尔汉河': 'Surkhandarya', '纳沃伊': 'Navoiy', '花拉子模': 'Khorezm', '卡拉卡尔帕克斯坦': 'Karakalpakstan',
      
      '塔吉克斯坦': 'Tajikistan', '杜尚别': 'Dushanbe', '苦盏': 'Khujand', '库利亚布': 'Kulob',
      '库尔干秋别': 'Kurgan-Tyube', '彭吉肯特': 'Panjakent', '伊斯塔拉夫尚': 'Istaravshan',
      '瓦赫什': 'Vakhsh', '努雷克': 'Nurek', '罗贡': 'Rogun',
      
      '土库曼斯坦': 'Turkmenistan', '阿什哈巴德': 'Ashgabat', '土库曼巴什': 'Türkmenbaşy', '马雷': 'Mary',
      '达什古兹': 'Daşoguz', '巴尔坎纳巴德': 'Balkanabat', '土库曼纳巴德': 'Türkmenabat',
      '阿巴丹': 'Abadan', '卡阿赫塔': 'Kaakhka', '拜拉姆阿里': 'Bayramaly',
      
      // 俄罗斯中亚地区
      '新西伯利亚': 'Novosibirsk', '鄂木斯克': 'Omsk', '托木斯克': 'Tomsk', '克拉斯诺亚尔斯克': 'Krasnoyarsk',
      '伊尔库茨克': 'Irkutsk', '乌兰乌德': 'Ulan-Ude', '赤塔': 'Chita', '布拉戈维申斯克': 'Blagoveshchensk',
      '符拉迪沃斯托克': 'Vladivostok', '哈巴罗夫斯克': 'Khabarovsk', '雅库茨克': 'Yakutsk',
      
      // 蒙古
      '蒙古': 'Mongolia', '乌兰巴托': 'Ulaanbaatar', '额尔登特': 'Erdenet', '达尔汗': 'Darkhan',
      '乔巴山': 'Choibalsan', '木伦': 'Mörön', '乌列盖': 'Ölgii', '科布多': 'Khovd',
      
      // 阿富汗
      '阿富汗': 'Afghanistan', '喀布尔': 'Kabul', '坎大哈': 'Kandahar', '赫拉特': 'Herat',
      '马扎里沙里夫': 'Mazar-i-Sharif', '贾拉拉巴德': 'Jalalabad', '昆都士': 'Kunduz',
      '加兹尼': 'Ghazni', '巴米扬': 'Bamiyan', '巴达赫尚': 'Badakhshan',
      
      // 巴基斯坦
      '巴基斯坦': 'Pakistan', '伊斯兰堡': 'Islamabad', '卡拉奇': 'Karachi', '拉合尔': 'Lahore',
      '费萨拉巴德': 'Faisalabad', '拉瓦尔品第': 'Rawalpindi', '白沙瓦': 'Peshawar',
      '奎达': 'Quetta', '木尔坦': 'Multan', '海得拉巴': 'Hyderabad', '苏库尔': 'Sukkur',
      
      // 印度
      '印度': 'India', '新德里': 'New Delhi', '孟买': 'Mumbai', '加尔各答': 'Kolkata',
      '班加罗尔': 'Bangalore', '海得拉巴': 'Hyderabad', '金奈': 'Chennai', '艾哈迈达巴德': 'Ahmedabad',
      '浦那': 'Pune', '苏拉特': 'Surat', '斋浦尔': 'Jaipur', '勒克瑙': 'Lucknow',
      
      // 伊朗
      '伊朗': 'Iran', '德黑兰': 'Tehran', '马什哈德': 'Mashhad', '伊斯法罕': 'Isfahan',
      '设拉子': 'Shiraz', '大不里士': 'Tabriz', '库姆': 'Qom', '克尔曼': 'Kerman',
      '亚兹德': 'Yazd', '阿瓦士': 'Ahvaz', '布什尔': 'Bushehr', '阿巴斯港': 'Bandar Abbas',
      
      // 港口城市
      '青岛港': 'Qingdao Port', '上海港': 'Shanghai Port', '宁波港': 'Ningbo Port',
      '天津港': 'Tianjin Port', '大连港': 'Dalian Port', '厦门港': 'Xiamen Port',
      '广州港': 'Guangzhou Port', '深圳港': 'Shenzhen Port', '连云港': 'Lianyungang Port',
      '烟台港': 'Yantai Port', '日照港': 'Rizhao Port', '营口港': 'Yingkou Port',
      '秦皇岛港': 'Qinhuangdao Port', '唐山港': 'Tangshan Port', '黄骅港': 'Huanghua Port',
      '锦州港': 'Jinzhou Port', '威海港': 'Weihai Port', '东营港': 'Dongying Port',
      '潍坊港': 'Weifang Port', '滨州港': 'Binzhou Port',
      
      // 国家
      '中国': 'China', '美国': 'United States', '日本': 'Japan', '韩国': 'South Korea',
      '德国': 'Germany', '法国': 'France', '英国': 'United Kingdom', '意大利': 'Italy',
      '西班牙': 'Spain', '加拿大': 'Canada', '澳大利亚': 'Australia', '俄罗斯': 'Russia',
      '印度': 'India', '巴西': 'Brazil', '墨西哥': 'Mexico', '阿根廷': 'Argentina',
      '智利': 'Chile', '秘鲁': 'Peru', '哥伦比亚': 'Colombia', '委内瑞拉': 'Venezuela',
      '厄瓜多尔': 'Ecuador', '玻利维亚': 'Bolivia', '巴拉圭': 'Paraguay', '乌拉圭': 'Uruguay',
      '圭亚那': 'Guyana', '苏里南': 'Suriname', '法属圭亚那': 'French Guiana',
      '福克兰群岛': 'Falkland Islands', '南乔治亚岛': 'South Georgia',
      '南桑威奇群岛': 'South Sandwich Islands', '南极洲': 'Antarctica',
      '非洲': 'Africa', '欧洲': 'Europe', '亚洲': 'Asia', '北美洲': 'North America',
      '南美洲': 'South America', '大洋洲': 'Oceania',
      
      // 常用缩写
      'USA': 'United States', 'UK': 'United Kingdom', 'PRC': 'People\'s Republic of China',
      'HK': 'Hong Kong', 'TW': 'Taiwan', 'SG': 'Singapore', 'MY': 'Malaysia',
      'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'ID': 'Indonesia',
      'IN': 'India', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
      'NP': 'Nepal', 'BT': 'Bhutan', 'MM': 'Myanmar', 'LA': 'Laos', 'KH': 'Cambodia'
    };
    
    return localTranslations[text] || null;
  }

  // 智能翻译方法（优先本地缓存，然后网络API）
  async smartTranslate(text, fromLang = 'zh', toLang = 'en') {
    if (!text || text.trim() === '') {
      return '';
    }

    // 1. 首先检查本地缓存
    const localResult = this.getLocalTranslation(text);
    if (localResult) {
      console.log(`✅ 本地翻译命中: ${text} → ${localResult}`);
      return localResult;
    }

    // 2. 如果本地没有，使用网络API
    return await this.translate(text, fromLang, toLang);
  }

  // 批量翻译
  async batchTranslate(texts, fromLang = 'zh', toLang = 'en') {
    const results = [];
    for (const text of texts) {
      const result = await this.smartTranslate(text, fromLang, toLang);
      results.push(result);
    }
    return results;
  }

  // 获取支持的翻译提供商
  getSupportedProviders() {
    return Object.keys(this.providers);
  }

  // 获取当前提供商
  getCurrentProvider() {
    return this.currentProvider;
  }

  // 测试翻译服务
  async testTranslation() {
    const testTexts = ['北京', '上海港', '美国', '未知地名'];
    console.log('🧪 开始测试翻译服务...');
    
    for (const text of testTexts) {
      try {
        const result = await this.smartTranslate(text);
        console.log(`✅ ${text} → ${result}`);
      } catch (error) {
        console.error(`❌ ${text} 翻译失败:`, error);
      }
    }
  }
}

// 创建全局翻译服务实例
export const translationService = new TranslationService(); 