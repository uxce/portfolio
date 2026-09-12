import * as THREE from 'three';
import { keepOutsideCar } from './clipGuard.js';

export const HERO_SHOTS = [
  {
    startPos:    new THREE.Vector3(3.3, 0.4, 2.0),
    endPos:      new THREE.Vector3(3.3, 0.4, -2.0),
    startTarget: new THREE.Vector3(0.1, 0.95, 1.1),
    endTarget:   new THREE.Vector3(0.1, 0.95, -1.1),
    duration: 9000,
  },
  {

    startPos:    new THREE.Vector3(2.5, 0.38, 3.0),
    endPos:      new THREE.Vector3(1.8, 0.42, 2.1),
    startTarget: new THREE.Vector3(0.55, 0.85, 1.6),
    endTarget:   new THREE.Vector3(0.05, 0.85, 1.05),
    duration: 7000,
  },
  {

    startPos:    new THREE.Vector3(0, 0.45, 6.5),
    endPos:      new THREE.Vector3(0, 0.45, 4.6),
    startTarget: new THREE.Vector3(0, 0.62, 1.9),
    endTarget:   new THREE.Vector3(0, 0.62, 1.9),
    duration: 6500,
  },
  {
    startPos:    new THREE.Vector3(-2.5, 0.4, -2.9),
    endPos:      new THREE.Vector3(-1.8, 0.45, -2.0),
    startTarget: new THREE.Vector3(-0.5, 0.85, -1.5),
    endTarget:   new THREE.Vector3(-0.05, 0.85, -1.0),
    duration: 7000,
  },
];

export function createHeroLoop(camera) {
  const hud = document.getElementById('hud');

  let heroShotIndex = 0;
  let heroShotStart = 0;
  let started = false;

  function start() {
    heroShotIndex = 0;
    heroShotStart = performance.now();
    started = true;
    update();
    if (hud) hud.classList.add('visible');
  }

  function update() {

    if (!started) return;
    let shot = HERO_SHOTS[heroShotIndex];
    let elapsed = performance.now() - heroShotStart;

    if (elapsed >= shot.duration) {
      heroShotIndex = (heroShotIndex + 1) % HERO_SHOTS.length;
      heroShotStart = performance.now();
      shot = HERO_SHOTS[heroShotIndex];
      elapsed = 0;
    }

    const t = Math.min(elapsed / shot.duration, 1);
    camera.position.lerpVectors(shot.startPos, shot.endPos, t);
    keepOutsideCar(camera.position);
    const target = new THREE.Vector3().lerpVectors(shot.startTarget, shot.endTarget, t);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
  }

  function resetClock(now) {
    heroShotStart = now;
  }

  return { start, update, resetClock };
}