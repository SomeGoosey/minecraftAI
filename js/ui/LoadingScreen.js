export class LoadingScreen {
  constructor() {
    this.container = document.getElementById('loading-screen');
    this.bar = document.getElementById('loading-bar');
    this.text = document.getElementById('loading-text');
    this.progress = 0;
  }

  setProgress(value, message) {
    this.progress = Math.min(100, Math.max(0, value));
    if (this.bar) this.bar.style.width = this.progress + '%';
    if (message && this.text) this.text.textContent = message;
  }

  hide() {
    if (this.container) {
      this.container.style.opacity = '0';
      this.container.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        this.container.classList.add('hidden');
        this.container.style.opacity = '1';
      }, 500);
    }
  }

  show() {
    if (this.container) {
      this.container.classList.remove('hidden');
      this.container.style.opacity = '1';
    }
  }
}
