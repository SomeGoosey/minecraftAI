import * as THREE from 'three';
import { CanvasTextureFactory } from './CanvasTextureFactory.js';

export class CarBuilder {
  constructor() {
    this.texFactory = new CanvasTextureFactory();
  }

  buildCar(color = '#e03030', position = new THREE.Vector3(0, 1, 0)) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      map: this.texFactory.carPaintTexture(color),
      roughness: 0.3,
      metalness: 0.8
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.4
    });

    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffdd44,
      emissive: 0xffdd44,
      emissiveIntensity: 0.3
    });

    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: 0xff0000,
      emissiveIntensity: 0.2
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.95,
      metalness: 0.0
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.2,
      metalness: 0.9
    });

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-0.85, -0.25);
    bodyShape.quadraticCurveTo(-0.7, -0.1, -0.5, -0.05);
    bodyShape.lineTo(-0.1, 0.15);
    bodyShape.quadraticCurveTo(0.0, 0.2, 0.1, 0.18);
    bodyShape.lineTo(0.7, 0.05);
    bodyShape.quadraticCurveTo(0.85, 0.0, 0.9, -0.05);
    bodyShape.lineTo(0.95, -0.15);
    bodyShape.lineTo(0.9, -0.25);
    bodyShape.lineTo(-0.9, -0.25);
    bodyShape.closePath();

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.04,
      bevelSegments: 2
    });
    bodyGeo.translate(0, 0, -0.45);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    group.add(body);

    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.45, 0.18);
    hoodShape.lineTo(0.65, 0.08);
    hoodShape.lineTo(0.7, 0.12);
    hoodShape.lineTo(0.3, 0.25);
    hoodShape.lineTo(-0.35, 0.25);
    hoodShape.closePath();
    const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, {
      depth: 0.85,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2
    });
    hoodGeo.translate(0, 0, -0.425);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.castShadow = true;
    group.add(hood);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.2, 0.75),
      glassMat
    );
    cabin.position.set(0.05, 0.35, 0);
    cabin.castShadow = true;
    group.add(cabin);

    const splitterShape = new THREE.Shape();
    splitterShape.moveTo(-0.1, -0.2);
    splitterShape.lineTo(0.98, -0.2);
    splitterShape.lineTo(0.98, -0.15);
    splitterShape.lineTo(-0.1, -0.15);
    splitterShape.closePath();
    const splitterGeo = new THREE.ExtrudeGeometry(splitterShape, {
      depth: 0.9, bevelEnabled: false
    });
    splitterGeo.translate(0, 0, -0.45);
    const splitter = new THREE.Mesh(splitterGeo, darkMat);
    group.add(splitter);

    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const spoiler = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.05, 0.15),
      spoilerMat
    );
    spoiler.position.set(-0.7, 0.45, 0);
    spoiler.castShadow = true;
    group.add(spoiler);

    const hl = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 6, 6),
      lightMat
    );
    hl.position.set(0.95, 0.0, 0);
    group.add(hl);

    const tl = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 6, 6),
      tailMat
    );
    tl.position.set(-0.88, 0.08, 0);
    group.add(tl);

    this.buildWheels(group, wheelMat, rimMat);

    group.position.copy(position);
    return group;
  }

  buildWheels(group, tireMat, rimMat) {
    const tireR = 0.18;
    const tireW = 0.12;
    const rimR = 0.10;
    const rimW = 0.06;

    const tireGeo = new THREE.CylinderGeometry(tireR, tireR, tireW, 12);
    const rimGeo = new THREE.CylinderGeometry(rimR, rimR, rimW, 8);

    const positions = [
      { x: 0.55, z: -0.5 },
      { x: 0.55, z: 0.5 },
      { x: -0.65, z: -0.5 },
      { x: -0.65, z: 0.5 }
    ];

    for (const pos of positions) {
      const wg = new THREE.Group();

      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.castShadow = true;
      wg.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.z = 0.01;
      wg.add(rim);

      wg.position.set(pos.x, -0.12, pos.z);
      wg.userData.isWheel = true;
      group.add(wg);
    }
  }
}
