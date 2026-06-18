import { bus } from './EventBus.js';

const STATES = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

const TRANSITIONS = {
  LOADING: ['MENU'],
  MENU: ['PLAYING'],
  PLAYING: ['PAUSED', 'GAMEOVER'],
  PAUSED: ['PLAYING'],
  GAMEOVER: ['MENU']
};

export class GameState {
  constructor() {
    this.state = STATES.LOADING;
    this.lapCount = 3;
    this.currentLap = 0;
    this.elapsedTime = 0;
    this.raceStarted = false;
  }

  get isPlaying() { return this.state === STATES.PLAYING; }
  get isPaused() { return this.state === STATES.PAUSED; }
  get isMenu() { return this.state === STATES.MENU; }
  get isGameOver() { return this.state === STATES.GAMEOVER; }
  get isLoaded() { return this.state !== STATES.LOADING; }

  transition(newState) {
    const allowed = TRANSITIONS[this.state];
    if (!allowed || !allowed.includes(newState)) {
      console.warn(`Invalid transition: ${this.state} -> ${newState}`);
      return false;
    }
    const prev = this.state;
    this.state = newState;
    bus.emit('state-change', { from: prev, to: newState });
    return true;
  }

  startRace() {
    this.currentLap = 1;
    this.elapsedTime = 0;
    this.raceStarted = true;
    this.transition(STATES.PLAYING);
  }

  completeLap() {
    this.currentLap++;
    bus.emit('lap-complete', { lap: this.currentLap, total: this.lapCount });
    if (this.currentLap > this.lapCount) {
      this.transition(STATES.GAMEOVER);
      bus.emit('race-finish', { time: this.elapsedTime });
    }
  }

  update(dt) {
    if (this.state === STATES.PLAYING) {
      this.elapsedTime += dt;
    }
  }
}
