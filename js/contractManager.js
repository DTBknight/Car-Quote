// 合同管理模块
export class ContractManager {
  constructor() {
    // 等待手动调用init()方法
    console.log('📋 合同管理器构造函数执行');
  }

  init() {
    console.log('🔧 合同管理器初始化开始...');
    try {
      this.bindEvents();
      // 不在这里调用showDevelopmentMessage，而是在切换标签时调用
      console.log('✅ 合同管理器初始化完成');
    } catch (error) {
      console.error('❌ 合同管理器初始化失败:', error);
    }
  }

  bindEvents() {
    console.log('🔗 绑定合同管理器事件...');
    try {
      // 分区切换
      const calculatorTab = document.getElementById('calculatorTab');
      const contractTab = document.getElementById('contractTab');
      
      if (calculatorTab) {
        calculatorTab.addEventListener('click', () => this.switchTab('calculator'));
        console.log('✅ 计算器标签事件绑定成功');
      } else {
        console.error('❌ 未找到计算器标签');
      }
      
      if (contractTab) {
        contractTab.addEventListener('click', () => this.switchTab('contract'));
        console.log('✅ 合同标签事件绑定成功');
      } else {
        console.error('❌ 未找到合同标签');
      }
    } catch (error) {
      console.error('❌ 事件绑定失败:', error);
    }
  }

  switchTab(tabName) {
    console.log(`🔄 切换到标签: ${tabName}`);
    try {
      // 确保主内容区域可见
      const mainContent = document.getElementById('mainContent');
      if (mainContent) {
        mainContent.style.display = 'block';
        console.log('✅ 主内容区域已设置为可见');
      }
      
      // 更新按钮状态
      document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
        console.log(`✅ 按钮状态更新成功: ${tabName}`);
      } else {
        console.error(`❌ 未找到按钮: ${tabName}`);
      }

      // 更新内容显示
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
      });
      const activeContent = document.getElementById(`${tabName}Content`);
      if (activeContent) {
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
        console.log(`✅ 内容显示更新成功: ${tabName}`);
        
        // 如果是合同标签，确保内容已生成
        if (tabName === 'contract') {
          this.showDevelopmentMessage();
        }
      } else {
        console.error(`❌ 未找到内容区域: ${tabName}Content`);
      }
    } catch (error) {
      console.error('❌ 标签切换失败:', error);
    }
  }

  showDevelopmentMessage() {
    console.log('🔧 正在初始化合同管理模块...');
    const contractContent = document.getElementById('contractContent');
    console.log('📋 找到合同内容容器:', contractContent);
    console.log('📋 合同内容容器样式:', contractContent ? contractContent.style.display : 'null');
    console.log('📋 合同内容容器类名:', contractContent ? contractContent.className : 'null');
    console.log('📋 合同内容容器父元素:', contractContent ? contractContent.parentElement : 'null');
    
    // 添加内容变化监听器
    if (contractContent) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            console.log('⚠️ 检测到内容变化:', mutation.type);
            console.log('⚠️ 变化后的innerHTML长度:', contractContent.innerHTML.length);
          }
        });
      });
      
      observer.observe(contractContent, {
        childList: true,
        subtree: true
      });
      
      console.log('📋 已添加内容变化监听器');
    }
    if (contractContent) {
      console.log('✅ 开始生成开发中页面...');
      // 确保容器可见
      contractContent.style.display = 'block';
      contractContent.classList.add('active');
      
      // 先测试最简单的内容
      contractContent.innerHTML = '<h1 style="color: red; font-size: 48px;">测试内容</h1>';
      console.log('🎉 简单测试内容设置完成！');
      console.log('📋 设置后的innerHTML:', contractContent.innerHTML);
      console.log('📋 设置后的innerHTML长度:', contractContent.innerHTML.length);
      
      // 等待一秒后再设置完整内容
      setTimeout(() => {
        const htmlContent = '<div class="bg-white rounded-xl shadow-md p-6 md:p-8 mb-8">' +
          '<div class="flex flex-col items-center justify-center py-16 text-center">' +
          '<div class="mb-6">' +
          '<i class="fa-solid fa-tools text-6xl text-gray-400 mb-4"></i>' +
          '<h2 class="text-3xl font-bold text-gray-700 mb-4">正在开发中</h2>' +
          '<p class="text-lg text-gray-600 mb-8">合同管理功能正在紧锣密鼓地开发中，敬请期待！</p>' +
          '</div>' +
          '<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">' +
          '<h3 class="text-lg font-semibold text-blue-800 mb-3 flex items-center">' +
          '<i class="fa-solid fa-lightbulb text-blue-600 mr-2"></i>' +
          '即将推出的功能' +
          '</h3>' +
          '<ul class="text-left text-blue-700 space-y-2">' +
          '<li class="flex items-center"><i class="fa-solid fa-check text-green-500 mr-2"></i>Excel表格编辑功能</li>' +
          '<li class="flex items-center"><i class="fa-solid fa-check text-green-500 mr-2"></i>合同数据管理</li>' +
          '<li class="flex items-center"><i class="fa-solid fa-check text-green-500 mr-2"></i>导入导出Excel文件</li>' +
          '<li class="flex items-center"><i class="fa-solid fa-check text-green-500 mr-2"></i>自动计算和统计</li>' +
          '</ul>' +
          '</div>' +
          '<div class="mt-8">' +
          '<button onclick="document.getElementById(\'calculatorTab\').click()" class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-custom flex items-center">' +
          '<i class="fa-solid fa-calculator mr-2"></i>' +
          '返回计算器' +
          '</button>' +
          '</div>' +
          '</div>' +
          '</div>';
        
        contractContent.innerHTML = htmlContent;
        console.log('🎉 开发中页面生成完成！');
        console.log('📋 设置的内容长度:', htmlContent.length);
        console.log('📋 设置后的innerHTML长度:', contractContent.innerHTML.length);
        console.log('📋 设置后的innerHTML前100字符:', contractContent.innerHTML.substring(0, 100));
      }, 1000);
    } else {
      console.error('❌ 未找到合同内容容器！');
    }
  }
} 