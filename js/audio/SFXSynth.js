export class SFXSynth {
  constructor(audioEngine) {
    this.ae = audioEngine;
    this.brakeNoiseSource = null;
    this.brakeFilter = null;
    this.brakeGain = null;
    this.crashNoiseBuffer = null;
    this.driftSource = null;
    this.driftFilter = null;
    this.driftGain = null;
  }

  start() {
    if (!this.ae.ctx) return;
    this.crashNoiseBuffer = this.ae.createNoiseBuffer(1);
  }

  playBrakeSqueal(intensity) {
    if (!this.ae.ctx || intensity < 0.3) return;

    const osc = this.ae.createOscillator('sawtooth');
    const gain = this.ae.createGain(0);
    const filter = this.ae.createFilter('bandpass', 2000 + Math.random() * 2000, 8);

    this.ae.connectChain(osc, gain, filter, this.ae.masterGain);
    gain.gain.setValueAtTime(0, this.ae.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06 * intensity, this.ae.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ae.ctx.currentTime + 0.4);
    osc.frequency.value = 2000 + Math.random() * 3000;
    osc.stop(this.ae.ctx.currentTime + 0.4);
  }

  playCrash(force) {
    if (!this.ae.ctx || !this.crashNoiseBuffer) return;

    const source = this.ae.ctx.createBufferSource();
    source.buffer = this.crashNoiseBuffer;
    source.loop = true;

    const gain = this.ae.createGain(0);
    const filter = this.ae.createFilter('lowpass', 5000, 1);

    this.ae.connectChain(source, gain, filter, this.ae.masterGain);
    gain.gain.setValueAtTime(0.25 * force, this.ae.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ae.ctx.currentTime + 0.3);
    filter.frequency.setValueAtTime(5000, this.ae.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.ae.ctx.currentTime + 0.3);
    source.start();
    source.stop(this.ae.ctx.currentTime + 0.3);
  }

  startDriftNoise() {
    if (!this.ae.ctx || this.driftSource) return;

    const buffer = this.ae.createNoiseBuffer(2);
    this.driftSource = this.ae.ctx.createBufferSource();
    this.driftSource.buffer = buffer;
    this.driftSource.loop = true;

    this.driftFilter = this.ae.createFilter('bandpass', 1500, 2);
    this.driftGain = this.ae.createGain(0);

    this.ae.connectChain(this.driftSource, this.driftFilter, this.driftGain, this.ae.masterGain);
    this.driftSource.start();
  }

  updateDriftNoise(driftFactor) {
    if (!this.driftGain || !this.driftSource) return;
    if (driftFactor > 0.1) {
      const targetGain = driftFactor * 0.12;
      this.driftGain.gain.value += (targetGain - this.driftGain.gain.value) * 0.1;
      if (this.driftFilter) {
        this.driftFilter.frequency.value = 1000 + driftFactor * 2000;
      }
    } else if (this.driftGain) {
      this.driftGain.gain.value *= 0.95;
      if (this.driftGain.gain.value < 0.001) {
        this.stopDriftNoise();
      }
    }
  }

  stopDriftNoise() {
    if (this.driftSource) {
      try { this.driftSource.stop(); this.driftSource.disconnect(); } catch (e) {}
      this.driftSource = null;
    }
    this.driftFilter = null;
    this.driftGain = null;
  }

  stop() {
    this.stopDriftNoise();
  }
}
