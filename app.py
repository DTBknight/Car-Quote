#!/usr/bin/env python3
"""
Render入口文件 - 直接包含Flask应用
"""
import sys
import os
import io

# 添加render-backend目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'render-backend'))

# 导入必要的模块
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openpyxl
from openpyxl import load_workbook
from datetime import datetime
import logging
import tempfile
import json

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'])

# 配置
TEMPLATE_PATH = 'render-backend/api/api/template.xlsx'

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': '合同管理后端服务运行正常',
        'platform': 'Render'
    })

@app.route('/api/generate-contract', methods=['GET', 'POST', 'OPTIONS'])
def generate_contract():
    """生成合同Excel文件"""
    # 处理OPTIONS请求（CORS预检）
    if request.method == 'OPTIONS':
        return '', 200
    
    # 处理GET请求（健康检查）
    if request.method == 'GET':
        return jsonify({
            'status': 'ok',
            'message': 'Contract API is running',
            'timestamp': datetime.now().isoformat(),
            'platform': 'Render'
        })
    
    # 处理POST请求
    try:
        # 获取请求数据
        data = request.get_json()
        logger.info(f"收到合同数据: {data}")
        
        if not data:
            return jsonify({'error': '未收到数据'}), 400
        
        # 验证必要字段
        if not data.get('buyerName') or not data.get('contractNumber'):
            return jsonify({'error': 'Missing required fields: buyerName, contractNumber'}), 400
        
        # 加载模板文件
        if not os.path.exists(TEMPLATE_PATH):
            return jsonify({'error': '模板文件不存在'}), 404
        
        # 使用openpyxl加载工作簿
        workbook = load_workbook(TEMPLATE_PATH)
        
        # 获取两个sheet
        sc_sheet = workbook['SC']  # SC sheet
        pi_sheet = workbook['PI']  # PI sheet
        
        # 填充基础信息
        buyer_name = data.get('buyerName', '')
        buyer_phone = data.get('buyerPhone', '')
        buyer_address = data.get('buyerAddress', '')
        seller_name = data.get('sellerName', '')
        seller_phone = data.get('sellerPhone', '')
        seller_address = data.get('sellerAddress', '')
        contract_number = data.get('contractNumber', '')
        contract_date_raw = data.get('contractDate', '')
        contract_location = data.get('contractLocation', '')
        bank_info = data.get('bankInfo', '')
        
        # 处理日期格式
        if contract_date_raw:
            try:
                date_obj = datetime.strptime(contract_date_raw, '%Y-%m-%d')
                contract_date = date_obj.strftime('%Y.%m.%d')
            except:
                contract_date = contract_date_raw
        else:
            contract_date = datetime.now().strftime('%Y.%m.%d')
        
        # 填充Excel单元格到两个sheet
        for sheet in [sc_sheet, pi_sheet]:
            try:
                sheet['C3'].value = buyer_name
                sheet['C4'].value = buyer_address
                sheet['C5'].value = buyer_phone
                sheet['C6'].value = seller_name
                sheet['C7'].value = seller_address
                sheet['C8'].value = seller_phone
                sheet['G3'].value = contract_number
                sheet['G4'].value = contract_date
                sheet['G5'].value = contract_location
                sheet['E7'].value = bank_info
            except Exception as e:
                logger.error(f"设置基础信息失败: {e}")
        
        # 处理货物信息
        goods_data = data.get('goodsData', [])
        if goods_data:
            for i, goods in enumerate(goods_data[:10]):  # 最多10行
                current_row = 11 + i
                try:
                    for sheet in [sc_sheet, pi_sheet]:
                        sheet[f'B{current_row}'].value = goods.get('model', '')
                        sheet[f'C{current_row}'].value = goods.get('description', '')
                        sheet[f'D{current_row}'].value = goods.get('color', '')
                        sheet[f'E{current_row}'].value = goods.get('quantity', 0)
                        sheet[f'F{current_row}'].value = goods.get('unitPrice', 0)
                        sheet[f'G{current_row}'].value = goods.get('totalAmount', 0)
                except Exception as e:
                    logger.error(f"设置货物信息失败: {e}")
        
        # 填充其他字段
        for sheet in [sc_sheet, pi_sheet]:
            try:
                if data.get('f22Value'):
                    sheet['F22'].value = data['f22Value']
                if data.get('paymentTerms'):
                    sheet['D24'].value = data['paymentTerms']
                if data.get('totalAmount'):
                    sheet['G21'].value = data['totalAmount']
                if data.get('amountInWords'):
                    sheet['B23'].value = data['amountInWords']
                if data.get('portOfLoading'):
                    sheet['D21'].value = data['portOfLoading']
                if data.get('finalDestination'):
                    sheet['D22'].value = data['finalDestination']
                if data.get('transportRoute'):
                    sheet['D25'].value = data['transportRoute']
                if data.get('modeOfShipment'):
                    sheet['D26'].value = data['modeOfShipment']
            except Exception as e:
                logger.error(f"设置其他字段失败: {e}")
        
        # 生成输出文件名
        if contract_number:
            safe_contract_number = "".join(c for c in contract_number if c.isalnum() or c in ('-', '_'))
            output_filename = f'{safe_contract_number}_Contract.xlsx'
        else:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f'contract_{timestamp}.xlsx'
        
        # 创建临时文件并返回
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            output_path = tmp_file.name
            workbook.save(output_path)
            
            with open(output_path, 'rb') as f:
                file_content = f.read()
            
            os.unlink(output_path)
            
            return send_file(
                io.BytesIO(file_content),
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=output_filename
            )
            
    except Exception as e:
        logger.error(f"生成合同失败: {e}")
        return jsonify({'error': f'生成合同失败: {str(e)}'}), 500

@app.route('/api/template-info', methods=['GET'])
def get_template_info():
    """获取模板信息"""
    return jsonify({
        'status': 'ok',
        'message': 'Template API is running',
        'timestamp': datetime.now().isoformat(),
        'platform': 'Render'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000))) 