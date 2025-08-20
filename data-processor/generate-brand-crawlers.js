#!/usr/bin/env node

/**
 * 品牌爬虫生成器
 * 为每个品牌生成独立的爬虫脚本文件
 */

const fs = require('fs');
const path = require('path');
const { brandIdsMap } = require('./index-optimized');

class BrandCrawlerGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, 'brand-crawler-template.js');
    this.outputDir = path.join(__dirname, 'brand-crawlers');
    this.ensureOutputDir();
  }

  /**
   * 确保输出目录存在
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 生成所有品牌的独立爬虫
   */
  async generateAllBrandCrawlers() {
    console.log('🏭 开始生成品牌爬虫...');
    
    const brands = Object.entries(brandIdsMap);
    console.log(`📊 共需生成 ${brands.length} 个品牌爬虫`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const [brandName, brandId] of brands) {
      try {
        await this.generateBrandCrawler(brandName, brandId);
        successCount++;
        console.log(`✅ 已生成: ${brandName}`);
      } catch (error) {
        failCount++;
        console.error(`❌ 生成失败: ${brandName} - ${error.message}`);
      }
    }
    
    console.log(`🎉 生成完成！成功: ${successCount}, 失败: ${failCount}`);
    
    // 生成执行脚本
    await this.generateExecutionScripts();
    
    return { successCount, failCount };
  }

  /**
   * 生成单个品牌爬虫
   */
  async generateBrandCrawler(brandName, brandId) {
    const brandIds = Array.isArray(brandId) ? brandId : [brandId];
    
    const crawlerContent = `#!/usr/bin/env node

/**
 * ${brandName} 品牌专属爬虫
 * 自动生成于: ${new Date().toISOString()}
 * 品牌ID: ${brandIds.join(', ')}
 */

const path = require('path');
const BrandCrawler = require('../brand-crawler-template');

class ${brandName.replace(/^(\d)/, 'Brand$1')}Crawler extends BrandCrawler {
  constructor() {
    super('${brandName}', ${JSON.stringify(brandIds)});
    
    // ${brandName} 专属配置
    this.brandSpecificConfig = this.getBrandSpecificConfig();
  }

  /**
   * 获取 ${brandName} 专属配置
   */
  getBrandSpecificConfig() {
    return {
      // 根据 ${brandName} 品牌特点调整的配置
      ${this.getBrandSpecificConfigContent(brandName)}
    };
  }

  /**
   * ${brandName} 专属的前置处理
   */
  async beforeCrawl() {
    console.log('🚗 开始处理 ${brandName} 品牌特定逻辑...');
    
    ${this.getBrandSpecificBeforeLogic(brandName)}
    
    await super.beforeCrawl?.();
  }

  /**
   * ${brandName} 专属的后置处理
   */
  async afterCrawl(result) {
    console.log('✅ 完成 ${brandName} 品牌特定后处理...');
    
    ${this.getBrandSpecificAfterLogic(brandName)}
    
    await super.afterCrawl?.(result);
    return result;
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const crawler = new ${brandName.replace(/^(\d)/, 'Brand$1')}Crawler();
  
  crawler.crawlBrand()
    .then((result) => {
      console.log('🎉 ${brandName} 爬取完成:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 ${brandName} 爬取失败:', error.message);
      process.exit(1);
    });
}

module.exports = ${brandName.replace(/^(\d)/, 'Brand$1')}Crawler;
`;

    // 保存爬虫文件
    const fileName = `${brandName.toLowerCase()}-crawler.js`;
    const filePath = path.join(this.outputDir, fileName);
    fs.writeFileSync(filePath, crawlerContent);
    
    // 设置执行权限
    try {
      fs.chmodSync(filePath, 0o755);
    } catch (e) {
      // 忽略权限设置错误
    }
  }

  /**
   * 获取品牌专属配置内容
   */
  getBrandSpecificConfigContent(brandName) {
    const luxuryBrands = ['Ferrari', 'Lamborghini', 'RollsRoyce', 'Bentley', 'AstonMartin', 'McLaren'];
    const complexBrands = ['BYD', 'Tesla', 'BMW', 'Audi', 'Benz', 'Volkswagen', 'Toyota', 'Honda'];
    const newEnergyBrands = ['Tesla', 'BYD', 'Nio', 'Xpeng', 'LiAuto', 'Aion', 'Neta'];
    
    const configs = [];
    
    if (luxuryBrands.includes(brandName)) {
      configs.push(`
      // 豪华品牌配置
      timeout: 120000, // 2分钟超时
      imageWaitTime: 8000, // 更长的图片等待时间
      pageWaitTime: 10000 // 更长的页面等待时间`);
    }
    
    if (complexBrands.includes(brandName)) {
      configs.push(`
      // 复杂品牌配置
      concurrency: 1, // 单线程处理
      maxRetries: 8, // 更多重试次数
      retryDelay: 5000 // 更长的重试延迟`);
    }
    
    if (newEnergyBrands.includes(brandName)) {
      configs.push(`
      // 新能源品牌配置
      specialHandling: true, // 启用特殊处理
      priceStrategy: 'new_energy' // 新能源价格策略`);
    }
    
    return configs.length > 0 ? configs.join(',') : `
      // 标准配置
      timeout: 60000,
      concurrency: 2`;
  }

  /**
   * 获取品牌专属前置逻辑
   */
  getBrandSpecificBeforeLogic(brandName) {
    const logics = [];
    
    if (brandName === 'Tesla') {
      logics.push(`// Tesla 特殊处理：检查国际化价格`);
    } else if (brandName === 'BYD') {
      logics.push(`// BYD 特殊处理：处理新能源车型分类`);
    } else if (['Ferrari', 'Lamborghini'].includes(brandName)) {
      logics.push(`// 超跑品牌特殊处理：延长等待时间`);
    }
    
    return logics.length > 0 ? logics.join('\n    ') : '// 无特殊前置处理';
  }

  /**
   * 获取品牌专属后置逻辑
   */
  getBrandSpecificAfterLogic(brandName) {
    const logics = [];
    
    if (['BYD', 'Tesla', 'Nio'].includes(brandName)) {
      logics.push(`// 新能源品牌：验证电池信息`);
    } else if (['BMW', 'Audi', 'Benz'].includes(brandName)) {
      logics.push(`// 豪华品牌：验证配置丰富度`);
    }
    
    return logics.length > 0 ? logics.join('\n    ') : '// 无特殊后置处理';
  }

  /**
   * 生成执行脚本
   */
  async generateExecutionScripts() {
    console.log('📝 生成执行脚本...');
    
    // 生成批量执行脚本
    await this.generateBatchScript();
    
    // 生成单个品牌执行脚本
    await this.generateSingleBrandScript();
    
    // 生成品牌列表
    await this.generateBrandList();
    
    // 生成 package.json 脚本配置
    await this.generatePackageScripts();
  }

  /**
   * 生成批量执行脚本
   */
  async generateBatchScript() {
    const batchScript = `#!/bin/bash

# 批量执行品牌爬虫脚本
# 用法: ./run-all-brands.sh [并发数]

CONCURRENT=\${1:-3}  # 默认并发数为3
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
CRAWLER_DIR="\$SCRIPT_DIR/brand-crawlers"

echo "🚀 开始批量执行品牌爬虫，并发数: \$CONCURRENT"
echo "📁 爬虫目录: \$CRAWLER_DIR"

# 创建日志目录
mkdir -p "\$SCRIPT_DIR/logs/batch"

# 获取所有爬虫文件
CRAWLERS=(\$(find "\$CRAWLER_DIR" -name "*-crawler.js" | sort))
TOTAL=\${#CRAWLERS[@]}

echo "📊 找到 \$TOTAL 个品牌爬虫"

# 并发执行
CURRENT=0
PIDS=()

for CRAWLER in "\${CRAWLERS[@]}"; do
    BRAND_NAME=\$(basename "\$CRAWLER" -crawler.js)
    LOG_FILE="\$SCRIPT_DIR/logs/batch/\$BRAND_NAME.log"
    
    echo "🚗 启动品牌爬虫: \$BRAND_NAME (\$((CURRENT + 1))/\$TOTAL)"
    
    # 后台执行
    node "\$CRAWLER" > "\$LOG_FILE" 2>&1 &
    PID=\$!
    PIDS+=(\$PID)
    
    echo "   进程ID: \$PID"
    echo "   日志文件: \$LOG_FILE"
    
    CURRENT=\$((CURRENT + 1))
    
    # 控制并发数
    if [ \${#PIDS[@]} -ge \$CONCURRENT ]; then
        echo "⏳ 等待前一批爬虫完成..."
        wait \${PIDS[0]}
        PIDS=("\${PIDS[@]:1}")  # 移除第一个PID
    fi
done

# 等待剩余进程完成
echo "⏳ 等待所有爬虫完成..."
for PID in "\${PIDS[@]}"; do
    wait \$PID
done

echo "🎉 所有品牌爬虫执行完成！"
`;

    fs.writeFileSync(path.join(__dirname, 'run-all-brands.sh'), batchScript);
    
    try {
      fs.chmodSync(path.join(__dirname, 'run-all-brands.sh'), 0o755);
    } catch (e) {
      // 忽略权限设置错误
    }
  }

  /**
   * 生成单个品牌执行脚本
   */
  async generateSingleBrandScript() {
    const singleScript = `#!/bin/bash

# 单个品牌爬虫执行脚本
# 用法: ./run-single-brand.sh <品牌名>

BRAND_NAME=\$1

if [ -z "\$BRAND_NAME" ]; then
    echo "❌ 请指定品牌名称"
    echo "用法: ./run-single-brand.sh <品牌名>"
    echo ""
    echo "可用品牌列表："
    find "./brand-crawlers" -name "*-crawler.js" | sed 's|./brand-crawlers/||g' | sed 's|-crawler.js||g' | sort
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
CRAWLER_FILE="\$SCRIPT_DIR/brand-crawlers/\${BRAND_NAME,,}-crawler.js"

if [ ! -f "\$CRAWLER_FILE" ]; then
    echo "❌ 未找到品牌爬虫文件: \$CRAWLER_FILE"
    echo ""
    echo "可用品牌列表："
    find "./brand-crawlers" -name "*-crawler.js" | sed 's|./brand-crawlers/||g' | sed 's|-crawler.js||g' | sort
    exit 1
fi

echo "🚗 执行品牌爬虫: \$BRAND_NAME"
echo "📁 爬虫文件: \$CRAWLER_FILE"

# 创建日志目录
mkdir -p "\$SCRIPT_DIR/logs/single"

LOG_FILE="\$SCRIPT_DIR/logs/single/\$BRAND_NAME.log"

echo "📝 日志文件: \$LOG_FILE"
echo "🚀 开始执行..."

# 执行爬虫
node "\$CRAWLER_FILE" 2>&1 | tee "\$LOG_FILE"

echo "✅ 执行完成"
`;

    fs.writeFileSync(path.join(__dirname, 'run-single-brand.sh'), singleScript);
    
    try {
      fs.chmodSync(path.join(__dirname, 'run-single-brand.sh'), 0o755);
    } catch (e) {
      // 忽略权限设置错误
    }
  }

  /**
   * 生成品牌列表
   */
  async generateBrandList() {
    const brands = Object.entries(brandIdsMap).map(([name, id]) => ({
      name,
      id: Array.isArray(id) ? id : [id],
      crawlerFile: `${name.toLowerCase()}-crawler.js`
    }));

    const brandListContent = {
      generatedAt: new Date().toISOString(),
      totalBrands: brands.length,
      brands: brands
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'brand-list.json'),
      JSON.stringify(brandListContent, null, 2)
    );
  }

  /**
   * 生成 package.json 脚本配置
   */
  async generatePackageScripts() {
    const scripts = {
      // 调度器相关
      "scheduler": "node brand-scheduler.js",
      "scheduler:help": "node brand-scheduler.js --help",
      
      // 批量执行
      "crawl:all": "./run-all-brands.sh",
      "crawl:all:concurrent": "./run-all-brands.sh 5",
      
      // 工具脚本
      "generate:crawlers": "node generate-brand-crawlers.js",
      "list:brands": "cat brand-crawlers/brand-list.json | jq '.brands[].name'",
      "status:all": "find logs/brands -name '*.json' | xargs -I {} node -e \"console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('{}', 'utf8')).slice(-1)[0], null, 2))\""
    };

    // 为每个品牌生成单独的脚本
    const brands = Object.keys(brandIdsMap);
    brands.forEach(brand => {
      scripts[`crawl:${brand.toLowerCase()}`] = `./run-single-brand.sh ${brand}`;
    });

    console.log('📝 建议添加到 package.json 的脚本:');
    console.log(JSON.stringify(scripts, null, 2));

    // 保存脚本配置到文件
    fs.writeFileSync(
      path.join(__dirname, 'suggested-package-scripts.json'),
      JSON.stringify(scripts, null, 2)
    );
  }
}

// 如果作为独立脚本运行
if (require.main === module) {
  const generator = new BrandCrawlerGenerator();
  
  generator.generateAllBrandCrawlers()
    .then((result) => {
      console.log('🎉 品牌爬虫生成完成!');
      console.log(`📊 成功: ${result.successCount}, 失败: ${result.failCount}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 生成失败:', error.message);
      process.exit(1);
    });
}

module.exports = BrandCrawlerGenerator;
