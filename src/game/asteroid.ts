import { Interp } from "../engine/interp.ts";
import { CONFIG } from "./config.ts";
import type { Trajectory } from "./trajectory.ts";
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

/** Size and speed are fixed at creation, scaled by baseR (not the shrinking orbit). */
export function createAsteroid(
  size: AsteroidSize,
  baseR: number,
  speedMul: number,
  traj: Trajectory,
): Asteroid {
  const def = CONFIG.asteroid.sizes[size];
  const radius = def.radius * baseR;
  const speed = def.speed * baseR * speedMul;
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
