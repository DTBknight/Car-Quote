import json
from datetime import datetime

def handler(request, context):
    """健康检查API端点"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'message': '合同管理后端服务运行正常',
            'service': 'Vercel Functions'
        })
    } 