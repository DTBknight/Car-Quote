import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取data目录下的所有JSON文件
const dataDir = path.join(__dirname, 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'brands.json');

// 生成品牌列表
const brands = files.map(file => {
  const brandName = file.replace('.json', '');
  
  // 读取品牌文件获取品牌信息
  try {
    const brandData = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    return {
      name: brandName,
      file: file,
      brand: brandData.brand || brandName,
      brandImage: brandData.brandImage || ''
    };
  } catch (e) {
    console.error(`读取品牌文件 ${file} 失败:`, e.message);
    return {
      name: brandName,
      file: file,
      brand: brandName,
      brandImage: ''
    };
  }
});

// 写入brands.json文件
const brandsPath = path.join(dataDir, 'brands.json');
fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));

console.log(`✅ brands.json 已生成，包含 ${brands.length} 个品牌`);
console.log(`文件路径: ${brandsPath}`); 