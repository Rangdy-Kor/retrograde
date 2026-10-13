export interface Trajectory {
  x: number;
  y: number;
  /** Unit direction of travel. */
  ux: number;
  uy: number;
  /** Path length (px) from the spawn point until fully off screen. */
  travel: number;
}

/**
 * Straight line whose closest point to the center is C = d * (cos phi, sin phi).
 * Travel direction is perpendicular to C (sign picks which way). The spawn point
 * is where the line enters the screen rect grown by `pad`, so the object starts
 * just outside the screen. Returns null if the line misses the screen.
 */
export function planTrajectory(
  d: number,
  phi: number,
  sign: 1 | -1,
  halfW: number,
  halfH: number,
  pad: number,
): Trajectory | null {
  const cx = d * Math.cos(phi);
  const cy = d * Math.sin(phi);
  const ux = -Math.sin(phi) * sign;
  const uy = Math.cos(phi) * sign;

  // Intersect the line with the grown screen rect, one axis slab at a time.
  let s0 = -Infinity;
  let s1 = Infinity;
  const slabs: [number, number, number][] = [
    [cx, ux, halfW + pad],
    [cy, uy, halfH + pad],
  ];
  for (const [c, u, half] of slabs) {
    if (Math.abs(u) < 1e-9) {
      if (Math.abs(c) > half) return null;
      continue;
    }
    const a = (-half - c) / u;
    const b = (half - c) / u;
    s0 = Math.max(s0, Math.min(a, b));
    s1 = Math.min(s1, Math.max(a, b));
  }
  if (!(s1 > s0)) return null;
  return { x: cx + ux * s0, y: cy + uy * s0, ux, uy, travel: s1 - s0 };
}
