#!/usr/bin/env python3
"""
Railway测试应用
"""
from flask import Flask, jsonify
from datetime import datetime
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Railway测试应用运行正常',
        'platform': 'Railway'
    })

@app.route('/', methods=['GET'])
def root():
    """根路径"""
    return jsonify({
        'message': 'Car Quote Backend API - Railway',
        'platform': 'Railway',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'health': '/health'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 