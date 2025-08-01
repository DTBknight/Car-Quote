#!/usr/bin/env python3
"""
Render入口文件 - 重定向到render-backend目录
"""
import sys
import os

# 添加render-backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'render-backend'))

# 导入render-backend中的app
from render import app

if __name__ == '__main__':
    app.run() 