from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openpyxl
from openpyxl import load_workbook
import os
from datetime import datetime
import logging
import tempfile
import json
import base64

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 配置
TEMPLATE_PATH = 'template.xlsx'

def generate_contract_handler(request):
    """Vercel函数处理合同生成"""
    try:
        # 获取请求数据
        data = request.get_json()
        logger.info(f"收到合同数据: {data}")
        
        if not data:
            return jsonify({'error': '未收到数据'}), 400
        
        # 加载模板文件
        if not os.path.exists(TEMPLATE_PATH):
            return jsonify({'error': '模板文件不存在'}), 404
        
        # 使用openpyxl加载工作簿
        workbook = load_workbook(TEMPLATE_PATH)
        
        # 获取两个sheet
        sc_sheet = workbook['SC']  # SC sheet
        pi_sheet = workbook['PI']  # PI sheet
        
        # 填充买方信息
        buyer_name = data.get('buyerName', '')
        buyer_phone = data.get('buyerPhone', '')
        buyer_address = data.get('buyerAddress', '')
        
        # 填充卖方信息
        seller_name = data.get('sellerName', '')
        seller_phone = data.get('sellerPhone', '')
        seller_address = data.get('sellerAddress', '')
        
        # 填充合同信息
        contract_number = data.get('contractNumber', '')
        contract_date_raw = data.get('contractDate', '')
        contract_location = data.get('contractLocation', '')
        
        # 处理日期格式：将 YYYY-MM-DD 转换为 YYYY.MM.DD
        if contract_date_raw:
            try:
                date_obj = datetime.strptime(contract_date_raw, '%Y-%m-%d')
                contract_date = date_obj.strftime('%Y.%m.%d')
            except:
                contract_date = contract_date_raw
        else:
            contract_date = datetime.now().strftime('%Y.%m.%d')
        
        # 填充开户行信息
        bank_info = data.get('bankInfo', '')
        
        # 填充Excel单元格到两个sheet
        for sheet in [sc_sheet, pi_sheet]:
            # 买方名称 - C3-D3合并单元格
            sheet['C3'] = buyer_name
            
            # 买方地址 - C4-D4合并单元格
            sheet['C4'] = buyer_address
            
            # 买方电话 - C5-D5合并单元格
            sheet['C5'] = buyer_phone
            
            # 卖方名称 - C6-D6合并单元格
            sheet['C6'] = seller_name
            
            # 卖方地址 - C7-D7合并单元格
            sheet['C7'] = seller_address
            
            # 卖方电话 - C8-D8合并单元格
            sheet['C8'] = seller_phone
            
            # 合同编号 - G3
            sheet['G3'] = contract_number
            
            # 合同日期 - G4
            sheet['G4'] = contract_date
            
            # 签署地点 - G5
            sheet['G5'] = contract_location
            
            # 开户行信息 - E7
            sheet['E7'] = bank_info
        
        # 处理货物信息
        goods_data = data.get('goodsData', [])
        logger.info(f"收到的货物数据: {goods_data}")
        if goods_data:
            # 先处理行的显示/隐藏逻辑
            goods_count = len(goods_data)
            
            # 默认隐藏所有货物行（第11-20行）在两个sheet中
            for row_num in range(11, 21):
                sc_sheet.row_dimensions[row_num].hidden = True
                pi_sheet.row_dimensions[row_num].hidden = True
            
            # 根据实际货物行数显示对应的行在两个sheet中
            for i in range(min(goods_count, 10)):  # 最多支持10行货物
                row_num = 11 + i
                sc_sheet.row_dimensions[row_num].hidden = False
                pi_sheet.row_dimensions[row_num].hidden = False
            
            # 填充货物信息到对应的行在两个sheet中
            for i, goods in enumerate(goods_data):
                if i >= 10:  # 最多支持10行货物
                    break
                    
                current_row = 11 + i
                
                # 在SC sheet中填充货物信息
                sc_sheet[f'B{current_row}'] = goods.get('model', '')  # 型号
                sc_sheet[f'C{current_row}'] = goods.get('description', '')  # 货物名称及规格
                sc_sheet[f'D{current_row}'] = goods.get('color', '')  # 颜色
                sc_sheet[f'E{current_row}'] = goods.get('quantity', 0)  # 数量
                sc_sheet[f'F{current_row}'] = goods.get('unitPrice', 0)  # 单价
                sc_sheet[f'G{current_row}'] = goods.get('totalAmount', 0)  # 金额
                
                # 在PI sheet中填充货物信息
                pi_sheet[f'B{current_row}'] = goods.get('model', '')  # 型号
                pi_sheet[f'C{current_row}'] = goods.get('description', '')  # 货物名称及规格
                pi_sheet[f'D{current_row}'] = goods.get('color', '')  # 颜色
                pi_sheet[f'E{current_row}'] = goods.get('quantity', 0)  # 数量
                pi_sheet[f'F{current_row}'] = goods.get('unitPrice', 0)  # 单价
                pi_sheet[f'G{current_row}'] = goods.get('totalAmount', 0)  # 金额
        
        # 填充其他字段到两个sheet
        for sheet in [sc_sheet, pi_sheet]:
            # F22 - 出口类型
            f22_value = data.get('f22Value', '')
            if f22_value:
                sheet['F22'] = f22_value
            
            # D24 - 支付条款
            payment_terms = data.get('paymentTerms', '')
            if payment_terms:
                sheet['D24'] = payment_terms
            
            # G21 - 总价
            total_amount = data.get('totalAmount', 0)
            if total_amount:
                sheet['G21'] = total_amount
            
            # B23 - 大写金额
            amount_in_words = data.get('amountInWords', '')
            if amount_in_words:
                sheet['B23'] = amount_in_words
            
            # D21 - 起运港
            port_of_loading = data.get('portOfLoading', '')
            if port_of_loading:
                sheet['D21'] = port_of_loading
            
            # D22 - 目的国
            final_destination = data.get('finalDestination', '')
            if final_destination:
                sheet['D22'] = final_destination
            
            # D25 - 运输路线
            transport_route = data.get('transportRoute', '')
            if transport_route:
                sheet['D25'] = transport_route
            
            # D26 - 运输方式
            mode_of_shipment = data.get('modeOfShipment', '')
            if mode_of_shipment:
                sheet['D26'] = mode_of_shipment
        
        # 生成输出文件名 - 使用合同编号
        if contract_number:
            # 清理合同编号中的特殊字符，确保文件名安全
            safe_contract_number = "".join(c for c in contract_number if c.isalnum() or c in ('-', '_'))
            output_filename = f'{safe_contract_number}_Contract.xlsx'
        else:
            # 如果没有合同编号，使用时间戳作为备用
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f'contract_{timestamp}.xlsx'
        
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            output_path = tmp_file.name
            workbook.save(output_path)
            logger.info(f"合同文件已生成: {output_path}")
            
            # 读取文件内容
            with open(output_path, 'rb') as f:
                file_content = f.read()
            
            # 删除临时文件
            os.unlink(output_path)
            
            # 返回文件下载
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': f'attachment; filename="{output_filename}"',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': base64.b64encode(file_content).decode('utf-8'),
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

# Vercel函数入口点
def handler(request, context):
    """Vercel函数入口点"""
    # 处理OPTIONS请求（CORS预检）
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        }
    
    # 处理POST请求
    if request.method == 'POST':
        return generate_contract_handler(request)
    
    # 处理GET请求（健康检查）
    if request.method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'status': 'ok', 'message': 'Contract API is running'})
        }
    
    # 其他方法返回405
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'})
    } 