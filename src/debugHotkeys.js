import { interiorCamTarget } from './positions.js';

export function createDebugHotkeys({ camera, cameraRig, kickFilterRepaint }) {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'c') {
      const controls = cameraRig.getControls();
      console.log(
        `Camera: new THREE.Vector3(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})\n` +
        `Target: new THREE.Vector3(${controls.target.x.toFixed(2)}, ${controls.target.y.toFixed(2)}, ${controls.target.z.toFixed(2)})`
      );
    } else if (e.key === 'v' && cameraRig.getState() === 'interior') {
      const calibrating = !cameraRig.isCalibrating();
      cameraRig.setCalibrating(calibrating);
      const controls = cameraRig.getControls();
      controls.enabled = calibrating;
      if (calibrating) {
        controls.target.copy(interiorCamTarget);
        controls.minDistance = 0.05;
        controls.maxDistance = 3;
        controls.enablePan = true;
        controls.update();
        console.log('Calibration ON — drag/zoom onto the screen, press "c" to log, "v" to exit.');
      } else {
        console.log('Calibration OFF.');
      }
    } else if (e.key === 'g') {
      kickFilterRepaint();
      console.log(`[manual] repaint kick @ ${performance.now().toFixed(0)}ms`);
    }
  });
}