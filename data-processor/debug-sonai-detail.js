const puppeteer = require('puppeteer');
const { getSmartUserAgent, getRandomViewport, optimizePageLoad } = require('./anti-detection');

(async () => {
  const carId = 9494;
  const url = `https://www.dongchedi.com/auto/series/${carId}`;
  const urlParams = `https://www.dongchedi.com/auto/params-carIds-x-${carId}`;
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent(getSmartUserAgent());
  await page.setViewport(getRandomViewport());
  await optimizePageLoad(page);

  function cleanCarName(carName) {
    // 这里不做品牌名去除，直接返回
    return carName;
  }

  try {
    // 1. 采集车型名
    console.log('访问车型页面:', url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2500));
    const carBasicInfo = await page.evaluate(() => {
      let carName = '';
      const selectors = [
        'h1[title]',
        'h1[class*="series-name"]',
        'h1[class*="line-1"]',
        'h1'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim().length > 1) {
          carName = el.textContent.trim();
          break;
        }
      }
      return { carName };
    });
    console.log('采集到车型名:', carBasicInfo.carName);
    // 校验车型名
    if (!carBasicInfo.carName || carBasicInfo.carName.length < 2) {
      console.warn('⚠️ 车型名称无效，跳过');
      await browser.close();
      return;
    }
    const cleanedCarName = cleanCarName(carBasicInfo.carName);

    // 2. 采集配置
    console.log('访问参数页:', urlParams);
    await page.goto(urlParams, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2500));
    const configs = await page.evaluate(() => {
      let configLinks = Array.from(document.querySelectorAll('a[class*="cell_car__"]'));
      let configNames = [];
      let configIds = [];
      let prices = [];
      if (configLinks.length > 0) {
        configNames = configLinks.map(a => a.textContent.trim());
        configIds = configLinks.map(a => {
          const match = a.href.match(/model-(\d+)/);
          return match ? match[1] : '';
        });
      }
      if (configNames.length === 0) {
        const liNodes = Array.from(document.querySelectorAll('ul > li'));
        configNames = liNodes.map(li => {
          const a = li.querySelector('a[href*="model-"]');
          return a ? a.textContent.trim() : '';
        });
        configIds = liNodes.map(li => {
          const a = li.querySelector('a[href*="model-"]');
          if (a && a.href) {
            const match = a.href.match(/model-(\d+)/);
            return match ? match[1] : '';
          }
          return '';
        });
        prices = liNodes.map(li => {
          const priceDiv = li.querySelector('div.tw-text-color-gray-800.tw-text-16');
          return priceDiv ? priceDiv.textContent.trim() : '';
        });
      }
      if (prices.length === 0) {
        const allDivs = Array.from(document.querySelectorAll('div, span')).map(e => e.textContent.trim());
        const priceIndex = allDivs.findIndex(t => t === '官方指导价');
        if (priceIndex !== -1) {
          for (let i = priceIndex + 1; i < allDivs.length && prices.length < configNames.length; i++) {
            if (/^[\d.]+万$/.test(allDivs[i]) || /^[\d.]+万元$/.test(allDivs[i])) {
              prices.push(allDivs[i]);
            }
          }
        }
      }
      const maxLen = Math.max(configNames.length, configIds.length, prices.length);
      while (configNames.length < maxLen) configNames.push('');
      while (configIds.length < maxLen) configIds.push('');
      while (prices.length < maxLen) prices.push('');
      return configNames.map((name, idx) => ({
        configName: name,
        configId: configIds[idx],
        price: prices[idx]
      })).filter(cfg => cfg.configName && cfg.price && !['暂无报价', '暂无', '-'].includes(cfg.price.trim()));
    });
    if (!configs.length) {
      console.warn('⚠️ 没有有效配置，跳过');
      await browser.close();
      return;
    }
    console.log('采集到配置:', configs);

    // 3. 采集图片（外观/内饰色块与主图）
    async function getTypeImages(config, carId, type) {
      const imagePageUrl = `https://www.dongchedi.com/series-${carId}/images/${type}-${config.configId}-x-x`;
      const imgPage = await browser.newPage();
      await imgPage.setUserAgent(getSmartUserAgent());
      await imgPage.setViewport(getRandomViewport());
      await optimizePageLoad(imgPage);
      try {
        console.log(`📸 访问${type === 'wg' ? '外观' : '内饰'}图片页面: ${imagePageUrl} (配置ID: ${config.configId})`);
        await imgPage.goto(imagePageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        const colorBlocks = await imgPage.evaluate(() => {
          const result = [];
          const colorFilters = document.querySelectorAll('.filters_colors__2qAUB .filters_item__1S2ZR');
          colorFilters.forEach(filter => {
            try {
              const colorNameElement = filter.querySelector('.filters_name__9ioNp');
              const colorName = colorNameElement ? colorNameElement.textContent.trim() : '';
              const colorElements = filter.querySelectorAll('.filters_color__2W_py');
              const colorCodes = Array.from(colorElements).map(el => el.style.backgroundColor);
              const colorLink = filter.href || '';
              if (colorName && colorCodes.length > 0) {
                result.push({
                  name: colorName,
                  colors: colorCodes,
                  link: colorLink
                });
              }
            } catch (e) {}
          });
          return result;
        });
        console.log(`🎨 找到${type === 'wg' ? '外观' : '内饰'}色块:`, colorBlocks.map(c => c.name));
        // 抓取每个色块的主图
        const colorBlocksWithImages = [];
        for (const color of colorBlocks) {
          try {
            let colorPageUrl = color.link;
            if (color.link && !color.link.startsWith('http')) {
              colorPageUrl = `https://www.dongchedi.com${color.link}`;
            }
            await imgPage.goto(colorPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
            const mainImage = await imgPage.evaluate(() => {
              const imageSelectors = [
                'img[src*="motor-mis-img"][src*="~2508x0"]',
                'img[src*="motor-mis-img"][src*="~1200x0"]',
                'img[src*="motor-mis-img"][src*="~1000x0"]',
                'img[src*="motor-mis-img"][src*="~700x0"]',
                'img[src*="motor-mis-img"][src*="~500x0"]',
                'img[src*="motor-mis-img"]',
                'img'
              ];
              for (const selector of imageSelectors) {
                const imgs = document.querySelectorAll(selector);
                if (imgs.length > 0) {
                  let bestImg = null;
                  let bestResolution = 0;
                  for (const img of imgs) {
                    const url = img.src || img.getAttribute('data-src') || '';
                    if (url) {
                      const resolutionMatch = url.match(/~(\d+)x\d+/);
                      if (resolutionMatch) {
                        const resolution = parseInt(resolutionMatch[1]);
                        if (resolution > bestResolution) {
                          bestResolution = resolution;
                          bestImg = img;
                        }
                      } else if (!bestImg) {
                        bestImg = img;
                      }
                    }
                  }
                  if (bestImg) {
                    return bestImg.src || bestImg.getAttribute('data-src') || '';
                  }
                }
              }
              return '';
            });
            colorBlocksWithImages.push({
              name: color.name,
              colors: color.colors,
              mainImage: mainImage
            });
          } catch (error) {
            colorBlocksWithImages.push({
              name: color.name,
              colors: color.colors,
              mainImage: ''
            });
          }
        }
        await imgPage.close();
        return colorBlocksWithImages;
      } catch (error) {
        console.warn(`⚠️ 获取${type === 'wg' ? '外观' : '内饰'}图片失败:`, error.message);
        await imgPage.close();
        return [];
      }
    }

    // 4. 组装数据结构
    const configsWithImages = [];
    for (const config of configs) {
      if (!config.configId) {
        configsWithImages.push({
          ...config,
          exteriorImages: [],
          interiorImages: [],
          configImage: ''
        });
        continue;
      }
      const exteriorImages = await getTypeImages(config, carId, 'wg');
      const interiorImages = await getTypeImages(config, carId, 'ns');
      configsWithImages.push({
        ...config,
        exteriorImages,
        interiorImages,
        configImage: exteriorImages.length > 0 ? exteriorImages[0].mainImage : ''
      });
    }
    // 5. 输出最终结构
    const result = {
      carName: cleanedCarName,
      configs: configsWithImages
    };
    console.log('最终采集结果:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('调试失败:', e.message);
    try { await page.screenshot({ path: 'debug-sonai-detail-error.png', fullPage: true }); } catch {}
  } finally {
    await browser.close();
  }
})();
