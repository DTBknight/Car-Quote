#!/bin/bash

# Car-Quote 停止脚本
# 停止所有运行的服务

echo "🛑 停止 Car-Quote 服务..."

# 停止后端服务
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "⚠️  强制停止后端服务..."
            kill -9 $BACKEND_PID
        fi
    else
        echo "ℹ️  后端服务未运行"
    fi
    rm -f .backend.pid
else
    echo "ℹ️  未找到后端进程ID文件"
fi

# 停止前端服务
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🌐 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "⚠️  强制停止前端服务..."
            kill -9 $FRONTEND_PID
        fi
    else
        echo "ℹ️  前端服务未运行"
    fi
    rm -f .frontend.pid
else
    echo "ℹ️  未找到前端进程ID文件"
fi

# 清理端口占用
echo "🧹 清理端口占用..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "✅ 所有服务已停止" 