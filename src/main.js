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

const { scene, camera, renderer, lens, screenFrame } = createSceneSetup();
const compositorFix = createCompositorFix();

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
cameraRig.setHooks({
  onEnterExterior: () => heroLoop.start(),
  onIdleFromFreeLook: () => cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior'),
});

screenOS = createScreenOS({ cameraRig, heroLoop, kickFilterRepaint: compositorFix.kick, openImage: gallery.openImage });
cameraRig.setHooks({ onEnterScreen: screenOS.revealScreenPanel });

const carInteraction = createCarInteraction({ camera, renderer, cameraRig, screenOS, musicPlayer, exteriorOverlay, resumeViewer });
createDebugHotkeys({ camera, cameraRig, kickFilterRepaint: compositorFix.kick });
createHudClock();
createGlitchTitle();

const HERO_LOOP_START_DELAY_MS = 6000;
setTimeout(() => {
  if (cameraRig.getState() === 'exterior') heroLoop.start();
}, HERO_LOOP_START_DELAY_MS);

const introScreen = createIntroScreen({
  onComplete: () => {},
});

loadCar({
  scene,
  screenTexture: screenTex,
  onLoaded: ({ carModel }) => carInteraction.setCarModel(carModel),
});

introScreen.show();

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
  introGrain.draw();
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