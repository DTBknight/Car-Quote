// 加载管理器模块
export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.mainContent = document.getElementById('mainContent');
    this.loadingText = document.getElementById('loadingText');
    this.loadingProgressBar = document.getElementById('loadingProgressBar');
    this.magicParticles = document.getElementById('magicParticles');
    this.loadingSteps = [
      { text: '正在初始化系统...', progress: 10 },
      { text: '加载车型数据...', progress: 25 },
      { text: '初始化汇率服务...', progress: 40 },
      { text: '设置计算引擎...', progress: 55 },
      { text: '配置用户界面...', progress: 70 },
      { text: '初始化合同管理...', progress: 85 },
      { text: '启动完成！', progress: 100 }
    ];
    this.currentStep = 0;
    this.particles = [];
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
    this.createMagicParticles();
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
          this.cleanupMagicParticles();
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

  // 创建魔法粒子效果
  createMagicParticles() {
    if (!this.magicParticles) return;
    
    // 清除现有粒子
    this.magicParticles.innerHTML = '';
    this.particles = [];
    
    // 创建20个粒子
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'magic-particle';
      
      // 随机位置和延迟
      const left = Math.random() * 100;
      const delay = Math.random() * 4;
      const duration = 3 + Math.random() * 2;
      
      particle.style.left = `${left}%`;
      particle.style.animationDelay = `${delay}s`;
      particle.style.animationDuration = `${duration}s`;
      
      this.magicParticles.appendChild(particle);
      this.particles.push(particle);
    }
  }
  
  // 清理魔法粒子
  cleanupMagicParticles() {
    if (this.magicParticles) {
      this.magicParticles.innerHTML = '';
    }
    this.particles = [];
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
    this.cleanupMagicParticles();
  }
} 