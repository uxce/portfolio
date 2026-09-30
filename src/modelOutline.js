import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { easeInOutCubic } from './easing.js';
import { INTRO_CAM_TARGET } from './positions.js';

const LINE_COLOR = [0.42, 0.68, 0.86];
const LINE_THICKNESS = 1.3;
const CREASE = [0.16, 0.38];
const DEPTH = [0.03, 0.10];
const BUILD_MS = 1300;
const BUILD_CLUMP = 0.15;
const BUILD_SCALE = 28.0;
const BUILD_SOFT = 0.14;
const LENS_RADIUS = 0.055;
const BLOOM_SIGMA = 0.10;
const LAMP_SENSITIVITY = 0.5;
const GLASS_RADIUS = 0.55;

const REGION = [-0.165, 0.0, 0.285, 0.10];
const REGION_SOFT = 0.03;
const BLEND_MS = 2600;

const GEO_VERT =  `
  varying vec3 vN;
  varying float vZ;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vZ = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const GEO_FRAG =  `
  varying vec3 vN;
  varying float vZ;
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    gl_FragColor = vec4(n * 0.5 + 0.5, vZ);
  }
`;

const QUAD_VERT =  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const QUAD_FRAG =  `
  uniform sampler2D tDiffuse;
  uniform sampler2D tGeo;
  uniform vec2 uTexel;
  uniform float uThickness;
  uniform float uCarShow;
  uniform float uEdge;
  uniform float uBuild;
  uniform float uAspect;
  uniform vec2 uCenter;
  uniform vec2 uCrease;
  uniform vec2 uDepth;
  uniform vec3 uBg;
  uniform vec3 uLine;
  uniform vec4 uBuildCfg;
  uniform float uSweep;
  uniform float uFlash;
  uniform vec2 uLens;
  uniform vec4 uRegion;
  uniform float uRegionSoft;
  uniform float uLampSens;
  varying vec2 vUv;

  float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float invZ(vec4 g) { return g.a > 0.0 ? 1.0 / g.a : 0.0; }

  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    vec4 c = texture2D(tGeo, vUv);

    vec2 o = uTexel * uThickness;
    vec4 l = texture2D(tGeo, vUv - vec2(o.x, 0.0));
    vec4 r = texture2D(tGeo, vUv + vec2(o.x, 0.0));
    vec4 u = texture2D(tGeo, vUv + vec2(0.0, o.y));
    vec4 d = texture2D(tGeo, vUv - vec2(0.0, o.y));

    vec2 p = (vUv - uCenter) * vec2(uAspect, 1.0);

    float k = mix(uLampSens, 1.0, smoothstep(0.14, 0.32, length(p)));

    float onCar = step(0.0001, c.a);
    float ic = invZ(c);
    float lap = abs(invZ(l) + invZ(r) - 2.0 * ic) + abs(invZ(u) + invZ(d) - 2.0 * ic);
    float depthEdge = smoothstep(uDepth.x * k, uDepth.y * k, lap / max(ic, 0.001));
    float creaseEdge = smoothstep(uCrease.x * k, uCrease.y * k, length(l.rgb - r.rgb) + length(u.rgb - d.rgb));

    vec2 rq = abs(p - uRegion.xy) - uRegion.zw;
    float region = 1.0 - smoothstep(0.0, uRegionSoft, length(max(rq, 0.0)) + min(max(rq.x, rq.y), 0.0));
    float edge = max(depthEdge, creaseEdge) * onCar * region;

    float dist = clamp(length(p) / 1.2, 0.0, 1.0);
    float n = vnoise(p * uBuildCfg.y) * 0.65 + vnoise(p * uBuildCfg.y * 3.1 + 7.3) * 0.35;
    n = clamp((n - 0.2) / 0.6, 0.0, 1.0);
    float phase = mix(n, dist, uBuildCfg.x);
    float soft = uBuildCfg.z;
    float reveal = clamp((uBuild * (1.0 + soft) - phase) / soft, 0.0, 1.0);
    float front = 4.0 * reveal * (1.0 - reveal);

    float a = clamp(edge * reveal * uEdge, 0.0, 1.0);
    float tip = edge * front * uEdge;

    vec3 col = base.rgb;

    col = mix(uBg, base.rgb, uCarShow);
    col += uLine * a + vec3(0.62, 0.86, 1.0) * tip * 0.9;

    float lensR = length(p);
    float ang = fract(atan(p.x, p.y) / 6.2831853);
    float lensMask = 1.0 - smoothstep(uLens.x, uLens.x * 1.35, lensR);
    col += vec3(0.78, 0.94, 1.0) * a * lensMask * step(ang, uSweep) * 1.8;
    col += vec3(0.37, 0.70, 1.0) * exp(-(lensR * lensR) / (2.0 * uLens.y * uLens.y)) * uFlash;
    gl_FragColor = vec4(col, 1.0);
  }
`;

class ModelOutlinePass extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.skip = [];
    this.glass = [];

    this.geoTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    });
    this.geoMaterial = new THREE.ShaderMaterial({
      vertexShader: GEO_VERT,
      fragmentShader: GEO_FRAG,
      side: THREE.DoubleSide,
    });

    const bg = scene.background && scene.background.isColor ? scene.background : new THREE.Color(0);
    this.uniforms = {
      tDiffuse: { value: null },
      tGeo: { value: this.geoTarget.texture },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uThickness: { value: LINE_THICKNESS },
      uCarShow: { value: 1 },
      uEdge: { value: 1 },
      uBuild: { value: 0 },
      uSweep: { value: 0 },
      uFlash: { value: 0 },
      uLens: { value: new THREE.Vector2(LENS_RADIUS, BLOOM_SIGMA) },
      uLampSens: { value: LAMP_SENSITIVITY },
      uRegion: { value: new THREE.Vector4(...REGION) },
      uRegionSoft: { value: REGION_SOFT },
      uAspect: { value: 1 },
      uCenter: { value: new THREE.Vector2(0.5, 0.5) },
      uCrease: { value: new THREE.Vector2(CREASE[0], CREASE[1]) },
      uDepth: { value: new THREE.Vector2(DEPTH[0], DEPTH[1]) },
      uBg: { value: new THREE.Vector3(bg.r, bg.g, bg.b) },
      uLine: { value: new THREE.Vector3(...LINE_COLOR) },
      uBuildCfg: { value: new THREE.Vector4(BUILD_CLUMP, BUILD_SCALE, BUILD_SOFT, 0) },
    };
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: QUAD_VERT,
      fragmentShader: QUAD_FRAG,
      depthTest: false,
      depthWrite: false,
    }));

    this._clearColor = new THREE.Color();
  }

  setSize(width, height) {
    this.geoTarget.setSize(width, height);
    this.uniforms.uTexel.value.set(1 / width, 1 / height);
    this.uniforms.uAspect.value = width / height;
  }

  collectGlass(center, radius) {
    this.glass = [];
    const box = new THREE.Box3();
    const c = new THREE.Vector3();
    const near = [];
    this.scene.traverse((o) => {
      if (!o.isMesh || this.skip.includes(o)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const seeThrough = mats.some((m) => m && (m.transparent || m.opacity < 1));
      box.setFromObject(o).getCenter(c);
      const d = c.distanceTo(center);
      if (d < 1.0) near.push(`${o.name || '(unnamed)'}  dist=${d.toFixed(2)}  seeThrough=${seeThrough}`);
      if (seeThrough && d < radius) this.glass.push(o);
    });
    console.log(`[outline] meshes within 1m of the headlight (${this.glass.length} see-through ones hidden):\n` + near.join('\n'));
  }

  render(renderer, writeBuffer, readBuffer) {

    const prevAlpha = renderer.getClearAlpha();
    renderer.getClearColor(this._clearColor);
    const prevBg = this.scene.background;
    const prevOverride = this.scene.overrideMaterial;
    const hidden = this.skip.concat(this.glass).filter((o) => o.visible);
    hidden.forEach((o) => { o.visible = false; });

    this.scene.background = null;
    this.scene.overrideMaterial = this.geoMaterial;
    renderer.setRenderTarget(this.geoTarget);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(this.scene, this.camera);

    this.scene.background = prevBg;
    this.scene.overrideMaterial = prevOverride;
    hidden.forEach((o) => { o.visible = true; });
    renderer.setClearColor(this._clearColor, prevAlpha);

    this.uniforms.tDiffuse.value = readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    if (this.clear) renderer.clear();
    this.quad.render(renderer);
  }
}

function tween(ms, step, done) {
  const t0 = performance.now();
  (function frame() {
    const t = Math.min(1, (performance.now() - t0) / ms);
    step(easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(frame);
    else if (done) done();
  })();
}

export function createModelOutline({ scene, camera, composer }) {
  const pass = new ModelOutlinePass(scene, camera);
  pass.enabled = false;
  composer.insertPass(pass, 1);
  const u = pass.uniforms;

  let active = false;
  let debugMode = 0;

  let glassReady = false;
  function begin() {
    if (!glassReady) { pass.collectGlass(INTRO_CAM_TARGET, GLASS_RADIUS); glassReady = true; }
    active = true;
    pass.enabled = true;
    u.uCarShow.value = 0;
    u.uEdge.value = 1;
    u.uBuild.value = 0;
  }

  function build(ms = BUILD_MS) {
    if (!active) return;
    const from = u.uBuild.value;
    tween(ms, (e) => { u.uBuild.value = from + (1 - from) * e; });
  }

  function setBuild(v) { if (active) u.uBuild.value = v; }

  function eye(ms = 800) {
    if (!active) return;
    tween(ms, (e) => { u.uSweep.value = e; u.uFlash.value = 0.5 * e; });
  }

  function flash(ms = 180) {
    if (!active) return;
    const from = u.uFlash.value;
    tween(ms, (e) => { u.uFlash.value = from + (1 - from) * e; });
  }

  function blendToCar(ms = BLEND_MS) {
    if (!active) return;
    const carFrom = u.uCarShow.value;
    const edgeFrom = u.uEdge.value;
    const flashFrom = u.uFlash.value;
    tween(ms, (e) => {
      u.uFlash.value = flashFrom * (1 - e);
      u.uCarShow.value = carFrom + (1 - carFrom) * e;
      u.uEdge.value = edgeFrom * (1 - e);
    }, end);
  }

  function end() {
    active = false;
    pass.enabled = false;
    u.uCarShow.value = 1;
    u.uEdge.value = 1;
    u.uBuild.value = 0;
    u.uSweep.value = 0;
    u.uFlash.value = 0;
  }

  function toggleDebug() {
    debugMode = (debugMode + 1) % 3;
    if (debugMode === 0) { end(); return; }
    begin();
    u.uBuild.value = 1;
    u.uCarShow.value = debugMode === 2 ? 1 : 0;
  }

  function setSkip(objects) {
    pass.skip = objects.filter(Boolean);
  }

  return { begin, build, setBuild, eye, flash, blendToCar, end, toggleDebug, setSkip, uniforms: u };
}
