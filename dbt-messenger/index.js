// 加载环境变量
require('dotenv').config();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getRandomUserAgent, getRandomViewport, getRandomDelay } = require('./anti-detection');

const carData = [];

async function collectCarData() {
  console.log('开始采集懂车帝A-Z全品牌在售车型...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport(getRandomViewport());

  // 1. 获取品牌A-Z列表
  await page.goto('https://www.dongchedi.com/auto/brand/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForTimeout(getRandomDelay(2000, 4000));
  const brands = await page.evaluate(() => {
    const brandList = [];
    document.querySelectorAll('.brand-index-list .brand-index-block').forEach(block => {
      const letter = block.querySelector('.brand-index-title')?.textContent.trim() || '';
      block.querySelectorAll('.brand-index-list-item').forEach(item => {
        const name = item.querySelector('.brand-index-list-name')?.textContent.trim() || '';
        const logo = item.querySelector('img')?.src || '';
        const href = item.querySelector('a')?.getAttribute('href') || '';
        // 品牌拼音通常在logo图片url或data-pinyin属性里
        const pinyin = item.getAttribute('data-pinyin') || '';
        // 品牌ID通常在链接里
        const idMatch = href.match(/brand\/(\d+)/);
        const brandId = idMatch ? idMatch[1] : '';
        if (name && href) {
          brandList.push({ name, letter, logo, pinyin, brandId, href });
        }
      });
    });
    return brandList;
  });
  console.log(`共采集到品牌数: ${brands.length}`);

  // 2. 遍历品牌，采集在售车型
  for (const brand of brands) {
    try {
      console.log(`采集品牌: ${brand.name} (${brand.letter})`);
      await page.goto('https://www.dongchedi.com' + brand.href, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForTimeout(getRandomDelay(2000, 4000));
      // 采集在售车型
      const seriesList = await page.evaluate(() => {
        const arr = [];
        document.querySelectorAll('.brand-series-list .brand-series-list-item').forEach(item => {
          const status = item.querySelector('.brand-series-list-status')?.textContent.trim() || '';
          if (status !== '在售') return;
          const carName = item.querySelector('.brand-series-list-name')?.textContent.trim() || '';
          const carImage = item.querySelector('img')?.src || '';
          const href = item.querySelector('a')?.getAttribute('href') || '';
          const energy = item.querySelector('.brand-series-list-tag')?.textContent.trim() || '';
          if (carName && href) {
            arr.push({ carName, carImage, href, energy });
          }
        });
        return arr;
      });
      console.log(`  在售车型数: ${seriesList.length}`);
      // 3. 遍历车型，采集配置
      for (const series of seriesList) {
        try {
          await page.goto('https://www.dongchedi.com' + series.href, { waitUntil: 'networkidle2', timeout: 60000 });
          await page.waitForTimeout(getRandomDelay(2000, 4000));
          // 采集配置
          const configs = await page.evaluate(() => {
            const arr = [];
            document.querySelectorAll('.config-car-list .config-car-list-item').forEach(item => {
              const configName = item.querySelector('.config-car-list-title')?.textContent.trim() || '';
              const price = item.querySelector('.config-car-list-price')?.textContent.trim() || '';
              if (configName && price) {
                arr.push({ configName, price });
              }
            });
            return arr;
          });
          for (const config of configs) {
            carData.push({
              brand: brand.name,
              brand_pinyin: brand.pinyin,
              brand_letter: brand.letter,
              brand_logo: brand.logo,
              carName: series.carName,
              configName: config.configName,
              price: config.price,
              carImage: series.carImage,
              energy: series.energy,
              status: '在售',
              created_at: new Date().toISOString()
            });
          }
        } catch (e) {
          console.log(`    采集车型配置失败: ${series.carName}`);
        }
        await page.waitForTimeout(getRandomDelay(2000, 5000));
      }
    } catch (e) {
      console.log(`采集品牌失败: ${brand.name}`);
    }
    await page.waitForTimeout(getRandomDelay(2000, 5000));
  }

  // 保存数据
  const dataPath = path.join(__dirname, '..', 'data', 'cars.json');
  fs.writeFileSync(dataPath, JSON.stringify(carData, null, 2));
  console.log(`采集完成！共采集到车型配置数: ${carData.length}`);
  await browser.close();
}

if (require.main === module) {
  collectCarData()
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