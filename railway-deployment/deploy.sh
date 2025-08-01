#!/bin/bash

# Railway部署脚本
echo "🚀 开始部署到Railway..."

# 检查是否安装了Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ 未安装Railway CLI，请先安装："
    echo "   npm install -g @railway/cli"
    echo "   然后运行: railway login"
    exit 1
fi

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo "🔐 请先登录Railway："
    echo "   railway login"
    exit 1
fi

echo "📦 开始部署..."

# 部署后端
echo "🔧 部署后端..."
cd backend
railway up --detach
BACKEND_URL=$(railway domain)
echo "✅ 后端部署完成: $BACKEND_URL"
cd ..

# 部署前端
echo "🌐 部署前端..."
cd frontend
railway up --detach
FRONTEND_URL=$(railway domain)
echo "✅ 前端部署完成: $FRONTEND_URL"
cd ..

echo "🎉 部署完成！"
echo "🌍 后端地址: $BACKEND_URL"
echo "🌍 前端地址: $FRONTEND_URL"
echo "📊 控制台地址: https://railway.app/dashboard" 