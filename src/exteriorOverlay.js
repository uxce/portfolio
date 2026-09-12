export function createExteriorOverlay({ onProjectOpen } = {}) {
  const overlayEl = document.getElementById('exteriorOverlay');
  const panelEl = document.getElementById('extPanel');
  const closeEl = document.getElementById('extClose');
  if (!overlayEl || !panelEl) {

    return { open: () => {}, close: () => {}, isOpen: () => false };
  }

  function replayEntrance() {
    const activePage = panelEl.querySelector('.ext-page.active');
    if (!activePage) return;
    activePage.classList.remove('entering');
    void activePage.offsetWidth;
    activePage.classList.add('entering');
  }

  function activateTab(tabId) {
    panelEl.querySelectorAll('.ext-page').forEach((p) => p.classList.toggle('active', p.dataset.panel === tabId));
  }

  function open(tabId) {
    activateTab(tabId);
    overlayEl.classList.add('visible');
    replayEntrance();
  }

  function close() {
    overlayEl.classList.remove('visible');
  }

  function isOpen() {
    return overlayEl.classList.contains('visible');
  }

  if (closeEl) closeEl.addEventListener('click', close);

  panelEl.querySelectorAll('.ext-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      if (onProjectOpen) onProjectOpen(card.dataset.project);
    });
  });

  return { open, close, isOpen };
}