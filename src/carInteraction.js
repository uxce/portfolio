import * as THREE from 'three';
import { HERO_SHOTS } from './heroLoop.js';
import { interiorCamPos, interiorCamTarget, screenCamPos, screenCamTarget, FREE_LOOK_POS, FREE_LOOK_TARGET } from './positions.js';

export function createCarInteraction({ camera, renderer, cameraRig, screenOS, musicPlayer, exteriorOverlay, resumeViewer }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pointerDownPos = { x: 0, y: 0 };

  let carModel = null;
  function setCarModel(model) {
    carModel = model;
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDownPos.x = e.clientX;
    pointerDownPos.y = e.clientY;
  });

  renderer.domElement.addEventListener('click', (e) => {
    const camState = cameraRig.getState();
    if (!carModel || camState === 'transitioning') return;

    const dragDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (dragDist > 6) return;

    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(carModel, true);

    if (camState === 'exterior' && hits.length > 0) {
      logHit(hits[0]);
      cameraRig.beginTransition(interiorCamPos, interiorCamTarget, 'interior');
    } else if (camState === 'exterior' && hits.length === 0) {

      cameraRig.beginTransition(FREE_LOOK_POS, FREE_LOOK_TARGET, 'freelook');
    } else if (camState === 'freelook' && hits.length > 0) {
      logHit(hits[0]);
      cameraRig.beginTransition(interiorCamPos, interiorCamTarget, 'interior');
    } else if (camState === 'freelook' && hits.length === 0) {

      cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior');
    } else if (camState === 'interior' && hits.length > 0) {
      const name = hits[0].object.name;
      logHit(hits[0]);
      if (name === 'Object_127' || name === 'Object_79' || name === 'Object_189') {
        cameraRig.beginTransition(screenCamPos, screenCamTarget, 'screen');
      } else if (name === 'Object_317') {
        musicPlayer.togglePlay();
      } else if (name === 'Object_317001') {
        musicPlayer.prevTrack();
      } else if (name === 'Object_317002') {
        musicPlayer.nextTrack();
      }
    } else if (camState === 'interior' && hits.length === 0) {
      cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (resumeViewer && resumeViewer.isOpen()) { resumeViewer.close(); return; }
    if (exteriorOverlay && exteriorOverlay.isOpen()) { exteriorOverlay.close(); return; }
    const camState = cameraRig.getState();
    if (camState === 'screen') screenOS.closeScreen();
    else if (camState === 'interior') cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior');
    else if (camState === 'freelook') cameraRig.beginTransition(HERO_SHOTS[0].startPos, HERO_SHOTS[0].startTarget, 'exterior');
  });

  function logHit(hit) {
    const p = hit.point;
    console.log(`Clicked: ${hit.object.name} | world position: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
  }

  return { setCarModel };
}