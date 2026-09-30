import { easeInOutCubic } from './easing.js';

export const INTRO_TIMING = {
  flashAt: 3000,
  clear: [0.13, 0.27],
  build: [0.27, 0.70],
  eye:   [0.73, 1.00],
  flashRampMs: 250,
  flareMs: 350,
  fadeMs: 1000,
};

const REF_ASPECT = 1920 / 948;

const SHAPES = [

  { name: 'reflector', glow: 'soft',
    d: 'M -253.0 -4.8 L 52.6 -39.7 Q 55.6 -40.0 55.6 -37.0 L 54.9 33.4 Q 54.9 36.4 51.9 36.5 L -287.0 43.9 Q -290.0 44.0 -288.3 41.5 L -257.7 -2.0 Q -256.0 -4.5 -253.0 -4.8 Z' },

  { name: 'divider-a', d: 'M -43 -30.5 L -43 37' },
  { name: 'divider-b', d: 'M -37 -24 L -37 14' },
  { name: 'divider-c', d: 'M 40.6 -39 L 38.6 36.5' },
  { name: 'panel', glow: 'soft',
    d: 'M -154 -10.3 L -76.9 -20.2 Q -68 -21.3 -68 -12.3 L -68 26 Q -68 32 -74 32 L -161.6 32.5 Q -167.6 32.5 -166.5 26.6 L -161.1 -3.6 Q -160 -9.5 -154 -10.3 Z' },
  { name: 'bulb', glow: 'mid',
    d: 'M -112.5 5.5 A 5.5 5.5 0 1 0 -101.5 5.5 A 5.5 5.5 0 1 0 -112.5 5.5 Z' },
  { name: 'lens', glow: 'hot',
    d: 'M -31 0 A 31 31 0 1 0 31 0 A 31 31 0 1 0 -31 0 Z' },

];

const GLOW = { soft: { eye: 0.07, lit: 0.16 }, mid: { eye: 0.18, lit: 0.40 }, hot: { eye: 0.22, lit: 0.55 } };

const LINE = [[107, 173, 217], [140, 196, 232], [191, 227, 247]];
const FILL_COLOR = '#6fc0ff';
const LINE_WIDTH = 1.5;
const LAMP_UNITS_W = 420;
const CALIBRATE = new URLSearchParams(location.search).has('lampcal');

const NS = 'http://www.w3.org/2000/svg';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const mix = (a, b, t) => a + (b - a) * t;
const mixRGB = (a, b, t) => a.map((v, i) => mix(v, b[i], t));
const rgb = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;

export function createIntroScreen({ fisheye = 0.30 } = {}) {
  const introEl = document.getElementById('introScreen');
  const loader = document.getElementById('introLoader');
  const frameEl = document.getElementById('screenFrame') || introEl;
  const svg = introEl && introEl.querySelector('.intro-lamp');
  if (!introEl || !loader || !svg) return { setProgress() {}, complete: async () => {}, reveal: async () => {} };

  svg.querySelectorAll('.intro-outline, .intro-outline-track, .intro-scan').forEach((el) => el.remove());
  const eyeTrack = svg.querySelector('.intro-eye-track');
  const eyeRing = svg.querySelector('.intro-eye-ring');
  const halo = svg.querySelector('.intro-halo');
  [loader, eyeTrack, eyeRing, halo].forEach((el) => { if (el) el.style.transition = 'none'; });

  function samplePath(d, el, step = 1.5) {
    el.setAttribute('d', d);
    const len = el.getTotalLength();
    const n = Math.max(2, Math.ceil(len / step));
    const pts = [];
    for (let i = 0; i <= n; i++) { const p = el.getPointAtLength((len * i) / n); pts.push([p.x, p.y]); }
    return pts;
  }
  function samplePoly(verts, step = 3) {
    const pts = [];
    verts.forEach((a, i) => {
      const b = verts[(i + 1) % verts.length];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let j = 0; j < n; j++) pts.push([mix(a[0], b[0], j / n), mix(a[1], b[1], j / n)]);
    });
    pts.push(verts[0].slice());
    return pts;
  }

  const shapes = SHAPES.map((s) => {
    const el = document.createElementNS(NS, 'path');
    el.classList.add('intro-shape');
    el.setAttribute('pathLength', '100');
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke-width', LINE_WIDTH);
    el.setAttribute('stroke-linejoin', 'round');
    el.style.transition = 'none';
    el.style.strokeDasharray = '0 100';
    svg.insertBefore(el, eyeTrack || null);
    const pts = s.poly ? samplePoly(s.poly) : samplePath(s.d, el);
    return { ...s, el, pts, closed: !!s.poly || /Z\s*$/.test(s.d || '') };
  });

  function layout() {
    const W = frameEl.clientWidth || introEl.clientWidth || innerWidth;
    const H = frameEl.clientHeight || introEl.clientHeight || innerHeight;
    const asp = W / H;
    const ky = (2 * (loader.offsetWidth || H * 0.638)) / LAMP_UNITS_W / H;
    const s = fisheye;
    const reshape = (x, y) => {
      const cx = (x * ky) / REF_ASPECT, cy = y * ky;
      const f = 1 + s * (cx * cx + cy * cy);
      const fx = (cx * f * REF_ASPECT) / asp, fy = cy * f;
      let ax = fx, ay = fy;
      for (let i = 0; i < 12; i++) { const g = 1 + s * (ax * ax + ay * ay); ax = fx / g; ay = fy / g; }
      return [(ax * asp) / ky, ay / ky];
    };
    shapes.forEach((sh) => {
      const d = sh.pts.map(([x, y], i) => {
        const [px, py] = reshape(x, y);
        return `${i ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`;
      }).join(' ');
      sh.el.setAttribute('d', sh.closed ? d + ' Z' : d);
    });
  }
  layout();
  let resizeQueued = false;
  const onResize = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => { resizeQueued = false; layout(); });
  };
  addEventListener('resize', onResize);

  const T = () => INTRO_TIMING.flashAt;
  function progress(t) {
    const P = INTRO_TIMING, total = T();
    const win = ([a, b]) => easeInOutCubic(clamp01((t - a * total) / ((b - a) * total)));
    const sinceFlash = (t - total) / P.flashRampMs;
    return {
      t,
      clear: win(P.clear),
      build: win(P.build),
      eye: win(P.eye),
      flash: t >= total ? 1 - Math.pow(1 - clamp01(sinceFlash), 3) : 0,
    };
  }

  function apply({ clear, build, eye, flash }) {
    introEl.style.backgroundColor = `rgba(6,5,3,${(1 - clear).toFixed(3)})`;

    const stroke = rgb(mixRGB(mixRGB(LINE[0], LINE[1], eye), LINE[2], flash));
    shapes.forEach((sh) => {
      const [a, b] = sh.at || [0, 1];
      const frac = clamp01((build - a) / (b - a));
      sh.el.style.strokeDasharray = `${(frac * 100).toFixed(2)} 100`;
      sh.el.style.stroke = stroke;
      if (sh.glow) {
        const g = GLOW[sh.glow];
        sh.el.style.fill = FILL_COLOR;
        sh.el.style.fillOpacity = (g.eye * eye + (g.lit - g.eye) * flash).toFixed(3);
      }
    });

    const visible = clamp01(eye * 8);
    if (eyeTrack) eyeTrack.style.opacity = visible;
    if (eyeRing) {
      eyeRing.style.opacity = visible;
      eyeRing.style.strokeDasharray = `${(eye * 100).toFixed(2)} 100`;
      eyeRing.style.stroke = rgb(mixRGB([159, 214, 255], [230, 245, 255], flash));
    }
    if (halo) halo.style.opacity = (0.85 * eye + 0.15 * flash).toFixed(3);

    loader.style.filter =
      `drop-shadow(0 0 ${6 + 2 * flash}px rgba(255,255,255,${(0.4 * eye + 0.2 * flash).toFixed(3)})) ` +
      `drop-shadow(0 0 ${5 + 11 * eye + 12 * flash}px rgba(120,190,255,${(0.22 + 0.33 * eye + 0.4 * flash).toFixed(3)}))`;
  }
  apply(progress(0));

  function calibrate() {
    const num = (name, fallback) => parseFloat(getComputedStyle(loader).getPropertyValue(name)) || fallback;
    const v = { x: num('--lamp-x', 0), y: num('--lamp-y', 0), scale: num('--lamp-scale', 58.7) };
    const applyCal = () => {
      loader.style.setProperty('--lamp-x', v.x.toFixed(2));
      loader.style.setProperty('--lamp-y', v.y.toFixed(2));
      loader.style.setProperty('--lamp-scale', v.scale.toFixed(2));
      layout();
      console.log(`[lamp] paste into style.css:  :root { --lamp-scale: ${v.scale.toFixed(2)}; --lamp-x: ${v.x.toFixed(2)}; --lamp-y: ${v.y.toFixed(2)}; }`);
    };
    console.log('[lamp] CALIBRATION: arrows = move, Shift+arrows = bigger steps, - / = resize');
    addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.5 : 0.1;
      const size = e.shiftKey ? 1 : 0.2;
      if (e.key === 'ArrowLeft') v.x -= step;
      else if (e.key === 'ArrowRight') v.x += step;
      else if (e.key === 'ArrowUp') v.y -= step;
      else if (e.key === 'ArrowDown') v.y += step;
      else if (e.key === '=' || e.key === '+') v.scale += size;
      else if (e.key === '-' || e.key === '_') v.scale -= size;
      else return;
      e.preventDefault();
      applyCal();
    });
    applyCal();
  }

  function setProgress() {}

  function complete({ onFrame, startTime = performance.now() } = {}) {
    const P = INTRO_TIMING, total = T();

    const now = performance.now();
    if (now - startTime > P.build[0] * total) startTime = now - P.clear[0] * total;

    let calibrated = false;
    return new Promise((resolve) => {
      (function frame() {
        let t = performance.now() - startTime;
        if (CALIBRATE) t = Math.min(t, P.build[1] * total + 200);
        const v = progress(t);
        apply(v);
        if (onFrame) onFrame(v);
        if (CALIBRATE) {
          if (!calibrated && t >= P.build[1] * total + 200) { calibrated = true; calibrate(); }
        } else if (t >= total + P.flareMs) { resolve(); return; }
        requestAnimationFrame(frame);
      })();
    });
  }

  async function reveal() {
    const ms = INTRO_TIMING.fadeMs;
    introEl.style.transition = `opacity ${ms}ms ease`;
    introEl.style.opacity = '0';
    introEl.style.pointerEvents = 'none';
    await wait(ms);
    removeEventListener('resize', onResize);
    introEl.remove();
  }

  return { setProgress, complete, reveal };
}
