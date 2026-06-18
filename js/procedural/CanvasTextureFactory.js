import * as THREE from 'three';

export class CanvasTextureFactory {
  asphaltTexture(size = 512) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 80 + (Math.random() * 40 | 0);
      d[i] = g - 8; d[i + 1] = g; d[i + 2] = g - 4; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.anisotropy = 2;
    return tex;
  }

  carPaintTexture(color = '#cc2222', size = 256) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(size/2, size/3, 0, size/2, size/2, size/2);
    const col = new THREE.Color(color);
    grad.addColorStop(0, '#' + col.clone().multiplyScalar(1.6).getHexString());
    grad.addColorStop(0.6, '#' + col.getHexString());
    grad.addColorStop(1, '#' + col.clone().multiplyScalar(0.5).getHexString());
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }

  chromeTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#888');
    grad.addColorStop(0.3, '#fff');
    grad.addColorStop(0.6, '#aaa');
    grad.addColorStop(1, '#bbb');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  tireTexture(size = 128) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 5000; i++) {
      const g = 20 + (Math.random() * 30 | 0);
      ctx.fillStyle = `rgb(${g},${g},${g})`;
      ctx.fillRect(Math.random() * size | 0, Math.random() * size | 0, 2, 2);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }
}
