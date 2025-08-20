#!/bin/bash

# 批量执行品牌爬虫脚本
# 用法: ./run-all-brands.sh [并发数]

CONCURRENT=${1:-3}  # 默认并发数为3
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CRAWLER_DIR="$SCRIPT_DIR/brand-crawlers"

echo "🚀 开始批量执行品牌爬虫，并发数: $CONCURRENT"
echo "📁 爬虫目录: $CRAWLER_DIR"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs/batch"

# 获取所有爬虫文件
CRAWLERS=($(find "$CRAWLER_DIR" -name "*-crawler.js" | sort))
TOTAL=${#CRAWLERS[@]}

echo "📊 找到 $TOTAL 个品牌爬虫"

# 并发执行
CURRENT=0
PIDS=()

for CRAWLER in "${CRAWLERS[@]}"; do
    BRAND_NAME=$(basename "$CRAWLER" -crawler.js)
    LOG_FILE="$SCRIPT_DIR/logs/batch/$BRAND_NAME.log"
    
    echo "🚗 启动品牌爬虫: $BRAND_NAME ($((CURRENT + 1))/$TOTAL)"
    
    # 后台执行
    node "$CRAWLER" > "$LOG_FILE" 2>&1 &
    PID=$!
    PIDS+=($PID)
    
    echo "   进程ID: $PID"
    echo "   日志文件: $LOG_FILE"
    
    CURRENT=$((CURRENT + 1))
    
    # 控制并发数
    if [ ${#PIDS[@]} -ge $CONCURRENT ]; then
        echo "⏳ 等待前一批爬虫完成..."
        wait ${PIDS[0]}
        PIDS=("${PIDS[@]:1}")  # 移除第一个PID
    fi
done

# 等待剩余进程完成
echo "⏳ 等待所有爬虫完成..."
for PID in "${PIDS[@]}"; do
    wait $PID
done

echo "🎉 所有品牌爬虫执行完成！"
