const fs = require('fs');
const path = require('path');
const { brandIdsMap } = require('../index-optimized');
const BrowserManager = require('../browser-manager');
const DataCollector = require('../data-collector');

async function main() {
  const args = process.argv.slice(2);
  const shouldWrite = args.includes('--write');

  const dataDir = path.join(__dirname, '..', '..', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');

  const missing = [];
  const results = [];

  // 扫描缺失 logo 的品牌文件
  for (const file of files) {
    try {
      const full = path.join(dataDir, file);
      const json = JSON.parse(fs.readFileSync(full, 'utf-8'));
      const hasLogo = typeof json.brandImage === 'string' && json.brandImage.trim().length > 0;
      if (!hasLogo) {
        const brandCode = path.basename(file, '.json');
        missing.push({ brandCode, file: full });
      }
    } catch (e) {
      // 跳过损坏文件
    }
  }

  console.log(`🔍 共发现缺失 logo 的品牌: ${missing.length}`);
  if (missing.length === 0) return;

  const browserManager = new BrowserManager();
  const dataCollector = new DataCollector(browserManager);

  // 为提升效率，尽量复用同一个浏览器实例
  const browser = await browserManager.createBrowser();

  for (const item of missing) {
    const { brandCode, file } = item;
    let brandId = brandIdsMap[brandCode];
    if (Array.isArray(brandId)) brandId = brandId[0];

    if (!brandId) {
      results.push({ brand: brandCode, status: 'no-brand-id' });
      continue;
    }

    try {
      const logo = await dataCollector.getBrandLogo(browser, null, brandId);
      if (logo && /^https?:\/\//i.test(logo)) {
        if (shouldWrite) {
          const json = JSON.parse(fs.readFileSync(file, 'utf-8'));
          json.brandImage = logo;
          fs.writeFileSync(file, JSON.stringify(json, null, 2));
        }
        results.push({ brand: brandCode, status: 'fetched', logo });
      } else {
        results.push({ brand: brandCode, status: 'not-found' });
      }
    } catch (e) {
      results.push({ brand: brandCode, status: 'error', error: e.message });
    }
  }

  // 关闭浏览器
  await browserManager.closeBrowser(browser);

  // 输出报告
  const grouped = results.reduce((acc, r) => {
    acc[r.status] = acc[r.status] || [];
    acc[r.status].push(r);
    return acc;
  }, {});

  console.log('\n📋 报告:');
  for (const k of Object.keys(grouped)) {
    console.log(`- ${k}: ${grouped[k].length}`);
  }

  if (shouldWrite) {
    // 同步 brands.json
    try {
      const DataManager = require('../data-manager');
      const dm = new DataManager();
      await dm.syncBrandsJson();
    } catch (_) {}
  }
}

if (require.main === module) {
  main().catch(e => {
    console.error('💥 运行失败:', e);
    process.exit(1);
  });
}


