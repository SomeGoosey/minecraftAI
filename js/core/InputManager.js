export class InputManager {
  constructor() {
    this.keys = new Map();
    this.justPressed = new Map();
    this.handlers = [];

    this.onKeyDown = (e) => {
      if (!this.keys.get(e.code)) {
        this.justPressed.set(e.code, true);
      }
      this.keys.set(e.code, true);
      this.notify(e.code, true);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    this.onKeyUp = (e) => {
      this.keys.set(e.code, false);
      this.notify(e.code, false);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  notify(code, pressed) {
    for (const h of this.handlers) h(code, pressed);
  }

  onKey(handler) {
    this.handlers.push(handler);
  }

  isDown(code) {
    return this.keys.get(code) === true;
  }

  wasPressed(code) {
    if (this.justPressed.get(code)) {
      this.justPressed.set(code, false);
      return true;
    }
    return false;
  }

  get throttle() {
    return this.isDown('KeyW') || this.isDown('ArrowUp') ? 1 : 0;
  }

  get brake() {
    return this.isDown('KeyS') || this.isDown('ArrowDown') ? 1 : 0;
  }

  get steer() {
    let s = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) s -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) s += 1;
    return s;
  }

  get handbrake() {
    if (this.isDown('Space')) return true;
    if (this.brake > 0 && this.steer !== 0) return true;
    return false;
  }

  clearJustPressed() {
    this.justPressed.clear();
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
