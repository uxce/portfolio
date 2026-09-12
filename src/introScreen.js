const SLIDES = ['WELCOME TO MY PORTFOLIO', 'CREATED BY ALEX'];
const SLIDE_MS = 3000;
const SWAP_MS = 250;
const FADE_OUT_MS = 600;

export function createIntroScreen({ onComplete }) {
  const introEl = document.getElementById('introScreen');
  const textEl = document.getElementById('introText');
  if (!introEl || !textEl) {

    return { show: () => onComplete() };
  }

  function showSlide(i, immediate) {
    if (immediate) {
      textEl.textContent = SLIDES[i];
      requestAnimationFrame(() => textEl.classList.add('visible'));
      return;
    }

    textEl.classList.remove('visible');
    setTimeout(() => {
      textEl.textContent = SLIDES[i];
      textEl.classList.add('visible');
    }, SWAP_MS);
  }

  function show() {
    introEl.classList.add('visible');
    showSlide(0, true);

    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i >= SLIDES.length) {
        clearInterval(timer);
        introEl.classList.remove('visible');
        setTimeout(onComplete, FADE_OUT_MS);
      } else {
        showSlide(i, false);
      }
    }, SLIDE_MS);
  }

  return { show };
}