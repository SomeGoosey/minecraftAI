export class HUD {
  constructor(gameState) {
    this.state = gameState;
    this.container = document.getElementById('hud');
    this.speedEl = document.getElementById('speed-value');
    this.lapCurrent = document.getElementById('lap-current');
    this.lapTotal = document.getElementById('lap-total');
    this.positionEl = document.getElementById('position-value');
    this.timerEl = document.getElementById('timer-value');
    this.rpmBar = document.getElementById('rpm-bar');
    this.lastSpeed = 0;
  }

  show() {
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
  }

  update(car, allCars) {
    if (!this.container || this.container.classList.contains('hidden')) return;

    const speedKmh = Math.round(Math.abs(car.speed) * 1.5);
    this.lastSpeed += (speedKmh - this.lastSpeed) * 0.2;

    if (this.speedEl) {
      this.speedEl.textContent = String(Math.round(this.lastSpeed)).padStart(3, '0');
    }

    if (this.lapCurrent) {
      this.lapCurrent.textContent = Math.min(car.lapCompleted + 1, this.state.lapCount);
    }
    if (this.lapTotal) {
      this.lapTotal.textContent = this.state.lapCount;
    }

    if (this.positionEl) {
      let pos = 1;
      if (allCars) {
        const sorted = [...allCars].sort((a, b) => {
          const la = a.lapCompleted || 0;
          const lb = b.lapCompleted || 0;
          if (la !== lb) return lb - la;
          return (b.progress || 0) - (a.progress || 0);
        });
        pos = sorted.indexOf(car) + 1;
        if (pos <= 0) pos = allCars.length;
      }
      this.positionEl.textContent = pos;
    }

    if (this.timerEl) {
      const t = this.state.elapsedTime;
      const mins = Math.floor(t / 60);
      const secs = Math.floor(t % 60);
      const ms = Math.floor((t % 1) * 10);
      this.timerEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${ms}`;
    }

    if (this.rpmBar) {
      const rpmPercent = (car.rpm - 800) / 6000 * 100;
      this.rpmBar.style.width = Math.min(100, Math.max(0, rpmPercent)) + '%';
    }
  }
}
