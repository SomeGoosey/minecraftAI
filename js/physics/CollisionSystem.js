import * as THREE from 'three';
import { bus } from '../state/EventBus.js';

const MAX_SPEED = 180;

export class CollisionSystem {
  constructor(trackBuilder) {
    this.track = trackBuilder;
    this.wallRadius = 2.0;
    this.carRadius = 2.0;
  }

  update(cars) {
    for (let i = 0; i < cars.length; i++) {
      this.checkWall(cars[i]);
      for (let j = i + 1; j < cars.length; j++) {
        this.checkCar(cars[i], cars[j]);
      }
    }
  }

  checkWall(car) {
    const t = this.track.getProgress(car.position);
    const closest = this.track.trackCurve.getPoint(t);
    const tangent = this.track.trackCurve.getTangent(t);
    const nx = -tangent.z;
    const nz = tangent.x;
    const len = Math.sqrt(nx * nx + nz * nz);
    const nxn = nx / len;
    const nzn = nz / len;

    const dx = car.position.x - closest.x;
    const dz = car.position.z - closest.z;
    const lateral = dx * nxn + dz * nzn;

    const halfWidth = this.track.trackWidth / 2;

    if (Math.abs(lateral) > halfWidth - this.wallRadius) {
      const sign = lateral > 0 ? 1 : -1;
      const overlap = Math.abs(lateral) - (halfWidth - this.wallRadius);
      car.position.x -= nxn * sign * (overlap + 0.1);
      car.position.z -= nzn * sign * (overlap + 0.1);

      const dot = car.velocity.x * nxn * sign + car.velocity.z * nzn * sign;
      if (dot < 0) {
        car.velocity.x -= nxn * sign * dot * 0.5;
        car.velocity.z -= nzn * sign * dot * 0.5;
      }

      if (car.speed > 20) {
        car.speed *= 0.5;
        bus.emit('collision', {
          force: Math.min(car.speed / MAX_SPEED, 1.0),
          position: car.position.clone()
        });
      }
      return true;
    }
    return false;
  }

  checkCar(carA, carB) {
    const dx = carA.position.x - carB.position.x;
    const dz = carA.position.z - carB.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < (this.carRadius * 2) * (this.carRadius * 2)) {
      const dist = Math.sqrt(distSq);
      const pushX = dx / dist;
      const pushZ = dz / dist;
      const overlap = this.carRadius * 2 - dist;

      const totalMass = 2;
      carA.position.x += pushX * overlap * 0.5;
      carA.position.z += pushZ * overlap * 0.5;
      carB.position.x -= pushX * overlap * 0.5;
      carB.position.z -= pushZ * overlap * 0.5;

      const relVx = carA.velocity.x - carB.velocity.x;
      const relVz = carA.velocity.z - carB.velocity.z;
      const relVn = relVx * pushX + relVz * pushZ;
      if (relVn > 0) {
        carA.velocity.x -= pushX * relVn * 0.5;
        carA.velocity.z -= pushZ * relVn * 0.5;
        carB.velocity.x += pushX * relVn * 0.5;
        carB.velocity.z += pushZ * relVn * 0.5;
      }

      const avgSpeed = (Math.abs(carA.speed) + Math.abs(carB.speed)) * 0.5;
      carA.speed *= 0.85;
      carB.speed *= 0.85;

      if (avgSpeed > 30) {
        bus.emit('collision', {
          force: Math.min(avgSpeed / MAX_SPEED, 0.8),
          position: carA.position.clone().add(carB.position).multiplyScalar(0.5)
        });
      }
      return true;
    }
    return false;
  }
}
