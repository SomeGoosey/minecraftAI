import * as THREE from 'three';

const MAX_SPEED = 100;
const MAX_REVERSE = 35;
const ACCEL = 45;
const BRAKE = 80;
const DRAG = 0.035;
const STEER_SPEED = 3.0;
const STEER_RETURN = 5.0;
const DRIFT_GRIP = 0.15;
const WALL_RADIUS = 0.6;
const ANTI_STUCK_TIME = 2.0;

const QUALITY = [
  { label: 'Basic', shadows: false, px: 0.75, ssao: false, fxaa: false, fog: false },
  { label: 'Low', shadows: true, px: 0.75, ssao: false, fxaa: false, fog: true },
  { label: 'Medium', shadows: true, px: 1, ssao: false, fxaa: true, fog: true },
  { label: 'High', shadows: true, px: 1, ssao: true, fxaa: true, fog: true },
  { label: 'Ultra', shadows: true, px: 1.5, ssao: true, fxaa: true, fog: true },
];

const TRACKS = [
  {
    name: 'OVAL',
    getPoints() {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const r = (80 * 55) / Math.sqrt((55 * Math.cos(t)) ** 2 + (80 * Math.sin(t)) ** 2);
        const w = Math.sin(t * 2) * 10 + Math.cos(t * 3) * 6;
        pts.push(new THREE.Vector3(Math.cos(t) * (r + w), 0, Math.sin(t) * (r + w)));
      }
      return pts;
    }
  },
  {
    name: 'TWIST',
    getPoints() {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const r = (85 * 50) / Math.sqrt((50 * Math.cos(t)) ** 2 + (85 * Math.sin(t)) ** 2);
        const w = Math.sin(t * 2) * 12 + Math.cos(t * 3) * 8 + Math.sin(t * 5) * 4 + Math.cos(t * 7) * 3;
        pts.push(new THREE.Vector3(Math.cos(t) * (r + w), 0, Math.sin(t) * (r + w)));
      }
      return pts;
    }
  },
  {
    name: 'COMPLEX',
    getPoints() {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const r = (95 * 60) / Math.sqrt((60 * Math.cos(t)) ** 2 + (95 * Math.sin(t)) ** 2);
        const w = Math.sin(t * 2) * 8 + Math.cos(t * 4) * 14 + Math.sin(t * 6) * 7 + Math.cos(t * 9) * 5;
        pts.push(new THREE.Vector3(Math.cos(t) * (r + w), 0, Math.sin(t) * (r + w)));
      }
      return pts;
    }
  }
];

const DIFFICULTIES = [
  { label: 'SUPER EASY', aiSpeedMult: 0.2, lapCount: 1, rewardMult: 0.25, headStart: 0.005 },
  { label: 'EASY', aiSpeedMult: 0.55, lapCount: 2, rewardMult: 1.0, headStart: 0.02 },
  { label: 'MEDIUM', aiSpeedMult: 0.8, lapCount: 3, rewardMult: 1.5, headStart: 0.04 },
  { label: 'HARD', aiSpeedMult: 1.0, lapCount: 5, rewardMult: 2.5, headStart: 0.06 },
  { label: 'SUPER HARD', aiSpeedMult: 1.4, lapCount: 7, rewardMult: 4.0, headStart: 0.10 },
];

const OPPONENT_COUNTS = [0, 1, 3, 5];
const COLLISION_RADIUS = 1.8;
const COIN_COUNT = 20;
const CURVE_SAMPLES_FOR_LENGTH = 500;

const CARS = [
  { name: 'STOCK', color: '#e03030', levelReq: 1, stats: [1.0, 1.0, 1.0], bodyW: 2, bodyH: 0.35, tireW: 0.1, spoiler: false },
  { name: 'SPORT', color: '#ff6600', levelReq: 3, stats: [1.25, 1.1, 1.2], bodyW: 2.1, bodyH: 0.3, tireW: 0.12, spoiler: true },
  { name: 'ELITE', color: '#ffd700', levelReq: 6, stats: [1.6, 1.2, 1.4], bodyW: 2.15, bodyH: 0.28, tireW: 0.13, spoiler: true },
  { name: 'RACER', color: '#00ccff', levelReq: 10, stats: [2.1, 1.35, 1.6], bodyW: 2.2, bodyH: 0.25, tireW: 0.14, spoiler: true },
];
const UPGRADE_COSTS = [0, 200, 500, 1200];
const NITRO_COSTS = [0, 500, 1000, 2000];
const NITRO_DURATIONS = [0, 3, 4, 5];
const NITRO_RECHARGE = [0, 30, 25, 20];
const WEATHERS = ['CLEAR', 'CLOUDY', 'RAINY'];

const _bodyMat = new THREE.MeshStandardMaterial({ color: 0xe03030, roughness: 0.3, metalness: 0.6 });
const _glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0, transparent: true, opacity: 0.3 });
const _tireMat = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 });
const _rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 });
const _darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
const _headlightMat = new THREE.MeshStandardMaterial({ color: 0xffee88, emissive: 0xffee88, emissiveIntensity: 0.3 });
const _taillightMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.2 });
const _roadMat = new THREE.MeshStandardMaterial({ color: 0x99aab0, roughness: 0.9, side: THREE.DoubleSide });
let _asphaltTex = null;
const _lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
const _centerMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.8 });
const _edgeMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, roughness: 0.7 });
const _grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 1, flatShading: true });
const _trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.9 });
const _leafMat = new THREE.MeshStandardMaterial({ color: 0x2d6a1e, roughness: 0.8 });
const _skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color(0x0f1a3a) }, mid: { value: new THREE.Color(0x2a5a8c) }, bot: { value: new THREE.Color(0xb0d4f1) } },
  vertexShader: `varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0)}`,
  fragmentShader: `uniform vec3 top;uniform vec3 mid;uniform vec3 bot;varying vec3 v;void main(){float h=normalize(v).y;vec3 c=mix(bot,mid,smoothstep(0.,.4,max(h,0.)));c=mix(c,top,smoothstep(.4,1.,max(h,0.)));gl_FragColor=vec4(c,1.0)}`,
  side: THREE.BackSide, depthWrite: false
});

function makeAsphaltTex(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const base = 140 + (Math.random() * 40 - 20 | 0);
    d[i] = base; d[i+1] = base + 2; d[i+2] = base + 5; d[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 200; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.quadraticCurveTo(Math.random() * size, Math.random() * size, Math.random() * size, Math.random() * size);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 2;
  return tex;
}

function getRoadHeight(t) {
  const h = Math.sin(t * Math.PI * 4) * 1.2
         + Math.sin(t * Math.PI * 10 + 1.3) * 0.6
         + Math.cos(t * Math.PI * 18 + 0.7) * 0.3;
  return h;
}

// ----- Car -----
function createCar(carIdx) {
  const cfg = CARS[carIdx] || CARS[0];
  const g = new THREE.Group();
  const bScale = 0.9 + Math.random() * 0.2;
  const bW = cfg.bodyW * bScale, bH = cfg.bodyH * bScale;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, 0.85), _bodyMat);
  body.material = _bodyMat.clone();
  body.material.color.set(cfg.color);
  body.position.y = 0.2;
  body.castShadow = true;
  g.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.65), _glassMat);
  cabin.position.set(0.1, 0.5, 0);
  g.add(cabin);

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.1, 0.05, 0.15), _darkMat);
  splitter.position.set(0, 0.02, 0);
  g.add(splitter);

  if (cfg.spoiler) {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.12), _darkMat);
    spoiler.position.set(-0.85, 0.55, 0);
    g.add(spoiler);
  }

  const hl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), _headlightMat);
  hl.position.set(bW / 2 + 0.02, 0.18, 0.2);
  g.add(hl);
  const hr = hl.clone(); hr.position.z = -0.2; g.add(hr);

  const tl = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.15), _taillightMat);
  tl.position.set(-bW / 2 - 0.02, 0.2, 0.2);
  g.add(tl);
  const tr = tl.clone(); tr.position.z = -0.2; g.add(tr);

  const tireR = 0.16, tireW = cfg.tireW;
  const tireGeo = new THREE.CylinderGeometry(tireR, tireR, tireW, 10);
  const rimGeo = new THREE.CylinderGeometry(tireR * 0.6, tireR * 0.6, tireW * 0.5, 6);
  const wOff = bW * 0.35;
  const wPos = [[wOff, -0.12, -0.45], [wOff, -0.12, 0.45], [-wOff - 0.1, -0.12, -0.45], [-wOff - 0.1, -0.12, 0.45]];
  for (const [wx, wy, wz] of wPos) {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, _tireMat);
    tire.rotation.x = Math.PI / 2;
    wg.add(tire);
    const rim = new THREE.Mesh(rimGeo, _rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.z = 0.01;
    wg.add(rim);
    wg.position.set(wx, wy, wz);
    wg.userData.isWheel = true;
    g.add(wg);
  }

  return g;
}

// ----- Track -----
function buildTrack(trackIndex) {
  const group = new THREE.Group();

  if (!_asphaltTex) _asphaltTex = makeAsphaltTex(512);
  _roadMat.map = _asphaltTex;

  const pts = TRACKS[trackIndex].getPoints();
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);

  // Road surface with height
  const segs = 256;
  const halfW = 7;
  const pos = new Float32Array((segs + 1) * 2 * 3);
  const uvs = new Float32Array((segs + 1) * 2 * 2);
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPoint(t);
    const tg = curve.getTangent(t);
    const nx = -tg.z, nz = tg.x;
    const len = Math.sqrt(nx * nx + nz * nz);
    const xn = nx / len, zn = nz / len;
    const height = getRoadHeight(t);
    const li = i * 2, ri = i * 2 + 1;
    pos[li * 3] = p.x + xn * halfW; pos[li * 3 + 1] = height; pos[li * 3 + 2] = p.z + zn * halfW;
    pos[ri * 3] = p.x - xn * halfW; pos[ri * 3 + 1] = height; pos[ri * 3 + 2] = p.z - zn * halfW;
    uvs[li * 2] = t * 30; uvs[li * 2 + 1] = 0;
    uvs[ri * 2] = t * 30; uvs[ri * 2 + 1] = 1;
    if (i < segs) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  roadGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  roadGeo.setIndex(idx);
  roadGeo.computeVertexNormals();
  roadGeo.computeBoundingSphere();
  const road = new THREE.Mesh(roadGeo, _roadMat);
  road.receiveShadow = true;
  group.add(road);

  // Lines (edge dashes) - follow road height
  for (let side = -0.85; side <= 0.85; side += 1.7) {
    for (let i = 0; i < 160; i++) {
      const t = i / 160, t2 = ((i + 1) / 160) % 1;
      const p1 = curve.getPoint(t), p2 = curve.getPoint(t2);
      const tg = curve.getTangent(t);
      const nx = -tg.z, nz = tg.x;
      const len = Math.sqrt(nx * nx + nz * nz);
      const xn = nx / len, zn = nz / len;
      const mx = (p1.x + p2.x) / 2 + xn * side, mz = (p1.z + p2.z) / 2 + zn * side;
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const sl = Math.sqrt(dx * dx + dz * dz);
      const ang = Math.atan2(dx, dz);
      const h = (getRoadHeight(t) + getRoadHeight(t2)) / 2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(i % 3 === 0 ? 0.15 : 0.08, i % 3 === 0 ? sl * 1.1 : sl * 0.5), _lineMat);
      dash.position.set(mx, h + 0.015, mz);
      dash.rotation.y = -ang;
      group.add(dash);
    }
  }

  // Center line - follow road height
  for (let i = 0; i < 160; i++) {
    if (i % 2 !== 0) continue;
    const t = i / 160, t2 = ((i + 1) / 160) % 1;
    const p1 = curve.getPoint(t), p2 = curve.getPoint(t2);
    const dx = p2.x - p1.x, dz = p2.z - p1.z;
    const sl = Math.sqrt(dx * dx + dz * dz);
    const ang = Math.atan2(dx, dz);
    const mx = (p1.x + p2.x) / 2, mz = (p1.z + p2.z) / 2;
    const h = (getRoadHeight(t) + getRoadHeight(t2)) / 2;
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.1, sl * 0.6), _centerMat);
    dash.position.set(mx, h + 0.02, mz);
    dash.rotation.y = -ang;
    group.add(dash);
  }

  // Red edge strips - follow road height
  const edgeHeight = 0.01;
  for (let i = 0; i < 100; i++) {
    const t = i / 100, t2 = ((i + 1) / 100) % 1;
    const p1 = curve.getPoint(t), p2 = curve.getPoint(t2);
    const tg = curve.getTangent(t);
    const nx = -tg.z, nz = tg.x;
    const len = Math.sqrt(nx * nx + nz * nz);
    const xn = nx / len, zn = nz / len;
    const inset = halfW + 0.1;
    const h = (getRoadHeight(t) + getRoadHeight(t2)) / 2;
    for (let s = -1; s <= 1; s += 2) {
      const mx = (p1.x + p2.x) / 2 + xn * inset * s, mz = (p1.z + p2.z) / 2 + zn * inset * s;
      const dx = p2.x - p1.x, dz = p2.z - p1.z;
      const sl = Math.sqrt(dx * dx + dz * dz);
      const ang = Math.atan2(dx, dz);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, sl * 1.05), _edgeMat);
      strip.position.set(mx, h + edgeHeight, mz);
      strip.rotation.y = -ang;
      group.add(strip);
    }
  }

  const curveLength = curve.getLength();
  return { group, curve, curveLength, checkpoints: buildCheckpoints(curve) };
}

function buildCheckpoints(curve) {
  const cps = [];
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const p = curve.getPoint(t);
    const tg = curve.getTangent(t);
    cps.push({ index: i, t, position: p.clone(), tangent: tg.clone(), normal: new THREE.Vector3(-tg.z, 0, tg.x).normalize() });
  }
  return cps;
}

function getProgress(pos, curve) {
  let minD = Infinity, minT = 0;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const p = curve.getPoint(t);
    const d = (pos.x - p.x) ** 2 + (pos.z - p.z) ** 2;
    if (d < minD) { minD = d; minT = t; }
  }
  for (let step = 0.005, iter = 0; iter < 6; iter++, step *= 0.5) {
    for (let s = -1; s <= 1; s += 2) {
      const t = minT + step * s;
      if (t < 0 || t > 1) continue;
      const p = curve.getPoint(t);
      const d = (pos.x - p.x) ** 2 + (pos.z - p.z) ** 2;
      if (d < minD) { minD = d; minT = t; }
    }
  }
  return ((minT % 1) + 1) % 1;
}

function getPointAt(curve, t, lat) {
  const p = curve.getPoint(t);
  if (lat) {
    const tg = curve.getTangent(t);
    const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
    p.x += n.x * lat;
    p.z += n.z * lat;
  }
  return p;
}

// ----- Environment -----
let _curveSamples = null;
function buildCurveSamples(curve, n) {
  _curveSamples = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPoint(t);
    _curveSamples.push({ t, x: p.x, z: p.z });
  }
}

function getGroundHeight(x, z) {
  if (!_curveSamples) return -0.5;
  let minD = Infinity, minT = 0;
  for (const s of _curveSamples) {
    const d = (x - s.x) ** 2 + (z - s.z) ** 2;
    if (d < minD) { minD = d; minT = s.t; }
  }
  const roadH = getRoadHeight(minT);
  const dist = Math.sqrt(minD);
  if (dist < 50) {
    return roadH - 0.15;
  }
  const falloff = Math.max(0, Math.min(1, (dist - 50) / 100));
  const flatH = roadH - 0.15 - falloff * 2;
  return flatH;
}

function buildEnvironment(curve) {
  const g = new THREE.Group();

  buildCurveSamples(curve, 200);

  // Sky
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 24), _skyMat);
  sky.matrixAutoUpdate = false;
  g.add(sky);

  // Ground - built directly in XZ plane
  const gSegs = 60;
  const gSize = 700;
  const gHalf = gSize / 2;
  const gVerts = [];
  const gIdx = [];
  for (let iz = 0; iz <= gSegs; iz++) {
    for (let ix = 0; ix <= gSegs; ix++) {
      const x = -gHalf + (ix / gSegs) * gSize;
      const z = -gHalf + (iz / gSegs) * gSize;
      gVerts.push(x, getGroundHeight(x, z), z);
      if (ix < gSegs && iz < gSegs) {
        const a = iz * (gSegs + 1) + ix;
        const b = a + 1;
        const c = a + (gSegs + 1);
        const d = c + 1;
        gIdx.push(a, c, b, b, c, d);
      }
    }
  }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gVerts), 3));
  groundGeo.setIndex(gIdx);
  groundGeo.computeVertexNormals();
  groundGeo.computeBoundingSphere();
  const ground = new THREE.Mesh(groundGeo, _grassMat);
  ground.receiveShadow = true;
  g.add(ground);

  // Trees (instanced) - on ground
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.18, 1.2, 4);
  const leafGeo = new THREE.SphereGeometry(0.8, 5, 5);
  const treePositions = [];
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 250;
    treePositions.push({ x: Math.cos(angle) * dist, z: Math.sin(angle) * dist, scale: 0.6 + Math.random() * 0.8 });
  }
  if (treePositions.length) {
    const trunkInst = new THREE.InstancedMesh(trunkGeo, _trunkMat, treePositions.length);
    const leafInst = new THREE.InstancedMesh(leafGeo, _leafMat, treePositions.length);
    const m = new THREE.Matrix4();
    for (let i = 0; i < treePositions.length; i++) {
      const t = treePositions[i];
      const gh = getGroundHeight(t.x, t.z);
      m.makeScale(t.scale, t.scale, t.scale);
      m.setPosition(t.x, gh + 0.6 * t.scale, t.z);
      trunkInst.setMatrixAt(i, m);
      m.makeScale(t.scale, t.scale * 0.7, t.scale);
      m.setPosition(t.x, gh + 1.6 * t.scale, t.z);
      leafInst.setMatrixAt(i, m);
    }
    trunkInst.instanceMatrix.needsUpdate = true;
    leafInst.instanceMatrix.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    leafInst.computeBoundingSphere();
    trunkInst.castShadow = true;
    leafInst.castShadow = true;
    g.add(trunkInst);
    g.add(leafInst);
  }

  // Light
  g.add(new THREE.AmbientLight(0x8899bb, 0.5));
  g.add(new THREE.HemisphereLight(0x87ceeb, 0x4a2e1a, 0.7));

  return g;
}

// ----- Weather -----
function createRainSystem(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  const box = 400;
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * box;
    pos[i * 3 + 1] = Math.random() * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * box;
    vel[i] = 15 + Math.random() * 10;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xaabbee, size: 0.08, transparent: true, opacity: 0.4, depthWrite: false });
  const mesh = new THREE.Points(geo, mat);
  mesh.userData = { vel, box, count };
  return mesh;
}

function updateRain(rain, dt) {
  if (!rain) return;
  const pos = rain.geometry.attributes.position.array;
  const vel = rain.userData.vel;
  const box = rain.userData.box;
  const half = box / 2;
  for (let i = 0; i < rain.userData.count; i++) {
    pos[i * 3 + 1] -= vel[i] * dt;
    pos[i * 3] += Math.sin(i) * dt * 2;
    pos[i * 3 + 2] += Math.cos(i * 0.7) * dt * 2;
    if (pos[i * 3 + 1] < -2) {
      pos[i * 3] = (Math.random() - 0.5) * box;
      pos[i * 3 + 1] = 15 + Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * box;
    }
  }
  rain.geometry.attributes.position.needsUpdate = true;
}

// ----- Game -----
class Game {
  constructor() {
    this.quality = 2;
    this.trackIndex = 0;
    this.diffIndex = 1;
    this.carIndex = 0;
    this.opponentCountIdx = 1;
    this.xp = parseInt(localStorage.getItem('racer_xp') || '0');
    this.level = this.calcLevel(this.xp);
    this.money = parseInt(localStorage.getItem('racer_money') || '0');
    this.upgrades = JSON.parse(localStorage.getItem('racer_upgrades') || '{}');
    this.running = true;
    this.raceActive = false;
    this.paused = false;
    this.lapCount = DIFFICULTIES[this.diffIndex].lapCount;
    this.currentLap = 0;
    this.elapsed = 0;
    this.raceResult = null;
    this.weather = 'CLEAR';
    this.rainMesh = null;
    this.opponents = [];
    this.coins = [];
    this.curveLength = 0;
    this.playerRoadDist = 0;
    this.playerOldProgress = 0;
    this.nitroCharge = 0;
    this.nitroActive = false;
    this.nitroTimer = 0;
    this.tab = 'start';
  }

  async init() {
    const container = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd0e0f0);
    this.scene.fog = new THREE.FogExp2(0xd0e0f0, 0.004);

    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 500);
    this.camera.position.set(0, 5, -10);

    window.addEventListener('resize', () => {
      this.camera.aspect = innerWidth / innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    });

    // Light
    this.light = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.light.position.set(60, 80, 40);
    this.light.castShadow = true;
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 250;
    this.light.shadow.camera.left = -60;
    this.light.shadow.camera.right = 60;
    this.light.shadow.camera.top = 60;
    this.light.shadow.camera.bottom = -60;
    this.light.shadow.bias = -0.0005;
    this.light.shadow.normalBias = 0.02;
    this.scene.add(this.light);

    this.setProgress(30);
    await this.sleep(30);
    this.setProgress(60);
    await this.sleep(30);
    this.setProgress(100);
    await this.sleep(30);

    // Input
    this.keys = new Map();
    window.addEventListener('keydown', e => { this.keys.set(e.code, true); if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); });
    window.addEventListener('keyup', e => this.keys.set(e.code, false));

    // State
    this.state = 'menu';
    document.getElementById('loading').classList.add('hidden');
    this.hideAll();
    document.getElementById('menu').classList.remove('hidden');
    this.setupUI();

    this.clock = new THREE.Clock();
    this.animate();
  }

  setupUI() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => this.switchTab(btn.dataset.tab);
    });

    document.getElementById('start-btn').onclick = () => this.startRace();
    document.getElementById('q-prev').onclick = () => this.cycleQuality(-1);
    document.getElementById('q-next').onclick = () => this.cycleQuality(1);
    document.getElementById('t-prev').onclick = () => this.cycleTrack(-1);
    document.getElementById('t-next').onclick = () => this.cycleTrack(1);
    document.getElementById('d-prev').onclick = () => this.cycleDiff(-1);
    document.getElementById('d-next').onclick = () => this.cycleDiff(1);
    document.getElementById('result-btn').onclick = () => this.backToMenu();
    document.getElementById('retry-btn').onclick = () => this.startRace();
    document.getElementById('c-prev').onclick = () => this.cycleCar(-1);
    document.getElementById('c-next').onclick = () => this.cycleCar(1);
    document.getElementById('o-prev').onclick = () => this.cycleOpponents(-1);
    document.getElementById('o-next').onclick = () => this.cycleOpponents(1);
    document.getElementById('upgrades-btn').onclick = () => this.showUpgrades();
    document.getElementById('upg-back').onclick = () => { this.hideUpgrades(); this.switchTab('cars'); };
    document.getElementById('upg-engine-plus').onclick = () => this.buyUpgrade('engine');
    document.getElementById('upg-engine-minus').onclick = () => this.sellUpgrade('engine');
    document.getElementById('upg-tires-plus').onclick = () => this.buyUpgrade('tires');
    document.getElementById('upg-tires-minus').onclick = () => this.sellUpgrade('tires');
    document.getElementById('upg-turbo-plus').onclick = () => this.buyUpgrade('turbo');
    document.getElementById('upg-turbo-minus').onclick = () => this.sellUpgrade('turbo');
    document.getElementById('upg-nitro-plus').onclick = () => this.buyNitro();
    document.getElementById('upg-nitro-minus').onclick = () => this.sellNitro();

    document.addEventListener('keydown', e => {
      if (e.code === 'Enter') {
        if (this.state === 'menu') this.startRace();
        else if (this.state === 'gameover') this.backToMenu();
        else if (this.state === 'upgrades') { this.hideUpgrades(); this.switchTab('cars'); }
      }
      if (e.code === 'Escape') {
        if (this.state === 'playing') { this.paused = true; this.state = 'paused'; document.getElementById('pause').classList.remove('hidden'); }
        else if (this.state === 'paused') { this.paused = false; this.state = 'playing'; document.getElementById('pause').classList.add('hidden'); }
        else if (this.state === 'gameover') this.backToMenu();
        else if (this.state === 'upgrades') { this.hideUpgrades(); this.switchTab('cars'); }
      }
      if (e.code === 'ArrowLeft' && (this.state === 'menu' || this.state === 'paused')) { e.preventDefault(); this.cycleQuality(-1); }
      if (e.code === 'ArrowRight' && (this.state === 'menu' || this.state === 'paused')) { e.preventDefault(); this.cycleQuality(1); }
    });

    this.updateQualityLabel();
    this.updateTrackLabel();
    this.updateDiffLabel();
    this.updateCarLabel();
    this.updateOpponentLabel();
    this.updateMoneyLabel();
  }

  switchTab(tab) {
    this.tab = tab;
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
  }

  cycleTrack(dir) {
    this.trackIndex = (this.trackIndex + dir + TRACKS.length) % TRACKS.length;
    this.updateTrackLabel();
  }
  cycleDiff(dir) {
    this.diffIndex = (this.diffIndex + dir + DIFFICULTIES.length) % DIFFICULTIES.length;
    this.updateDiffLabel();
  }
  cycleOpponents(dir) {
    this.opponentCountIdx = (this.opponentCountIdx + dir + OPPONENT_COUNTS.length) % OPPONENT_COUNTS.length;
    this.updateOpponentLabel();
  }
  updateTrackLabel() { document.getElementById('track-label').textContent = TRACKS[this.trackIndex].name; }
  updateDiffLabel() {
    const d = DIFFICULTIES[this.diffIndex];
    document.getElementById('diff-label').textContent = d.label + ' (' + d.rewardMult + 'x)';
  }
  updateOpponentLabel() { document.getElementById('opp-label').textContent = String(OPPONENT_COUNTS[this.opponentCountIdx]); }

  cycleCar(dir) {
    const next = (this.carIndex + dir + CARS.length) % CARS.length;
    if (CARS[next].levelReq > this.level) return;
    this.carIndex = next;
    this.updateCarLabel();
  }
  updateCarLabel() {
    const el = document.getElementById('car-label');
    const c = CARS[this.carIndex];
    el.textContent = c.name;
    el.style.color = c.levelReq <= this.level ? '#f80' : '#666';
    document.getElementById('car-status').textContent = c.levelReq > this.level ? `LOCKED (LV ${c.levelReq})` : 'READY';
  }
  updateMoneyLabel() {
    document.getElementById('money-label').textContent = `$${this.money}`;
    if (document.getElementById('hud-money')) document.getElementById('hud-money').textContent = `$${this.money}`;
  }

  getUpgradeKey(carIdx, type) { return `u_${carIdx}_${type}`; }
  getUpgradeLevel(carIdx, type) { return this.upgrades[this.getUpgradeKey(carIdx, type)] || 0; }
  getNitroLevel() { return this.upgrades[`nitro_${this.carIndex}`] || 0; }
  calcLevel(xp) {
    if (xp < 200) return 1;
    if (xp < 500) return 2;
    if (xp < 1000) return 3;
    if (xp < 1800) return 4;
    if (xp < 3000) return 5;
    if (xp < 5000) return 6;
    if (xp < 8000) return 7;
    if (xp < 12000) return 8;
    if (xp < 18000) return 9;
    return 10 + Math.floor((xp - 18000) / 10000);
  }

  buyUpgrade(type) {
    const key = this.getUpgradeKey(this.carIndex, type);
    const cur = this.upgrades[key] || 0;
    if (cur >= 3) return;
    const cost = UPGRADE_COSTS[cur + 1];
    if (this.money < cost) return;
    this.money -= cost;
    this.upgrades[key] = cur + 1;
    localStorage.setItem('racer_money', String(this.money));
    localStorage.setItem('racer_upgrades', JSON.stringify(this.upgrades));
    this.updateMoneyLabel();
    this.refreshUpgradePanel();
  }
  buyNitro() {
    const cur = this.getNitroLevel();
    if (cur >= 3) return;
    const cost = NITRO_COSTS[cur + 1];
    if (this.money < cost) return;
    this.money -= cost;
    this.upgrades[`nitro_${this.carIndex}`] = cur + 1;
    localStorage.setItem('racer_money', String(this.money));
    localStorage.setItem('racer_upgrades', JSON.stringify(this.upgrades));
    this.updateMoneyLabel();
    this.refreshUpgradePanel();
  }
  sellNitro() {
    const cur = this.getNitroLevel();
    if (cur <= 0) return;
    const refund = Math.floor(NITRO_COSTS[cur] * 0.5);
    this.money += refund;
    this.upgrades[`nitro_${this.carIndex}`] = cur - 1;
    localStorage.setItem('racer_money', String(this.money));
    localStorage.setItem('racer_upgrades', JSON.stringify(this.upgrades));
    this.updateMoneyLabel();
    this.refreshUpgradePanel();
  }

  sellUpgrade(type) {
    const key = this.getUpgradeKey(this.carIndex, type);
    const cur = this.upgrades[key] || 0;
    if (cur <= 0) return;
    const refund = Math.floor(UPGRADE_COSTS[cur] * 0.5);
    this.money += refund;
    this.upgrades[key] = cur - 1;
    localStorage.setItem('racer_money', String(this.money));
    localStorage.setItem('racer_upgrades', JSON.stringify(this.upgrades));
    this.updateMoneyLabel();
    this.refreshUpgradePanel();
  }

  showUpgrades() {
    this.state = 'upgrades';
    this.hideAll();
    document.getElementById('upgrade').classList.remove('hidden');
    document.getElementById('upg-title').textContent = `UPGRADES — ${CARS[this.carIndex].name}`;
    this.refreshUpgradePanel();
  }
  refreshUpgradePanel() {
    for (const p of ['engine', 'tires', 'turbo']) {
      const lv = this.getUpgradeLevel(this.carIndex, p);
      document.getElementById(`upg-${p}-level`).textContent = `LV ${lv}/3`;
      document.getElementById(`upg-${p}-cost`).textContent = lv < 3 ? `$${UPGRADE_COSTS[lv + 1]}` : 'MAX';
      document.getElementById(`upg-${p}-refund`).textContent = lv > 0 ? `$${Math.floor(UPGRADE_COSTS[lv] * 0.5)}` : '—';
    }
    const nLv = this.getNitroLevel();
    document.getElementById('upg-nitro-level').textContent = `LV ${nLv}/3`;
    document.getElementById('upg-nitro-cost').textContent = nLv < 3 ? `$${NITRO_COSTS[nLv + 1]}` : 'MAX';
    document.getElementById('upg-nitro-refund').textContent = nLv > 0 ? `$${Math.floor(NITRO_COSTS[nLv] * 0.5)}` : '—';
  }
  hideUpgrades() {
    this.state = 'menu';
    this.hideAll();
    document.getElementById('menu').classList.remove('hidden');
    this.updateCarLabel();
    this.updateMoneyLabel();
  }

  cycleQuality(dir) {
    this.quality = Math.max(0, Math.min(QUALITY.length - 1, this.quality + dir));
    this.applyQuality();
    this.updateQualityLabel();
  }
  applyQuality() {
    const q = QUALITY[this.quality];
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, q.px));
    this.renderer.toneMapping = q.fog ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    this.renderer.toneMappingExposure = q.fog ? 1.2 : 0;
    this.scene.fog = q.fog ? new THREE.FogExp2(0xd0e0f0, 0.004) : null;
    this.scene.background = q.fog ? new THREE.Color(0xd0e0f0) : new THREE.Color(0x87ceeb);
    if (q.shadows) {
      this.light.castShadow = true;
      this.light.shadow.mapSize.width = this.quality >= 4 ? 2048 : 1024;
      this.light.shadow.mapSize.height = this.quality >= 4 ? 2048 : 1024;
    } else { this.light.castShadow = false; }
  }
  updateQualityLabel() { document.getElementById('q-label').textContent = QUALITY[this.quality].label; }

  // ── Race Start ──

  startRace() {
    this.diff = DIFFICULTIES[this.diffIndex];
    this.lapCount = this.diff.lapCount;
    this.aiSpeedMult = this.diff.aiSpeedMult;
    this.weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
    this.opponents = [];
    this.coins = [];

    const carCfg = CARS[this.carIndex];
    const eLv = this.getUpgradeLevel(this.carIndex, 'engine');
    const tLv = this.getUpgradeLevel(this.carIndex, 'tires');
    const trLv = this.getUpgradeLevel(this.carIndex, 'turbo');
    this.carSpeedMult = carCfg.stats[0] + eLv * 0.12;
    this.carHandlingMult = carCfg.stats[1] + tLv * 0.08;
    this.carAccelMult = carCfg.stats[2] + trLv * 0.10;
    this.nitroCharge = 1;
    this.nitroActive = false;
    this.nitroTimer = 0;

    this.clearScene();
    const track = buildTrack(this.trackIndex);
    this.scene.add(track.group);
    this.curve = track.curve;
    this.checkpoints = track.checkpoints;
    this.curveLength = track.curveLength;
    this.scene.add(buildEnvironment(this.curve));

    // Weather
    if (this.weather === 'RAINY') {
      this.scene.background.set(0x556677);
      this.scene.fog = new THREE.FogExp2(0x556677, 0.006);
      this.light.intensity = 0.7;
      this.rainMesh = createRainSystem(4000);
      this.scene.add(this.rainMesh);
    } else if (this.weather === 'CLOUDY') {
      this.scene.background.set(0x8899aa);
      this.scene.fog = new THREE.FogExp2(0x8899aa, 0.005);
      this.light.intensity = 0.9;
    } else {
      this.scene.background.set(0xd0e0f0);
      this.scene.fog = new THREE.FogExp2(0xd0e0f0, 0.004);
      this.light.intensity = 1.2;
    }

    // Player
    const startProg = 0;
    this.playerPos = getPointAt(this.curve, startProg, 1.5).clone();
    this.playerHeading = 0;
    this.playerSpeed = 0;
    this.playerSteer = 0;
    this.playerLap = 0;
    this.playerCheckpoint = 0;
    this.playerRoadDist = 0;
    this.playerOldProgress = startProg;
    this.playerMesh = createCar(this.carIndex);
    this.playerMesh.position.copy(this.playerPos);
    this.scene.add(this.playerMesh);

    // Opponents
    const numOpponents = OPPONENT_COUNTS[this.opponentCountIdx];
    for (let i = 0; i < numOpponents; i++) {
      const opProgress = this.diff.headStart * (i + 1) + Math.random() * 0.005;
      const aiIdx = Math.floor(Math.random() * Math.min(this.carIndex + 1, CARS.length));
      const pos = getPointAt(this.curve, opProgress, 1.5).clone();
      const mesh = createCar(aiIdx);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.opponents.push({
        pos, heading: 0, speed: 0, roadDist: opProgress * this.curveLength,
        lap: 0, checkpoint: 0, oldProgress: opProgress,
        pathProgress: opProgress,
        mesh, carIdx: aiIdx, knocked: 0, active: true,
        stuckTimer: 0, lastPos: pos.clone()
      });
    }

    // Coins
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.2 });
    for (let i = 0; i < COIN_COUNT; i++) {
      const t = i / COIN_COUNT + (Math.random() - 0.5) * 0.03;
      const lat = (Math.random() - 0.5) * 10;
      const pos = getPointAt(this.curve, ((t % 1) + 1) % 1, lat);
      const h = getRoadHeight(((t % 1) + 1) % 1) + 0.5;
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 8), coinMat);
      coin.position.set(pos.x, h, pos.z);
      coin.rotation.x = Math.PI / 2;
      this.scene.add(coin);
      this.coins.push({ mesh: coin, collected: false, t: ((t % 1) + 1) % 1 });
    }

    this.state = 'playing';
    this.raceActive = true;
    this.paused = false;
    this.currentLap = 1;
    this.elapsed = 0;
    this.raceResult = null;

    this.hideAll();
    document.getElementById('hud').classList.remove('hidden');
  }

  clearScene() {
    this.opponents = [];
    this.coins = [];
    this.rainMesh = null;
    const keep = new Set();
    keep.add(this.camera);
    keep.add(this.light);
    keep.add(this.light.target);
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const c = this.scene.children[i];
      if (keep.has(c)) continue;
      this.scene.remove(c);
    }
  }

  hideAll() {
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    document.getElementById('hud').classList.add('hidden');
  }

  get throttle() { return this.keys.get('KeyW') || this.keys.get('ArrowUp') ? 1 : 0; }
  get brake() { return this.keys.get('KeyS') || this.keys.get('ArrowDown') ? 1 : 0; }
  get steerInput() {
    let s = 0;
    if (this.keys.get('KeyA') || this.keys.get('ArrowLeft')) s -= 1;
    if (this.keys.get('KeyD') || this.keys.get('ArrowRight')) s += 1;
    return s;
  }
  get handbrake() { return this.keys.get('Space') ? true : false; }
  get driftInput() { return this.handbrake || (this.brake > 0 && this.steerInput !== 0); }

  getPositionScore(car) { return car.lap + car.roadDist / this.curveLength; }

  // ── Player Update ──

  updatePlayer(dt) {
    const accelMult = this.carAccelMult || 1;
    const speedMult = this.carSpeedMult || 1;
    const handleMult = this.carHandlingMult || 1;

    // Steering
    const targetAngle = this.steerInput * 0.8;
    if (Math.abs(this.steerInput) > 0.01) {
      this.playerSteer += (targetAngle - this.playerSteer) * Math.min(1, STEER_SPEED * dt);
    } else {
      this.playerSteer *= (1 - STEER_RETURN * dt);
      if (Math.abs(this.playerSteer) < 0.001) this.playerSteer = 0;
    }

    // Speed
    if (this.throttle > 0) {
      if (this.playerSpeed < 0) this.playerSpeed += BRAKE * dt;
      else this.playerSpeed += ACCEL * this.throttle * dt * accelMult;
    }
    if (this.brake > 0) {
      if (this.playerSpeed > 0) {
        this.playerSpeed -= BRAKE * this.brake * dt;
        if (this.playerSpeed < 0) this.playerSpeed = 0;
      } else {
        this.playerSpeed -= ACCEL * 0.5 * this.brake * dt;
      }
    }
    this.playerSpeed -= DRAG * this.playerSpeed * Math.abs(this.playerSpeed) * dt;
    if (Math.abs(this.playerSpeed) < 0.5 && !this.throttle && !this.brake) this.playerSpeed = 0;
    this.playerSpeed = Math.max(-MAX_REVERSE, Math.min(MAX_SPEED * speedMult, this.playerSpeed));

    // Nitro
    const nitroLv = this.getNitroLevel();
    if (nitroLv > 0) {
      if (this.nitroActive) {
        this.nitroTimer -= dt;
        this.playerSpeed += ACCEL * 0.8 * dt;
        this.nitroCharge = Math.max(0, this.nitroTimer / NITRO_DURATIONS[nitroLv]);
        if (this.nitroTimer <= 0) {
          this.nitroActive = false;
          this.nitroCharge = 0;
        }
      } else {
        this.nitroCharge = Math.min(1, this.nitroCharge + dt / NITRO_RECHARGE[nitroLv]);
        if ((this.keys.get('ShiftLeft') || this.keys.get('ShiftRight')) && this.nitroCharge > 0.05) {
          this.nitroActive = true;
          this.nitroTimer = NITRO_DURATIONS[nitroLv] * this.nitroCharge;
          this.nitroCharge = 0;
        }
      }
    }

    // Drift
    const drifting = this.driftInput && Math.abs(this.playerSpeed) > 10;
    const effectiveSteer = this.playerSteer * (drifting ? 1.8 : 1.0);

    // Rotation
    const rotSpeed = effectiveSteer * Math.min(Math.abs(this.playerSpeed) * 0.022 * handleMult, 2.5 * handleMult);
    this.playerHeading += rotSpeed * dt;

    let slideAngle = 0;
    if (drifting) {
      slideAngle = this.playerSteer * 0.3 * (this.playerSpeed / MAX_SPEED);
      this.playerHeading -= slideAngle * dt * 0.3;
    }

    // Movement
    const fwd = new THREE.Vector3(Math.sin(this.playerHeading), 0, Math.cos(this.playerHeading));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);
    this.playerPos.x += (fwd.x * this.playerSpeed + right.x * slideAngle * 10) * dt;
    this.playerPos.z += (fwd.z * this.playerSpeed + right.z * slideAngle * 10) * dt;

    // Road-distance tracking
    const prog = getProgress(this.playerPos, this.curve);
    const roadH = getRoadHeight(prog);
    this.playerPos.y += (roadH + 0.3 - this.playerPos.y) * 0.2;
    let delta2 = prog - this.playerOldProgress;
    if (delta2 > 0.5) delta2 -= 1;
    else if (delta2 < -0.5) delta2 += 1;
    this.playerRoadDist += delta2 * this.curveLength;
    if (this.playerRoadDist > this.curveLength) { this.playerRoadDist -= this.curveLength; this.playerLap++; }
    if (this.playerRoadDist < 0) { this.playerRoadDist += this.curveLength; this.playerLap--; }
    this.playerOldProgress = prog;

    // Anti-stuck for player
    if (!this._playerStuckTimer) this._playerStuckTimer = 0;
    if (!this._playerLastPos) this._playerLastPos = this.playerPos.clone();
    const pdX = this.playerPos.x - this._playerLastPos.x;
    const pdZ = this.playerPos.z - this._playerLastPos.z;
    if (pdX * pdX + pdZ * pdZ < 0.01) {
      this._playerStuckTimer += dt;
      if (this._playerStuckTimer > ANTI_STUCK_TIME && Math.abs(this.playerSpeed) < 2) {
        const nudgeProg = (prog + 0.02) % 1;
        const nudgeP = getPointAt(this.curve, nudgeProg, 1.0);
        this.playerPos.x = nudgeP.x; this.playerPos.z = nudgeP.z;
        this.playerSpeed = 15;
        this.playerHeading = 0;
        this._playerStuckTimer = 0;
      }
    } else {
      this._playerStuckTimer = 0;
    }
    this._playerLastPos.copy(this.playerPos);

    // Coins
    for (const c of this.coins) {
      if (c.collected) continue;
      const dx = this.playerPos.x - c.mesh.position.x;
      const dz = this.playerPos.z - c.mesh.position.z;
      if (dx * dx + dz * dz < 4) {
        c.collected = true;
        this.scene.remove(c.mesh);
        this.money += 25;
        localStorage.setItem('racer_money', String(this.money));
      }
    }

    // Checkpoints
    const cp = this.checkpoints[this.playerCheckpoint % this.checkpoints.length];
    if (cp) {
      const ddx = this.playerPos.x - cp.position.x;
      const ddz = this.playerPos.z - cp.position.z;
      if (ddx * ddx + ddz * ddz < 64) {
        this.playerCheckpoint++;
        if (this.playerCheckpoint % this.checkpoints.length === 0) {
          if (this.playerLap > 0) {
            this.currentLap++;
            if (this.currentLap > this.lapCount) { this.finishRace(); return; }
          }
        }
      }
    }

    // Wall collision
    const ct = getProgress(this.playerPos, this.curve);
    const closest = this.curve.getPoint(ct);
    const tg = this.curve.getTangent(ct);
    const nx = -tg.z, nz = tg.x;
    const len = Math.sqrt(nx * nx + nz * nz);
    const xn = nx / len, zn = nz / len;
    const dxc = this.playerPos.x - closest.x;
    const dzc = this.playerPos.z - closest.z;
    const lateral = dxc * xn + dzc * zn;
    if (Math.abs(lateral) > 7 - WALL_RADIUS) {
      const sign = lateral > 0 ? 1 : -1;
      this.playerPos.x -= xn * sign * (Math.abs(lateral) - (7 - WALL_RADIUS) + 0.05);
      this.playerPos.z -= zn * sign * (Math.abs(lateral) - (7 - WALL_RADIUS) + 0.05);
      this.playerSpeed *= 0.6;
    }

    // Car-to-car collision
    for (const op of this.opponents) {
      if (!op.active) continue;
      const dx2 = this.playerPos.x - op.pos.x;
      const dz2 = this.playerPos.z - op.pos.z;
      const dist = Math.sqrt(dx2 * dx2 + dz2 * dz2);
      if (dist < COLLISION_RADIUS) {
        const overlap = COLLISION_RADIUS - dist;
        const nx2 = dx2 / dist, nz2 = dz2 / dist;
        this.playerPos.x += nx2 * overlap * 0.25;
        this.playerPos.z += nz2 * overlap * 0.25;
        this.playerSpeed *= 0.85;
        op.pos.x -= nx2 * overlap * 1.5;
        op.pos.z -= nz2 * overlap * 1.5;
        op.knocked = 1.0;
        op.speed *= 0.5;
      }
    }
  }

  // ── Opponent AI ──

  updateOpponents(dt) {
    for (const op of this.opponents) {
      if (!op.active) continue;

      // Target speed from car stats + difficulty
      const carCfg = CARS[op.carIdx];
      const eLv = this.getUpgradeLevel(op.carIdx, 'engine');
      const tLv = this.getUpgradeLevel(op.carIdx, 'tires');
      const trLv = this.getUpgradeLevel(op.carIdx, 'turbo');
      const aiSpeedM = carCfg.stats[0] + eLv * 0.12;
      const aiAccelM = carCfg.stats[2] + trLv * 0.10;
      const targetSpeed = MAX_SPEED * aiSpeedM * this.aiSpeedMult * 0.6;

      // Advance path ghost
      if (op.knocked > 0) {
        op.knocked -= dt;
        op.speed = targetSpeed * 0.65;
      } else {
        op.speed = targetSpeed;
      }
      op.pathProgress = (op.pathProgress + op.speed * dt / this.curveLength) % 1;

      // Ideal position on center of track
      const pathTangent = this.curve.getTangent(op.pathProgress);
      const pathPos = getPointAt(this.curve, op.pathProgress, 0);
      pathPos.y = getRoadHeight(op.pathProgress) + 0.3;

      if (op.knocked <= 0) {
        // Locked to perfect path
        op.pos.copy(pathPos);
        op.heading = Math.atan2(pathTangent.x, pathTangent.z);
      } else {
        // Recover toward path (smooth spring-back)
        op.pos.x += (pathPos.x - op.pos.x) * Math.min(1, dt * 3);
        op.pos.z += (pathPos.z - op.pos.z) * Math.min(1, dt * 3);
        op.pos.y += (pathPos.y - op.pos.y) * 0.2;
        const ph = Math.atan2(pathTangent.x, pathTangent.z);
        let hd = ph - op.heading;
        while (hd > Math.PI) hd -= Math.PI * 2;
        while (hd < -Math.PI) hd += Math.PI * 2;
        op.heading += hd * Math.min(1, dt * 3);
      }

      // Anti-stuck (safety)
      if (op.knocked > 0) {
        const dxs = op.pos.x - op.lastPos.x;
        const dzs = op.pos.z - op.lastPos.z;
        if (dxs * dxs + dzs * dzs < 0.005) {
          op.stuckTimer += dt;
          if (op.stuckTimer > ANTI_STUCK_TIME) {
            const nt = (op.pathProgress + 0.03) % 1;
            const np = getPointAt(this.curve, nt, 0);
            np.y = getRoadHeight(nt) + 0.3;
            op.pos.copy(np);
            op.speed = targetSpeed * 0.3;
            op.stuckTimer = 0;
          }
        } else { op.stuckTimer = 0; }
      }
      op.lastPos.copy(op.pos);

      // Road distance for scoring (from actual position)
      const roadT = getProgress(op.pos, this.curve);
      let delta = roadT - op.oldProgress;
      if (delta > 0.5) delta -= 1;
      else if (delta < -0.5) delta += 1;
      op.roadDist += delta * this.curveLength;
      if (op.roadDist > this.curveLength) { op.roadDist -= this.curveLength; op.lap++; }
      else if (op.roadDist < 0) { op.roadDist += this.curveLength; op.lap--; }
      op.oldProgress = roadT;
    }
  }

  // ── Mesh Updates ──

  updateMeshes(dt) {
    // Player
    this.playerMesh.position.copy(this.playerPos);
    let diff = (this.playerHeading - Math.PI / 2) - this.playerMesh.rotation.y;
    if (diff > Math.PI) diff -= Math.PI * 2;
    else if (diff < -Math.PI) diff += Math.PI * 2;
    this.playerMesh.rotation.y += diff * 0.3;

    if (Math.abs(this.playerSpeed) > 1) {
      const spin = this.playerSpeed * dt * 3;
      for (const child of this.playerMesh.children) {
        if (child.userData && child.userData.isWheel && child.children.length > 0)
          child.children[0].rotation.z -= spin;
      }
    }

    // Opponents
    for (const op of this.opponents) {
      op.mesh.position.copy(op.pos);
      let ad = (op.heading - Math.PI / 2) - op.mesh.rotation.y;
      if (ad > Math.PI) ad -= Math.PI * 2;
      else if (ad < -Math.PI) ad += Math.PI * 2;
      op.mesh.rotation.y += ad * 0.3;

      if (Math.abs(op.speed) > 1) {
        const spin = op.speed * dt * 3;
        for (const child of op.mesh.children) {
          if (child.userData && child.userData.isWheel && child.children.length > 0)
            child.children[0].rotation.z -= spin;
        }
      }

      const dx = op.mesh.position.x - this.camera.position.x;
      const dz = op.mesh.position.z - this.camera.position.z;
      op.mesh.visible = (dx * dx + dz * dz) < 90000;
    }
  }

  // ── Camera ──

  updateCamera(dt) {
    const offset = new THREE.Vector3(0, 6, -10);
    const targetPos = this.playerPos.clone().add(
      new THREE.Vector3(Math.sin(this.playerHeading) * offset.z, offset.y, Math.cos(this.playerHeading) * offset.z)
    );
    this.camera.position.lerp(targetPos, 6 * dt);
    const look = this.playerPos.clone().add(
      new THREE.Vector3(Math.sin(this.playerHeading) * 5, 1.5, Math.cos(this.playerHeading) * 5)
    );
    this.camera.lookAt(look);
    this.light.position.set(this.camera.position.x + 60, 80, this.camera.position.z + 40);
    this.light.target.position.copy(this.camera.position);
    this.light.target.updateMatrixWorld();
  }

  // ── Race End ──

  finishRace() {
    this.raceActive = false;
    this.state = 'gameover';

    // Compute final position among all cars
    const scores = [{ name: 'PLAYER', score: this.getPositionScore({ lap: this.playerLap, roadDist: this.playerRoadDist }), won: true }];
    for (const op of this.opponents) {
      scores.push({ name: 'OP', score: this.getPositionScore(op), won: false });
    }
    scores.sort((a, b) => b.score - a.score);
    const playerPos = scores.findIndex(s => s.name === 'PLAYER') + 1;
    const totalCars = scores.length;
    const won = playerPos === 1;

    this.raceResult = { won, position: playerPos, total: totalCars, time: this.elapsed };

    const xpGain = Math.round((won ? 100 : Math.max(10, 50 - (playerPos - 1) * 10)) * this.diff.rewardMult);
    const moneyGain = Math.round((won ? 200 : Math.max(25, 100 - (playerPos - 1) * 20)) * this.diff.rewardMult);
    this.xp += xpGain;
    this.money += moneyGain;
    localStorage.setItem('racer_xp', String(this.xp));
    localStorage.setItem('racer_money', String(this.money));
    this.level = this.calcLevel(this.xp);

    this.hideAll();
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('result-title').textContent = won ? 'YOU WIN!' : `#${playerPos} OF ${totalCars}`;
    document.getElementById('result-pos').textContent = `#${playerPos}`;
    document.getElementById('result-xp').textContent = `+${xpGain} XP`;
    document.getElementById('result-level').textContent = `LEVEL ${this.level}`;
    document.getElementById('result-money').textContent = `+$${moneyGain}`;
    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60);
    const ms = Math.floor((this.elapsed % 1) * 10);
    document.getElementById('result-time').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${ms}`;
  }

  backToMenu() {
    this.clearScene();
    this.state = 'menu';
    this.raceActive = false;
    this.hideAll();
    document.getElementById('menu').classList.remove('hidden');
    this.updateTrackLabel();
    this.updateDiffLabel();
    this.updateCarLabel();
    this.updateMoneyLabel();
  }

  updateHUD() {
    const speed = Math.round(Math.abs(this.playerSpeed) * 1.2);
    document.getElementById('speed').textContent = String(speed).padStart(3, '0');
    document.getElementById('lap').textContent = `LAP ${this.currentLap}/${this.lapCount}`;

    // Position among all cars
    const scores = [{ name: 'P', score: this.getPositionScore({ lap: this.playerLap, roadDist: this.playerRoadDist }) }];
    for (const op of this.opponents) {
      if (op.active) scores.push({ name: 'O', score: this.getPositionScore(op) });
    }
    scores.sort((a, b) => b.score - a.score);
    const pos = scores.findIndex(s => s.name === 'P') + 1;
    document.getElementById('pos').textContent = `#${pos}/${scores.length}`;

    const mins = Math.floor(this.elapsed / 60);
    const secs = Math.floor(this.elapsed % 60);
    const ms = Math.floor((this.elapsed % 1) * 10);
    document.getElementById('timer').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${ms}`;
    document.getElementById('level').textContent = `LV ${this.level}`;
    document.getElementById('hud-money').textContent = `$${this.money}`;
    document.getElementById('hud-weather').textContent = this.weather;
    // Nitro gauge
    const nitroFill = document.getElementById('nitro-fill');
    if (nitroFill) {
      nitroFill.style.width = (this.nitroCharge * 100) + '%';
      nitroFill.style.background = this.nitroActive ? '#0ff' : '#f80';
    }
  }

  setProgress(pct) {
    const bar = document.getElementById('loading-bar');
    if (bar) bar.style.width = pct + '%';
  }
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.state === 'playing' && !this.paused) {
      this.elapsed += dt;
      if (this.rainMesh) updateRain(this.rainMesh, dt);
      this.updatePlayer(dt);
      this.updateOpponents(dt);
      this.updateMeshes(dt);
      this.updateCamera(dt);
      this.updateHUD();
    }
    this.renderer.render(this.scene, this.camera);
  }
}

// Start
const game = new Game();
game.init().catch(console.error);
