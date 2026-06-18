import * as THREE from 'three';

const _trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.9 });
const _leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a1e, roughness: 0.8 });
const _rockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });
const _pillarMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.5 });
const _bannerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });

const _trunkDummyGeo = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 4);
const _leafDummyGeo = new THREE.SphereGeometry(1.0, 5, 5);
const _rockDummyGeo = new THREE.DodecahedronGeometry(0.5, 0);

export class EnvironmentBuilder {
  constructor(scene) {
    this.scene = scene;
    this.envGroup = new THREE.Group();
  }

  build() {
    this.buildSkyDome();
    this.buildGround();
    this.buildTrees();
    this.buildRocks();
    this.buildStartFinish();
    this.buildAmbientLights();
    return this.envGroup;
  }

  buildSkyDome() {
    const skyGeo = new THREE.SphereGeometry(500, 24, 24);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0f1a3a) },
        midColor: { value: new THREE.Color(0x2a5a8c) },
        bottomColor: { value: new THREE.Color(0xb0d4f1) },
        offset: { value: 20 },
        exponent: { value: 0.4 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.4, max(h, 0.0)));
          col = mix(col, topColor, smoothstep(0.4, 1.0, max(h, 0.0)));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.matrixAutoUpdate = false;
    this.envGroup.add(sky);
  }

  buildGround() {
    const segs = 80;
    const size = 600;
    const groundGeo = new THREE.PlaneGeometry(size, size, segs, segs);
    const pos = groundGeo.attributes.position.array;

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i + 2];
      pos[i + 1] = this.getTerrainHeight(x, z);
    }
    groundGeo.computeVertexNormals();
    groundGeo.computeBoundingSphere();
    groundGeo.computeBoundingBox();

    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(256, 256);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random();
      if (n < 0.4) {
        d[i] = 25 + (Math.random() * 20 | 0);
        d[i+1] = 55 + (Math.random() * 25 | 0);
        d[i+2] = 18 + (Math.random() * 15 | 0);
      } else if (n < 0.7) {
        d[i] = 35 + (Math.random() * 20 | 0);
        d[i+1] = 65 + (Math.random() * 20 | 0);
        d[i+2] = 22 + (Math.random() * 15 | 0);
      } else if (n < 0.85) {
        d[i] = 50 + (Math.random() * 20 | 0);
        d[i+1] = 80 + (Math.random() * 15 | 0);
        d[i+2] = 30 + (Math.random() * 15 | 0);
      } else {
        d[i] = 70 + (Math.random() * 20 | 0);
        d[i+1] = 60 + (Math.random() * 20 | 0);
        d[i+2] = 35 + (Math.random() * 15 | 0);
      }
      d[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 500; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.anisotropy = 2;

    const grassMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.envGroup.add(ground);
  }

  getTerrainHeight(x, z) {
    const h1 = Math.sin(x * 0.003) * Math.cos(z * 0.004) * 3;
    const h2 = Math.sin(x * 0.008 + z * 0.006) * 1.5;
    const h3 = Math.cos(x * 0.012) * Math.sin(z * 0.015) * 1.0;
    const h4 = Math.sin(x * 0.02 + z * 0.025) * 0.5;
    return h1 + h2 + h3 + h4 - 1.5;
  }

  buildTrees() {
    const trunkPositions = [];
    const trunkScales = [];
    const leafPositions = [];
    const leafScales = [];

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 250;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z);
      const scale = 0.6 + Math.random() * 0.8;

      trunkPositions.push({ x, y: y + 0.75 * scale, z });
      trunkScales.push(scale);

      const leafR = 1.0 * scale;
      leafPositions.push({ x, y: y + 1.8 * scale + leafR * 0.8, z });
      leafScales.push({ x: scale, y: (0.7 + Math.random() * 0.3) * scale, z: scale });
    }

    if (trunkPositions.length) {
      const trunkInst = new THREE.InstancedMesh(_trunkDummyGeo, _trunkMat, trunkPositions.length);
      trunkInst.castShadow = true;
      trunkInst.receiveShadow = true;
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < trunkPositions.length; i++) {
        const p = trunkPositions[i];
        const s = trunkScales[i];
        matrix.makeScale(s, s, s);
        matrix.setPosition(p.x, p.y, p.z);
        trunkInst.setMatrixAt(i, matrix);
      }
      trunkInst.instanceMatrix.needsUpdate = true;
      trunkInst.computeBoundingSphere();
      this.envGroup.add(trunkInst);
    }

    if (leafPositions.length) {
      const leafInst = new THREE.InstancedMesh(_leafDummyGeo, _leafMat, leafPositions.length);
      leafInst.castShadow = true;
      const matrix = new THREE.Matrix4();
      for (let i = 0; i < leafPositions.length; i++) {
        const p = leafPositions[i];
        const s = leafScales[i];
        matrix.makeScale(s.x, s.y, s.z);
        matrix.setPosition(p.x, p.y, p.z);
        leafInst.setMatrixAt(i, matrix);
      }
      leafInst.instanceMatrix.needsUpdate = true;
      leafInst.computeBoundingSphere();
      this.envGroup.add(leafInst);
    }
  }

  buildRocks() {
    const rockData = [];
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 280;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z);
      if (y < -1) continue;
      const s = 0.3 + Math.random() * 1.0;
      const rotY = Math.random() * 6;
      const rotX = Math.random() * 6;
      rockData.push({ x, y: y + s * 0.3, z, s, rotY, rotX });
    }

    if (rockData.length) {
      const rockInst = new THREE.InstancedMesh(_rockDummyGeo, _rockMat, rockData.length);
      rockInst.castShadow = true;
      rockInst.receiveShadow = true;
      const matrix = new THREE.Matrix4();
      const rot = new THREE.Matrix4();
      const scale = new THREE.Matrix4();
      for (let i = 0; i < rockData.length; i++) {
        const r = rockData[i];
        matrix.identity();
        scale.makeScale(r.s, r.s, r.s);
        rot.makeRotationX(r.rotX);
        matrix.multiply(rot);
        rot.makeRotationY(r.rotY);
        matrix.multiply(rot);
        matrix.multiply(scale);
        matrix.setPosition(r.x, r.y, r.z);
        rockInst.setMatrixAt(i, matrix);
      }
      rockInst.instanceMatrix.needsUpdate = true;
      rockInst.computeBoundingSphere();
      this.envGroup.add(rockInst);
    }
  }

  buildStartFinish() {
    const startPos = new THREE.Vector3(83, 0, 0);

    for (let side = -1; side <= 1; side += 2) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 5, 0.4),
        _pillarMat
      );
      pillar.position.set(startPos.x + side * 7, startPos.y + 2.5, startPos.z);
      pillar.castShadow = true;
      this.envGroup.add(pillar);
    }

    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.3, 0.4),
      _pillarMat
    );
    beam.position.set(startPos.x, startPos.y + 5, startPos.z);
    this.envGroup.add(beam);

    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1.5),
      _bannerMat
    );
    banner.position.set(startPos.x, startPos.y + 3.5, startPos.z + 0.3);
    this.envGroup.add(banner);
  }

  buildAmbientLights() {
    const ambient = new THREE.AmbientLight(0x8899bb, 0.5);
    this.envGroup.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x4a2e1a, 0.8);
    this.envGroup.add(hemi);
  }
}
