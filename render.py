from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import openpyxl
from openpyxl import load_workbook
import os
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
TEMPLATE_PATH = 'api/api/template.xlsx'

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
        
        # 最简单的单元格设置函数 - 直接设置值，不破坏合并单元格
        def simple_set_cell(sheet, cell_ref, value):
            """
            最简单的单元格设置方法，直接设置值，让openpyxl自己处理合并单元格
            """
            try:
                # 直接使用sheet索引设置值，让openpyxl自动处理合并单元格
                sheet[cell_ref] = value
                return True
            except Exception as e:
                logger.error(f"设置单元格 {cell_ref} 失败: {e}")
                return False
        
        # 批量设置单元格的函数
        def batch_set_cells(sheet, cell_mappings):
            """
            批量设置多个单元格
            """
            success_count = 0
            for mapping in cell_mappings:
                if simple_set_cell(sheet, mapping['cell'], mapping['value']):
                    success_count += 1
                    logger.debug(f"成功设置 {mapping['cell']}: {mapping['value']}")
                else:
                    logger.error(f"设置失败: {mapping['cell']}")
            return success_count
        
        # 使用批量设置函数填充Excel单元格到SC sheet
        basic_cell_mappings = [
            {'cell': 'C3', 'value': buyer_name, 'desc': '买方名称 - C3-D3合并单元格'},
            {'cell': 'C4', 'value': buyer_address, 'desc': '买方地址 - C4-D4合并单元格'},
            {'cell': 'C5', 'value': buyer_phone, 'desc': '买方电话 - C5-D5合并单元格'},
            {'cell': 'C6', 'value': seller_name, 'desc': '卖方名称 - C6-D6合并单元格'},
            {'cell': 'C7', 'value': seller_address, 'desc': '卖方地址 - C7-D7合并单元格'},
            {'cell': 'C8', 'value': seller_phone, 'desc': '卖方电话 - C8-D8合并单元格'},
            {'cell': 'G3', 'value': contract_number, 'desc': '合同编号 - G3'},
            {'cell': 'G4', 'value': contract_date, 'desc': '合同日期 - G4'},
            {'cell': 'G5', 'value': contract_location, 'desc': '签署地点 - G5'},
            {'cell': 'E7', 'value': bank_info, 'desc': '开户行信息 - E7-G8合并单元格'}
        ]
        
        # 批量设置基础信息
        success_count = batch_set_cells(sc_sheet, basic_cell_mappings)
        logger.info(f"基础信息设置成功: {success_count}/{len(basic_cell_mappings)}")
        
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
                
                # 只填充货物数据到SC sheet，PI sheet保持原样
                goods_item = goods_data[i]
                # 简单填充货物数据 - 适配前端字段名
                simple_set_cell(sc_sheet, f'B{row_num}', goods_item.get('model', goods_item.get('name', '')))
                simple_set_cell(sc_sheet, f'C{row_num}', goods_item.get('description', goods_item.get('specification', '')))
                simple_set_cell(sc_sheet, f'D{row_num}', goods_item.get('color', ''))  # 颜色字段
                simple_set_cell(sc_sheet, f'E{row_num}', goods_item.get('quantity', ''))
                simple_set_cell(sc_sheet, f'F{row_num}', goods_item.get('unitPrice', ''))
                simple_set_cell(sc_sheet, f'G{row_num}', goods_item.get('totalAmount', goods_item.get('amount', '')))
        
        # 处理运输信息 - 使用批量设置函数
        transport_cell_mappings = []
        
        # D21-E21 - 装运港（合并单元格）
        port_of_loading = data.get('portOfLoading', '')
        if port_of_loading:
            transport_cell_mappings.append({'cell': 'D21', 'value': port_of_loading, 'desc': '装运港'})
        
        # D22-E22 - 目的港（合并单元格）
        final_destination = data.get('finalDestination', '')
        if final_destination:
            transport_cell_mappings.append({'cell': 'D22', 'value': final_destination, 'desc': '目的港'})
        
        # B23-G23 - 金额大写
        amount_in_words = data.get('amountInWords', '')
        if amount_in_words:
            transport_cell_mappings.append({'cell': 'B23', 'value': amount_in_words, 'desc': '金额大写'})
        
        # D24-G24 - 付款条件（合并单元格）
        payment_terms = data.get('paymentTerms', '')
        if payment_terms:
            transport_cell_mappings.append({'cell': 'D24', 'value': payment_terms, 'desc': '付款条件'})
        
        # D25-G25 - 运输路线（合并单元格）
        transport_route = data.get('transportRoute', '')
        if transport_route:
            transport_cell_mappings.append({'cell': 'D25', 'value': transport_route, 'desc': '运输路线'})
        
        # D26-G26 - 运输方式（合并单元格）
        mode_of_shipment = data.get('modeOfShipment', '')
        if mode_of_shipment:
            # 转换运输方式为中文+英文
            shipment_mapping = {
                'SEA': '海运 SEA',
                'LAND': '陆运 LAND',
                'AIR': '空运 AIR'
            }
            shipment_text = shipment_mapping.get(mode_of_shipment.upper(), mode_of_shipment)
            transport_cell_mappings.append({'cell': 'D26', 'value': shipment_text, 'desc': '运输方式'})
        
        # 批量设置运输信息
        if transport_cell_mappings:
            transport_success_count = batch_set_cells(sc_sheet, transport_cell_mappings)
            logger.info(f"运输信息设置成功: {transport_success_count}/{len(transport_cell_mappings)}")
        
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
            
            # 返回文件下载
            return send_file(
                output_path,
                as_attachment=True,
                download_name=output_filename,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        
    except Exception as e:
        logger.error(f"生成合同时发生错误: {str(e)}")
        return jsonify({'error': f'生成合同失败: {str(e)}'}), 500

@app.route('/api/template-info', methods=['GET'])
def get_template_info():
    """获取模板文件信息"""
    try:
        if os.path.exists(TEMPLATE_PATH):
            file_size = os.path.getsize(TEMPLATE_PATH)
            return jsonify({
                'status': 'ok',
                'template_exists': True,
                'file_size': file_size,
                'file_path': TEMPLATE_PATH
            })
        else:
            return jsonify({
                'status': 'error',
                'template_exists': False,
                'message': '模板文件不存在'
            }), 404
    except Exception as e:
        return jsonify({'error': f'获取模板信息失败: {str(e)}'}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 