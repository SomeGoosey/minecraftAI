import * as THREE from 'three';

export class DriftModel {
  constructor() {
    this.driftFactor = 0;
    this.slipAngle = 0;
    this.driftAngle = 0;
    this.isDrifting = false;
    this.wasDrifting = false;
    this.driftScore = 0;
    this.lateralVelocity = new THREE.Vector3();
    this.sideFriction = 1.0;
  }

  update(car, dt) {
    const speed = car.speed;
    const steerInput = car.steerInput;
    const handbrake = car.handbrake;

    const steeringAngle = steerInput * 0.6;
    this.slipAngle = steeringAngle * (1 - Math.min(speed / 120, 0.8));

    const lateralForce = Math.sin(this.slipAngle) * speed * 0.3;
    const gripFactor = handbrake ? 0.2 : (1 - Math.min(speed / 200, 0.7));

    this.lateralVelocity.copy(car.velocity)
      .multiplyScalar(gripFactor * 0.05);

    const targetDrift = handbrake ? 0.8 : Math.abs(this.slipAngle) * 2;
    this.driftFactor += (targetDrift - this.driftFactor) * dt * 3;
    this.driftFactor = Math.max(0, Math.min(1, this.driftFactor));

    this.driftAngle += (this.slipAngle - this.driftAngle) * dt * 2;

    this.wasDrifting = this.isDrifting;
    this.isDrifting = this.driftFactor > 0.15;

    if (this.isDrifting && !this.wasDrifting) {
      this.driftScore = 0;
    }
    if (this.isDrifting) {
      this.driftScore += Math.abs(this.slipAngle) * speed * dt * 0.1;
    }

    return {
      lateralOffset: this.lateralVelocity.clone(),
      driftFactor: this.driftFactor,
      slipAngle: this.slipAngle,
      driftAngle: this.driftAngle,
      isDrifting: this.isDrifting,
      driftScore: this.driftScore
    };
  }
}
