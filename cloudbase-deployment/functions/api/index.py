#!/usr/bin/env python3
"""
腾讯云CloudBase云函数 - 简化入口
"""
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'message': 'CloudBase云函数运行正常',
        'service': 'car-quote-api'
    })

@app.route('/api/test', methods=['GET'])
def test_api():
    """测试API接口"""
    return jsonify({
        'message': 'API接口测试成功',
        'platform': 'tencent-cloudbase'
    })

# CloudBase云函数入口
def main_handler(event, context):
    """云函数入口点"""
    try:
        # 解析事件
        if 'httpMethod' in event:
            # HTTP触发器
            return handle_http_request(event, context)
        else:
            # 其他触发器
            return {
                'statusCode': 400,
                'body': json.dumps({'error': '不支持的触发器类型'})
            }
    except Exception as e:
        logger.error(f"云函数执行失败: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'服务器内部错误: {str(e)}'})
        }

def handle_http_request(event, context):
    """处理HTTP请求"""
    try:
        # 构建Flask请求环境
        path = event.get('path', '/')
        http_method = event.get('httpMethod', 'GET')
        headers = event.get('headers', {})
        query_string = event.get('queryString', '')
        body = event.get('body', '')
        
        # 创建Flask请求
        with app.test_request_context(
            path=path,
            method=http_method,
            headers=headers,
            query_string=query_string,
            data=body
        ):
            # 执行Flask应用
            response = app.full_dispatch_request()
            
            # 返回响应
            return {
                'statusCode': response.status_code,
                'headers': dict(response.headers),
                'body': response.get_data(as_text=True)
            }
            
    except Exception as e:
        logger.error(f"处理HTTP请求失败: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'处理请求失败: {str(e)}'})
        }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 