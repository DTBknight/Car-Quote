#!/bin/bash

# 腾讯云云开发部署脚本
echo "🚀 开始部署到腾讯云云开发..."

# 检查是否安装了云开发CLI
if ! command -v tcb &> /dev/null; then
    echo "❌ 请先安装腾讯云云开发CLI: npm i -g @cloudbase/cli"
    exit 1
fi

# 检查是否已登录
if ! tcb auth:list &> /dev/null; then
    echo "🔐 请先登录腾讯云云开发..."
    tcb login
fi

# 获取环境ID
echo "📋 请输入您的云开发环境ID:"
read -p "环境ID: " ENV_ID

if [ -z "$ENV_ID" ]; then
    echo "❌ 环境ID不能为空"
    exit 1
fi

# 更新配置文件
echo "🔧 更新配置文件..."
sed -i '' "s/your-env-id/$ENV_ID/g" cloudbase.json
sed -i '' "s/your-env-id/$ENV_ID/g" js/config-tencent.js

# 1. 部署云函数
echo "📦 部署云函数..."
cd cloudfunctions/generate-contract
tcb fn:deploy generate-contract -e $ENV_ID
cd ../..

# 2. 部署静态网站
echo "🌐 部署静态网站..."
tcb hosting:deploy ./ -e $ENV_ID

echo "✅ 部署完成！"
echo "📋 部署信息："
echo "   - 环境ID: $ENV_ID"
echo "   - 静态网站: https://$ENV_ID.service.tcloudbase.com"
echo "   - 云函数: generate-contract"
echo ""
echo "🔗 访问您的应用: https://$ENV_ID.service.tcloudbase.com" 