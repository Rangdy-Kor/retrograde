import { Interp } from "../engine/interp.ts";
import { CONFIG } from "./config.ts";
import type { AsteroidSize } from "./types.ts";

export interface Asteroid {
  size: AsteroidSize;
  x: Interp;
  y: Interp;
  vx: number;
  vy: number;
  /** Drawn radius (px). */
  radius: number;
  hitRadius: number;
  /** Distance (px) left until fully off screen; the asteroid is removed at 0. */
  travelLeft: number;
  /** [0, 1) value for the renderer to derive shape and spin from. */
  seed: number;
  age: number;
}

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
 * is where the line enters the screen rect grown by `pad`, so the asteroid starts
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

export function createAsteroid(
  size: AsteroidSize,
  R: number,
  speedMul: number,
  traj: Trajectory,
): Asteroid {
  const def = CONFIG.asteroid.sizes[size];
  const radius = def.radius * R;
  const speed = def.speed * R * speedMul;
  return {
    size,
    x: new Interp(traj.x),
    y: new Interp(traj.y),
    vx: traj.ux * speed,
    vy: traj.uy * speed,
    radius,
    hitRadius: radius * CONFIG.asteroid.hitScale,
    travelLeft: traj.travel,
    seed: Math.random(),
    age: 0,
  };
}

/** Advances one step. Returns false once the asteroid has left the screen. */
export function updateAsteroid(a: Asteroid, dt: number): boolean {
  a.x.push(a.x.cur + a.vx * dt);
  a.y.push(a.y.cur + a.vy * dt);
  a.age += dt;
  a.travelLeft -= Math.hypot(a.vx, a.vy) * dt;
  return a.travelLeft > 0;
}
