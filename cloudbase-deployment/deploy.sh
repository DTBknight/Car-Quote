#!/bin/bash

# 腾讯云CloudBase部署脚本
echo "🚀 开始部署到腾讯云CloudBase..."

# 检查是否安装了CloudBase CLI
if ! command -v tcb &> /dev/null; then
    echo "❌ 未安装CloudBase CLI，正在安装..."
    npm install -g @cloudbase/cli
fi

# 检查是否已登录
if ! tcb auth list &> /dev/null; then
    echo "🔐 请先登录腾讯云账号..."
    tcb login
fi

# 检查环境ID
if [ -z "$CLOUDBASE_ENV_ID" ]; then
    echo "⚠️  请设置环境ID: export CLOUDBASE_ENV_ID=your-env-id"
    echo "或者修改 cloudbaserc.json 中的 envId 字段"
    exit 1
fi

# 更新环境ID
sed -i.bak "s/car-quote-env/$CLOUDBASE_ENV_ID/g" cloudbaserc.json

echo "📦 开始部署..."

# 部署云函数
echo "🔧 部署云函数..."
tcb fn deploy api --force

# 部署静态网站
echo "🌐 部署静态网站..."
tcb hosting deploy public/ --force

echo "✅ 部署完成！"
echo "🌍 静态网站地址: https://$CLOUDBASE_ENV_ID.service.tcloudbase.com"
echo "🔗 云函数地址: https://$CLOUDBASE_ENV_ID.service.tcloudbase.com/api" 