// 合同管理器
import { ContractGenerator } from './contractGenerator.js';
import { Utils } from './utils.js';

export class ContractManager {
  constructor() {
    this.contractGenerator = new ContractGenerator();
    this.currentContractData = null;
    this.isInitialized = false;
  }

  // 初始化合同管理器
  initialize() {
    if (this.isInitialized) return;
    
    this.createContractInterface();
    this.bindEvents();
    this.isInitialized = true;
  }

  // 创建合同界面
  createContractInterface() {
    const contractContent = document.getElementById('contractContent');
    if (!contractContent) return;

    contractContent.innerHTML = `
      <div class="space-y-8">
        <!-- 合同生成器卡片 -->
        <div class="bg-white rounded-xl shadow-md p-6 md:p-8">
          <h3 class="text-xl font-semibold mb-6 flex items-center">
            <i class="fa-solid fa-file-contract text-primary mr-2"></i>合同生成器
          </h3>
          
          <!-- 买方信息表单 -->
          <div class="mb-8">
            <h4 class="text-lg font-medium mb-4 flex items-center">
              <i class="fa-solid fa-user text-primary mr-2"></i>买方信息
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">买方名称 Buyer Name</label>
                <input type="text" id="buyerName" class="form-input" placeholder="输入买方公司名称">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">联系电话 Tel</label>
                <input type="text" id="buyerTel" class="form-input" placeholder="输入联系电话">
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">地址 Address</label>
                <input type="text" id="buyerAddress" class="form-input" placeholder="输入买方地址">
              </div>
            </div>
          </div>

          <!-- 货物信息 -->
          <div class="mb-8">
            <h4 class="text-lg font-medium mb-4 flex items-center">
              <i class="fa-solid fa-car text-primary mr-2"></i>货物信息
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">车型 Model</label>
                <input type="text" id="contractCarModel" class="form-input" placeholder="输入车型名称" readonly>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">颜色 Color</label>
                <input type="text" id="contractCarColor" class="form-input" placeholder="输入颜色">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">数量 Quantity</label>
                <input type="number" id="contractQuantity" class="form-input" placeholder="输入数量" min="1" value="1">
              </div>
            </div>
          </div>

          <!-- 价格信息 -->
          <div class="mb-8">
            <h4 class="text-lg font-medium mb-4 flex items-center">
              <i class="fa-solid fa-dollar-sign text-primary mr-2"></i>价格信息
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">单价 Unit Price (USD)</label>
                <input type="number" id="contractUnitPrice" class="form-input" placeholder="输入单价" step="0.01">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">总金额 Total Amount (USD)</label>
                <input type="number" id="contractTotalAmount" class="form-input" placeholder="自动计算" readonly>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap gap-4">
            <button 
              type="button" 
              id="generateContractBtn" 
              class="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center"
            >
              <i class="fa-solid fa-magic mr-2"></i>生成合同
            </button>
            <button 
              type="button" 
              id="loadFromCalculatorBtn" 
              class="px-6 py-3 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center"
            >
              <i class="fa-solid fa-calculator mr-2"></i>从计算器加载
            </button>
            <button 
              type="button" 
              id="clearContractBtn" 
              class="px-6 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center"
            >
              <i class="fa-solid fa-eraser mr-2"></i>清空表单
            </button>
          </div>
        </div>

        <!-- 合同预览区域 -->
        <div id="contractPreview" class="hidden">
          <div class="bg-white rounded-xl shadow-md p-6 md:p-8">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold flex items-center">
                <i class="fa-solid fa-eye text-primary mr-2"></i>合同预览
              </h3>
              <div class="flex gap-4">
                <button 
                  type="button" 
                  id="printContractBtn" 
                  class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center"
                >
                  <i class="fa-solid fa-print mr-2"></i>打印
                </button>
                <button 
                  type="button" 
                  id="downloadContractBtn" 
                  class="px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center"
                >
                  <i class="fa-solid fa-download mr-2"></i>下载
                </button>
              </div>
            </div>
            <div id="contractContent" class="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <!-- 合同内容将在这里显示 -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 绑定事件
  bindEvents() {
    // 生成合同按钮
    const generateBtn = document.getElementById('generateContractBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateContract());
    }

    // 从计算器加载按钮
    const loadBtn = document.getElementById('loadFromCalculatorBtn');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => this.loadFromCalculator());
    }

    // 清空表单按钮
    const clearBtn = document.getElementById('clearContractBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearForm());
    }

    // 打印合同按钮
    const printBtn = document.getElementById('printContractBtn');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.printContract());
    }

    // 下载合同按钮
    const downloadBtn = document.getElementById('downloadContractBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadContract());
    }

    // 数量变化时自动计算总金额
    const quantityInput = document.getElementById('contractQuantity');
    const unitPriceInput = document.getElementById('contractUnitPrice');
    const totalAmountInput = document.getElementById('contractTotalAmount');

    if (quantityInput && unitPriceInput && totalAmountInput) {
      const calculateTotal = () => {
        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(unitPriceInput.value) || 0;
        const total = quantity * unitPrice;
        totalAmountInput.value = total.toFixed(2);
      };

      quantityInput.addEventListener('input', calculateTotal);
      unitPriceInput.addEventListener('input', calculateTotal);
    }
  }

  // 生成合同
  generateContract() {
    try {
      // 收集表单数据
      const formData = this.collectFormData();
      
      // 验证数据
      if (!this.validateFormData(formData)) {
        return;
      }

      // 生成合同数据
      const contractData = this.contractGenerator.generateFromCalculator(formData);
      
      // 显示合同预览
      this.showContractPreview(contractData);
      
      // 保存当前合同数据
      this.currentContractData = contractData;
      
      console.log('✅ 合同生成成功');
      
    } catch (error) {
      console.error('❌ 合同生成失败:', error);
      this.showError('合同生成失败，请检查输入数据');
    }
  }

  // 从计算器加载数据
  loadFromCalculator() {
    try {
      // 获取计算器的当前结果
      const calculatorResult = this.getCalculatorResult();
      
      if (!calculatorResult) {
        this.showError('未找到计算器数据，请先进行计算');
        return;
      }

      // 填充表单
      this.fillFormFromCalculator(calculatorResult);
      
      console.log('✅ 从计算器加载数据成功');
      
    } catch (error) {
      console.error('❌ 从计算器加载数据失败:', error);
      this.showError('加载计算器数据失败');
    }
  }

  // 获取计算器结果
  getCalculatorResult() {
    // 这里需要从计算器模块获取当前结果
    // 暂时返回模拟数据
    const resultCard = document.getElementById('resultCard');
    if (resultCard && !resultCard.classList.contains('hidden')) {
      return {
        carModel: document.getElementById('resultCarModel')?.textContent || '',
        finalQuote: parseFloat(document.getElementById('resultFinalQuote')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
        brandName: document.getElementById('resultCarModel')?.textContent?.split(' ')[0] || '',
        quantity: 1,
        unitPrice: parseFloat(document.getElementById('resultFinalQuote')?.textContent?.replace(/[^0-9.]/g, '') || '0')
      };
    }
    return null;
  }

  // 填充表单
  fillFormFromCalculator(calculatorResult) {
    const buyerNameInput = document.getElementById('buyerName');
    const buyerTelInput = document.getElementById('buyerTel');
    const buyerAddressInput = document.getElementById('buyerAddress');
    const carModelInput = document.getElementById('contractCarModel');
    const carColorInput = document.getElementById('contractCarColor');
    const quantityInput = document.getElementById('contractQuantity');
    const unitPriceInput = document.getElementById('contractUnitPrice');
    const totalAmountInput = document.getElementById('contractTotalAmount');

    if (buyerNameInput) buyerNameInput.value = 'ARF GLOBAL TRADING LIMITED';
    if (buyerAddressInput) buyerAddressInput.value = 'RM C 13/F HARVARD COMM BLDG105-111 THOMSON RD WAN CHAI HK';
    if (carModelInput) carModelInput.value = calculatorResult.carModel || '';
    if (carColorInput) carColorInput.value = 'Grey';
    if (quantityInput) quantityInput.value = calculatorResult.quantity || 1;
    if (unitPriceInput) unitPriceInput.value = calculatorResult.unitPrice || calculatorResult.finalQuote || 0;
    if (totalAmountInput) totalAmountInput.value = calculatorResult.finalQuote || 0;
  }

  // 收集表单数据
  collectFormData() {
    return {
      buyerName: document.getElementById('buyerName')?.value || '',
      buyerTel: document.getElementById('buyerTel')?.value || '',
      buyerAddress: document.getElementById('buyerAddress')?.value || '',
      carModel: document.getElementById('contractCarModel')?.value || '',
      color: document.getElementById('contractCarColor')?.value || '',
      quantity: parseInt(document.getElementById('contractQuantity')?.value || '1'),
      unitPrice: parseFloat(document.getElementById('contractUnitPrice')?.value || '0'),
      finalQuote: parseFloat(document.getElementById('contractTotalAmount')?.value || '0'),
      brandName: document.getElementById('contractCarModel')?.value?.split(' ')[0] || ''
    };
  }

  // 验证表单数据
  validateFormData(data) {
    const errors = [];
    
    if (!data.buyerName.trim()) {
      errors.push('请输入买方名称');
    }
    if (!data.carModel.trim()) {
      errors.push('请输入车型信息');
    }
    if (data.quantity <= 0) {
      errors.push('数量必须大于0');
    }
    if (data.unitPrice <= 0) {
      errors.push('单价必须大于0');
    }

    if (errors.length > 0) {
      this.showError(errors.join('\n'));
      return false;
    }
    
    return true;
  }

  // 显示合同预览
  showContractPreview(contractData) {
    const previewDiv = document.getElementById('contractPreview');
    const contentDiv = document.getElementById('contractContent');
    
    if (previewDiv && contentDiv) {
      contentDiv.innerHTML = this.contractGenerator.generateContractHTML();
      previewDiv.classList.remove('hidden');
      
      // 滚动到预览区域
      previewDiv.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 清空表单
  clearForm() {
    const inputs = [
      'buyerName', 'buyerTel', 'buyerAddress', 'contractCarModel', 
      'contractCarColor', 'contractQuantity', 'contractUnitPrice', 'contractTotalAmount'
    ];
    
    inputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.value = '';
      }
    });

    // 重置数量为1
    const quantityInput = document.getElementById('contractQuantity');
    if (quantityInput) {
      quantityInput.value = '1';
    }

    // 隐藏预览
    const previewDiv = document.getElementById('contractPreview');
    if (previewDiv) {
      previewDiv.classList.add('hidden');
    }

    this.currentContractData = null;
  }

  // 打印合同
  printContract() {
    if (this.currentContractData) {
      this.contractGenerator.printContract();
    } else {
      this.showError('请先生成合同');
    }
  }

  // 下载合同
  downloadContract() {
    if (this.currentContractData) {
      // 这里可以实现下载功能
      console.log('下载合同功能待实现');
      this.showError('下载功能正在开发中');
    } else {
      this.showError('请先生成合同');
    }
  }

  // 显示错误信息
  showError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fa-solid fa-exclamation-triangle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  // 获取当前合同数据
  getCurrentContractData() {
    return this.currentContractData;
  }
} 