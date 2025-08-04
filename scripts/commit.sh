#!/bin/bash

# Git Commit Helper Script
# 帮助生成标准的commit信息

echo "Git Commit Helper"
echo "=================="

# 选择commit类型
echo "请选择commit类型:"
echo "1) update - 一般更新和修改"
echo "2) fix - 修复bug"
echo "3) feature - 新功能"
echo "4) refactor - 代码重构"
echo "5) docs - 文档更新"
echo "6) style - 代码格式调整"
echo "7) test - 测试相关"
echo "8) chore - 构建过程或辅助工具的变动"

read -p "请输入选项 (1-8): " choice

case $choice in
    1) type="update" ;;
    2) type="fix" ;;
    3) type="feature" ;;
    4) type="refactor" ;;
    5) type="docs" ;;
    6) type="style" ;;
    7) type="test" ;;
    8) type="chore" ;;
    *) echo "无效选项，使用默认类型 'update'"; type="update" ;;
esac

# 输入描述
read -p "请输入commit描述: " description

# 生成commit信息
commit_msg="$type: $description"

echo ""
echo "生成的commit信息: $commit_msg"
echo ""

# 确认是否提交
read -p "确认提交吗？(y/N): " confirm
if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    git commit -m "$commit_msg"
    echo "提交完成！"
else
    echo "取消提交"
fi 