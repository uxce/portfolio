import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { setCarClipBox } from './clipGuard.js';

const HEADLIGHT_COLOR = 0x9FD3FF;
const GAUGE_GLOW_COLOR = 0xFFF0DC;
const GAUGE_GLOW_RGBA = 'rgba(255,240,220,1)';

function makeGlowTexture(color) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color.replace('1)', '0.35)'));
  gradient.addColorStop(1, color.replace('1)', '0)'));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function makeGaugeGlow(scene, pos) {
  const light = new THREE.PointLight(GAUGE_GLOW_COLOR, 0.09, 0.25);
  light.position.copy(pos);
  scene.add(light);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(GAUGE_GLOW_RGBA),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.45,
  }));
  sprite.scale.set(0.05, 0.05, 0.05);
  sprite.position.copy(pos);
  scene.add(sprite);

  return { light, sprite };
}

export function loadCar({ scene, manager, screenTexture, onLoaded }) {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);

  loader.load('https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/models/car.glb', (gltf) => {
    const carModel = gltf.scene;
    scene.add(carModel);

    carModel.updateMatrixWorld(true);
    setCarClipBox(new THREE.Box3().setFromObject(carModel));

    const screenMesh = carModel.getObjectByName('Object_189');
    if (screenMesh) {
      screenMesh.material = new THREE.MeshBasicMaterial({ map: screenTexture, side: THREE.DoubleSide });

      const uvAttr = screenMesh.geometry.attributes.uv;
      if (uvAttr) {
        let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
        for (let i = 0; i < uvAttr.count; i++) {
          const u = uvAttr.getX(i);
          const v = uvAttr.getY(i);
          if (u < minU) minU = u;
          if (u > maxU) maxU = u;
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
        const spanU = maxU - minU || 1;
        const spanV = maxV - minV || 1;
        screenTexture.wrapS = THREE.RepeatWrapping;
        screenTexture.wrapT = THREE.RepeatWrapping;
        screenTexture.repeat.set(1 / spanU, 1 / spanV);
        screenTexture.offset.set(-minU / spanU, -minV / spanV);
      }

      const screenWorldPos = new THREE.Vector3();
      screenMesh.getWorldPosition(screenWorldPos);
      const screenSpillLight = new THREE.PointLight(0x6FD8FF, 0.6, 0.35, 2);
      screenSpillLight.position.copy(screenWorldPos);
      scene.add(screenSpillLight);
    }

    const headlightGeo = () => new THREE.PointLight(HEADLIGHT_COLOR, 2, 8);
    const headlightL = headlightGeo();
    const headlightR = headlightGeo();
    headlightL.position.set(0.58, 0.53, 2.11);
    headlightR.position.set(-0.58, 0.53, 2.11);
    scene.add(headlightL, headlightR);

    const DOME_LIGHT_COLOR = 0xFFCE7A;
    const domeLightObj = carModel.getObjectByName('Object_186');
    let domeLight = null;
    if (domeLightObj) {
      const domeWorldPos = new THREE.Vector3();
      domeLightObj.getWorldPosition(domeWorldPos);
      domeLight = new THREE.PointLight(DOME_LIGHT_COLOR, 1.8, 2.2, 2);
      domeLight.position.copy(domeWorldPos);
      scene.add(domeLight);
    }

    const gaugeGlass = carModel.getObjectByName('Object_311');
    if (gaugeGlass) {
      gaugeGlass.material.transparent = true;
      gaugeGlass.material.opacity = 0.35;
      gaugeGlass.material.depthWrite = false;
    }

    const gaugeGlows = {
      temp:  makeGaugeGlow(scene, new THREE.Vector3(-0.20, 0.74, 0.62)),
      rpm:   makeGaugeGlow(scene, new THREE.Vector3(-0.30, 0.73, 0.62)),
      speed: makeGaugeGlow(scene, new THREE.Vector3(-0.41, 0.73, 0.62)),
      fuel:  makeGaugeGlow(scene, new THREE.Vector3(-0.51, 0.74, 0.62)),
    };

    onLoaded({ carModel, headlightL, headlightR, domeLight, gaugeGlows });
  });
}