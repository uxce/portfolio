import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { easeInOutCubic } from './easing.js';
import { applyExteriorClipGuard } from './clipGuard.js';
import { interiorCamPos, interiorCamTarget, screenCamPos, screenCamTarget, heroCamTarget } from './positions.js';

export function createCameraRig({ camera, renderer, screenFrame, lens, kickFilterRepaint }) {
  const hud = document.getElementById('hud');
  const hudHint = document.querySelector('.hud-hint');
  const transitionFadeEl = document.getElementById('transitionFade');

  const TRANSITION_MS = 1600;
  const LOOK_SENSITIVITY = 0.0025;
  const MAX_PITCH = Math.PI / 2 - 0.1;
  const FREE_LOOK_IDLE_MS = 7000;
  const FISHEYE_EXTERIOR = { strength: 0.30, zoom: 1.12 };
  const FISHEYE_FLAT      = { strength: 0.0,  zoom: 1.0 };

  const SHELL_CROSSING_PAIRS = new Set([
    'exterior->interior', 'interior->exterior',
    'exterior->screen',   'screen->exterior',
    'freelook->interior', 'interior->freelook',
    'freelook->screen',   'screen->freelook',
  ]);

  const HARD_CUT_PAIRS = new Set(['exterior->screen', 'screen->exterior', 'freelook->screen', 'screen->freelook']);

  let camState = 'exterior';
  let controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(heroCamTarget);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 16;
  controls.minPolarAngle = Math.PI / 6;
  controls.maxPolarAngle = Math.PI / 1.9;
  controls.enabled = false;
  controls.update();

  let hooks = { onEnterScreen: () => {}, onEnterExterior: () => {}, onIdleFromFreeLook: () => {} };
  const transitionStartListeners = [];

  let calibrating = false;
  function setCalibrating(v) { calibrating = v; }
  function isCalibrating() { return calibrating; }

  let lookYaw = 0;
  let lookPitch = 0;
  let isLooking = false;
  let lastPointerX = 0;
  let lastPointerY = 0;

  function setLookFromDirection(fromPos, toTarget) {
    const dir = new THREE.Vector3().subVectors(toTarget, fromPos).normalize();
    lookPitch = Math.asin(dir.y);
    lookYaw = Math.atan2(dir.x, dir.z);
  }

  function applyLook() {
    const dir = new THREE.Vector3(
      Math.cos(lookPitch) * Math.sin(lookYaw),
      Math.sin(lookPitch),
      Math.cos(lookPitch) * Math.cos(lookYaw)
    );
    camera.position.copy(interiorCamPos);
    camera.lookAt(interiorCamPos.clone().add(dir));
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (camState === 'interior') {
      isLooking = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    }
  });
  window.addEventListener('pointerup', () => { isLooking = false; });
  window.addEventListener('pointermove', (e) => {
    if (!isLooking || camState !== 'interior') return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    lookYaw -= dx * LOOK_SENSITIVITY;
    lookPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, lookPitch - dy * LOOK_SENSITIVITY));
  });

  let freeLookIdleTimer = null;
  function clearFreeLookIdleTimer() {
    if (freeLookIdleTimer) {
      clearTimeout(freeLookIdleTimer);
      freeLookIdleTimer = null;
    }
  }
  function armFreeLookIdleTimer() {
    clearFreeLookIdleTimer();
    freeLookIdleTimer = setTimeout(() => {
      if (camState === 'freelook') hooks.onIdleFromFreeLook();
    }, FREE_LOOK_IDLE_MS);
  }
  function resetFreeLookIdleTimer() {
    if (camState === 'freelook') armFreeLookIdleTimer();
  }
  renderer.domElement.addEventListener('pointerdown', resetFreeLookIdleTimer);
  renderer.domElement.addEventListener('pointermove', resetFreeLookIdleTimer);
  renderer.domElement.addEventListener('wheel', resetFreeLookIdleTimer, { passive: true });

  let transitionFadeTimer = null;
  function flashTransitionMask(durationMs = 260) {
    if (!transitionFadeEl) return;
    transitionFadeEl.classList.add('active');
    clearTimeout(transitionFadeTimer);

    transitionFadeTimer = setTimeout(() => transitionFadeEl.classList.remove('active'), durationMs);
  }

  let transitionStartTime = 0;
  let tweenStartPos = new THREE.Vector3();
  let tweenEndPos = new THREE.Vector3();
  let tweenStartTarget = new THREE.Vector3();
  let tweenEndTarget = new THREE.Vector3();
  let transitionCurve = null;
  let onTransitionFinish = null;
  let tweenStartFisheye = { ...FISHEYE_EXTERIOR };
  let tweenEndFisheye = { ...FISHEYE_EXTERIOR };

  function beginTransition(toPos, toTarget, nextState) {
    const fromState = camState;
    const pairKey = `${fromState}->${nextState}`;
    console.log(`[transition] START ${fromState} -> ${nextState} @ ${performance.now().toFixed(0)}ms`);
    camState = 'transitioning';
    controls.enabled = false;
    isLooking = false;
    camera.up.set(0, 1, 0);
    clearFreeLookIdleTimer();

    transitionStartListeners.forEach((fn) => fn(nextState, fromState));

    const isExteriorish = nextState === 'exterior' || nextState === 'freelook';

    if (hud) hud.classList.toggle('visible', nextState !== 'screen');

    document.body.classList.toggle('hud-hidden', !isExteriorish);

    const isCabin = (s) => s === 'interior' || s === 'screen';
    const willExpand = !isExteriorish;
    const frameSizeChanging = screenFrame.classList.contains('expanded') !== willExpand;

    const cabinHop = isCabin(fromState) && isCabin(nextState) && fromState !== nextState;
    if (frameSizeChanging) {

      flashTransitionMask(HARD_CUT_PAIRS.has(pairKey) ? TRANSITION_MS + 50 : undefined);

      kickFilterRepaint();
    } else if (cabinHop) {

      kickFilterRepaint();
    }
    screenFrame.classList.toggle('expanded', willExpand);
    if (nextState === 'interior') {
      if (hudHint) hudHint.textContent = 'Drag to look around. Press ESC or click outside the car to get out';
    } else if (isExteriorish) {
      if (hudHint) hudHint.textContent = 'Click the car to get in';
    }

    tweenStartFisheye = {
      strength: lens.uniforms.strength.value,
      zoom: lens.uniforms.zoom.value,
    };
    tweenEndFisheye = isExteriorish ? FISHEYE_EXTERIOR : FISHEYE_FLAT;

    const CABIN_POS = { interior: interiorCamPos, screen: screenCamPos };
    const CABIN_TARGET = { interior: interiorCamTarget, screen: screenCamTarget };

    if (CABIN_POS[fromState]) {
      tweenStartPos.copy(CABIN_POS[fromState]);
    } else {
      tweenStartPos.copy(camera.position);
    }

    if (CABIN_TARGET[fromState]) {
      tweenStartTarget.copy(CABIN_TARGET[fromState]);
    } else {
      const currentDir = new THREE.Vector3();
      camera.getWorldDirection(currentDir);
      tweenStartTarget.copy(camera.position).add(currentDir);
    }
    tweenEndPos.copy(toPos);
    tweenEndTarget.copy(toTarget);
    transitionStartTime = performance.now();

    const crossesShell = SHELL_CROSSING_PAIRS.has(pairKey);
    if (crossesShell) {
      const mid = tweenStartPos.clone().lerp(tweenEndPos, 0.5);
      mid.y += 1.4;
      transitionCurve = new THREE.QuadraticBezierCurve3(tweenStartPos.clone(), mid, tweenEndPos.clone());
    } else {
      transitionCurve = null;
    }

    onTransitionFinish = () => {
      camState = nextState;

      controls.dispose();
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(toTarget);
      controls.enableDamping = false;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      controls.minDistance = 5;
      controls.maxDistance = 16;
      controls.minPolarAngle = Math.PI / 6;
      controls.maxPolarAngle = Math.PI / 1.9;
      controls.enabled = false;

      if (nextState === 'interior') {
        setLookFromDirection(interiorCamPos, interiorCamTarget);
        applyLook();
      } else if (nextState === 'screen') {
        controls.update();
        hooks.onEnterScreen();
      } else if (nextState === 'exterior') {

        hooks.onEnterExterior();
      } else if (nextState === 'freelook') {

        controls.minDistance = 4.2;
        controls.maxDistance = 10;
        controls.enabled = true;
        controls.update();
        armFreeLookIdleTimer();
      } else {
        controls.update();
      }

      requestAnimationFrame(() => { controls.enableDamping = true; });
    };
  }

  function updateTransition() {
    const t = Math.min((performance.now() - transitionStartTime) / TRANSITION_MS, 1);
    const eased = easeInOutCubic(t);
    if (transitionCurve) {
      camera.position.copy(transitionCurve.getPoint(eased));
    } else {
      camera.position.lerpVectors(tweenStartPos, tweenEndPos, eased);
    }
    applyExteriorClipGuard(camera.position);
    controls.target.lerpVectors(tweenStartTarget, tweenEndTarget, eased);
    camera.lookAt(controls.target);
    lens.uniforms.strength.value = THREE.MathUtils.lerp(tweenStartFisheye.strength, tweenEndFisheye.strength, eased);
    lens.uniforms.zoom.value = THREE.MathUtils.lerp(tweenStartFisheye.zoom, tweenEndFisheye.zoom, eased);
    if (t >= 1 && onTransitionFinish) {

      const finish = onTransitionFinish;
      onTransitionFinish = null;
      try {
        finish();
        console.log(`[transition] FINISHED -> ${camState} @ ${performance.now().toFixed(0)}ms`);
      } catch (err) {
        console.error('[transition] finish handler threw:', err);
        controls.enabled = false;
      }
    }
  }

  function resumeFromHidden(now) {
    if (camState === 'transitioning') {
      transitionStartTime = now - TRANSITION_MS;
    }
    if (camState === 'freelook') armFreeLookIdleTimer();
  }

  function setHooks(newHooks) {
    hooks = { ...hooks, ...newHooks };
  }

  function onTransitionStart(fn) {
    transitionStartListeners.push(fn);
  }

  return {
    beginTransition,
    updateTransition,
    applyLook,
    getState: () => camState,
    getControls: () => controls,
    setHooks,
    onTransitionStart,
    resumeFromHidden,
    setCalibrating,
    isCalibrating,
  };
}