#!/bin/bash

# 混合部署脚本 - 前端Netlify + 后端Vercel
echo "🚀 开始混合部署..."

# 检查是否安装了必要的工具
if ! command -v vercel &> /dev/null; then
    echo "❌ 请先安装 Vercel CLI: npm i -g vercel"
    exit 1
fi

if ! command -v netlify &> /dev/null; then
    echo "❌ 请先安装 Netlify CLI: npm i -g netlify-cli"
    exit 1
fi

# 1. 部署后端到Vercel
echo "📦 部署后端到Vercel..."
vercel --prod

# 获取最新的Vercel URL
VERCEL_URL=$(vercel ls | grep "● Ready" | head -1 | awk '{print $3}')
if [ -z "$VERCEL_URL" ]; then
    echo "❌ 无法获取Vercel URL，请检查部署状态"
    exit 1
fi

echo "✅ Vercel后端已部署到: $VERCEL_URL"

# 2. 更新配置文件中的Vercel URL
echo "🔧 更新配置文件..."
sed -i '' "s|https://[^/]*\.vercel\.app|$VERCEL_URL|g" js/config.js
sed -i '' "s|https://[^/]*\.vercel\.app|$VERCEL_URL|g" netlify.toml

# 3. 部署前端到Netlify
echo "🌐 部署前端到Netlify..."
netlify deploy --prod

echo "✅ 混合部署完成！"
echo "📋 部署信息："
echo "   - 前端: Netlify"
echo "   - 后端: $VERCEL_URL"
echo "   - 合同功能: $VERCEL_URL/api/generate-contract" 