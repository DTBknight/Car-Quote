# -*- coding: utf-8 -*-
import json
import os
import tempfile
import base64
from datetime import datetime
import logging
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main_handler(event, context):
    """腾讯云云函数入口点"""
    try:
        # 解析请求
        http_method = event.get('httpMethod', 'GET')
        
        # 处理OPTIONS请求（CORS预检）
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400'
                }
            }
        
        # 处理GET请求（健康检查）
        if http_method == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'ok',
                    'message': 'Contract API is running on Tencent Cloud',
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        # 处理POST请求（合同生成）
        if http_method == 'POST':
            return generate_contract(event)
        
        # 其他方法返回405
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        logger.error(f"函数执行错误: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'服务器内部错误: {str(e)}'})
        }

def generate_contract(event):
    """生成合同文件"""
    try:
        # 解析请求体
        body = event.get('body', '{}')
        if isinstance(body, str):
            data = json.loads(body)
        else:
            data = body
        
        logger.info(f"收到合同数据: {data}")
        
        if not data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': '未收到数据'})
            }
        
        # 这里应该实现Excel生成逻辑
        # 由于云函数环境限制，我们先返回模拟数据
        contract_number = data.get('contractNumber', '')
        buyer_name = data.get('buyerName', '')
        seller_name = data.get('sellerName', '')
        
        # 生成模拟的Excel文件内容（Base64编码）
        excel_content = generate_mock_excel(data)
        
        # 生成文件名
        if contract_number:
            safe_contract_number = "".join(c for c in contract_number if c.isalnum() or c in ('-', '_'))
            output_filename = f'{safe_contract_number}_Contract.xlsx'
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f'contract_{timestamp}.xlsx'
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': f'attachment; filename="{output_filename}"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': excel_content,
            'isBase64Encoded': True
        }
        
    except Exception as e:
        logger.error(f"生成合同时发生错误: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'生成合同失败: {str(e)}'})
        }

def generate_mock_excel(data):
    """生成模拟的Excel文件内容"""
    # 这里应该使用openpyxl生成真实的Excel文件
    # 由于云函数环境限制，我们返回一个简单的CSV格式作为示例
    
    # 创建简单的CSV内容
    csv_content = f"""合同信息
买方名称,{data.get('buyerName', '')}
买方电话,{data.get('buyerPhone', '')}
买方地址,{data.get('buyerAddress', '')}
卖方名称,{data.get('sellerName', '')}
卖方电话,{data.get('sellerPhone', '')}
卖方地址,{data.get('sellerAddress', '')}
合同编号,{data.get('contractNumber', '')}
合同日期,{data.get('contractDate', '')}
签署地点,{data.get('contractLocation', '')}
"""
    
    # 转换为Base64编码
    return base64.b64encode(csv_content.encode('utf-8')).decode('utf-8') 