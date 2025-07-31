// 加载管理器模块
export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.mainContent = document.getElementById('mainContent');
    this.loadingText = document.getElementById('loadingText');
    this.loadingProgressBar = document.getElementById('loadingProgressBar');
    this.loadingSteps = [
      { text: '正在初始化系统...', progress: 10 },
      { text: '加载车型数据...', progress: 30 },
      { text: '初始化汇率服务...', progress: 50 },
      { text: '设置计算引擎...', progress: 70 },
      { text: '配置用户界面...', progress: 90 },
      { text: '启动完成！', progress: 100 }
    ];
    this.currentStep = 0;
  }

  // 开始加载
  startLoading() {
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'flex';
    }
    if (this.mainContent) {
      this.mainContent.style.display = 'none';
    }
    this.updateProgress(0, this.loadingSteps[0].text);
  }

  // 更新加载进度
  updateProgress(progress, text) {
    if (this.loadingProgressBar) {
      this.loadingProgressBar.style.width = `${progress}%`;
    }
    if (this.loadingText) {
      this.loadingText.textContent = text;
    }
  }

  // 下一步加载
  nextStep() {
    this.currentStep++;
    if (this.currentStep < this.loadingSteps.length) {
      const step = this.loadingSteps[this.currentStep];
      this.updateProgress(step.progress, step.text);
    }
  }

  // 完成加载
  completeLoading() {
    return new Promise((resolve) => {
      // 更新到100%
      this.updateProgress(100, '启动完成！');
      
      // 等待一小段时间让用户看到完成状态
      setTimeout(() => {
        // 淡出加载动画
        if (this.loadingScreen) {
          this.loadingScreen.classList.add('loading-fade-out');
        }
        
        // 淡入主内容
        if (this.mainContent) {
          this.mainContent.style.display = 'block';
          this.mainContent.classList.add('loading-fade-in');
        }
        
        // 动画完成后隐藏加载屏幕
        setTimeout(() => {
          if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
            this.loadingScreen.classList.remove('loading-fade-out');
          }
          if (this.mainContent) {
            this.mainContent.classList.remove('loading-fade-in');
          }
          resolve();
        }, 500);
      }, 800);
    });
  }

  // 显示错误状态
  showError(message) {
    if (this.loadingText) {
      this.loadingText.textContent = `加载失败: ${message}`;
      this.loadingText.classList.add('text-red-500');
    }
    if (this.loadingProgressBar) {
      this.loadingProgressBar.style.backgroundColor = '#ef4444';
    }
  }

  // 重置加载状态
  reset() {
    this.currentStep = 0;
    if (this.loadingText) {
      this.loadingText.classList.remove('text-red-500');
    }
    if (this.loadingProgressBar) {
      this.loadingProgressBar.style.backgroundColor = '';
    }
  }
} 