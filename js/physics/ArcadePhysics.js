import * as THREE from 'three';
import { DriftModel } from './DriftModel.js';

const MAX_SPEED = 180;
const ACCELERATION = 80;
const BRAKE_FORCE = 120;
const DRAG_COEFF = 0.03;
const STEER_SPEED = 3.0;
const STEER_RETURN = 5.0;

export class CarPhysics {
  constructor(trackBuilder) {
    this.track = trackBuilder;
    this.drift = new DriftModel();

    this.position = new THREE.Vector3(0, 1, 40);
    this.velocity = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.steerAngle = 0;
    this.steerInput = 0;
    this.throttle = 0;
    this.brake = 0;
    this.handbrake = false;
    this.rpm = 800;
    this.progress = 0;
    this.onGround = true;
    this.lapCompleted = 0;
    this.checkpointIndex = 0;
    this._cachedProgressT = 0;
  }

  reset(position, heading) {
    this.position.copy(position);
    this.heading = heading;
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.steerAngle = 0;
    this.progress = 0;
    this.lapCompleted = 0;
    this.checkpointIndex = 0;
    this._cachedProgressT = 0;
    this._adaptiveThrottle = undefined;
  }

  update(dt, input, trackCurve) {
    this.throttle = input.throttle;
    this.brake = input.brake;
    this.steerInput = input.steer;
    this.handbrake = input.handbrake;

    const targetAngle = this.steerInput * 0.8;
    if (Math.abs(this.steerInput) > 0.01) {
      this.steerAngle += (targetAngle - this.steerAngle) * Math.min(1, STEER_SPEED * dt);
    } else {
      this.steerAngle *= (1 - STEER_RETURN * dt);
      if (Math.abs(this.steerAngle) < 0.001) this.steerAngle = 0;
    }

    if (this.throttle > 0) {
      this.speed += ACCELERATION * this.throttle * dt;
    }
    if (this.brake > 0 && this.speed > 0) {
      this.speed -= BRAKE_FORCE * this.brake * dt;
      if (this.speed < 0) this.speed = 0;
    }

    const drag = DRAG_COEFF * this.speed * this.speed * dt;
    this.speed -= drag;
    if (this.speed < 0 && !(this.throttle > 0)) this.speed = 0;
    this.speed = Math.max(-30, Math.min(MAX_SPEED, this.speed));

    const driftResult = this.drift.update(this, dt);

    const turnRadius = this.steerAngle * (this.handbrake ? 2.5 : 1.0);
    const rotationSpeed = turnRadius * Math.min(Math.abs(this.speed) * 0.02, 3.0);
    this.heading += rotationSpeed * dt * (this.speed >= 0 ? 1 : -1);

    if (driftResult.isDrifting) {
      this.heading += driftResult.slipAngle * dt * 0.5;
    }

    const fwd = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

    this.position.x += (fwd.x * this.speed + right.x * driftResult.lateralOffset.x * 2) * dt;
    this.position.z += (fwd.z * this.speed + right.z * driftResult.lateralOffset.x * 2) * dt;

    this.rpm = 800 + (Math.abs(this.speed) / MAX_SPEED) * 6000;

    if (trackCurve) {
      this.snapToGround();
      this.progress = this.track.getProgress(this.position);
    }
  }

  snapToGround() {
    const targetY = 0.3;
    this.position.y += (targetY - this.position.y) * 0.2;
  }

  checkCheckpoint(checkpoints) {
    const cp = checkpoints[this.checkpointIndex % checkpoints.length];
    if (!cp) return false;
    const dx = this.position.x - cp.position.x;
    const dz = this.position.z - cp.position.z;
    if ((dx * dx + dz * dz) < 64) {
      this.checkpointIndex++;
      if (this.checkpointIndex % checkpoints.length === 0) {
        this.lapCompleted++;
        return true;
      }
    }
    return false;
  }
}

export class ArcadePhysics {
  constructor(trackBuilder) {
    this.track = trackBuilder;
    this.playerCar = new CarPhysics(trackBuilder);
    this.aiCars = [];
    this._aiThrottle = 0.7;
    this._aiSkill = 0.5;
  }

  initPlayer(position, heading) {
    this.playerCar.reset(position, heading);
  }

  initAI(count) {
    this.aiCars = [];
    for (let i = 0; i < count; i++) {
      const ai = new CarPhysics(this.track);
      const t = (i + 1) / (count + 1);
      const pos = this.track.getPointAtProgress(t, 1.5);
      ai.reset(pos, 0);
      ai.isAI = true;
      this.aiCars.push(ai);
    }
  }

  updateAI(ai, dt, trackCurve, checkpoints) {
    const targetT = (ai.progress + 0.02) % 1.0;
    const target = this.track.getPointAtProgress(targetT, 1.0 + Math.sin(ai.progress * 30) * 0.5);
    const dx = target.x - ai.position.x;
    const dz = target.z - ai.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 0.25) {
      ai.progress = (ai.progress + 0.005) % 1.0;
    }

    const targetAngle = Math.atan2(dx, dz);
    let angleDiff = targetAngle - ai.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const throttleBase = ai._adaptiveThrottle !== undefined ? ai._adaptiveThrottle : this._aiThrottle;
    const jitter = (Math.random() - 0.5) * 0.1;
    const noise = (Math.random() - 0.5) * 0.15;
    const aiInput = {
      throttle: Math.max(0.3, Math.min(1.0, throttleBase + jitter)),
      brake: angleDiff > 0.5 ? 0.3 : 0,
      steer: Math.max(-1, Math.min(1, angleDiff * 2 + noise)),
      handbrake: Math.abs(angleDiff) > 0.8 && ai.speed > 40
    };

    const prevT = ai.progress;
    ai.progress = this.track.getProgress(ai.position);
    if (ai.progress < 0.1 && prevT > 0.9) {
      ai.lapCompleted++;
    }

    const cp = checkpoints[ai.checkpointIndex % checkpoints.length];
    if (cp) {
      const dx2 = ai.position.x - cp.position.x;
      const dz2 = ai.position.z - cp.position.z;
      if ((dx2 * dx2 + dz2 * dz2) < 64) {
        ai.checkpointIndex++;
      }
    }

    ai.update(dt, aiInput, trackCurve);
  }

  getAllCars() {
    return [this.playerCar, ...this.aiCars];
  }
}
