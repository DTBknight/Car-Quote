#!/bin/bash

# 批量修改commit信息的脚本
# 将中文commit信息改为英文update格式

echo "开始批量修改commit信息..."

# 获取所有需要修改的commit
commits=$(git log --oneline --grep="修复\|优化\|统一\|添加\|更新" --format="%H %s")

if [ -z "$commits" ]; then
    echo "没有找到需要修改的commit"
    exit 0
fi

echo "找到以下需要修改的commit:"
echo "$commits"
echo ""

# 创建临时文件来存储新的commit信息
temp_file=$(mktemp)

# 为每个commit生成新的信息
while IFS= read -r line; do
    if [ -n "$line" ]; then
        hash=$(echo "$line" | cut -d' ' -f1)
        old_msg=$(echo "$line" | cut -d' ' -f2-)
        
        # 根据原信息生成新的update信息
        if echo "$old_msg" | grep -q "修复"; then
            new_msg="update: fix UI issues and improve user experience"
        elif echo "$old_msg" | grep -q "优化"; then
            new_msg="update: optimize layout and improve responsive design"
        elif echo "$old_msg" | grep -q "统一"; then
            new_msg="update: standardize UI components and styling"
        elif echo "$old_msg" | grep -q "添加"; then
            new_msg="update: add new features and functionality"
        elif echo "$old_msg" | grep -q "更新"; then
            new_msg="update: update data and configurations"
        else
            new_msg="update: general improvements and bug fixes"
        fi
        
        echo "$hash|$new_msg" >> "$temp_file"
    fi
done <<< "$commits"

echo "准备修改以下commit信息:"
cat "$temp_file"
echo ""

read -p "确认要修改这些commit信息吗？(y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "取消操作"
    rm "$temp_file"
    exit 0
fi

# 执行批量修改
echo "开始执行批量修改..."
while IFS='|' read -r hash new_msg; do
    if [ -n "$hash" ] && [ -n "$new_msg" ]; then
        echo "修改commit: $hash -> $new_msg"
        git filter-branch --msg-filter "
            if [ \"\$GIT_COMMIT\" = \"$hash\" ]; then
                echo \"$new_msg\"
            else
                cat
            fi
        " -- $hash^..$hash > /dev/null 2>&1
    fi
done < "$temp_file"

rm "$temp_file"
echo "批量修改完成！" 