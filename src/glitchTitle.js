const GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*';
const GLITCH_LENGTH = 5;
const GLITCH_INTERVAL_MS = 140;

function randomGlitchString(len) {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  }
  return out;
}

export function createGlitchTitle(elId = 'hudTitle') {
  const el = document.getElementById(elId);
  if (!el) return;

  function tick() {
    el.textContent = randomGlitchString(GLITCH_LENGTH);
  }
  tick();
  setInterval(tick, GLITCH_INTERVAL_MS);
}