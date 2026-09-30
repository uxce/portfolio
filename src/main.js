import './style.css';
import { initMusicPlayer } from './musicPlayer.js';
import { createScreenTexture } from './screenTexture.js';
import { createFilmGrain } from './filmGrain.js';
import { createSidebar } from './sidebar.js';
import { createExteriorOverlay } from './exteriorOverlay.js';
import { createResumeViewer } from './resumeViewer.js';
import { createSceneSetup } from './sceneSetup.js';
import { createCompositorFix } from './compositorFix.js';
import { loadCar } from './carLoader.js';
import { createIntroScreen } from './introScreen.js';
import { createHeroLoop, HERO_SHOTS } from './heroLoop.js';
import { createCameraRig } from './cameraRig.js';
import { createScreenOS } from './screenOS.js';
import { createCarInteraction } from './carInteraction.js';
import { createDebugHotkeys } from './debugHotkeys.js';
import { createHudClock } from './hudClock.js';
import { createGlitchTitle } from './glitchTitle.js';
import { createGallery } from './gallery.js';
import { createModelOutline } from './modelOutline.js';
import { INTRO_CAM_POS, INTRO_CAM_TARGET, INTRO_PULL_VIA, INTRO_PULL_MS } from './positions.js';

const { scene, camera, renderer, lens, screenFrame } = createSceneSetup();
const compositorFix = createCompositorFix();
const modelOutline = createModelOutline({ scene, camera, composer: lens.composer });

const musicPlayer = initMusicPlayer();
const { texture: screenTex, draw: drawScreenTexture } = createScreenTexture();
const filmGrain = createFilmGrain('grainCanvas');
const introGrain = createFilmGrain('introGrainCanvas');
const heroLoop = createHeroLoop(camera);

const gallery = createGallery();

const resumeViewer = createResumeViewer();

let screenOS;

const exteriorOverlay = createExteriorOverlay({
  onProjectOpen: () => {
    exteriorOverlay.close();
    screenOS.goToScreenTab('projects');
  },
});
const sidebar = createSidebar({
  musicPlayer,

  onNav: (tabId) => {
    if (tabId === 'resume') { resumeViewer.open(); return; }
    const state = cameraRig.getState();
    if (state === 'transitioning') return;
    const insideCar = state === 'interior' || state === 'screen';
    if (insideCar) {
      tabId === 'home' ? screenOS.goHome() : screenOS.goToScreenTab(tabId);
    } else if (tabId === 'home') {
      exteriorOverlay.close();
    } else {
      exteriorOverlay.open(tabId);
    }
  },
});

const cameraRig = createCameraRig({ camera, renderer, screenFrame, lens, kickFilterRepaint: compositorFix.kick });
camera.position.copy(INTRO_CAM_POS);
camera.lookAt(INTRO_CAM_TARGET);
cameraRig.setHooks({
  onEnterExterior: () => heroLoop.start(),
  onIdleFromFreeLook: () => cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior'),
});

screenOS = createScreenOS({ cameraRig, heroLoop, kickFilterRepaint: compositorFix.kick, openImage: gallery.openImage });
cameraRig.setHooks({ onEnterScreen: screenOS.revealScreenPanel });

const extGalleryMoreBtn = document.getElementById('extGalleryMore');
if (extGalleryMoreBtn) extGalleryMoreBtn.addEventListener('click', () => {
  if (cameraRig.getState() === 'transitioning') return;
  exteriorOverlay.close();
  screenOS.goToScreenTab('gallery');
});

const carInteraction = createCarInteraction({ camera, renderer, cameraRig, screenOS, musicPlayer, exteriorOverlay, resumeViewer });
createDebugHotkeys({ camera, cameraRig, kickFilterRepaint: compositorFix.kick });
createHudClock();
createGlitchTitle();

const introScreen = createIntroScreen({ fisheye: lens.uniforms.strength.value });
let introActive = true;

const MIN_INTRO_MS = 700;
const introStart = performance.now();

let headlights = [];
function setHeadlights(k) {
  headlights.forEach((h) => { h.light.intensity = h.full * k; });
}

const carReady = new Promise((resolve) => {
  loadCar({
    scene,
    screenTexture: screenTex,
    onLoaded: ({ carModel, headlightL, headlightR, gaugeGlows }) => {
      carInteraction.setCarModel(carModel);
      modelOutline.setSkip(Object.values(gaugeGlows).map((g) => g.sprite));
      modelOutline.begin();
      headlights = [headlightL, headlightR].map((light) => ({ light, full: light.intensity }));
      headlights.forEach((h) => { h.light.intensity = 0; });
      resolve();
    },
    onError: () => resolve(),
  });
});

const fontsReady = Promise.all([
  document.fonts.load('26px "Bebas Neue"'),
  document.fonts.load('12px "Space Mono"'),
  document.fonts.load('bold 12px "Space Mono"'),
  document.fonts.load('600 16px "Rajdhani"'),
  document.fonts.load('700 16px "Rajdhani"'),
]).catch(() => {});

const minTime = new Promise((resolve) => setTimeout(resolve, MIN_INTRO_MS));
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));

Promise.all([carReady, fontsReady, minTime])
  .then(async () => {
    await nextFrame();
    await nextFrame();

    try {
      await introScreen.complete({
        startTime: introStart,
        onFrame: ({ build, eye }) => {
          modelOutline.setBuild(build);
          setHeadlights(1 - Math.pow(1 - eye, 3));
        },
      });
    } catch (err) { console.error('[intro] timeline failed, skipping ahead:', err); }

    document.body.classList.add('intro-fade');
    document.body.classList.remove('intro-active');
    setTimeout(() => document.body.classList.remove('intro-fade'), 1100);
    modelOutline.blendToCar();
    cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior', {
      duration: INTRO_PULL_MS,
      via: INTRO_PULL_VIA,
      skipClipGuard: true,
    });
    await introScreen.reveal();
    introActive = false;
  });

musicPlayer.startWithFadeIn();
document.addEventListener('click', () => musicPlayer.startWithFadeIn(), { once: true });
document.addEventListener('keydown', () => musicPlayer.startWithFadeIn(), { once: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const now = performance.now();
  cameraRig.resumeFromHidden(now);
  heroLoop.resetClock(now);
});

function animate() {
  requestAnimationFrame(animate);
  drawScreenTexture();
  filmGrain.draw();
  if (introActive) introGrain.draw();
  sidebar.update();

  const camState = cameraRig.getState();
  if (camState === 'transitioning') {
    cameraRig.updateTransition();
  } else if (camState === 'interior') {

    if (cameraRig.isCalibrating()) cameraRig.getControls().update();
    else cameraRig.applyLook();
  } else if (camState === 'screen') {

  } else if (camState === 'exterior') {
    heroLoop.update();
  } else if (camState === 'freelook') {
    cameraRig.getControls().update();
  }
  lens.composer.render();
}
animate();