import { TAU, randRange, randSign, weightedIndex } from "../engine/math.ts";
import { createAsteroid, planTrajectory, type Asteroid } from "./asteroid.ts";
import { CONFIG } from "./config.ts";
import { getDifficulty } from "./difficulty.ts";
import type { AsteroidSize } from "./types.ts";

export interface SpawnContext {
  /** Seconds since the run started. */
  time: number;
  /** Orbit radius (px). */
  R: number;
  halfW: number;
  halfH: number;
}

/** Swap implementations (e.g. a pattern-based one) without touching the scene. */
export interface Spawner {
  update(dt: number, ctx: SpawnContext): Asteroid[];
}

const SIZES = Object.keys(CONFIG.asteroid.sizes) as AsteroidSize[];
const SIZE_WEIGHTS = SIZES.map((s) => CONFIG.asteroid.sizes[s].weight);

export class RandomSpawner implements Spawner {
  private timer: number = CONFIG.asteroid.firstSpawnDelaySec;

  update(dt: number, ctx: SpawnContext): Asteroid[] {
    const out: Asteroid[] = [];
    this.timer -= dt;
    while (this.timer <= 0) {
      const diff = getDifficulty(ctx.time);
      const a = this.spawnOne(ctx, diff.threatRatio, diff.speedMul);
      if (a) out.push(a);
      this.timer += diff.spawnIntervalSec;
    }
    return out;
  }

  private spawnOne(ctx: SpawnContext, threatRatio: number, speedMul: number): Asteroid | null {
    const cfg = CONFIG.asteroid;
    const size = SIZES[weightedIndex(SIZE_WEIGHTS)];
    const sizeRadius = cfg.sizes[size].radius * ctx.R;
    const phi = Math.random() * TAU;

    let d: number;
    if (Math.random() < threatRatio) {
      d = randRange(cfg.threat.dMin, cfg.threat.dMax) * ctx.R;
    } else {
      // A line at distance d with normal direction phi crosses the screen rect
      // only if d <= the rect's extent along phi.
      const extent = ctx.halfW * Math.abs(Math.cos(phi)) + ctx.halfH * Math.abs(Math.sin(phi));
      const dMin = cfg.miss.dMin * ctx.R;
      const dMax = Math.max(dMin, extent * cfg.miss.screenMargin);
      d = randRange(dMin, dMax);
    }

    const traj = planTrajectory(
      d,
      phi,
      randSign(),
      ctx.halfW,
      ctx.halfH,
      sizeRadius + cfg.spawnPadding,
    );
    return traj ? createAsteroid(size, ctx.R, speedMul, traj) : null;
  }
}
