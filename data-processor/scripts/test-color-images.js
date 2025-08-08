const { brandIdsMap } = require('../index-optimized');
const BrowserManager = require('../browser-manager');
const DataCollector = require('../data-collector');

async function run(arg) {
  const browserManager = new BrowserManager();
  const browser = await browserManager.createBrowser();
  const dc = new DataCollector(browserManager);

  try {
    const maybeSeriesId = parseInt(arg, 10);
    if (!isNaN(maybeSeriesId)) {
      const car = await dc.collectSingleCarData(browser, maybeSeriesId, 'Geely');
      if (!car) { console.log('未获取到车型数据'); return; }
      console.log('车型名称:', car.carName);
      console.log('主图:', car.mainImage);
      const colors = Array.isArray(car.colorImages) ? car.colorImages : [];
      console.log('颜色图片数量:', colors.length);
      colors.forEach((c, i) => console.log(`${i+1}. ${c.colorName || ''} -> ${c.image}`));
      return;
    }

    const brandCode = arg;
    const ids = brandIdsMap[brandCode];
    const brandIds = Array.isArray(ids) ? ids : [ids];
    if (!brandIds[0]) {
      console.error('未找到品牌ID:', brandCode);
      process.exit(1);
    }
    const { carIds } = await dc.getBrandInfoAndCarIds(browser, brandIds[0]);
    if (!carIds || carIds.length === 0) { console.log('未找到车型ID'); return; }
    const carId = carIds[0];
    console.log('测试车型ID:', carId);
    const car = await dc.collectSingleCarData(browser, carId, brandCode);
    if (!car) { console.log('未获取到车型数据'); return; }
    console.log('车型名称:', car.carName);
    console.log('主图:', car.mainImage);
    const colors = Array.isArray(car.colorImages) ? car.colorImages : [];
    console.log('颜色图片数量:', colors.length);
    colors.forEach((c, i) => console.log(`${i+1}. ${c.colorName || ''} -> ${c.image}`));
  } finally {
    await browserManager.closeBrowser(browser);
  }
}

if (require.main === module) {
  const arg = process.argv[2] || 'Geely';
  run(arg).catch(e => {
    console.error('测试失败:', e.message);
    process.exit(1);
  });
}


