#!/bin/bash

echo "🚀 Netlify Functions 部署脚本"
echo "================================"

# 检查是否安装了Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "❌ 未安装Netlify CLI"
    echo "请先安装: npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI 已安装"

# 检查登录状态
if ! netlify status &> /dev/null; then
    echo "🔐 请先登录Netlify"
    netlify login
fi

echo "✅ 已登录Netlify"

# 创建部署包
echo "📦 准备部署文件..."

# 确保netlify/functions目录存在
mkdir -p netlify/functions

# 检查函数文件是否存在
if [ ! -f "netlify/functions/generate-contract.js" ]; then
    echo "❌ 函数文件不存在: netlify/functions/generate-contract.js"
    exit 1
fi

echo "✅ 函数文件检查完成"

# 检查配置文件
if [ ! -f "netlify.toml" ]; then
    echo "❌ 配置文件不存在: netlify.toml"
    exit 1
fi

echo "✅ 配置文件检查完成"

# 部署到Netlify
echo "🚀 开始部署到Netlify..."

# 如果是新项目，先初始化
if [ ! -f ".netlify/state.json" ]; then
    echo "📋 初始化Netlify项目..."
    netlify init --manual
fi

# 部署
echo "📤 部署中..."
netlify deploy --prod

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 下一步操作："
echo "1. 访问您的Netlify域名"
echo "2. 测试API端点: /api/generate-contract"
echo "3. 检查函数日志: netlify functions:logs"
echo ""
echo "🔧 管理命令："
echo "  查看状态: netlify status"
echo "  查看日志: netlify functions:logs"
echo "  重新部署: netlify deploy --prod" 