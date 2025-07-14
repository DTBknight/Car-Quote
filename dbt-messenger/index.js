// 加载环境变量
require('dotenv').config();

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { getRandomUserAgent, getRandomViewport, getRandomDelay } = require('./anti-detection');

async function collectCarData() {
  console.log('开始采集懂车帝车型ID=9页面...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.setViewport(getRandomViewport());

  const url = 'https://www.dongchedi.com/auto/series/2890';
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(2000, 4000)));

  // 采集数据
  const carData = await page.evaluate(() => {
    function getByXpath(xpath) {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    }
    // 品牌图片
    const logoImg = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[1]/div[1]/div[1]/img');
    const brandImage = logoImg ? logoImg.src : '';
    // 品牌名称
    const brandSpan = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[1]/div[1]/div[1]/span');
    let brand = brandSpan ? brandSpan.textContent.trim() : '';
    if (brand.includes('/')) brand = brand.split('/')[0].trim();
    // 车型名称
    const carNameH1 = getByXpath('//*[@id=\"__next\"]/div/div[2]/div[2]/div[1]/div[1]/div[1]/h1');
    let carName = carNameH1 ? carNameH1.textContent.trim() : '';

    // 配置名称和指导价，每个配置单独为一条数据
    const carList = [];
    const liNodes = document.querySelectorAll('#carModels ul > li');
    liNodes.forEach(li => {
      // 只采集有data-log-click属性的div
      const configDivs = li.querySelectorAll('div[data-log-click]');
      configDivs.forEach(div => {
        // 配置名称优先取data-log-click中的car_style_name
        let configName = '';
        try {
          const logClick = div.getAttribute('data-log-click');
          if (logClick) {
            const match = logClick.match(/"car_style_name":"([^"]+)"/);
            if (match) configName = match[1];
          }
        } catch (e) {}
        // 如果没取到再降级用strong/div
        if (!configName) {
          const strong = div.querySelector('strong');
          if (strong) {
            configName = strong.textContent.trim();
          } else {
            const nameDiv = div.querySelector('div');
            if (nameDiv) configName = nameDiv.textContent.trim();
          }
        }
        // 指导价，采集div > div:nth-child(2) > div
        let price = '';
        const priceNode = div.querySelector('div > div:nth-child(2) > div');
        if (priceNode) {
          price = priceNode.textContent.trim();
        }
        // 车型主图
        let mainImage = '';
        try {
          const mainImg = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[2]/div/div/div[36]/img');
          if (mainImg) mainImage = mainImg.src;
        } catch (e) {}
        if (configName) {
          carList.push({
            brand,
            brandImage,
            carName,
            configName,
            price,
            mainImage,
            created_at: new Date().toISOString()
          });
        }
      });
    });
    return carList;
  });

  // 保存数据
  const dataPath = path.join(__dirname, '..', 'data', 'cars.json');
  fs.writeFileSync(dataPath, JSON.stringify(carData, null, 2));
  console.log('采集完成！数据已保存到data/cars.json');
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