#!/bin/bash

# 单个品牌爬虫执行脚本
# 用法: ./run-single-brand.sh <品牌名>

BRAND_NAME=$1

if [ -z "$BRAND_NAME" ]; then
    echo "❌ 请指定品牌名称"
    echo "用法: ./run-single-brand.sh <品牌名>"
    echo ""
    echo "可用品牌列表："
    find "./brand-crawlers" -name "*-crawler.js" | sed 's|./brand-crawlers/||g' | sed 's|-crawler.js||g' | sort
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAWLER_FILE="$SCRIPT_DIR/brand-crawlers/${BRAND_NAME,,}-crawler.js"

if [ ! -f "$CRAWLER_FILE" ]; then
    echo "❌ 未找到品牌爬虫文件: $CRAWLER_FILE"
    echo ""
    echo "可用品牌列表："
    find "./brand-crawlers" -name "*-crawler.js" | sed 's|./brand-crawlers/||g' | sed 's|-crawler.js||g' | sort
    exit 1
fi

echo "🚗 执行品牌爬虫: $BRAND_NAME"
echo "📁 爬虫文件: $CRAWLER_FILE"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs/single"

LOG_FILE="$SCRIPT_DIR/logs/single/$BRAND_NAME.log"

echo "📝 日志文件: $LOG_FILE"
echo "🚀 开始执行..."

# 执行爬虫
node "$CRAWLER_FILE" 2>&1 | tee "$LOG_FILE"

echo "✅ 执行完成"
