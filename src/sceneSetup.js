import * as THREE from 'three';
import { createLensDistortion } from './lensDistortion.js';
import { INTRO_CAM_POS, INTRO_CAM_TARGET } from './positions.js';

export function createSceneSetup() {
  const screenFrame = document.getElementById('screenFrame');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0806);

  const camera = new THREE.PerspectiveCamera(45, screenFrame.clientWidth / screenFrame.clientHeight, 0.1, 1000);

  camera.position.copy(INTRO_CAM_POS);
  camera.lookAt(INTRO_CAM_TARGET);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(screenFrame.clientWidth, screenFrame.clientHeight);
  screenFrame.appendChild(renderer.domElement);

  const lens = createLensDistortion(renderer, scene, camera, screenFrame.clientWidth, screenFrame.clientHeight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.35);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const resizeObserver = new ResizeObserver(() => {
    const w = screenFrame.clientWidth;
    const h = screenFrame.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    lens.setSize(w, h);
  });
  resizeObserver.observe(screenFrame);

  return { scene, camera, renderer, lens, screenFrame };
}