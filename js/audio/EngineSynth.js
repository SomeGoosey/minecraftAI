export class EngineSynth {
  constructor(audioEngine) {
    this.ae = audioEngine;
    this.osc1 = null;
    this.osc2 = null;
    this.osc3 = null;
    this.gain1 = null;
    this.gain2 = null;
    this.gain3 = null;
    this.filter = null;
    this.connected = false;
    this.currentRPM = 800;
    this.targetRPM = 800;
  }

  start() {
    if (!this.ae.ctx || this.connected) return;

    this.osc1 = this.ae.createOscillator('sawtooth');
    this.osc2 = this.ae.createOscillator('square');
    this.osc3 = this.ae.createOscillator('sine');

    this.gain1 = this.ae.createGain(0.08);
    this.gain2 = this.ae.createGain(0.04);
    this.gain3 = this.ae.createGain(0.02);

    this.filter = this.ae.createFilter('lowpass', 800, 2);

    this.ae.connectChain(this.osc1, this.gain1, this.filter, this.ae.masterGain);
    this.ae.connectChain(this.osc2, this.gain2, this.filter);
    this.ae.connectChain(this.osc3, this.gain3, this.ae.masterGain);

    this.connected = true;
  }

  update(rpm, throttle) {
    if (!this.connected || !this.ae.ctx) return;

    this.targetRPM = rpm;
    this.currentRPM += (this.targetRPM - this.currentRPM) * 0.1;

    const normalizedRPM = (this.currentRPM - 800) / 6000;
    const baseFreq = 55 + normalizedRPM * 400;

    if (this.osc1) this.osc1.frequency.value = baseFreq;
    if (this.osc2) this.osc2.frequency.value = baseFreq * 2;
    if (this.osc3) this.osc3.frequency.value = baseFreq * 3.5;

    const volume = 0.04 + normalizedRPM * 0.12;
    if (this.gain1) this.gain1.gain.value = volume;

    const harmonicVol = 0.02 + normalizedRPM * 0.05;
    if (this.gain2) this.gain2.gain.value = harmonicVol;
    if (this.gain3) this.gain3.gain.value = 0.01 + normalizedRPM * 0.03;

    const cutoff = 400 + normalizedRPM * 2500;
    if (this.filter) this.filter.frequency.value = cutoff;

    const load = throttle > 0 ? 2 + throttle * 3 : 1;
    if (this.filter) this.filter.Q.value = load;
  }

  stop() {
    if (!this.connected) return;
    try {
      if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
      if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
      if (this.osc3) { this.osc3.stop(); this.osc3.disconnect(); }
    } catch (e) {}
    this.connected = false;
  }
}
