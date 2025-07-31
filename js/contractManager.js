// 合同管理器模块
export class ContractManager {
  constructor() {
    console.log('🔧 合同管理器初始化');
  }

  // 初始化合同管理
  init() {
    console.log('🔧 初始化合同管理...');
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    console.log('🔧 绑定合同标签事件...');
    
    const calculatorTab = document.getElementById('calculatorTab');
    const contractTab = document.getElementById('contractTab');
    
    if (calculatorTab) {
      calculatorTab.addEventListener('click', () => this.switchTab('calculator'));
      console.log('✅ calculatorTab 事件已绑定');
    } else {
      console.error('❌ 未找到 calculatorTab');
    }
    
    if (contractTab) {
      contractTab.addEventListener('click', () => this.switchTab('contract'));
      console.log('✅ contractTab 事件已绑定');
    } else {
      console.error('❌ 未找到 contractTab');
    }
  }

  // 切换标签页
  switchTab(tabName) {
    console.log(`🔄 切换到标签: ${tabName}`);
    
    // 隐藏所有主内容区域
    const mainContent = document.getElementById('mainContent');
    const contractMainContent = document.getElementById('contractMainContent');
    
    if (mainContent) {
      mainContent.style.setProperty('display', 'none', 'important');
    }
    if (contractMainContent) {
      contractMainContent.style.setProperty('display', 'none', 'important');
    }
    
    // 显示对应的主内容区域
    if (tabName === 'calculator') {
      if (mainContent) {
        mainContent.style.setProperty('display', 'block', 'important');
        console.log('✅ 计算器主内容区域已设置为可见');
      }
    } else if (tabName === 'contract') {
      if (contractMainContent) {
        contractMainContent.style.setProperty('display', 'block', 'important');
        console.log('✅ 合同主内容区域已设置为可见');
      }
    }
    
    // 更新按钮状态
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      console.log(`✅ 按钮状态已更新: ${tabName}`);
    } else {
      console.error(`❌ 未找到按钮: [data-tab=${tabName}]`);
    }

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabName}Content`);
    if (activeContent) {
      activeContent.classList.add('active');
      console.log(`✅ 内容区已激活: ${tabName}Content`);
      
      // 如果是合同标签，生成内容
      if (tabName === 'contract') {
        this.generateContractContent();
      }
    } else {
      console.error(`❌ 未找到内容区: ${tabName}Content`);
    }
  }

  // 生成合同页面内容
  generateContractContent() {
    console.log('🔧 生成合同页面内容...');
    
    const contractContent = document.getElementById('contractContent');
    if (!contractContent) {
      console.error('❌ 未找到合同内容容器');
      return;
    }
    
    // 合同内容区域现在有独立的容器，不需要强制设置显示
    contractContent.classList.add('active');
    contractContent.style.minHeight = '300px';
    // contractContent.style.border = '2px solid red'; // 调试用，已注释

    // 生成带有扳手动画的开发中页面
    const content = `
      <div class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <div class="mb-8">
            <div class="wrench-animation mb-6">
              <i class="fa-solid fa-wrench text-6xl text-primary animate-bounce"></i>
            </div>
            <h2 class="text-3xl font-bold text-gray-700 mb-4">正在开发中</h2>
            <p class="text-lg text-gray-600 mb-8">合同管理功能正在紧锣密鼓地开发中，敬请期待！</p>
          </div>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mb-8">
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
          <div class="flex gap-4">
            <button 
              onclick="document.getElementById('calculatorTab').click()"
              class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-custom flex items-center"
            >
              <i class="fa-solid fa-calculator mr-2"></i>
              返回计算器
            </button>
            <button 
              class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-custom flex items-center"
              onclick="this.querySelector('i').classList.toggle('fa-spin')"
            >
              <i class="fa-solid fa-wrench mr-2"></i>
              切换动画
            </button>
          </div>
        </div>
      </div>
    `;
    contractContent.innerHTML = content;
    console.log('✅ 合同页面内容生成完成，innerHTML长度:', contractContent.innerHTML.length);
    
    // 额外的调试信息
    console.log('🔍 合同内容区域状态检查:');
    console.log('- display:', contractContent.style.display);
    console.log('- computed display:', window.getComputedStyle(contractContent).display);
    console.log('- classList:', contractContent.classList.toString());
    console.log('- offsetHeight:', contractContent.offsetHeight);
    console.log('- clientHeight:', contractContent.clientHeight);
    console.log('- scrollHeight:', contractContent.scrollHeight);
  }
} 