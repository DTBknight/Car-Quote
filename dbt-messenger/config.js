// 配置文件 - 运行时配置
module.exports = {
  // 目标网站配置
  targetSite: {
    baseUrl: process.env.TARGET_BASE_URL || 'https://www.example.com',
    apiBaseUrl: process.env.TARGET_API_BASE_URL || 'https://www.example.com'
  },
  
  // 车型系列配置
  carSeries: [
    { 
      name: '比亚迪秦PLUS DM', 
      seriesId: '4802',
      brand: '比亚迪'
    },
    { 
      name: '特斯拉Model 3', 
      seriesId: '4803',
      brand: '特斯拉'
    },
    { 
      name: '特斯拉Model Y', 
      seriesId: '4804',
      brand: '特斯拉'
    },
    { 
      name: '比亚迪汉', 
      seriesId: '4805',
      brand: '比亚迪'
    },
    { 
      name: '奔驰C级', 
      seriesId: '4806',
      brand: '奔驰'
    },
    { 
      name: '宝马3系', 
      seriesId: '4807',
      brand: '宝马'
    },
    { 
      name: '奥迪A4L', 
      seriesId: '4808',
      brand: '奥迪'
    }
  ],
  
  // API端点配置
  apiEndpoints: [
    '/motor/pc/car/series/get_car_series_list/?brand_id=1&city_id=201',
    '/motor/pc/car/series/get_car_series_list/?brand_id=2&city_id=201',
    '/motor/pc/car/series/get_car_series_list/?brand_id=3&city_id=201'
  ]
}; 