export const QUALITY_PRESETS = [
  {
    name: 'BASIC',
    label: 'Basic',
    shadows: false,
    ssao: false,
    fxaa: false,
    pixelRatio: 1,
    shadowMapSize: 0,
    toneMapping: false,
    fog: false,
    desc: 'No shading, max performance'
  },
  {
    name: 'LOW',
    label: 'Low',
    shadows: true,
    ssao: false,
    fxaa: false,
    pixelRatio: 0.75,
    shadowMapSize: 512,
    toneMapping: false,
    fog: true,
    desc: 'Simple shadows, balanced'
  },
  {
    name: 'MEDIUM',
    label: 'Medium',
    shadows: true,
    ssao: false,
    fxaa: true,
    pixelRatio: 1,
    shadowMapSize: 1024,
    toneMapping: true,
    fog: true,
    desc: 'Shadows + FXAA'
  },
  {
    name: 'HIGH',
    label: 'High',
    shadows: true,
    ssao: true,
    fxaa: true,
    pixelRatio: 1,
    shadowMapSize: 1024,
    toneMapping: true,
    fog: true,
    desc: 'Shadows + SSAO + FXAA'
  },
  {
    name: 'ULTRA',
    label: 'Ultra',
    shadows: true,
    ssao: true,
    fxaa: true,
    pixelRatio: 1.5,
    shadowMapSize: 2048,
    toneMapping: true,
    fog: true,
    desc: 'High-res shadows + SSAO + FXAA'
  }
];

export class GraphicsSettings {
  constructor() {
    this._level = 2;
    this._dirty = false;
  }

  get level() { return this._level; }
  get preset() { return QUALITY_PRESETS[this._level]; }
  get isDirty() { return this._dirty; }

  setLevel(n) {
    this._level = Math.max(0, Math.min(QUALITY_PRESETS.length - 1, n));
    this._dirty = true;
  }

  cycleUp() {
    this.setLevel(this._level + 1);
  }

  cycleDown() {
    this.setLevel(this._level - 1);
  }

  get label() { return this.preset.label; }
  get desc() { return this.preset.desc; }
}
