const pLimit = require('p-limit').default;
const pRetry = require('p-retry').default;
const pTimeout = require('p-timeout');
const cliProgress = require('cli-progress');
const { getSmartDelay, simulateHumanBehavior, smartWait } = require('./anti-detection');
const config = require('./config');

class DataCollector {
  constructor(browserManager) {
    this.browserManager = browserManager;
    this.limit = pLimit(config.crawler.maxConcurrency);
  }

  async collectCarData(brand, brandIds) {
    let allCars = [];
    let brandInfo = null;
    let brandIdUsed = null;

    for (const brandId of brandIds) {
      const browser = await this.browserManager.createBrowser();
      
      try {
        const result = await pRetry(
          () => this.getBrandInfoAndCarIds(browser, brandId),
          { 
            retries: config.crawler.maxRetries,
            onFailedAttempt: error => {
              console.warn(`⚠️ 获取品牌信息失败，重试中... (${error.attemptNumber}/${config.crawler.maxRetries})`);
            }
          }
        );

        if (!brandInfo) {
          brandInfo = result.brandInfo;
          brandInfo.brand = brand;
          brandIdUsed = brandId;
        }

        // 获取品牌logo
        brandInfo.brandImage = await this.getBrandLogo(browser, result.carIds[0]);

        if (result.carIds.length > 0) {
          const cars = await this.collectCarsConcurrently(browser, result.carIds);
          allCars = allCars.concat(cars);
        }
      } catch (error) {
        console.error(`❌ 处理品牌 ${brand} (ID: ${brandId}) 时发生错误:`, error.message);
      } finally {
        await this.browserManager.closeBrowser(browser);
      }
    }

    return { brandInfo, cars: allCars };
  }

  async getBrandInfoAndCarIds(browser, brandId) {
    const page = await this.browserManager.createPage(browser);
    
    try {
      const brandUrl = `https://www.dongchedi.com/auto/library-brand/${brandId}`;
      console.log(`🌐 访问品牌页面: ${brandUrl}`);
      
      await pTimeout(
        page.goto(brandUrl, { waitUntil: 'networkidle2' }),
        config.crawler.timeout
      );
      
      await page.waitForTimeout(getSmartDelay());

      const result = await page.evaluate(() => {
        const brandInfo = {
          brand: '',
          brandImage: ''
        };

        const carIds = Array.from(document.querySelectorAll('a[href*="/auto/series/"]'))
          .map(a => {
            const match = a.href.match(/\/auto\/series\/(\d+)/);
            return match ? match[1] : null;
          })
          .filter(id => id);

        return { brandInfo, carIds: [...new Set(carIds)] };
      });

      return result;
    } finally {
      await page.close();
    }
  }

  async getBrandLogo(browser, carId) {
    if (!carId) return '';
    
    const page = await this.browserManager.createPage(browser);
    
    try {
      const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
      await pTimeout(
        page.goto(urlSeries, { waitUntil: 'networkidle2' }),
        config.crawler.timeout
      );
      
      await page.waitForTimeout(getSmartDelay());

      const brandLogo = await page.evaluate(() => {
        const logoImg = document.querySelector('[class^="header-left_logo"]');
        return logoImg ? logoImg.src : '';
      });

      return brandLogo;
    } catch (error) {
      console.warn(`⚠️ 获取品牌logo失败: ${error.message}`);
      return '';
    } finally {
      await page.close();
    }
  }

  async collectCarsConcurrently(browser, carIds) {
    const uniqueCarIds = [...new Set(carIds)];
    const progressBar = new cliProgress.SingleBar({
      format: '采集进度 |{bar}| {percentage}% | {value}/{total} | 剩余时间: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(uniqueCarIds.length, 0);

    const cars = [];
    const promises = uniqueCarIds.map((carId, index) => 
      this.limit(async () => {
        try {
          const carData = await pRetry(
            () => this.collectSingleCarData(browser, carId),
            { 
              retries: config.crawler.maxRetries,
              onFailedAttempt: error => {
                console.warn(`⚠️ 采集车型 ${carId} 失败，重试中... (${error.attemptNumber}/${config.crawler.maxRetries})`);
              }
            }
          );
          
          if (carData) {
            cars.push(carData);
          }
          
          progressBar.update(index + 1);
          return carData;
        } catch (error) {
          console.error(`❌ 采集车型 ${carId} 最终失败:`, error.message);
          progressBar.update(index + 1);
          return null;
        }
      })
    );

    await Promise.all(promises);
    progressBar.stop();

    return cars;
  }

  async collectSingleCarData(browser, carId) {
    const page = await this.browserManager.createPage(browser);
    
    try {
      // 1. 采集车型基本信息
      const urlSeries = `https://www.dongchedi.com/auto/series/${carId}`;
      await pTimeout(
        page.goto(urlSeries, { waitUntil: 'networkidle2' }),
        config.crawler.timeout
      );
      
      await page.waitForTimeout(getSmartDelay());
      
      // 模拟人类行为
      await simulateHumanBehavior(page);

      const carBasicInfo = await page.evaluate(() => {
        function getByXpath(xpath) {
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          return result.singleNodeValue;
        }
        
        const carNameH1 = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[1]/div[1]/div[1]/h1');
        let carName = carNameH1 ? carNameH1.textContent.trim() : '';
        
        let mainImage = '';
        const mainImg = getByXpath('//*[@id="__next"]/div/div[2]/div[2]/div[2]/div/div/div[2]/img');
        if (mainImg) mainImage = mainImg.src;
        
        let seriesName = '';
        const seriesSpan = document.querySelector('span.tw-leading-50.tw-text-12');
        if (seriesSpan) {
          seriesName = Array.from(seriesSpan.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .filter(Boolean)
            .join('');
        }
        
        return { carName, mainImage, seriesName };
      });

      // 验证数据
      if (!this.validateCarBasicInfo(carBasicInfo)) {
        return null;
      }

      // 2. 采集配置信息
      const urlParams = `https://www.dongchedi.com/auto/params-carIds-x-${carId}`;
      await pTimeout(
        page.goto(urlParams, { waitUntil: 'networkidle2' }),
        config.crawler.timeout
      );
      
      await page.waitForTimeout(getSmartDelay());

      const configs = await page.evaluate(() => {
        const configNames = Array.from(document.querySelectorAll('a[class^="cell_car__"]'))
          .map(a => a.textContent.trim());
        const prices = Array.from(document.querySelectorAll('div[class*="official-price"]'))
          .map(e => e.textContent.trim());
        const sizes = Array.from(document.querySelectorAll('div[data-row-anchor="length_width_height"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        const fuelTypes = Array.from(document.querySelectorAll('div[data-row-anchor="fuel_form"] div[class*="table_col__"]'))
          .slice(1)
          .map(e => e.textContent.trim());
        
        return configNames.map((name, idx) => ({
          configName: name,
          price: prices[idx] || '',
          fuelType: fuelTypes[idx] || '',
          size: sizes[idx] || ''
        }));
      });

      return {
        carName: carBasicInfo.carName,
        mainImage: carBasicInfo.mainImage,
        seriesName: carBasicInfo.seriesName,
        configs
      };
    } catch (error) {
      console.error(`❌ 采集车型 ${carId} 数据失败:`, error.message);
      return null;
    } finally {
      await page.close();
    }
  }

  validateCarBasicInfo(carBasicInfo) {
    if (!carBasicInfo.carName) {
      console.warn('⚠️ 车型名称为空');
      return false;
    }
    
    if (config.validation.requireImages && !carBasicInfo.mainImage) {
      console.warn('⚠️ 车型主图为空');
      return false;
    }
    
    return true;
  }
}

module.exports = DataCollector; 