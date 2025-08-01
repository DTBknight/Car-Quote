#!/usr/bin/env python3
import requests
import json

# 测试数据
test_data = {
    "buyerName": "测试买方",
    "buyerPhone": "13800138000",
    "buyerAddress": "北京市朝阳区测试地址",
    "sellerName": "测试卖方",
    "sellerPhone": "13900139000",
    "sellerAddress": "上海市浦东新区测试地址",
    "contractNumber": "CT2025001",
    "contractDate": "2025-01-01",
    "contractLocation": "北京",
    "bankInfo": "中国银行北京分行",
    "goodsData": [
        {
            "name": "测试商品1",
            "specification": "规格1",
            "quantity": "100",
            "unitPrice": "100.00",
            "amount": "10000.00"
        },
        {
            "name": "测试商品2",
            "specification": "规格2",
            "quantity": "50",
            "unitPrice": "200.00",
            "amount": "10000.00"
        }
    ],
    "portOfLoading": "上海港",
    "finalDestination": "纽约港",
    "transportRoute": "上海-纽约"
}

def test_contract_generation():
    url = "https://dbtknight.onrender.com/api/generate-contract"
    
    print("🧪 测试合同生成功能...")
    print(f"📡 请求URL: {url}")
    print(f"📋 测试数据: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data, timeout=30)
        
        print(f"📊 响应状态码: {response.status_code}")
        print(f"📄 响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            # 检查是否是Excel文件
            content_type = response.headers.get('content-type', '')
            if 'spreadsheet' in content_type or 'excel' in content_type:
                print("✅ 成功生成Excel文件！")
                print(f"📁 文件大小: {len(response.content)} 字节")
                
                # 保存文件
                filename = f"test_contract_{test_data['contractNumber']}.xlsx"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"💾 文件已保存为: {filename}")
                return True
            else:
                print("❌ 响应不是Excel文件")
                print(f"📄 响应内容: {response.text[:500]}")
                return False
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"📄 错误信息: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

if __name__ == "__main__":
    success = test_contract_generation()
    if success:
        print("\n🎉 测试成功！合同生成功能正常工作。")
    else:
        print("\n💥 测试失败！请检查错误信息。") 