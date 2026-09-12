import * as THREE from 'three';
import { playerState } from './musicPlayer.js';

const NEON_GREEN = '#4CFF6B';
const DIM = '#1C5E70';

const RENDER_SCALE = 2;
const LOGICAL_W = 512;
const LOGICAL_H = 256;

const BAR_COUNT = 14;
const barLevels = new Array(BAR_COUNT).fill(0.06);
const peakLevels = new Array(BAR_COUNT).fill(0);
let hueTime = 0;

export function createScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = LOGICAL_W * RENDER_SCALE;
  canvas.height = LOGICAL_H * RENDER_SCALE;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.anisotropy = 8;

  function drawSpectrumDotMatrix(x, y, w, h) {
    const dotSpacing = 6;
    const cols = Math.floor(w / dotSpacing);
    const rows = Math.floor(h / dotSpacing);
    const colsPerBar = Math.max(2, Math.floor(cols / BAR_COUNT));

    ctx.save();
    ctx.fillStyle = DIM;
    ctx.globalAlpha = 0.10;
    for (let ry = 0; ry < rows; ry++) {
      for (let rx = 0; rx < cols; rx++) {
        ctx.beginPath();
        ctx.arc(x + rx * dotSpacing, y + ry * dotSpacing, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    ctx.save();
    for (let b = 0; b < BAR_COUNT; b++) {
      const litRows = Math.round(barLevels[b] * rows);
      const hue = (hueTime * 40 + b * (360 / BAR_COUNT)) % 360;
      const color = `hsl(${hue}, 90%, 60%)`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 3;

      for (let cr = 0; cr < colsPerBar - 1; cr++) {
        const dotX = x + (b * colsPerBar + cr) * dotSpacing;
        for (let ry = 0; ry < litRows; ry++) {
          const rowFromBottom = rows - 1 - ry;
          const dotY = y + rowFromBottom * dotSpacing;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const peakRow = Math.round(peakLevels[b] * rows);
      if (peakRow > 1) {
        const py = y + (rows - peakRow) * dotSpacing;
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        for (let cr = 0; cr < colsPerBar - 1; cr++) {
          const dotX = x + (b * colsPerBar + cr) * dotSpacing;
          ctx.beginPath();
          ctx.arc(dotX, py, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function draw() {
    hueTime += 0.012;

    for (let i = 0; i < BAR_COUNT; i++) {
      const target = playerState.playing ? Math.random() * 0.85 + 0.1 : 0.06;
      barLevels[i] += (target - barLevels[i]) * 0.18;
      if (barLevels[i] > peakLevels[i]) peakLevels[i] = barLevels[i];
      else peakLevels[i] = Math.max(0, peakLevels[i] - 0.008);
    }

    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    const backlight = ctx.createRadialGradient(
      LOGICAL_W / 2, LOGICAL_H / 2, 20,
      LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W / 1.3
    );
    backlight.addColorStop(0, 'rgba(30, 70, 90, 0.25)');
    backlight.addColorStop(1, 'rgba(30, 70, 90, 0)');
    ctx.fillStyle = backlight;
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    ctx.strokeStyle = DIM;
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, LOGICAL_W - 6, LOGICAL_H - 6);

    ctx.shadowColor = '#3FE0FF';
    ctx.shadowBlur = playerState.playing ? 10 : 3;
    ctx.fillStyle = playerState.playing ? '#3FE0FF' : DIM;
    ctx.font = 'bold 26px monospace';
    ctx.fillText(playerState.title.toUpperCase(), 18, 34);

    ctx.shadowBlur = 4;
    ctx.font = '14px monospace';
    ctx.fillStyle = playerState.playing ? '#1FA8C0' : DIM;
    ctx.fillText(playerState.artist.toUpperCase(), 18, 54);
    ctx.shadowBlur = 0;

    drawSpectrumDotMatrix(18, 66, LOGICAL_W - 36, 116);

    const segCount = 40;
    const segW = (LOGICAL_W - 36) / segCount;
    const litSegs = Math.round(playerState.progress * segCount);
    for (let i = 0; i < segCount; i++) {
      ctx.fillStyle = i < litSegs ? NEON_GREEN : DIM;
      ctx.fillRect(18 + i * segW, 200, segW - 2, 8);
    }

    ctx.fillStyle = playerState.playing ? NEON_GREEN : DIM;
    ctx.beginPath();
    ctx.arc(LOGICAL_W - 24, 24, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    texture.needsUpdate = true;
  }

  return { texture, draw };
}