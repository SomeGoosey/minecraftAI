import { CarBuilder } from '../procedural/CarBuilder.js';
import { TrackBuilder } from '../procedural/TrackBuilder.js';
import { EnvironmentBuilder } from '../procedural/EnvironmentBuilder.js';

export class AssetManager {
  constructor(scene) {
    this.scene = scene;
    this.carBuilder = new CarBuilder();
    this.trackBuilder = new TrackBuilder();
    this.envBuilder = new EnvironmentBuilder(scene);

    this.playerCar = null;
    this.aiCars = [];
    this.trackGroup = null;
    this.envGroup = null;
  }

  async loadAll(loadingScreen) {
    loadingScreen.setProgress(0, 'GENERATING TRACK...');

    await this.delay(50);
    this.trackGroup = await this.trackBuilder.build();
    this.scene.add(this.trackGroup);
    loadingScreen.setProgress(25, 'TRACK GENERATED');

    loadingScreen.setProgress(35, 'CONSTRUCTING ENVIRONMENT...');
    await this.delay(50);
    this.envGroup = this.envBuilder.build();
    this.scene.add(this.envGroup);
    loadingScreen.setProgress(55, 'ENVIRONMENT READY');

    loadingScreen.setProgress(60, 'BUILDING PLAYER CAR...');
    await this.delay(50);
    this.playerCar = this.carBuilder.buildCar('#e03030');
    this.scene.add(this.playerCar);
    loadingScreen.setProgress(75, 'PLAYER CAR READY');

    loadingScreen.setProgress(80, 'BUILDING COMPETITORS...');
    await this.delay(50);
    const colors = ['#2244cc', '#22aa44', '#ff8800'];
    for (let i = 0; i < 2; i++) {
      const aiCar = this.carBuilder.buildCar(colors[i % colors.length]);
      this.aiCars.push(aiCar);
      this.scene.add(aiCar);
    }
    loadingScreen.setProgress(95, 'COMPETITORS DEPLOYED');

    await this.delay(100);
    loadingScreen.setProgress(100, 'READY TO RACE!');
    await this.delay(300);
  }

  getPlayerCarMesh() {
    return this.playerCar;
  }

  getAICarMeshes() {
    return this.aiCars;
  }

  getTrackBuilder() {
    return this.trackBuilder;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
