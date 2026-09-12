const REAL_FILTER = 'contrast(1.06) saturate(1.15) brightness(1.22)';

export function createCompositorFix() {
  const viewportEl = document.getElementById('viewport');
  const repaintMaskEl = document.getElementById('repaintMask');
  if (!viewportEl) return { kick: () => {} };

  function kick() {

    if (repaintMaskEl) repaintMaskEl.classList.add('active');
    viewportEl.style.filter = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        viewportEl.style.filter = REAL_FILTER;

        requestAnimationFrame(() => {
          if (repaintMaskEl) repaintMaskEl.classList.remove('active');
        });
      });
    });
  }

  return { kick };
}