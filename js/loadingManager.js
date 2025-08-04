// 加载管理器模块
export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.mainContent = document.getElementById('mainContent');
    this.loadingText = document.getElementById('loadingText');
    this.loadingProgressBar = document.getElementById('loadingProgressBar');
    this.techParticles = document.getElementById('techParticles');
    this.loadingSteps = [
      { text: '正在初始化系统...', progress: 12, status: 0 },
      { text: '加载车型数据...', progress: 25, status: 0 },
      { text: '初始化汇率服务...', progress: 38, status: 1 },
      { text: '设置计算引擎...', progress: 50, status: 1 },
      { text: '配置用户界面...', progress: 62, status: 2 },
      { text: '初始化合同管理...', progress: 75, status: 2 },
      { text: '启动完成！', progress: 100, status: 2 }
    ];
    this.currentStep = 0;
    this.particles = [];
  }

  // 开始加载
  startLoading() {
    // 显示加载进度
    this.updateProgress(0, this.loadingSteps[0].text);
    this.createTechParticles();
    this.updateStatusIndicators(0);
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

  // 更新状态指示器
  updateStatusIndicators(activeIndex) {
    const statusItems = document.querySelectorAll('.tech-status-item');
    statusItems.forEach((item, index) => {
      const dot = item.querySelector('.tech-status-dot');
      if (index <= activeIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // 下一步加载
  nextStep() {
    this.currentStep++;
    if (this.currentStep < this.loadingSteps.length) {
      const step = this.loadingSteps[this.currentStep];
      this.updateProgress(step.progress, step.text);
      this.updateStatusIndicators(step.status);
    }
  }

  // 完成加载
  completeLoading() {
    return new Promise((resolve) => {
      // 更新到100%
      this.updateProgress(100, '启动完成！');
      this.updateStatusIndicators(2);
      
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
          this.cleanupTechParticles();
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

  // 创建科技粒子效果
  createTechParticles() {
    if (!this.techParticles) return;
    
    // 清除现有粒子
    this.techParticles.innerHTML = '';
    this.particles = [];
    
    // 创建粒子
    for (let i = 0; i < 30; i++) {
      this.createTechParticle();
    }
  }

  // 创建单个科技粒子
  createTechParticle() {
    const particle = document.createElement('div');
    particle.className = 'tech-particle';
    
    // 随机位置和延迟
    const startX = Math.random() * window.innerWidth;
    const delay = Math.random() * 6;
    
    particle.style.left = `${startX}px`;
    particle.style.animationDelay = `${delay}s`;
    
    this.techParticles.appendChild(particle);
    this.particles.push(particle);
    
    // 粒子动画结束后重新创建
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove();
        this.particles = this.particles.filter(p => p !== particle);
        this.createTechParticle();
      }
    }, 6000 + delay * 1000);
  }

  // 清理科技粒子
  cleanupTechParticles() {
    if (this.techParticles) {
      this.techParticles.innerHTML = '';
    }
    this.particles = [];
  }

  // 重置加载状态
  reset() {
    this.currentStep = 0;
    this.updateProgress(0, this.loadingSteps[0].text);
    this.updateStatusIndicators(0);
    if (this.loadingText) {
      this.loadingText.classList.remove('text-red-500');
    }
    if (this.loadingProgressBar) {
      this.loadingProgressBar.style.backgroundColor = '';
    }
  }
} 