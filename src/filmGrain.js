const TILE_SIZE = 200;
const NOISE_MID = 90;
const NOISE_RANGE = 95;

export function createFilmGrain(canvasId = 'grainCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { draw: () => {} };

  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  const buf = imgData.data;

  function draw() {
    for (let i = 0; i < buf.length; i += 4) {
      const v = (NOISE_MID + (Math.random() - 0.5) * NOISE_RANGE) | 0;
      buf[i] = v;
      buf[i + 1] = v;
      buf[i + 2] = v;
      buf[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return { draw };
}