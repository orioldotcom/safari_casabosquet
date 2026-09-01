import type { ParkConfig } from "../types";

function pointInPolygon(x: number, z: number, polygon: [number, number][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    const intersects = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distanceToSegment(
  x: number,
  z: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  const lengthSquared = (bx - ax) ** 2 + (bz - az) ** 2;
  const t =
    lengthSquared === 0
      ? 0
      : clamp(((x - ax) * (bx - ax) + (z - az) * (bz - az)) / lengthSquared, 0, 1);
  const dx = x - (ax + t * (bx - ax));
  const dz = z - (az + t * (bz - az));
  return Math.hypot(dx, dz);
}

function insideEllipse(
  x: number,
  z: number,
  center: { x: number; z: number; rx: number; rz: number },
) {
  return ((x - center.x) / center.rx) ** 2 + ((z - center.z) / center.rz) ** 2 < 1;
}

export function isPlayableLand(x: number, z: number, config: ParkConfig) {
  const { terrain } = config;
  if (!pointInPolygon(x, z, terrain.landPolygon)) return false;
  if (terrain.mountain && insideEllipse(x, z, terrain.mountain)) return false;
  if (terrain.pond && insideEllipse(x, z, terrain.pond)) return false;
  if (terrain.riverPolygon) {
    for (let index = 1; index < terrain.riverPolygon.length; index += 1) {
      const [ax, az] = terrain.riverPolygon[index - 1];
      const [bx, bz] = terrain.riverPolygon[index];
      if (distanceToSegment(x, z, ax, az, bx, bz) < 8) return false;
    }
  }
  return true;
}

export function isSolidGround(x: number, z: number, config: ParkConfig) {
  const { terrain } = config;
  if (!pointInPolygon(x, z, terrain.landPolygon)) return false;
  if (terrain.mountain && insideEllipse(x, z, terrain.mountain)) return false;
  return true;
}

export function randomPlayablePosition(
  config: ParkConfig,
  seed: number,
  attempt = 0,
): [number, number] {
  const { bounds } = config;
  const x = (Math.random() - 0.5) * 2 * bounds.halfWidth;
  const z = (Math.random() - 0.5) * 2 * bounds.halfDepth;
  if (isPlayableLand(x, z, config)) return [x, z];
  if (attempt > 60) return [0, 0];
  return randomPlayablePosition(config, seed + 1, attempt + 1);
}
