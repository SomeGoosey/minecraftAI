import * as THREE from 'three';

const _fogColor = 0xd0e0f0;

export class Engine {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(_fogColor);
    this.scene.fog = new THREE.FogExp2(_fogColor, 0.004);

    this.camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.1, 500
    );
    this.camera.position.set(0, 5, -10);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  applyQuality(preset) {
    this.renderer.shadowMap.enabled = preset.shadows;
    if (preset.shadows) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    this.renderer.toneMapping = preset.toneMapping ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = preset.toneMapping ? 1.2 : 0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (preset.fog) {
      this.scene.fog = new THREE.FogExp2(_fogColor, 0.004);
      this.scene.background = new THREE.Color(_fogColor);
    } else {
      this.scene.fog = null;
      this.scene.background = new THREE.Color(0x87ceeb);
    }
  }

  getDistanceToCamera(pos) {
    const dx = pos.x - this.camera.position.x;
    const dy = pos.y - this.camera.position.y;
    const dz = pos.z - this.camera.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  get width() { return window.innerWidth; }
  get height() { return window.innerHeight; }

  getDelta() {
    return Math.min(this.clock.getDelta(), 0.05);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
