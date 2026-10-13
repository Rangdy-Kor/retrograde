import { Interp } from "../engine/interp.ts";
import { TAU, randRange, randSign, weightedIndex } from "../engine/math.ts";
import { CONFIG } from "./config.ts";
import { planTrajectory, type Trajectory } from "./trajectory.ts";
import type { PickupKind } from "./types.ts";

export interface Pickup {
  kind: PickupKind;
  x: Interp;
  y: Interp;
  vx: number;
  vy: number;
  /** Distance (px) left until fully off screen; removed at 0. */
  travelLeft: number;
}

export interface PickupSpawnContext {
  baseR: number;
  targetR: number;
  halfW: number;
  halfH: number;
}

const KINDS: PickupKind[] = ["heal", "score", "bomb"];

/** Heal is excluded from the candidates while hp is full. */
function pickKind(hp: number): PickupKind {
  const w = CONFIG.pickup.weights;
  const weights = KINDS.map((k) => (k === "heal" && hp >= CONFIG.player.maxHp ? 0 : w[k]));
  return KINDS[weightedIndex(weights)];
}

function createPickup(kind: PickupKind, baseR: number, traj: Trajectory): Pickup {
  const speed = CONFIG.pickup.speed * baseR;
  return {
    kind,
    x: new Interp(traj.x),
    y: new Interp(traj.y),
    vx: traj.ux * speed,
    vy: traj.uy * speed,
    travelLeft: traj.travel,
  };
}

/** Advances one step. Returns false once the pickup has left the screen. */
export function updatePickup(p: Pickup, dt: number): boolean {
  p.x.push(p.x.cur + p.vx * dt);
  p.y.push(p.y.cur + p.vy * dt);
  p.travelLeft -= Math.hypot(p.vx, p.vy) * dt;
  return p.travelLeft > 0;
}

export class PickupSpawner {
  private timer: number = CONFIG.pickup.firstDelaySec;

  /** The timer only runs while no pickup is on screen. */
  update(dt: number, activeCount: number, hp: number, ctx: PickupSpawnContext): Pickup | null {
    if (activeCount >= CONFIG.pickup.maxActive) return null;
    this.timer -= dt;
    if (this.timer > 0) return null;

    // d <= dMax * targetR < targetR, so the path always crosses the orbit.
    const d = randRange(0, CONFIG.pickup.dMax) * ctx.targetR;
    const pad = CONFIG.pickup.radiusRatio * ctx.baseR + CONFIG.asteroid.spawnPadding;
    const traj = planTrajectory(d, Math.random() * TAU, randSign(), ctx.halfW, ctx.halfH, pad);
    if (!traj) return null;

    this.timer = randRange(CONFIG.pickup.intervalSec.min, CONFIG.pickup.intervalSec.max);
    return createPickup(pickKind(hp), ctx.baseR, traj);
  }
}
