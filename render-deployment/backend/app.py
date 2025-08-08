#!/usr/bin/env python3
"""
Render入口文件 - 直接包含Flask应用
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
        
        # 安全填充单元格的函数
        def safe_set_cell_value(sheet, cell_address, value):
            """安全地设置单元格值，处理合并单元格，并确保字体不加粗"""
            try:
                # 检查是否是合并单元格
                for merged_range in sheet.merged_cells.ranges:
                    if cell_address in merged_range:
                        # 如果是合并单元格，设置主单元格的值
                        cell = sheet[merged_range.start_cell.coordinate]
                        cell.value = value
                        # 确保字体不加粗（使用copy避免不可变对象错误）
                        if cell.font:
                            from copy import copy
                            new_font = copy(cell.font)
                            new_font.bold = False
                            cell.font = new_font
                        return
                
                # 如果不是合并单元格，直接设置
                cell = sheet[cell_address]
                cell.value = value
                # 确保字体不加粗（使用copy避免不可变对象错误）
                if cell.font:
                    from copy import copy
                    new_font = copy(cell.font)
                    new_font.bold = False
                    cell.font = new_font
            except Exception as e:
                logger.warning(f"设置单元格 {cell_address} 失败: {str(e)}")
                # 尝试直接设置值
                try:
                    cell = sheet[cell_address]
                    cell.value = value
                    if cell.font:
                        from copy import copy
                        new_font = copy(cell.font)
                        new_font.bold = False
                        cell.font = new_font
                except Exception as e2:
                    logger.error(f"直接设置单元格 {cell_address} 也失败: {str(e2)}")
        
        # 填充Excel单元格到SC sheet（不填充PI sheet）
        try:
            safe_set_cell_value(sc_sheet, 'C3', buyer_name)
            safe_set_cell_value(sc_sheet, 'C4', buyer_address)
            safe_set_cell_value(sc_sheet, 'C5', buyer_phone)
            safe_set_cell_value(sc_sheet, 'C6', seller_name)
            safe_set_cell_value(sc_sheet, 'C7', seller_address)
            safe_set_cell_value(sc_sheet, 'C8', seller_phone)
            safe_set_cell_value(sc_sheet, 'G3', contract_number)
            safe_set_cell_value(sc_sheet, 'G4', contract_date)
            safe_set_cell_value(sc_sheet, 'G5', contract_location)
            safe_set_cell_value(sc_sheet, 'E7', bank_info)
        except Exception as e:
            logger.error(f"设置基础信息失败: {e}")
        
        # 处理货物信息
        goods_data = data.get('goodsData', [])
        if goods_data:
            for i, goods in enumerate(goods_data[:10]):  # 最多10行
                current_row = 11 + i
                try:
                    safe_set_cell_value(sc_sheet, f'B{current_row}', goods.get('model', ''))
                    safe_set_cell_value(sc_sheet, f'C{current_row}', goods.get('description', ''))
                    safe_set_cell_value(sc_sheet, f'D{current_row}', goods.get('color', ''))
                    safe_set_cell_value(sc_sheet, f'E{current_row}', goods.get('quantity', 0))
                    safe_set_cell_value(sc_sheet, f'F{current_row}', goods.get('unitPrice', 0))
                    safe_set_cell_value(sc_sheet, f'G{current_row}', goods.get('totalAmount', 0))
                except Exception as e:
                    logger.error(f"设置货物信息失败: {e}")
            
            # 隐藏没有填写的商品栏
            # 如果有1个商品，显示第11行，隐藏第12-20行
            # 如果有2个商品，显示第11-12行，隐藏第13-20行
            # 以此类推
            start_hide_row = 11 + len(goods_data)  # 从第一个未使用的商品行开始隐藏
            for i in range(start_hide_row, 21):  # 隐藏从start_hide_row到第20行
                sc_sheet.row_dimensions[i].hidden = True
                pi_sheet.row_dimensions[i].hidden = True
        else:
            # 如果没有货物数据，隐藏所有商品行（第11-20行）
            for row in range(11, 21):
                sc_sheet.row_dimensions[row].hidden = True
                pi_sheet.row_dimensions[row].hidden = True
        
        # 填充其他字段
        try:
            if data.get('f22Value'):
                safe_set_cell_value(sc_sheet, 'F22', data['f22Value'])
            if data.get('paymentTerms'):
                safe_set_cell_value(sc_sheet, 'D24', data['paymentTerms'])
            if data.get('totalAmount'):
                safe_set_cell_value(sc_sheet, 'G21', data['totalAmount'])
            if data.get('amountInWords'):
                safe_set_cell_value(sc_sheet, 'B23', data['amountInWords'])
            if data.get('portOfLoading'):
                safe_set_cell_value(sc_sheet, 'D21', data['portOfLoading'])
            if data.get('finalDestination'):
                safe_set_cell_value(sc_sheet, 'D22', data['finalDestination'])
            if data.get('transportRoute'):
                # 处理运输路线，避免重复
                transport_route = data['transportRoute']
                if transport_route:
                    # 更智能的去重处理
                    # 先按空格分割
                    parts = transport_route.split()
                    
                    # 重建路线，每个词只出现一次，保持顺序
                    clean_parts = []
                    seen_words = set()
                    for part in parts:
                        if part not in seen_words:
                            clean_parts.append(part)
                            seen_words.add(part)
                    
                    # 进一步处理：如果结果包含多个"交车"或"Delivery"，只保留第一个
                    final_parts = []
                    has_jiaoche = False
                    has_delivery = False
                    
                    for part in clean_parts:
                        if part == '交车' and not has_jiaoche:
                            final_parts.append(part)
                            has_jiaoche = True
                        elif part == 'Delivery' and not has_delivery:
                            final_parts.append(part)
                            has_delivery = True
                        elif part not in ['交车', 'Delivery']:
                            final_parts.append(part)
                    
                    clean_route = ' '.join(final_parts)
                    safe_set_cell_value(sc_sheet, 'D25', clean_route)
            if data.get('modeOfShipment'):
                # 处理运输方式，显示中文+英文
                mode = data['modeOfShipment']
                if mode == 'Land':
                    mode = '陆运 Land'
                elif mode == 'Sea':
                    mode = '海运 Sea'
                elif mode == 'Air':
                    mode = '空运 Air'
                safe_set_cell_value(sc_sheet, 'D26', mode)
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
        logger.error(f"生成合同时出错: {str(e)}")
        return jsonify({'error': f'生成合同失败: {str(e)}'}), 500

@app.route('/api/template-info', methods=['GET'])
def get_template_info():
    """获取模板信息"""
    return jsonify({
        'template_path': TEMPLATE_PATH,
        'exists': os.path.exists(TEMPLATE_PATH),
        'platform': 'Render'
    })

@app.route('/', methods=['GET'])
def root():
    """根路径"""
    return jsonify({
        'message': 'Car Quote Backend API',
        'platform': 'Render',
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