import * as THREE from 'three';

export const heroCamPos    = new THREE.Vector3(6.2, 3.8, 7.2);
export const heroCamTarget = new THREE.Vector3(0, 0.8, 0);

export const interiorCamPos    = new THREE.Vector3(-0.36, 0.9, -0.25);
export const interiorCamTarget = new THREE.Vector3(-0.05, 0.64, 1.22);

export const screenCamPos    = new THREE.Vector3(-0.15, 0.62, 0.15);
export const screenCamTarget = new THREE.Vector3(0.00, 0.53, 0.51);

export const FREE_LOOK_POS    = new THREE.Vector3(4.8, 2.1, 5.4);
export const FREE_LOOK_TARGET = new THREE.Vector3(0, 0.6, 0);

const SCREEN_EXIT_T = 0.4;
export const screenExitCamPos    = screenCamPos.clone().lerp(interiorCamPos, SCREEN_EXIT_T);
export const screenExitCamTarget = screenCamTarget.clone().lerp(interiorCamTarget, SCREEN_EXIT_T);