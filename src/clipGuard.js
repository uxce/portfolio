import { interiorCamPos, screenCamPos } from './positions.js';

const CAR_CLIP_MARGIN = 0.75;
const CLIP_PUSH_PAD = 0.15;

const CABIN_CLEAR_RADIUS = 1.3;

let carClipBox = null;

export function setCarClipBox(box) {
  carClipBox = box.clone().expandByScalar(CAR_CLIP_MARGIN);
}

export function keepOutsideCar(pos) {
  if (!carClipBox || !carClipBox.containsPoint(pos)) return pos;
  const dxMin = pos.x - carClipBox.min.x, dxMax = carClipBox.max.x - pos.x;
  const dyMin = pos.y - carClipBox.min.y, dyMax = carClipBox.max.y - pos.y;
  const dzMin = pos.z - carClipBox.min.z, dzMax = carClipBox.max.z - pos.z;
  const minPen = Math.min(dxMin, dxMax, dyMin, dyMax, dzMin, dzMax);

  if (minPen === dxMin) pos.x = carClipBox.min.x - CLIP_PUSH_PAD;
  else if (minPen === dxMax) pos.x = carClipBox.max.x + CLIP_PUSH_PAD;
  else if (minPen === dyMin) pos.y = carClipBox.min.y - CLIP_PUSH_PAD;
  else if (minPen === dyMax) pos.y = carClipBox.max.y + CLIP_PUSH_PAD;
  else if (minPen === dzMin) pos.z = carClipBox.min.z - CLIP_PUSH_PAD;
  else pos.z = carClipBox.max.z + CLIP_PUSH_PAD;
  return pos;
}

export function applyExteriorClipGuard(pos) {
  if (!carClipBox) return;
  const nearCabin =
    pos.distanceTo(interiorCamPos) < CABIN_CLEAR_RADIUS ||
    pos.distanceTo(screenCamPos) < CABIN_CLEAR_RADIUS;
  if (nearCabin) return;
  keepOutsideCar(pos);
}