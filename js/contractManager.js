// 合同管理器模块
import { getApiUrl } from './config.js';

export class ContractManager {
  constructor() {
    console.log('🔧 合同管理器初始化');
    this.goodsRows = []; // 存储货物行数据
    this.nextRowId = 1; // 货物行ID计数器
    
    // 地名翻译映射表
    this.locationTranslations = {
      // 中国城市
      '北京': 'Beijing',
      '上海': 'Shanghai',
      '广州': 'Guangzhou',
      '深圳': 'Shenzhen',
      '天津': 'Tianjin',
      '重庆': 'Chongqing',
      '成都': 'Chengdu',
      '武汉': 'Wuhan',
      '西安': 'Xi\'an',
      '南京': 'Nanjing',
      '杭州': 'Hangzhou',
      '苏州': 'Suzhou',
      '青岛': 'Qingdao',
      '大连': 'Dalian',
      '厦门': 'Xiamen',
      '宁波': 'Ningbo',
      '福州': 'Fuzhou',
      '济南': 'Jinan',
      '郑州': 'Zhengzhou',
      '长沙': 'Changsha',
      '哈尔滨': 'Harbin',
      '沈阳': 'Shenyang',
      '昆明': 'Kunming',
      '合肥': 'Hefei',
      '南昌': 'Nanchang',
      '太原': 'Taiyuan',
      '石家庄': 'Shijiazhuang',
      '兰州': 'Lanzhou',
      '贵阳': 'Guiyang',
      '南宁': 'Nanning',
      '海口': 'Haikou',
      '银川': 'Yinchuan',
      '西宁': 'Xining',
      '拉萨': 'Lhasa',
      '乌鲁木齐': 'Urumqi',
      '呼和浩特': 'Hohhot',
      
      // 港口城市
      '青岛港': 'Qingdao Port',
      '上海港': 'Shanghai Port',
      '宁波港': 'Ningbo Port',
      '天津港': 'Tianjin Port',
      '大连港': 'Dalian Port',
      '厦门港': 'Xiamen Port',
      '广州港': 'Guangzhou Port',
      '深圳港': 'Shenzhen Port',
      '连云港': 'Lianyungang Port',
      '烟台港': 'Yantai Port',
      '日照港': 'Rizhao Port',
      '营口港': 'Yingkou Port',
      '秦皇岛港': 'Qinhuangdao Port',
      '唐山港': 'Tangshan Port',
      '黄骅港': 'Huanghua Port',
      '锦州港': 'Jinzhou Port',
      '威海港': 'Weihai Port',
      '东营港': 'Dongying Port',
      '潍坊港': 'Weifang Port',
      '滨州港': 'Binzhou Port',
      
      // 国家
      '中国': 'China',
      '美国': 'United States',
      '日本': 'Japan',
      '韩国': 'South Korea',
      '德国': 'Germany',
      '法国': 'France',
      '英国': 'United Kingdom',
      '意大利': 'Italy',
      '西班牙': 'Spain',
      '加拿大': 'Canada',
      '澳大利亚': 'Australia',
      '俄罗斯': 'Russia',
      '印度': 'India',
      '巴西': 'Brazil',
      '墨西哥': 'Mexico',
      '阿根廷': 'Argentina',
      '智利': 'Chile',
      '秘鲁': 'Peru',
      '哥伦比亚': 'Colombia',
      '委内瑞拉': 'Venezuela',
      '厄瓜多尔': 'Ecuador',
      '玻利维亚': 'Bolivia',
      '巴拉圭': 'Paraguay',
      '乌拉圭': 'Uruguay',
      '圭亚那': 'Guyana',
      '苏里南': 'Suriname',
      '法属圭亚那': 'French Guiana',
      '福克兰群岛': 'Falkland Islands',
      '南乔治亚岛': 'South Georgia',
      '南桑威奇群岛': 'South Sandwich Islands',
      '南极洲': 'Antarctica',
      '非洲': 'Africa',
      '欧洲': 'Europe',
      '亚洲': 'Asia',
      '北美洲': 'North America',
      '南美洲': 'South America',
      '大洋洲': 'Oceania',
      '阿尔及利亚': 'Algeria',
      '埃及': 'Egypt',
      '利比亚': 'Libya',
      '突尼斯': 'Tunisia',
      '摩洛哥': 'Morocco',
      '苏丹': 'Sudan',
      '南苏丹': 'South Sudan',
      '埃塞俄比亚': 'Ethiopia',
      '厄立特里亚': 'Eritrea',
      '吉布提': 'Djibouti',
      '索马里': 'Somalia',
      '肯尼亚': 'Kenya',
      '乌干达': 'Uganda',
      '坦桑尼亚': 'Tanzania',
      '卢旺达': 'Rwanda',
      '布隆迪': 'Burundi',
      '刚果民主共和国': 'Democratic Republic of the Congo',
      '刚果共和国': 'Republic of the Congo',
      '加蓬': 'Gabon',
      '赤道几内亚': 'Equatorial Guinea',
      '圣多美和普林西比': 'São Tomé and Príncipe',
      '喀麦隆': 'Cameroon',
      '中非共和国': 'Central African Republic',
      '乍得': 'Chad',
      '尼日尔': 'Niger',
      '尼日利亚': 'Nigeria',
      '贝宁': 'Benin',
      '多哥': 'Togo',
      '加纳': 'Ghana',
      '科特迪瓦': 'Ivory Coast',
      '利比里亚': 'Liberia',
      '塞拉利昂': 'Sierra Leone',
      '几内亚': 'Guinea',
      '几内亚比绍': 'Guinea-Bissau',
      '塞内加尔': 'Senegal',
      '冈比亚': 'Gambia',
      '毛里塔尼亚': 'Mauritania',
      '马里': 'Mali',
      '布基纳法索': 'Burkina Faso',
      '佛得角': 'Cape Verde',
      '安哥拉': 'Angola',
      '赞比亚': 'Zambia',
      '津巴布韦': 'Zimbabwe',
      '博茨瓦纳': 'Botswana',
      '纳米比亚': 'Namibia',
      '南非': 'South Africa',
      '莱索托': 'Lesotho',
      '斯威士兰': 'Eswatini',
      '莫桑比克': 'Mozambique',
      '马达加斯加': 'Madagascar',
      '毛里求斯': 'Mauritius',
      '塞舌尔': 'Seychelles',
      '科摩罗': 'Comoros',
      '马约特': 'Mayotte',
      '留尼汪': 'Réunion',
      '圣赫勒拿': 'Saint Helena',
      '阿森松岛': 'Ascension Island',
      '特里斯坦-达库尼亚': 'Tristan da Cunha',
      '西撒哈拉': 'Western Sahara',
      '加那利群岛': 'Canary Islands',
      '马德拉群岛': 'Madeira',
      '亚速尔群岛': 'Azores',
      '佛得角': 'Cape Verde',
      '圣多美和普林西比': 'São Tomé and Príncipe',
      '赤道几内亚': 'Equatorial Guinea',
      '加蓬': 'Gabon',
      '刚果共和国': 'Republic of the Congo',
      '刚果民主共和国': 'Democratic Republic of the Congo',
      '安哥拉': 'Angola',
      '赞比亚': 'Zambia',
      '津巴布韦': 'Zimbabwe',
      '博茨瓦纳': 'Botswana',
      '纳米比亚': 'Namibia',
      '南非': 'South Africa',
      '莱索托': 'Lesotho',
      '斯威士兰': 'Eswatini',
      '莫桑比克': 'Mozambique',
      '马达加斯加': 'Madagascar',
      '毛里求斯': 'Mauritius',
      '塞舌尔': 'Seychelles',
      '科摩罗': 'Comoros',
      '马约特': 'Mayotte',
      '留尼汪': 'Réunion',
      '圣赫勒拿': 'Saint Helena',
      '阿森松岛': 'Ascension Island',
      '特里斯坦-达库尼亚': 'Tristan da Cunha',
      '西撒哈拉': 'Western Sahara',
      '加那利群岛': 'Canary Islands',
      '马德拉群岛': 'Madeira',
      '亚速尔群岛': 'Azores'
    };
  }

  // 初始化合同管理
  init() {
    console.log('🔧 初始化合同管理...');
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    console.log('🔧 绑定合同标签事件...');
    
    const calculatorTab = document.getElementById('calculatorTab');
    const contractTab = document.getElementById('contractTab');
    
    console.log('🔍 找到的元素:', { calculatorTab, contractTab });
    
    if (calculatorTab) {
      calculatorTab.addEventListener('click', () => {
        console.log('🖱️ 点击了计算器标签');
        this.switchTab('calculator');
      });
      console.log('✅ calculatorTab 事件已绑定');
    } else {
      console.error('❌ 未找到 calculatorTab');
    }
    
    if (contractTab) {
      contractTab.addEventListener('click', () => {
        console.log('🖱️ 点击了合同标签');
        this.switchTab('contract');
      });
      console.log('✅ contractTab 事件已绑定');
    } else {
      console.error('❌ 未找到 contractTab');
    }
  }

  // 切换标签页
  switchTab(tabName) {
    console.log(`🔄 切换到标签: ${tabName}`);
    
    // 隐藏所有主内容区域
    const mainContent = document.getElementById('mainContent');
    const contractMainContent = document.getElementById('contractMainContent');
    
    if (mainContent) {
      mainContent.style.setProperty('display', 'none', 'important');
    }
    if (contractMainContent) {
      contractMainContent.style.setProperty('display', 'none', 'important');
    }
    
    // 显示对应的主内容区域
    if (tabName === 'calculator') {
      if (mainContent) {
        mainContent.style.setProperty('display', 'block', 'important');
        console.log('✅ 计算器主内容区域已设置为可见');
      }
    } else if (tabName === 'contract') {
      if (contractMainContent) {
        contractMainContent.style.setProperty('display', 'block', 'important');
        console.log('✅ 合同主内容区域已设置为可见');
        
        // 生成合同内容
        this.generateContractContent();
      }
    }
    
    // 更新按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      console.log(`✅ 按钮状态已更新: ${tabName}`);
    } else {
      console.error(`❌ 未找到按钮: [data-tab=${tabName}]`);
    }

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabName}Content`);
    if (activeContent) {
      activeContent.classList.add('active');
      console.log(`✅ 内容区已激活: ${tabName}Content`);
    } else {
      console.error(`❌ 未找到内容区: ${tabName}Content`);
    }
  }

  // 生成合同页面内容
  generateContractContent() {
    console.log('🔧 生成合同页面内容...');
    
    const contractContent = document.getElementById('contractContent');
    if (!contractContent) {
      console.error('❌ 未找到合同内容容器');
      return;
    }
    
    // 合同内容区域现在有独立的容器，不需要强制设置显示
    contractContent.classList.add('active');
    contractContent.style.minHeight = '300px';

    // 生成合同管理表单
    const content = `
      <div class="space-y-8">
        <!-- 买方信息和合同信息卡片并排显示 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 买方信息卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-user text-primary mr-2"></i>买方信息
            </h3>
            <div class="grid grid-cols-1 gap-3">
                             <div class="grid grid-cols-2 gap-4">
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">买方名称 / Buyer Name</div>
                   <input type="text" id="buyerName" class="form-input" placeholder="请输入买方名称">
                 </div>
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">买方电话 / Buyer Phone</div>
                   <input type="tel" id="buyerPhone" class="form-input" placeholder="请输入买方电话">
                 </div>
               </div>
               <div>
                 <div class="text-sm font-medium text-gray-700 mb-1">买方地址 / Buyer Address</div>
                 <textarea id="buyerAddress" class="form-input" placeholder="请输入买方地址" rows="2" style="width: 100%; resize: vertical; min-height: 60px; height: 60px;"></textarea>
               </div>
            </div>
          </div>
          
          <!-- 合同信息卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-file-contract text-primary mr-2"></i>合同信息
            </h3>
            <div class="grid grid-cols-1 gap-3">
                             <div class="grid grid-cols-2 gap-4">
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">合同编号 / Contract Number</div>
                   <input type="text" id="contractNumber" class="form-input" placeholder="请输入合同编号">
                 </div>
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">合同日期 / Contract Date</div>
                   <input type="date" id="contractDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
                 </div>
               </div>
               <div>
                 <div class="text-sm font-medium text-gray-700 mb-1">签署地点 / Signing Location</div>
                 <input type="text" id="contractLocation" class="form-input" placeholder="请输入合同签订地点" value="Chongqing, China">
               </div>
            </div>
          </div>
        </div>
        
        <!-- 卖方信息和开户行卡片并排显示 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 卖方信息卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-building text-primary mr-2"></i>卖方信息
            </h3>
            <div class="grid grid-cols-1 gap-3">
                             <div class="grid grid-cols-2 gap-4">
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">卖方名称 / Seller Name</div>
                   <input type="text" id="sellerName" class="form-input" placeholder="请输入卖方名称" value="Smai Co., LTD">
                 </div>
                 <div>
                   <div class="text-sm font-medium text-gray-700 mb-1">卖方电话 / Seller Phone</div>
                   <input type="tel" id="sellerPhone" class="form-input" placeholder="请输入卖方电话">
                 </div>
               </div>
               <div>
                 <div class="text-sm font-medium text-gray-700 mb-1">卖方地址 / Seller Address</div>
                 <textarea id="sellerAddress" class="form-input" placeholder="请输入卖方地址" rows="2" style="width: 100%; resize: vertical; min-height: 60px; height: 60px;">201 A024 2nd Floor Xichen Building 9 Xiyuan North Street Xiyong Street, High tech Zone, Chongqing</textarea>
               </div>
            </div>
          </div>
          
          <!-- 开户行卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-university text-primary mr-2"></i>开户行
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <div>
                <textarea id="bankInfo" class="form-input" placeholder="请输入开户行信息" rows="2" style="width: 100%; resize: vertical; min-height: 160px; height: 160px;">Benificiary Bank: CHINA CITIC BANK CHONGQING BRANCH
Swift Code:  CIBKCNBJ400
Benificiary Name: Smai Co., LTD
Benificiary Account: （8111214013100727547）
Bank Address:  NO. 5, WEST STREET, JIANGBEI CITY, JIANGBEI DISTRICT, CHONGQING</textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 商品信息卡片 -->
        <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover mt-6" style="z-index: 20;">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium flex items-center" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-shopping-cart text-primary mr-2"></i>商品信息
            </h3>
            <button id="addGoodsRow" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center">
              <i class="fa-solid fa-plus mr-2"></i>增加商品
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 12%;">型号<br>Model</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 35%;">货物名称及规格<br>Description & Specification</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 10%;">颜色<br>Color</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 8%;">数量<br>Quantity</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 12%;">单价<br>Unit Price (USD)</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 12%;">金额<br>Total Amount (USD)</th>
                  <th class="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700" style="width: 11%;">操作</th>
                </tr>
              </thead>
              <tbody id="goodsTableBody">
                <!-- 货物行将通过JavaScript动态生成 -->
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- 出口信息和运输信息卡片并排显示 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <!-- 支付信息卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-credit-card text-primary mr-2"></i>支付信息
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">出口类型 / Export Type</div>
                  <select id="exportType" class="form-input">
                    <option value="EXW">EXW</option>
                    <option value="FOB">FOB</option>
                    <option value="CIF">CIF</option>
                    <option value="CFR">CFR</option>
                  </select>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">支付条款 / Terms of Payment</div>
                  <input type="text" id="paymentTerms" class="form-input" placeholder="请输入支付条款" value="付全款提车（100% Payment by T/T）">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">总价 / Total Amount</div>
                  <div class="form-input bg-gray-100" id="totalAmount" style="cursor: not-allowed;">0</div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">大写金额 / Amount in Words</div>
                  <textarea id="amountInWords" class="form-input bg-gray-100" style="cursor: not-allowed; font-size: 0.875rem; line-height: 1.25rem; resize: none; min-height: 40px; overflow: hidden;" readonly>SAY US DOLLARS ZERO ONLY</textarea>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 运输信息卡片 -->
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200 card-hover" style="z-index: 20;">
            <h3 class="text-lg font-medium flex items-center mb-3" style="z-index: 25; position: relative;">
              <i class="fa-solid fa-truck text-primary mr-2"></i>运输信息
            </h3>
            <div class="grid grid-cols-1 gap-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">起运港 / Port of Loading</div>
                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="portOfLoading" class="form-input" placeholder="中文地名">
                    <input type="text" id="portOfLoadingEn" class="form-input" placeholder="英文地名" readonly>
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">目的国 / Final Destination</div>
                  <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="finalDestination" class="form-input" placeholder="中文地名">
                    <input type="text" id="finalDestinationEn" class="form-input" placeholder="英文地名" readonly>
                  </div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">运输路线 / Transport Route</div>
                  <input type="text" id="transportRoute" class="form-input" placeholder="请输入运输路线">
                </div>
                <div>
                  <div class="text-sm font-medium text-gray-700 mb-1">运输方式 / Mode of Shipment</div>
                  <select id="modeOfShipment" class="form-input">
                    <option value="Land">陆运 Land</option>
                    <option value="Sea">海运 Sea</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 生成合同按钮 -->
        <div class="flex justify-center">
            <button 
            id="generateContractBtn"
            class="px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-custom flex items-center text-lg font-medium shadow-lg hover:shadow-xl"
            >
            <i class="fa-solid fa-file-excel mr-3"></i>
            生成合同Excel文件
            </button>
        </div>
        
        <!-- 状态提示 -->
        <div id="contractStatus" class="hidden">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div class="flex items-center justify-center">
              <i class="fa-solid fa-spinner fa-spin text-blue-600 mr-2"></i>
              <span class="text-blue-800">正在生成合同文件，请稍候...</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    contractContent.innerHTML = content;
    console.log('✅ 合同页面内容生成完成');
    
    // 绑定生成合同按钮事件
    this.bindContractEvents();
  }
  
  // 绑定合同相关事件
  bindContractEvents() {
    const generateBtn = document.getElementById('generateContractBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateContract());
    }
    
    // 绑定增加货物行按钮
    const addGoodsRowBtn = document.getElementById('addGoodsRow');
    if (addGoodsRowBtn) {
      addGoodsRowBtn.addEventListener('click', () => this.addGoodsRow());
    }
    
    // 初始化货物表格
    this.initializeGoodsTable();
    
    // 绑定地名翻译事件
    this.bindLocationTranslationEvents();
  }
  
  // 生成合同
  async generateContract() {
    try {
      // 获取表单数据
      const formData = {
        buyerName: document.getElementById('buyerName')?.value || '',
        buyerPhone: document.getElementById('buyerPhone')?.value || '',
        buyerAddress: document.getElementById('buyerAddress')?.value || '',
        sellerName: document.getElementById('sellerName')?.value || '',
        sellerPhone: document.getElementById('sellerPhone')?.value || '',
        sellerAddress: document.getElementById('sellerAddress')?.value || '',
        contractNumber: document.getElementById('contractNumber')?.value || '',
        contractDate: document.getElementById('contractDate')?.value || '',
        contractLocation: document.getElementById('contractLocation')?.value || '',
        bankInfo: document.getElementById('bankInfo')?.value || '',
        goodsData: this.goodsRows, // 添加货物数据
        // 新增字段
        exportType: document.getElementById('exportType')?.value || '',
        paymentTerms: document.getElementById('paymentTerms')?.value || '',
        totalAmount: this.goodsRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0),
        amountInWords: this.numberToWords(this.goodsRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0)),
        f22Value: this.updateF22Value(),
        portOfLoading: this.getLocationWithTranslation('portOfLoading'),
        finalDestination: this.getLocationWithTranslation('finalDestination'),
        transportRoute: document.getElementById('transportRoute')?.value || '',
        modeOfShipment: document.getElementById('modeOfShipment')?.value || ''
      };
      
      // 调试：打印货物数据
      console.log('🔍 发送的货物数据:', this.goodsRows);
      console.log('🔍 货物数据详情:', JSON.stringify(this.goodsRows, null, 2));
      
      // 调试：打印F22值
      console.log('🔍 F22值:', formData.f22Value);
      console.log('🔍 出口类型:', formData.exportType);
      console.log('🔍 起运港英文:', this.getLocationEnglishOnly('portOfLoading'));
      console.log('🔍 目的国英文:', this.getLocationEnglishOnly('finalDestination'));
      
      // 验证必填字段
      if (!formData.buyerName || !formData.contractNumber) {
        alert('请填写买方名称和合同编号');
        return;
      }
      
      // 显示加载状态
      this.showContractStatus(true);
      
      // 使用配置的API地址
      const apiUrl = getApiUrl('GENERATE_CONTRACT');
      console.log('🌐 API地址:', apiUrl);
      
      // 调用后端API
      console.log('🌐 发送请求到:', apiUrl);
      console.log('📦 请求数据:', JSON.stringify(formData, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      console.log('📡 响应状态:', response.status);
      console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        // 下载文件
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('合同文件生成成功！');
      } else {
        let errorMessage = '生成合同失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // 如果无法解析JSON，尝试获取文本内容
          try {
            const errorText = await response.text();
            errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
          } catch (textError) {
            errorMessage = `HTTP ${response.status}: 无法获取错误详情`;
          }
        }
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('生成合同失败:', error);
      console.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      let errorMessage = error.message;
      
      // 处理网络错误
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络连接或稍后重试';
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = '无法连接到服务器，请检查网络连接';
      } else if (error.message.includes('Load failed')) {
        errorMessage = '请求加载失败，可能是网络问题或服务器暂时不可用';
      }
      
      alert(`生成合同失败: ${errorMessage}`);
    } finally {
      this.showContractStatus(false);
    }
  }
  
  // 显示/隐藏合同状态
  showContractStatus(show) {
    const statusDiv = document.getElementById('contractStatus');
    if (statusDiv) {
      statusDiv.classList.toggle('hidden', !show);
    }
  }
  
  // 初始化货物表格
  initializeGoodsTable() {
    this.goodsRows = [];
    this.nextRowId = 1;
    this.renderGoodsTable();
  }
  
  // 渲染货物表格
  renderGoodsTable() {
    const tbody = document.getElementById('goodsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (this.goodsRows.length === 0) {
      // 添加默认的第一行
      this.addGoodsRow();
    } else {
      // 渲染所有货物行，保持现有数据
      this.goodsRows.forEach(row => {
        tbody.appendChild(this.createGoodsRow(row));
      });
    }
  }
  
    // 创建货物行
  createGoodsRow(rowData) {
    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-200';
    tr.innerHTML = `
      <td class="border border-gray-300 px-3 py-2" style="width: 12%;">
        <input type="text" class="w-full border-none outline-none bg-transparent" 
               data-field="model" data-row-id="${rowData.id}" placeholder="请输入型号" value="${rowData.model || ''}">
      </td>
      <td class="border border-gray-300 px-3 py-2" style="width: 35%;">
        <input type="text" class="w-full border-none outline-none bg-transparent" 
               data-field="description" data-row-id="${rowData.id}" placeholder="请输入货物名称及规格" value="${rowData.description || ''}">
      </td>
      <td class="border border-gray-300 px-3 py-2" style="width: 10%;">
        <input type="text" class="w-full border-none outline-none bg-transparent" 
               data-field="color" data-row-id="${rowData.id}" placeholder="请输入颜色" value="${rowData.color || ''}">
      </td>
      <td class="border border-gray-300 px-3 py-2" style="width: 8%;">
        <input type="number" class="w-full border-none outline-none bg-transparent" 
               data-field="quantity" data-row-id="${rowData.id}" placeholder="0" min="0" step="1" value="${rowData.quantity || ''}">
      </td>
      <td class="border border-gray-300 px-3 py-2" style="width: 12%;">
        <input type="number" class="w-full border-none outline-none bg-transparent" 
               data-field="unitPrice" data-row-id="${rowData.id}" placeholder="0" min="0" step="1" value="${rowData.unitPrice || ''}">
      </td>
      <td class="border border-gray-300 px-3 py-2" style="width: 12%;">
        <span class="total-amount" data-row-id="${rowData.id}">${rowData.totalAmount || 0}</span>
      </td>
      <td class="border border-gray-300 px-3 py-2 text-center" style="width: 11%;">
        <button class="text-red-500 hover:text-red-700 delete-row" data-row-id="${rowData.id}">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    
    // 绑定输入事件
    this.bindGoodsRowEvents(tr, rowData.id);
    
    return tr;
  }
  
  // 绑定货物行事件
  bindGoodsRowEvents(tr, rowId) {
    const modelInput = tr.querySelector('[data-field="model"]');
    const descriptionInput = tr.querySelector('[data-field="description"]');
    const colorInput = tr.querySelector('[data-field="color"]');
    const quantityInput = tr.querySelector('[data-field="quantity"]');
    const unitPriceInput = tr.querySelector('[data-field="unitPrice"]');
    const deleteBtn = tr.querySelector('.delete-row');
    
    // 更新数据到goodsRows数组
    const updateRowData = () => {
      const rowData = this.goodsRows.find(row => row.id === rowId);
      if (rowData) {
        rowData.model = modelInput.value || '';
        rowData.description = descriptionInput.value || '';
        rowData.color = colorInput.value || '';
        rowData.quantity = parseFloat(quantityInput.value) || 0;
        rowData.unitPrice = parseFloat(unitPriceInput.value) || 0;
        rowData.totalAmount = Math.round(rowData.quantity * rowData.unitPrice);
      }
      // 更新总价和大写金额
      this.updateTotalAmount();
    };
    
    // 计算总金额
    const calculateTotal = () => {
      const quantity = parseFloat(quantityInput.value) || 0;
      const unitPrice = parseFloat(unitPriceInput.value) || 0;
      const total = Math.round(quantity * unitPrice);
      
      const totalSpan = tr.querySelector('.total-amount');
      if (totalSpan) {
        totalSpan.textContent = total;
      }
      
      updateRowData();
    };
    
    // 绑定所有输入事件
    modelInput.addEventListener('input', updateRowData);
    descriptionInput.addEventListener('input', updateRowData);
    colorInput.addEventListener('input', updateRowData);
    quantityInput.addEventListener('input', calculateTotal);
    unitPriceInput.addEventListener('input', calculateTotal);
    
    // 绑定删除事件
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteGoodsRow(rowId));
    }
  }
  
  // 添加货物行
  addGoodsRow() {
    // 检查是否已达到最大行数限制（10行）
    if (this.goodsRows.length >= 10) {
      alert('最多只能添加10行货物信息');
      return;
    }
    
    const newRow = {
      id: this.nextRowId++,
      model: '',
      description: '',
      color: '',
      quantity: 0,
      unitPrice: 0,
      totalAmount: 0
    };
    
    this.goodsRows.push(newRow);
    this.renderGoodsTable();
  }
  
  // 删除货物行
  deleteGoodsRow(rowId) {
    if (this.goodsRows.length <= 1) {
      alert('至少需要保留一行货物信息');
      return;
    }
    
    this.goodsRows = this.goodsRows.filter(row => row.id !== rowId);
    this.renderGoodsTable();
    // 更新总价和大写金额
    this.updateTotalAmount();
  }
  
  // 更新总价和大写金额
  updateTotalAmount() {
    const totalAmount = this.goodsRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
    
    // 更新总价显示
    const totalAmountElement = document.getElementById('totalAmount');
    if (totalAmountElement) {
      totalAmountElement.textContent = totalAmount;
    }
    
    // 更新大写金额显示
    const amountInWordsElement = document.getElementById('amountInWords');
    if (amountInWordsElement) {
      const words = this.numberToWords(totalAmount);
      amountInWordsElement.value = words;
      // 自动调整textarea高度
      this.adjustTextareaHeight(amountInWordsElement);
    }
  }
  
  // 自动调整textarea高度
  adjustTextareaHeight(textarea) {
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = 'auto';
    // 设置新高度
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  
  // 数字转英文大写
  numberToWords(num) {
    if (num === 0) return 'SAY US DOLLARS ZERO ONLY';
    
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    
    function convertLessThanOneThousand(n) {
      if (n === 0) return '';
      
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      }
      if (n < 1000) {
        return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + convertLessThanOneThousand(n % 100) : '');
      }
    }
    
    function convert(n) {
      if (n === 0) return 'ZERO';
      
      const billion = Math.floor(n / 1000000000);
      const million = Math.floor((n % 1000000000) / 1000000);
      const thousand = Math.floor((n % 1000000) / 1000);
      const remainder = n % 1000;
      
      let result = '';
      
      if (billion) {
        result += convertLessThanOneThousand(billion) + ' BILLION';
      }
      if (million) {
        result += (result ? ' ' : '') + convertLessThanOneThousand(million) + ' MILLION';
      }
      if (thousand) {
        result += (result ? ' ' : '') + convertLessThanOneThousand(thousand) + ' THOUSAND';
      }
      if (remainder) {
        result += (result ? ' ' : '') + convertLessThanOneThousand(remainder);
      }
      
      return result;
    }
    
    return 'SAY US DOLLARS ' + convert(num) + ' ONLY';
  }
  
  // 更新F22单元格值（出口类型 + 港口/国家）
  updateF22Value() {
    const exportType = document.getElementById('exportType')?.value || '';
    const portOfLoading = this.getLocationEnglishOnly('portOfLoading');
    const finalDestination = this.getLocationEnglishOnly('finalDestination');
    
    let f22Value = '';
    if (exportType) {
      if (exportType === 'EXW' || exportType === 'FOB') {
        f22Value = portOfLoading ? `${exportType} ${portOfLoading.toUpperCase()}` : exportType;
      } else if (exportType === 'CIF' || exportType === 'CFR') {
        f22Value = finalDestination ? `${exportType} ${finalDestination.toUpperCase()}` : exportType;
      }
    }
    
    return f22Value;
  }
  
  // 获取位置信息的纯英文部分
  getLocationEnglishOnly(fieldId) {
    const englishInput = document.getElementById(fieldId + 'En');
    return englishInput ? englishInput.value : '';
  }
  
  // 获取带翻译的位置信息
  getLocationWithTranslation(fieldId) {
    const chineseInput = document.getElementById(fieldId);
    const englishInput = document.getElementById(fieldId + 'En');
    
    if (!chineseInput) return '';
    
    const chineseValue = chineseInput.value;
    const englishValue = englishInput ? englishInput.value : '';
    
    if (chineseValue && englishValue) {
      return `${chineseValue} ${englishValue}`;
    }
    
    return chineseValue;
  }
  
  // 地名翻译方法
  translateLocation(chineseText) {
    if (!chineseText) return '';
    
    // 检查是否有完全匹配
    if (this.locationTranslations[chineseText]) {
      return this.locationTranslations[chineseText];
    }
    
    // 检查是否包含已知地名
    for (const [chinese, english] of Object.entries(this.locationTranslations)) {
      if (chineseText.includes(chinese)) {
        return chineseText.replace(chinese, english);
      }
    }
    
    // 如果没有匹配，返回原文本
    return chineseText;
  }
  
  // 绑定地名翻译事件
  bindLocationTranslationEvents() {
    const portOfLoadingInput = document.getElementById('portOfLoading');
    const portOfLoadingEnInput = document.getElementById('portOfLoadingEn');
    const finalDestinationInput = document.getElementById('finalDestination');
    const finalDestinationEnInput = document.getElementById('finalDestinationEn');
    
    if (portOfLoadingInput && portOfLoadingEnInput) {
      // 为起运港输入框添加翻译功能
      this.setupDualInputTranslation(portOfLoadingInput, portOfLoadingEnInput);
    }
    
    if (finalDestinationInput && finalDestinationEnInput) {
      // 为目的国输入框添加翻译功能
      this.setupDualInputTranslation(finalDestinationInput, finalDestinationEnInput);
    }
  }
  
  // 设置双输入框翻译功能
  setupDualInputTranslation(chineseInput, englishInput) {
    // 监听中文输入框的输入事件
    chineseInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const translated = this.translateLocation(value);
      
      if (translated && translated !== value) {
        englishInput.value = translated;
      } else {
        englishInput.value = '';
      }
    });
    
    // 监听中文输入框的失焦事件
    chineseInput.addEventListener('blur', (e) => {
      const value = e.target.value;
      const translated = this.translateLocation(value);
      
      if (translated && translated !== value) {
        englishInput.value = translated;
      }
    });
    
    // 监听中文输入框的聚焦事件
    chineseInput.addEventListener('focus', (e) => {
      const value = e.target.value;
      const translated = this.translateLocation(value);
      
      if (translated && translated !== value) {
        englishInput.value = translated;
      }
    });
  }
} 