import { lerp } from "../engine/math.ts";
import { CONFIG } from "./config.ts";

/** Everything the rest of the game needs to know about difficulty. */
export interface Factors {
  /** Asteroids per second. Uncapped. */
  spawnRate: number;
  speedMul: number;
  threatRatio: number;
  /** Share of asteroids that are small. */
  smallShare: number;
  /** Target orbit radius / baseR. */
  orbitRatio: number;
}

export function stageOf(score: number): number {
  return Math.floor(score / CONFIG.score.pointsPerStage);
}

/** Layer 1: stage -> D. */
export function stageToD(stage: number): number {
  const { A, T, k } = CONFIG.difficulty.curve;
  return A * Math.log(1 + Math.pow(stage / T, k));
}

/** start -> max, approaching max asymptotically as D grows. */
function saturate(c: { start: number; max: number; scale: number }, D: number): number {
  return lerp(c.start, c.max, 1 - Math.exp(-D / c.scale));
}

/** Layer 2: D -> game factors. */
export function dToFactors(D: number): Factors {
  const c = CONFIG.difficulty;
  return {
    spawnRate: c.spawnRate.base + c.spawnRate.slope * D,
    speedMul: saturate(c.speedMul, D),
    threatRatio: saturate(c.threatRatio, D),
    smallShare: saturate(c.smallShare, D),
    orbitRatio: saturate(c.orbitRatio, D),
  };
}
