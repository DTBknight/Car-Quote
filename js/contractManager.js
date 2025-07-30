// 合同管理模块
export class ContractManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.showDevelopmentMessage();
  }

  bindEvents() {
    // 分区切换
    document.getElementById('calculatorTab').addEventListener('click', () => this.switchTab('calculator'));
    document.getElementById('contractTab').addEventListener('click', () => this.switchTab('contract'));
  }

  switchTab(tabName) {
    // 更新按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Content`).classList.add('active');
  }

  showDevelopmentMessage() {
    const contractContent = document.getElementById('contractContent');
    if (contractContent) {
      contractContent.innerHTML = `
        <div class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="mb-6">
              <i class="fa-solid fa-tools text-6xl text-gray-400 mb-4"></i>
              <h2 class="text-3xl font-bold text-gray-700 mb-4">正在开发中</h2>
              <p class="text-lg text-gray-600 mb-8">合同管理功能正在紧锣密鼓地开发中，敬请期待！</p>
            </div>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
              <h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                <i class="fa-solid fa-lightbulb text-blue-600 mr-2"></i>
                即将推出的功能
              </h3>
              <ul class="text-left text-blue-700 space-y-2">
                <li class="flex items-center">
                  <i class="fa-solid fa-check text-green-500 mr-2"></i>
                  Excel表格编辑功能
                </li>
                <li class="flex items-center">
                  <i class="fa-solid fa-check text-green-500 mr-2"></i>
                  合同数据管理
                </li>
                <li class="flex items-center">
                  <i class="fa-solid fa-check text-green-500 mr-2"></i>
                  导入导出Excel文件
                </li>
                <li class="flex items-center">
                  <i class="fa-solid fa-check text-green-500 mr-2"></i>
                  自动计算和统计
                </li>
              </ul>
            </div>
            
            <div class="mt-8">
              <button 
                onclick="document.getElementById('calculatorTab').click()"
                class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-custom flex items-center"
              >
                <i class="fa-solid fa-calculator mr-2"></i>
                返回计算器
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }
} 