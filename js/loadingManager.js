// 加载管理器模块
export class LoadingManager {
  constructor() {
    this.loadingScreen = document.getElementById('loadingScreen');
    this.mainContent = document.getElementById('mainContent');
    this.loadingText = document.getElementById('loadingText');
    this.loadingProgressBar = document.getElementById('loadingProgressBar');
    this.magicParticles = document.getElementById('magicParticles');
    this.loadingSteps = [
      { text: '正在施展魔法...', progress: 12 },
      { text: '召唤车型数据...', progress: 25 },
      { text: '激活汇率服务...', progress: 38 },
      { text: '启动计算引擎...', progress: 50 },
      { text: '构建用户界面...', progress: 62 },
      { text: '初始化合同管理...', progress: 75 },
      { text: '魔法完成！', progress: 100 }
    ];
    this.currentStep = 0;
    this.particles = [];
  }

  // 开始加载
  startLoading() {
    // 显示加载进度
    this.updateProgress(0, this.loadingSteps[0].text);
    this.createMagicParticles();
  }

  // 更新加载进度
  updateProgress(progress, text) {
    if (this.loadingProgressBar) {
      // 更新魔法进度条的填充部分
      const progressFill = this.loadingProgressBar.querySelector('.magic-progress-fill');
      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }
    }
    if (this.loadingText) {
      // 更新魔法文字动画
      const textAnimation = this.loadingText.querySelector('.magic-text-animation');
      if (textAnimation) {
        textAnimation.textContent = text;
      } else {
        this.loadingText.innerHTML = `<span class="magic-text-animation">${text}</span>`;
      }
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
      this.updateProgress(100, '魔法完成！');
      
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
    
    // 创建多个魔法粒子
    for (let i = 0; i < 15; i++) {
      this.createParticle();
    }
    
    // 定期创建新粒子
    this.particleInterval = setInterval(() => {
      if (this.particles.length < 20) {
        this.createParticle();
      }
    }, 500);
  }
  
  // 创建单个粒子
  createParticle() {
    const particle = document.createElement('div');
    particle.className = 'magic-particle';
    
    // 随机位置
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    
    // 随机大小
    const size = Math.random() * 6 + 2;
    
    // 随机颜色
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // 设置样式
    particle.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
      animation: magicParticleFloat 4s ease-in-out infinite;
      animation-delay: ${Math.random() * 2}s;
      filter: blur(0.5px);
      box-shadow: 0 0 10px ${color};
    `;
    
    this.magicParticles.appendChild(particle);
    this.particles.push(particle);
    
    // 粒子消失后移除
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
        this.particles = this.particles.filter(p => p !== particle);
      }
    }, 4000);
  }
  
  // 清理魔法粒子
  cleanupMagicParticles() {
    if (this.particleInterval) {
      clearInterval(this.particleInterval);
      this.particleInterval = null;
    }
    
    if (this.magicParticles) {
      this.magicParticles.innerHTML = '';
    }
    
    this.particles = [];
  }

  // 重置加载状态
  reset() {
    this.currentStep = 0;
    this.cleanupMagicParticles();
    
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'flex';
      this.loadingScreen.classList.remove('loading-fade-out');
    }
    
    if (this.mainContent) {
      this.mainContent.style.display = 'none';
      this.mainContent.classList.remove('loading-fade-in');
    }
  }
} 