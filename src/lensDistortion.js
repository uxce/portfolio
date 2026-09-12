import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const FishEyeShader = {
  uniforms: {
    tDiffuse: { value: null },
    strength: { value: 0.30 },
    zoom: { value: 1.12 },
  },
  vertexShader:  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader:  `
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform float zoom;
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv * 2.0 - 1.0;
      float r2 = dot(centered, centered);
      vec2 warped = centered * (1.0 + strength * r2);
      warped /= zoom;
      vec2 uv = warped * 0.5 + 0.5;

      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        gl_FragColor = texture2D(tDiffuse, uv);
      }
    }
  `,
};

export function createLensDistortion(renderer, scene, camera, width, height) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const fisheyePass = new ShaderPass(FishEyeShader);
  fisheyePass.renderToScreen = true;
  composer.addPass(fisheyePass);

  composer.setSize(width, height);

  return {
    composer,
    setSize: (w, h) => composer.setSize(w, h),

    uniforms: fisheyePass.uniforms,
  };
}