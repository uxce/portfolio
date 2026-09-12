import * as THREE from 'three';

const MIN_INTRO_MS = 1000;

export function createLoadingManager(onDone) {
  const loadingScreen = document.getElementById('loadingScreen');
  const loadBar = document.getElementById('loadBar');
  const loadPct = document.getElementById('loadPct');
  const startTime = performance.now();

  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => {
    const pct = Math.round((loaded / total) * 100);
    if (loadBar) loadBar.style.width = pct + '%';
    if (loadPct) loadPct.textContent = pct + '%';
  };
  manager.onLoad = () => {
    const elapsed = performance.now() - startTime;
    const wait = Math.max(0, MIN_INTRO_MS - elapsed);
    setTimeout(() => {
      if (loadingScreen) loadingScreen.classList.add('hidden');
      onDone();
    }, wait);
  };

  return { manager };
}