const RESUME_PATH = 'https://pub-f3421bbecaba465e83e033376eb8cdb2.r2.dev/Resume_Alex_Hila_AUG.pdf';

export function createResumeViewer() {
  const overlay = document.getElementById('resumeModal');
  const closeBtn = document.getElementById('resumeClose');
  const frame = document.getElementById('resumeFrame');
  if (!overlay || !frame) {

    return { open: () => {}, close: () => {}, isOpen: () => false };
  }

  let loaded = false;

  function open() {
    if (!loaded) {
      frame.src = RESUME_PATH;
      loaded = true;
    }
    overlay.classList.add('visible');
  }

  function close() {
    overlay.classList.remove('visible');
  }

  function isOpen() {
    return overlay.classList.contains('visible');
  }

  if (closeBtn) closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  return { open, close, isOpen };
}