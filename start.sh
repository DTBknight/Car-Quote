#!/bin/bash

# Car-Quote 启动脚本
# 一键启动前后端服务

echo "🚗 启动 Car-Quote 汽车报价系统..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "index.html" ] || [ ! -d "backend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查后端依赖
echo "📦 检查后端依赖..."
cd backend
if [ ! -f "requirements.txt" ]; then
    echo "❌ 错误：未找到 requirements.txt"
    exit 1
fi

# 安装后端依赖
echo "🔧 安装后端依赖..."
pip3 install -r requirements.txt > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  警告：依赖安装可能有问题，但继续启动..."
fi

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  警告：端口 $1 已被占用，尝试停止占用进程..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# 检查并清理端口
check_port 5001
check_port 8000

# 回到根目录
cd ..

# 启动后端服务
echo "🔧 启动后端服务 (端口 5001)..."
cd backend
python3 app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，请检查 backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# 启动前端服务
echo "🌐 启动前端服务 (端口 8000)..."
python3 -m http.server 8000 > frontend.log 2>&1 &
FRONTEND_PID=$!

# 等待前端启动
sleep 2

# 检查前端是否启动成功
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ 前端服务启动成功"
else
    echo "❌ 前端服务启动失败，请检查 frontend.log"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Car-Quote 系统启动完成！"
echo ""
echo "📱 访问地址："
echo "   前端界面：http://localhost:8000"
echo "   后端API：http://localhost:5001"
echo ""
echo "📋 使用说明："
echo "   1. 打开浏览器访问 http://localhost:8000"
echo "   2. 使用'计算器'标签进行汽车报价"
echo "   3. 使用'合同'标签生成贸易合同"
echo ""
echo "🛑 停止服务："
echo "   按 Ctrl+C 停止所有服务"
echo "   或运行：kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 保存进程ID到文件
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; rm -f .backend.pid .frontend.pid; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait 