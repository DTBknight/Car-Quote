#!/usr/bin/env python3
"""
Railway入口文件 - 直接包含Flask应用
"""
import sys
import os
import io

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
TEMPLATE_PATH = 'api/template.xlsx'

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': '合同管理后端服务运行正常',
        'platform': 'Railway'
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
            'platform': 'Railway'
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
        
        # 安全填充单元格的函数
        def safe_set_cell_value(sheet, cell_address, value):
            """安全地设置单元格值，处理合并单元格"""
            try:
                # 检查是否是合并单元格
                for merged_range in sheet.merged_cells.ranges:
                    if cell_address in merged_range:
                        # 如果是合并单元格，设置主单元格的值
                        sheet[merged_range.start_cell.coordinate].value = value
                        return
                
                # 如果不是合并单元格，直接设置
                sheet[cell_address].value = value
            except Exception as e:
                logger.warning(f"设置单元格 {cell_address} 失败: {str(e)}")
                # 尝试直接设置值
                try:
                    sheet[cell_address] = value
                except Exception as e2:
                    logger.error(f"直接设置单元格 {cell_address} 也失败: {str(e2)}")
        
        # 填充SC sheet
        safe_set_cell_value(sc_sheet, 'B3', buyer_name)
        safe_set_cell_value(sc_sheet, 'B4', buyer_phone)
        safe_set_cell_value(sc_sheet, 'B5', buyer_address)
        safe_set_cell_value(sc_sheet, 'D3', seller_name)
        safe_set_cell_value(sc_sheet, 'D4', seller_phone)
        safe_set_cell_value(sc_sheet, 'D5', seller_address)
        safe_set_cell_value(sc_sheet, 'B7', contract_number)
        safe_set_cell_value(sc_sheet, 'D7', contract_date)
        safe_set_cell_value(sc_sheet, 'B9', contract_location)
        safe_set_cell_value(sc_sheet, 'D9', bank_info)
        
        # 填充PI sheet
        safe_set_cell_value(pi_sheet, 'B3', buyer_name)
        safe_set_cell_value(pi_sheet, 'B4', buyer_phone)
        safe_set_cell_value(pi_sheet, 'B5', buyer_address)
        safe_set_cell_value(pi_sheet, 'D3', seller_name)
        safe_set_cell_value(pi_sheet, 'D4', seller_phone)
        safe_set_cell_value(pi_sheet, 'D5', seller_address)
        safe_set_cell_value(pi_sheet, 'B7', contract_number)
        safe_set_cell_value(pi_sheet, 'D7', contract_date)
        safe_set_cell_value(pi_sheet, 'B9', contract_location)
        safe_set_cell_value(pi_sheet, 'D9', bank_info)
        
        # 填充车辆信息
        vehicles = data.get('vehicles', [])
        if vehicles:
            # 填充SC sheet的车辆信息
            for i, vehicle in enumerate(vehicles[:10]):  # 最多10辆车
                row = 12 + i
                if row <= 21:  # SC sheet的车辆信息范围
                    safe_set_cell_value(sc_sheet, f'A{row}', vehicle.get('brand', ''))
                    safe_set_cell_value(sc_sheet, f'B{row}', vehicle.get('model', ''))
                    safe_set_cell_value(sc_sheet, f'C{row}', vehicle.get('year', ''))
                    safe_set_cell_value(sc_sheet, f'D{row}', vehicle.get('vin', ''))
                    safe_set_cell_value(sc_sheet, f'E{row}', vehicle.get('price', ''))
            
            # 填充PI sheet的车辆信息
            for i, vehicle in enumerate(vehicles[:10]):  # 最多10辆车
                row = 12 + i
                if row <= 21:  # PI sheet的车辆信息范围
                    safe_set_cell_value(pi_sheet, f'A{row}', vehicle.get('brand', ''))
                    safe_set_cell_value(pi_sheet, f'B{row}', vehicle.get('model', ''))
                    safe_set_cell_value(pi_sheet, f'C{row}', vehicle.get('year', ''))
                    safe_set_cell_value(pi_sheet, f'D{row}', vehicle.get('vin', ''))
                    safe_set_cell_value(pi_sheet, f'E{row}', vehicle.get('price', ''))
        
        # 计算总价
        total_price = sum(float(vehicle.get('price', 0)) for vehicle in vehicles)
        
        # 填充总价
        safe_set_cell_value(sc_sheet, 'E22', f"${total_price:,.2f}")
        safe_set_cell_value(pi_sheet, 'E22', f"${total_price:,.2f}")
        
        # 保存到临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            workbook.save(tmp_file.name)
            tmp_file_path = tmp_file.name
        
        # 生成文件名
        filename = f"contract_{contract_number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        # 返回文件
        return send_file(
            tmp_file_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        logger.error(f"生成合同时出错: {str(e)}")
        return jsonify({'error': f'生成合同失败: {str(e)}'}), 500

@app.route('/api/template-info', methods=['GET'])
def get_template_info():
    """获取模板信息"""
    return jsonify({
        'template_path': TEMPLATE_PATH,
        'exists': os.path.exists(TEMPLATE_PATH),
        'platform': 'Railway'
    })

@app.route('/', methods=['GET'])
def root():
    """根路径"""
    return jsonify({
        'message': 'Car Quote Backend API',
        'platform': 'Railway',
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'health': '/health',
            'generate_contract': '/api/generate-contract',
            'template_info': '/api/template-info'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 