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
        
        # 安全地填充单元格，避免合并单元格问题
        def safe_set_cell(sheet, cell_ref, value):
            try:
                # 直接使用cell.value属性设置值
                cell = sheet[cell_ref]
                cell.value = value
            except Exception as e:
                logger.error(f"设置单元格 {cell_ref} 失败: {e}")
                # 最后的尝试：直接设置值
                try:
                    sheet[cell_ref] = value
                except Exception as e2:
                    logger.error(f"最终设置单元格失败 {cell_ref}: {e2}")
        
        # 填充Excel单元格到两个sheet
        for sheet in [sc_sheet, pi_sheet]:
            # 买方名称 - C3-D3合并单元格
            safe_set_cell(sheet, 'C3', buyer_name)
            
            # 买方地址 - C4-D4合并单元格
            safe_set_cell(sheet, 'C4', buyer_address)
            
            # 买方电话 - C5-D5合并单元格
            safe_set_cell(sheet, 'C5', buyer_phone)
            
            # 卖方名称 - C6-D6合并单元格
            safe_set_cell(sheet, 'C6', seller_name)
            
            # 卖方地址 - C7-D7合并单元格
            safe_set_cell(sheet, 'C7', seller_address)
            
            # 卖方电话 - C8-D8合并单元格
            safe_set_cell(sheet, 'C8', seller_phone)
            
            # 合同编号 - G3
            safe_set_cell(sheet, 'G3', contract_number)
            
            # 合同日期 - G4
            safe_set_cell(sheet, 'G4', contract_date)
            
            # 签署地点 - G5
            safe_set_cell(sheet, 'G5', contract_location)
            
            # 开户行信息 - E7
            safe_set_cell(sheet, 'E7', bank_info)
        
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
                
                # 填充货物数据到两个sheet
                goods_item = goods_data[i]
                for sheet in [sc_sheet, pi_sheet]:
                    # 安全地填充货物数据
                    safe_set_cell(sheet, f'B{row_num}', goods_item.get('name', ''))
                    safe_set_cell(sheet, f'C{row_num}', goods_item.get('specification', ''))
                    safe_set_cell(sheet, f'D{row_num}', goods_item.get('quantity', ''))
                    safe_set_cell(sheet, f'E{row_num}', goods_item.get('unitPrice', ''))
                    safe_set_cell(sheet, f'F{row_num}', goods_item.get('amount', ''))
        
        # 处理运输信息
        # D21 - 装运港
        port_of_loading = data.get('portOfLoading', '')
        if port_of_loading:
            for sheet in [sc_sheet, pi_sheet]:
                safe_set_cell(sheet, 'D21', port_of_loading)
        
        # D22 - 目的港
        final_destination = data.get('finalDestination', '')
        if final_destination:
            for sheet in [sc_sheet, pi_sheet]:
                safe_set_cell(sheet, 'D22', final_destination)
        
        # D25 - 运输路线
        transport_route = data.get('transportRoute', '')
        if transport_route:
            for sheet in [sc_sheet, pi_sheet]:
                safe_set_cell(sheet, 'D25', transport_route)
        
        # D26 - 运输方式
        mode_of_shipment = data.get('modeOfShipment', '')
        if mode_of_shipment:
            for sheet in [sc_sheet, pi_sheet]:
                safe_set_cell(sheet, 'D26', mode_of_shipment)
        
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