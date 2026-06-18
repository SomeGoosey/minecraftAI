import * as THREE from 'three';

export class ShadowManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.light = null;
    this.currentSize = 1024;
  }

  init() {
    this.light = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.light.position.set(60, 80, 40);
    this.light.castShadow = true;
    this.setShadowSize(1024);
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 250;
    this.light.shadow.camera.left = -60;
    this.light.shadow.camera.right = 60;
    this.light.shadow.camera.top = 60;
    this.light.shadow.camera.bottom = -60;
    this.light.shadow.normalBias = 0.02;
    this.light.shadow.bias = -0.0005;
    this.scene.add(this.light);
  }

  setShadowSize(size) {
    this.currentSize = size;
    if (!this.light) return;
    if (size <= 0) {
      this.light.castShadow = false;
      return;
    }
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = size;
    this.light.shadow.mapSize.height = size;
    if (this.light.shadow.map) {
      this.light.shadow.map.dispose();
    }
    this.light.shadow.map = null;
  }

  applyQuality(preset) {
    if (preset.shadows) {
      this.setShadowSize(preset.shadowMapSize);
    } else {
      this.setShadowSize(0);
    }
  }

  update() {
    if (this.light && this.camera) {
      const pos = this.camera.position;
      this.light.position.set(pos.x + 60, 80, pos.z + 40);
      this.light.target.position.copy(pos);
      this.light.target.updateMatrixWorld();
    }
  }

  dispose() {
    if (this.light) this.scene.remove(this.light);
  }
}
