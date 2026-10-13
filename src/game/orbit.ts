import { Interp } from "../engine/interp.ts";
import { CONFIG } from "./config.ts";

/**
 * The orbit radius is stored as a ratio of baseR, so a resize keeps its
 * proportion. The current ratio eases exponentially toward the target.
 */
export interface Orbit {
  ratio: Interp;
  target: number;
}

export function createOrbit(ratio: number): Orbit {
  return { ratio: new Interp(ratio), target: ratio };
}

export function updateOrbit(o: Orbit, dt: number): void {
  const k = 1 - Math.exp(-dt / CONFIG.orbit.easeSec);
  o.ratio.push(o.ratio.cur + (o.target - o.ratio.cur) * k);
}
