// 合同生成器模块
export class ContractGenerator {
  constructor() {
    this.contractTemplate = null; // 延迟创建模板
    this.currentContractData = {};
  }

  // 获取合同模板
  getContractTemplate() {
    if (this.contractTemplate) {
      return this.contractTemplate;
    }
    
    this.contractTemplate = {
      header: {
        companyName: 'SMAI CO., LTD',
        contractType: '外销合同 / SALES CONTRACT'
      },
      parties: {
        buyer: {
          name: '',
          address: '',
          tel: ''
        },
        seller: {
          name: 'Smai Co., LTD',
          address: '201 A024 2nd Floor Xichen (enter Building 9 Xiyuan North Street Xiyong Street High tech Zone Chongqing',
          tel: '+86 18883144054'
        }
      },
      contractInfo: {
        contractNo: '',
        date: '',
        signedAt: 'Chongqing, China'
      },
      bankInfo: {
        beneficiaryBank: 'CHINA CITIC BANK CHONGQING BRANCH',
        swiftCode: 'CIBKCNBJ400',
        beneficiaryName: 'Smai Co., LTD',
        beneficiaryAccount: '8111214013100727547',
        bankAddress: 'NO. 5, WEST STREET, JIANGBEI CITY, JIANGBEI DISTRICT, CHONGQING'
      },
      goods: [],
      totalAmount: 0,
      paymentTerms: '付全款提车 (100% Payment by T/T)',
      transportation: {
        route: '南沙交车 Nansha Delivery',
        mode: '海运 Sea',
        timeLimit: 'THE FREIGHT FORWARDER INFORMATION IS PROVIDED BY THE BUYER, AND THE LATEST SHIPMENT DATE IS TWO MONTHS AFTER THE COMPLETION OF DELIVERY',
        partialShipment: '允许 ALLOWED',
        transshipment: '允许 ALLOWED'
      }
    };
  }

  // 设置合同数据
  setContractData(data) {
    this.currentContractData = {
      ...this.contractTemplate,
      ...data
    };
  }

  // 从计算器结果生成合同数据
  generateFromCalculator(calculatorResult) {
    console.log('🔄 开始生成合同数据，输入:', calculatorResult);
    
    const contractData = {
      parties: {
        buyer: {
          name: calculatorResult.buyerName || 'ARF GLOBAL TRADING LIMITED',
          address: calculatorResult.buyerAddress || 'RM C 13/F HARVARD COMM BLDG105-111 THOMSON RD WAN CHAI HK',
          tel: calculatorResult.buyerTel || ''
        }
      },
      contractInfo: {
        contractNo: this.generateContractNumber(),
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        signedAt: 'Chongqing, China'
      },
      goods: this.generateGoodsList(calculatorResult),
      totalAmount: calculatorResult.finalQuote || calculatorResult.totalAmount || 0
    };

    console.log('📄 生成的合同数据:', contractData);
    this.setContractData(contractData);
    return contractData;
  }

  // 生成合同编号
  generateContractNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `JIN${year}${month}${day}${random}`;
  }

  // 从计算结果生成货物清单
  generateGoodsList(calculatorResult) {
    const goods = [];
    
    if (calculatorResult.carModel && calculatorResult.finalQuote) {
      goods.push({
        model: calculatorResult.brandName || 'Geely',
        description: calculatorResult.carModel,
        color: calculatorResult.color || 'Grey',
        quantity: calculatorResult.quantity || 1,
        unitPrice: calculatorResult.unitPrice || calculatorResult.finalQuote,
        totalAmount: calculatorResult.finalQuote
      });
    }

    return goods;
  }

  // 生成合同HTML
  generateContractHTML() {
    const data = this.currentContractData;
    const totalAmountText = this.numberToWords(data.totalAmount);

    return `
      <div class="contract-container bg-white p-8 max-w-4xl mx-auto">
        <!-- 合同头部 -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">${data.header.companyName}</h1>
          <h2 class="text-xl font-semibold">${data.header.contractType}</h2>
        </div>

        <!-- 合同双方信息 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div class="border p-4 rounded">
            <h3 class="font-bold mb-2">买方 Buyer:</h3>
            <p><strong>${data.parties.buyer.name}</strong></p>
            <p class="text-sm">地址 Address: ${data.parties.buyer.address}</p>
            <p class="text-sm">电话 Tel: ${data.parties.buyer.tel}</p>
          </div>
          <div class="border p-4 rounded">
            <h3 class="font-bold mb-2">卖方 Seller:</h3>
            <p><strong>${data.parties.seller.name}</strong></p>
            <p class="text-sm">地址 Address: ${data.parties.seller.address}</p>
            <p class="text-sm">电话 Tel: ${data.parties.seller.tel}</p>
          </div>
        </div>

        <!-- 合同基本信息 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <p class="text-sm text-gray-600">合同编号 Contract No.</p>
            <p class="font-semibold">${data.contractInfo.contractNo}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">日期 Date</p>
            <p class="font-semibold">${data.contractInfo.date}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">签署地点 Signed At</p>
            <p class="font-semibold">${data.contractInfo.signedAt}</p>
          </div>
        </div>

        <!-- 银行信息 -->
        <div class="border p-4 rounded mb-8">
          <h3 class="font-bold mb-4">开户行 BANK:</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Beneficiary Bank:</strong> ${data.bankInfo.beneficiaryBank}</p>
              <p><strong>Swift Code:</strong> ${data.bankInfo.swiftCode}</p>
              <p><strong>Beneficiary Name:</strong> ${data.bankInfo.beneficiaryName}</p>
            </div>
            <div>
              <p><strong>Beneficiary Account:</strong> ${data.bankInfo.beneficiaryAccount}</p>
              <p><strong>Bank Address:</strong> ${data.bankInfo.bankAddress}</p>
            </div>
          </div>
        </div>

        <!-- 货物清单 -->
        <div class="mb-8">
          <h3 class="font-bold mb-4">货物清单 Goods Description:</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 p-2 text-sm">型号 Model</th>
                  <th class="border border-gray-300 p-2 text-sm">货物名称及规格 Description & Specification</th>
                  <th class="border border-gray-300 p-2 text-sm">颜色 Color</th>
                  <th class="border border-gray-300 p-2 text-sm">数量 Quantity</th>
                  <th class="border border-gray-300 p-2 text-sm">单价 Unit Price (USD)</th>
                  <th class="border border-gray-300 p-2 text-sm">金额 Total Amount (USD)</th>
                </tr>
              </thead>
              <tbody>
                ${data.goods.map(item => `
                  <tr>
                    <td class="border border-gray-300 p-2 text-sm">${item.model}</td>
                    <td class="border border-gray-300 p-2 text-sm">${item.description}</td>
                    <td class="border border-gray-300 p-2 text-sm">${item.color}</td>
                    <td class="border border-gray-300 p-2 text-sm text-center">${item.quantity}</td>
                    <td class="border border-gray-300 p-2 text-sm text-right">$${item.unitPrice.toLocaleString()}</td>
                    <td class="border border-gray-300 p-2 text-sm text-right">$${item.totalAmount.toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr class="bg-gray-50">
                  <td colspan="5" class="border border-gray-300 p-2 text-sm font-bold text-right">TOTAL:</td>
                  <td class="border border-gray-300 p-2 text-sm font-bold text-right">$${data.totalAmount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-4 font-semibold">TOTAL: SAY US DOLLARS ${totalAmountText} ONLY</p>
        </div>

        <!-- 条款 -->
        <div class="space-y-6">
          <div>
            <h4 class="font-bold mb-2">2. 支付条款 TERMS OF PAYMENT:</h4>
            <p>${data.paymentTerms}</p>
          </div>
          
          <div>
            <h4 class="font-bold mb-2">3. 运输 Transportation:</h4>
            <div class="ml-4 space-y-2">
              <p><strong>3.1 运输路线 TRANSPORT ROUTE:</strong> ${data.transportation.route}</p>
              <p><strong>3.2 运输方式 MODE OF SHIPMENT:</strong> ${data.transportation.mode}</p>
              <p><strong>3.3 装运期限 TIME OF SHIPMENT:</strong> ${data.transportation.timeLimit}</p>
              <p><strong>3.4 分批装运 PARTIAL SHIPMENT:</strong> ${data.transportation.partialShipment}</p>
              <p><strong>3.5 转运 TRANSSHIPMENT:</strong> ${data.transportation.transshipment}</p>
            </div>
          </div>

          <div>
            <h4 class="font-bold mb-2">4. 运输保险 TRANSPORTATION INSURANCE:</h4>
            <p>To be covered by the buyer.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">5. 检验 INSPECTION:</h4>
            <p>产品技术标准及市场特殊要求</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">6. 产品技术标准及市场特殊要求 TECHNICAL STANDARD AND SPECIAL MARKET REQUIREMENTS OF THE PRODUCT:</h4>
            <p>Technical standards and market requirements will be listed in the contract or annex, otherwise Chinese national standards (GB) apply.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">7. 异议索赔 DISCREPANCIES AND CLAIMS:</h4>
            <p><strong>A.</strong> Claims regarding quality, quantity, and weight discrepancies must be filed within 30 days for quality issues and 15 days for quantity/weight issues after arrival at destination port.</p>
            <p><strong>B.</strong> Buyer confirms the commodity conforms to local standards and laws. Seller is not liable for customs clearance failures.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">8. 不可抗力 FORCE MAJEURE:</h4>
            <p>Seller is not liable for delays due to force majeure events but must notify buyer in writing.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">9. 生效 VALIDITY:</h4>
            <p><strong>A.</strong> This contract comes into effect from the signing or stamp date.</p>
            <p><strong>B.</strong> Buyer guarantees unconditional payment and cannot cancel orders due to quality or market problems.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">10. 仲裁 ARBITRATION:</h4>
            <p>All disputes to be settled by friendly negotiation. If unresolved, disputes will be submitted to the China International Economic and Trade Arbitration Commission Southwest Sub-Commission.</p>
          </div>

          <div>
            <h4 class="font-bold mb-2">11. 合同份数及语言 Contract Copies and Language:</h4>
            <p>本合同一式两份,买卖双方各执壹份,合同自签字或盖章之日起生效。中英文本具有同等法律效力。</p>
          </div>
        </div>

        <!-- 签名区域 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <p class="font-bold mb-4">买方签字 Signature of the Buyer:</p>
            <div class="border-b-2 border-gray-400 h-12"></div>
          </div>
          <div>
            <p class="font-bold mb-4">卖方签字 Signature of the Seller:</p>
            <div class="border-b-2 border-gray-400 h-12"></div>
          </div>
        </div>
      </div>
    `;
  }

  // 数字转英文单词
  numberToWords(num) {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

    if (num === 0) return 'ZERO';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    }
    if (num < 1000) {
      return ones[Math.floor(num / 100)] + ' HUNDRED' + (num % 100 ? ' AND ' + this.numberToWords(num % 100) : '');
    }
    if (num < 1000000) {
      return this.numberToWords(Math.floor(num / 1000)) + ' THOUSAND' + (num % 1000 ? ' ' + this.numberToWords(num % 1000) : '');
    }
    if (num < 1000000000) {
      return this.numberToWords(Math.floor(num / 1000000)) + ' MILLION' + (num % 1000000 ? ' ' + this.numberToWords(num % 1000000) : '');
    }
    return 'NUMBER TOO LARGE';
  }

  // 导出PDF
  async exportToPDF() {
    // 这里可以集成PDF生成库，如jsPDF或html2pdf
    console.log('Exporting to PDF...');
    // 实现PDF导出逻辑
  }

  // 打印合同
  printContract() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sales Contract - ${this.currentContractData.contractInfo.contractNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .contract-container { max-width: 800px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${this.generateContractHTML()}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
} 