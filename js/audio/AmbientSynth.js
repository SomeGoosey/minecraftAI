export class AmbientSynth {
  constructor(audioEngine) {
    this.ae = audioEngine;
    this.windSource = null;
    this.windGain = null;
    this.windFilter = null;
    this.roadSource = null;
    this.roadGain = null;
    this.roadFilter = null;
    this.started = false;
  }

  start() {
    if (!this.ae.ctx || this.started) return;

    const windBuffer = this.ae.createNoiseBuffer(4);
    this.windSource = this.ae.ctx.createBufferSource();
    this.windSource.buffer = windBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ae.createFilter('lowpass', 300, 1);
    this.windGain = this.ae.createGain(0);

    this.ae.connectChain(this.windSource, this.windFilter, this.windGain, this.ae.masterGain);
    this.windSource.start();

    const roadBuffer = this.ae.createNoiseBuffer(2);
    this.roadSource = this.ae.ctx.createBufferSource();
    this.roadSource.buffer = roadBuffer;
    this.roadSource.loop = true;

    this.roadFilter = this.ae.createFilter('bandpass', 600, 1.5);
    this.roadGain = this.ae.createGain(0);

    this.ae.connectChain(this.roadSource, this.roadFilter, this.roadGain, this.ae.masterGain);
    this.roadSource.start();

    this.started = true;
  }

  update(speed, isOnRoad = true) {
    if (!this.started) return;

    const normalizedSpeed = Math.min(speed / 180, 1);

    if (this.windGain) {
      const windVol = 0.01 + normalizedSpeed * 0.05;
      this.windGain.gain.value += (windVol - this.windGain.gain.value) * 0.1;
    }

    if (this.windFilter) {
      this.windFilter.frequency.value = 100 + normalizedSpeed * 500;
    }

    if (this.roadGain) {
      const roadVol = isOnRoad ? (0.01 + normalizedSpeed * 0.04) : 0.005;
      this.roadGain.gain.value += (roadVol - this.roadGain.gain.value) * 0.1;
    }

    if (this.roadFilter) {
      this.roadFilter.frequency.value = 400 + normalizedSpeed * 800;
    }
  }

  stop() {
    if (this.windSource) {
      try { this.windSource.stop(); this.windSource.disconnect(); } catch (e) {}
    }
    if (this.roadSource) {
      try { this.roadSource.stop(); this.roadSource.disconnect(); } catch (e) {}
    }
    this.started = false;
  }
}
