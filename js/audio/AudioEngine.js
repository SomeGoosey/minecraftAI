export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext not available:', e.message);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createOscillator(type = 'sawtooth') {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.start();
    return osc;
  }

  createGain(initialValue = 0.1) {
    const g = this.ctx.createGain();
    g.gain.value = initialValue;
    return g;
  }

  createFilter(type = 'lowpass', freq = 1000, Q = 1) {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = Q;
    return f;
  }

  createNoiseBuffer(duration = 1) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  connectChain(...nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
      if (nodes[i] && nodes[i + 1]) {
        nodes[i].connect(nodes[i + 1]);
      }
    }
  }

  dispose() {
    if (this.ctx) {
      this.ctx.close();
    }
  }
}
