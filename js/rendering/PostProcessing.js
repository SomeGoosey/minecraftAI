import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = null;
    this.renderPass = null;
    this.ssaoPass = null;
    this.fxaaPass = null;
    this.ready = false;
  }

  async init() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(w, h);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.composer.addPass(new OutputPass());

    this.ready = true;
  }

  async applyQuality(preset) {
    if (!this.composer) return;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Remove all passes except the base render pass
    while (this.composer.passes.length > 1) {
      this.composer.removePass(this.composer.passes[this.composer.passes.length - 1]);
    }
    if (this.ssaoPass) { this.ssaoPass = null; }
    if (this.fxaaPass) { this.fxaaPass = null; }

    if (preset.ssao) {
      await this.tryAddSSAO(w, h);
    }

    if (preset.fxaa) {
      await this.tryAddFXAA(w, h);
    }

    this.composer.addPass(new OutputPass());
  }

  async tryAddSSAO(w, h) {
    try {
      const { SSAOPass } = await import('three/addons/postprocessing/SSAOPass.js');
      const pass = new SSAOPass(this.scene, this.camera, w, h);
      pass.kernelRadius = 3;
      pass.minDistance = 0.02;
      pass.maxDistance = 0.08;
      pass.output = SSAOPass.OUTPUT.Default;
      this.composer.addPass(pass);
      this.ssaoPass = pass;
    } catch (e) {
      // SSAO not available
    }
  }

  async tryAddFXAA(w, h) {
    try {
      const { FXAAShader } = await import('three/addons/shaders/FXAAShader.js');
      const pass = new ShaderPass(FXAAShader);
      const pixelRatio = this.renderer.getPixelRatio();
      pass.uniforms.resolution.value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
      this.composer.addPass(pass);
      this.fxaaPass = pass;
    } catch (e) {
      // FXAA not available
    }
  }

  setSize(w, h) {
    if (!this.ready) return;
    if (this.composer) this.composer.setSize(w, h);
    if (this.ssaoPass) {
      try { this.ssaoPass.setSize(w, h); } catch (e) { /* ignore */ }
    }
    if (this.fxaaPass) {
      const pixelRatio = this.renderer.getPixelRatio();
      this.fxaaPass.uniforms.resolution.value.set(1 / (w * pixelRatio), 1 / (h * pixelRatio));
    }
  }

  render() {
    if (this.composer && this.ready) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    if (this.composer) this.composer.dispose();
  }
}
