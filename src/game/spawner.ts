import { TAU, randRange, randSign, weightedIndex } from "../engine/math.ts";
import { createAsteroid, type Asteroid } from "./asteroid.ts";
import { CONFIG } from "./config.ts";
import { planTrajectory } from "./trajectory.ts";
import type { AsteroidSize } from "./types.ts";

/** What a spawner needs to know about the current difficulty. */
export interface SpawnStats {
  /** Asteroids per second. */
  rate: number;
  speedMul: number;
  threatRatio: number;
  smallShare: number;
}

export interface SpawnContext {
  stats: SpawnStats;
  /** Reference radius (px) that asteroid size and speed scale with. */
  baseR: number;
  /** Radius (px) the orbit is heading to; trajectories are aimed relative to it. */
  targetR: number;
  halfW: number;
  halfH: number;
}

/** Swap implementations (e.g. a pattern-based one) without touching the scene. */
export interface Spawner {
  update(dt: number, ctx: SpawnContext): Asteroid[];
}

const SIZES: AsteroidSize[] = ["small", "medium", "large"];

export class RandomSpawner implements Spawner {
  private timer: number = CONFIG.asteroid.firstSpawnDelaySec;

  update(dt: number, ctx: SpawnContext): Asteroid[] {
    const out: Asteroid[] = [];
    this.timer -= dt;
    while (this.timer <= 0) {
      const a = this.spawnOne(ctx);
      if (a) out.push(a);
      this.timer += 1 / ctx.stats.rate;
    }
    return out;
  }

  private spawnOne(ctx: SpawnContext): Asteroid | null {
    const cfg = CONFIG.asteroid;
    const { smallShare, threatRatio, speedMul } = ctx.stats;
    const rest = 1 - smallShare;
    const total = cfg.restWeights.medium + cfg.restWeights.large;
    const size = SIZES[
      weightedIndex([
        smallShare,
        (rest * cfg.restWeights.medium) / total,
        (rest * cfg.restWeights.large) / total,
      ])
    ];
    const phi = Math.random() * TAU;

    let d: number;
    if (Math.random() < threatRatio) {
      d = randRange(cfg.threat.dMin, cfg.threat.dMax) * ctx.targetR;
    } else {
      // A line at distance d with normal direction phi crosses the screen rect
      // only if d <= the rect's extent along phi.
      const extent = ctx.halfW * Math.abs(Math.cos(phi)) + ctx.halfH * Math.abs(Math.sin(phi));
      const dMin = cfg.miss.dMin * ctx.targetR;
      const dMax = Math.max(dMin, extent * cfg.miss.screenMargin);
      d = randRange(dMin, dMax);
    }

    const pad = cfg.sizes[size].radius * ctx.baseR + cfg.spawnPadding;
    const traj = planTrajectory(d, phi, randSign(), ctx.halfW, ctx.halfH, pad);
    return traj ? createAsteroid(size, ctx.baseR, speedMul, traj) : null;
  }
}
