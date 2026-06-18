import { bus } from '../state/EventBus.js';
import { QUALITY_PRESETS } from '../rendering/GraphicsSettings.js';

export class MenuScreen {
  constructor(gameState, graphics) {
    this.state = gameState;
    this.graphics = graphics;
    this.menuEl = document.getElementById('menu-screen');
    this.pauseEl = document.getElementById('pause-screen');
    this.gameoverEl = document.getElementById('gameover-screen');
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.finalPosition = document.getElementById('final-position');
    this.finalTime = document.getElementById('final-time');
    this.resumeBtn = document.getElementById('resume-btn');
    this.qualityLabel = document.getElementById('quality-label');
    this.qualityDesc = document.getElementById('quality-desc');
    this.qualityPrev = document.getElementById('quality-prev');
    this.qualityNext = document.getElementById('quality-next');
    this.pauseQualityLabel = document.getElementById('pause-quality-label');
    this.pauseQualityPrev = document.getElementById('pause-quality-prev');
    this.pauseQualityNext = document.getElementById('pause-quality-next');
    this.settingsToggle = document.getElementById('settings-toggle');
    this.settingsPanel = document.getElementById('settings-panel');

    this.setupListeners();
  }

  setupListeners() {
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.onStart());
    }
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.onRestart());
    }
    if (this.resumeBtn) {
      this.resumeBtn.addEventListener('click', () => {
        this.state.transition('PLAYING');
      });
    }

    if (this.settingsToggle && this.settingsPanel) {
      this.settingsToggle.addEventListener('click', () => {
        this.settingsPanel.classList.toggle('hidden');
      });
    }

    if (this.qualityPrev) {
      this.qualityPrev.addEventListener('click', () => {
        this.cycleQualityDown();
      });
    }
    if (this.qualityNext) {
      this.qualityNext.addEventListener('click', () => {
        this.cycleQualityUp();
      });
    }

    if (this.pauseQualityPrev) {
      this.pauseQualityPrev.addEventListener('click', () => {
        this.cycleQualityDown();
        this.updatePauseQualityDisplay();
      });
    }
    if (this.pauseQualityNext) {
      this.pauseQualityNext.addEventListener('click', () => {
        this.cycleQualityUp();
        this.updatePauseQualityDisplay();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft') {
        if (this.state.isMenu || this.state.isPaused) {
          e.preventDefault();
          this.cycleQualityDown();
          this.updateQualityDisplay();
          this.updatePauseQualityDisplay();
        }
      }
      if (e.code === 'ArrowRight') {
        if (this.state.isMenu || this.state.isPaused) {
          e.preventDefault();
          this.cycleQualityUp();
          this.updateQualityDisplay();
          this.updatePauseQualityDisplay();
        }
      }
      if (e.code === 'Enter') {
        if (this.state.isMenu) this.onStart();
        else if (this.state.isGameOver) this.onRestart();
      }
      if (e.code === 'Escape') {
        if (this.state.isPlaying) {
          this.state.transition('PAUSED');
        } else if (this.state.isPaused) {
          this.state.transition('PLAYING');
        }
      }
    });

    bus.on('race-finish', (data) => {
      this.showGameOver(data.position || 2, data.time);
    });
  }

  cycleQualityDown() {
    this.graphics.cycleDown();
    this.updateQualityDisplay();
    bus.emit('quality-change', this.graphics.level);
  }

  cycleQualityUp() {
    this.graphics.cycleUp();
    this.updateQualityDisplay();
    bus.emit('quality-change', this.graphics.level);
  }

  onStart() {
    this.hideAll();
    this.state.startRace();
    bus.emit('race-start');
  }

  onRestart() {
    this.hideAll();
    bus.emit('race-restart');
  }

  hideAll() {
    if (this.menuEl) this.menuEl.classList.add('hidden');
    if (this.pauseEl) this.pauseEl.classList.add('hidden');
    if (this.gameoverEl) this.gameoverEl.classList.add('hidden');
  }

  showMenu() {
    this.hideAll();
    this.updateQualityDisplay();
    if (this.menuEl) this.menuEl.classList.remove('hidden');
  }

  showPause() {
    this.hideAll();
    this.updatePauseQualityDisplay();
    if (this.pauseEl) this.pauseEl.classList.remove('hidden');
  }

  showGameOver(position, time) {
    this.hideAll();
    if (this.finalPosition) {
      this.finalPosition.textContent = `Position: #${position}`;
    }
    if (this.finalTime) {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      const ms = Math.floor((time % 1) * 10);
      this.finalTime.textContent = `Time: ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${ms}`;
    }
    if (this.gameoverEl) this.gameoverEl.classList.remove('hidden');
  }

  updateQualityDisplay() {
    if (this.qualityLabel) this.qualityLabel.textContent = this.graphics.label;
    if (this.qualityDesc) this.qualityDesc.textContent = this.graphics.desc;
  }

  updatePauseQualityDisplay() {
    if (this.pauseQualityLabel) this.pauseQualityLabel.textContent = this.graphics.label;
  }
}
