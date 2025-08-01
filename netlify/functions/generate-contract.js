const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // 处理CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  // 处理OPTIONS请求（CORS预检）
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // 处理GET请求（健康检查）
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        message: 'Contract API is running',
        timestamp: new Date().toISOString(),
        platform: 'Netlify Functions'
      })
    };
  }

  // 处理POST请求
  if (event.httpMethod === 'POST') {
    try {
      const data = JSON.parse(event.body);
      
      // 验证必要字段
      if (!data.buyerName || !data.contractNumber) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Missing required fields: buyerName, contractNumber'
          })
        };
      }

      // 模拟合同生成（实际项目中可以调用Python脚本或使用Node.js库）
      const contractData = {
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone || '',
        buyerAddress: data.buyerAddress || '',
        sellerName: data.sellerName || 'Default Seller',
        sellerPhone: data.sellerPhone || '',
        sellerAddress: data.sellerAddress || '',
        contractNumber: data.contractNumber,
        contractDate: data.contractDate || new Date().toISOString().split('T')[0],
        contractLocation: data.contractLocation || 'Default Location',
        bankInfo: data.bankInfo || '',
        goodsData: data.goodsData || []
      };

      // 生成合同文件名
      const safeContractNumber = data.contractNumber.replace(/[^a-zA-Z0-9-_]/g, '');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${safeContractNumber}_Contract_${timestamp}.json`;

      // 返回成功响应
      return {
        statusCode: 200,
        headers: { 
          ...headers, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        },
        body: JSON.stringify({
          status: 'success',
          message: 'Contract data processed successfully',
          contractData: contractData,
          filename: filename,
          generatedAt: new Date().toISOString(),
          note: 'This is a demo response. In production, this would generate an Excel file.'
        })
      };

    } catch (error) {
      console.error('Error processing contract:', error);
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Internal server error',
          message: error.message,
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // 其他方法返回405
  return {
    statusCode: 405,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'OPTIONS']
    })
  };
}; 