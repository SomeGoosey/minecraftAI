import * as THREE from 'three';

let _mergeUtils = null;
async function getMergeUtils() {
  if (!_mergeUtils) {
    try {
      _mergeUtils = await import('three/addons/utils/BufferGeometryUtils.js');
    } catch (e) {
      _mergeUtils = { mergeGeometries: null };
    }
  }
  return _mergeUtils;
}

const _roadMat = new THREE.MeshStandardMaterial({
  roughness: 0.9,
  metalness: 0.0,
  side: THREE.DoubleSide,
  color: 0x99aab0
});

const _lineMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
const _lineMatYellow = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8 });
const _redMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, roughness: 0.7 });
const _greenMat = new THREE.MeshStandardMaterial({ color: 0x22aa44, roughness: 0.7 });

export class TrackBuilder {
  constructor() {
    this.trackWidth = 14;
    this.trackCurve = null;
    this.trackLength = 0;
    this.checkpoints = [];
    this.trackGroup = new THREE.Group();
    this.roadMesh = null;
  }

  generateOvalPoints() {
    const pts = [];
    const a = 85, b = 50;
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const r = (a * b) / Math.sqrt((b * Math.cos(t)) ** 2 + (a * Math.sin(t)) ** 2);
      const wobble = Math.sin(t * 2) * 12 + Math.cos(t * 3) * 8 + Math.sin(t * 5) * 4 + Math.cos(t * 7) * 3;
      pts.push(new THREE.Vector3(
        Math.cos(t) * (r + wobble),
        0,
        Math.sin(t) * (r + wobble)
      ));
    }
    return pts;
  }

  async build() {
    const pts = this.generateOvalPoints();
    this.trackCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

    this.buildRoad();
    await this.buildLines();
    await this.buildEdges();
    this.buildCheckpoints();

    return this.trackGroup;
  }

  buildRoad() {
    const segs = 256;
    const halfW = this.trackWidth / 2;

    const vertCount = (segs + 1) * 2;
    const positions = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);
    const indices = [];

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = this.trackCurve.getPoint(t);
      const tangent = this.trackCurve.getTangent(t);
      const nx = -tangent.z;
      const nz = tangent.x;
      const len = Math.sqrt(nx * nx + nz * nz);
      const xn = nx / len;
      const zn = nz / len;

      const left = i * 2;
      const right = i * 2 + 1;

      positions[left * 3]     = p.x + xn * halfW;
      positions[left * 3 + 1] = 0;
      positions[left * 3 + 2] = p.z + zn * halfW;

      positions[right * 3]     = p.x - xn * halfW;
      positions[right * 3 + 1] = 0;
      positions[right * 3 + 2] = p.z - zn * halfW;

      uvs[left * 2]     = t * 30;
      uvs[left * 2 + 1] = 0;
      uvs[right * 2]    = t * 30;
      uvs[right * 2 + 1] = 1;

      if (i < segs) {
        const a = i * 2, b = i * 2 + 1;
        const c = (i + 1) * 2, d = (i + 1) * 2 + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();

    const texCanvas = this.makeAsphaltNoise(512);
    const tex = new THREE.CanvasTexture(texCanvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    tex.anisotropy = 2;

    _roadMat.map = tex;

    this.roadMesh = new THREE.Mesh(geo, _roadMat);
    this.roadMesh.receiveShadow = true;
    this.trackGroup.add(this.roadMesh);
  }

  makeAsphaltNoise(size) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    const img = ctx.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const base = 140 + (Math.random() * 40 - 20 | 0);
      d[i] = base;
      d[i + 1] = base + 2;
      d[i + 2] = base + 5;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 300; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.quadraticCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size
      );
      ctx.stroke();
    }
    return c;
  }

  async buildLines() {
    const segs = 160;
    const halfW = this.trackWidth / 2;
    const whiteGeos = [];
    const yellowGeos = [];

    for (let side = -0.85; side <= 0.85; side += 1.7) {
      for (let i = 0; i < segs; i++) {
        const t = i / segs;
        const t2 = ((i + 1) / segs) % 1;
        const p1 = this.trackCurve.getPoint(t);
        const p2 = this.trackCurve.getPoint(t2);
        const tangent = this.trackCurve.getTangent(t);
        const nx = -tangent.z, nz = tangent.x;
        const len = Math.sqrt(nx * nx + nz * nz);
        const xn = nx / len, zn = nz / len;

        const mx = (p1.x + p2.x) / 2 + xn * side;
        const mz = (p1.z + p2.z) / 2 + zn * side;
        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        const w = i % 3 === 0 ? 0.15 : 0.08;
        const h = i % 3 === 0 ? segLen * 1.1 : segLen * 0.5;
        const geo = new THREE.PlaneGeometry(w, h);
        geo.rotateY(-angle);
        geo.translate(mx, 0.005, mz);
        geo.computeBoundingSphere();
        whiteGeos.push(geo);
      }
    }

    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      const t2 = ((i + 1) / segs) % 1;
      const p1 = this.trackCurve.getPoint(t);
      const p2 = this.trackCurve.getPoint(t2);
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const segLen = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      const mx = (p1.x + p2.x) / 2, mz = (p1.z + p2.z) / 2;

      if (i % 2 === 0) {
        const geo = new THREE.PlaneGeometry(0.1, segLen * 0.6);
        geo.rotateY(-angle);
        geo.translate(mx, 0.005, mz);
        geo.computeBoundingSphere();
        yellowGeos.push(geo);
      }
    }

    const utils = await getMergeUtils();
    if (utils.mergeGeometries) {
      if (whiteGeos.length) {
        const merged = utils.mergeGeometries(whiteGeos, false);
        if (merged) {
          const mesh = new THREE.Mesh(merged, _lineMatWhite);
          this.trackGroup.add(mesh);
        }
      }
      if (yellowGeos.length) {
        const merged = utils.mergeGeometries(yellowGeos, false);
        if (merged) {
          const mesh = new THREE.Mesh(merged, _lineMatYellow);
          this.trackGroup.add(mesh);
        }
      }
    } else {
      for (const geo of whiteGeos) {
        this.trackGroup.add(new THREE.Mesh(geo, _lineMatWhite));
      }
      for (const geo of yellowGeos) {
        this.trackGroup.add(new THREE.Mesh(geo, _lineMatYellow));
      }
    }
  }

  async buildEdges() {
    const segs = 100;
    const inset = this.trackWidth / 2 + 0.15;
    const redGeos = [];
    const greenGeos = [];

    for (let side = -1; side <= 1; side += 2) {
      const target = side < 0 ? redGeos : greenGeos;
      for (let i = 0; i < segs; i++) {
        const t = i / segs;
        const t2 = ((i + 1) / segs) % 1;
        const p1 = this.trackCurve.getPoint(t);
        const p2 = this.trackCurve.getPoint(t2);
        const tangent = this.trackCurve.getTangent(t);
        const nx = -tangent.z, nz = tangent.x;
        const len = Math.sqrt(nx * nx + nz * nz);
        const xn = nx / len, zn = nz / len;

        const mx = (p1.x + p2.x) / 2 + xn * inset * side;
        const mz = (p1.z + p2.z) / 2 + zn * inset * side;
        const dx = p2.x - p1.x, dz = p2.z - p1.z;
        const segLen = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        const geo = new THREE.PlaneGeometry(0.4, segLen * 1.05);
        geo.rotateY(-angle);
        geo.translate(mx, 0.005, mz);
        geo.computeBoundingSphere();
        target.push(geo);
      }
    }

    const utils = await getMergeUtils();
    if (utils.mergeGeometries) {
      if (redGeos.length) {
        const merged = utils.mergeGeometries(redGeos, false);
        if (merged) {
          this.trackGroup.add(new THREE.Mesh(merged, _redMat));
        }
      }
      if (greenGeos.length) {
        const merged = utils.mergeGeometries(greenGeos, false);
        if (merged) {
          this.trackGroup.add(new THREE.Mesh(merged, _greenMat));
        }
      }
    } else {
      for (const geo of redGeos) this.trackGroup.add(new THREE.Mesh(geo, _redMat));
      for (const geo of greenGeos) this.trackGroup.add(new THREE.Mesh(geo, _greenMat));
    }
  }

  buildCheckpoints() {
    const num = 4;
    for (let i = 0; i < num; i++) {
      const t = i / num;
      const p = this.trackCurve.getPoint(t);
      const tangent = this.trackCurve.getTangent(t);
      this.checkpoints.push({
        index: i, t, position: p.clone(),
        tangent: tangent.clone(),
        normal: new THREE.Vector3(-tangent.z, 0, tangent.x).normalize()
      });
    }
  }

  getProgress(pos) {
    let minD = Infinity, minT = 0;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const p = this.trackCurve.getPoint(t);
      const dx = pos.x - p.x, dz = pos.z - p.z;
      const d = dx * dx + dz * dz;
      if (d < minD) { minD = d; minT = t; }
    }
    return minT;
  }

  getPointAtProgress(t, lateral = 0) {
    const p = this.trackCurve.getPoint(t);
    if (lateral !== 0) {
      const tangent = this.trackCurve.getTangent(t);
      const n = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      p.x += n.x * lateral;
      p.z += n.z * lateral;
    }
    return p;
  }

  getTrackHeight(x, z) {
    return 0;
  }
}
