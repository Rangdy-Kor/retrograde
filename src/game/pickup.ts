import { TAU, randRange, weightedIndex } from "../engine/math.ts";
import { CONFIG } from "./config.ts";
import type { PickupKind } from "./types.ts";

export interface Pickup {
  kind: PickupKind;
  /** Angle on the orbit, radians. */
  angle: number;
  age: number;
}

const KINDS: PickupKind[] = ["heal", "score", "bomb"];

/** Heal is excluded from the candidates while hp is full. */
function pickKind(hp: number): PickupKind {
  const w = CONFIG.pickup.weights;
  const weights = KINDS.map((k) => (k === "heal" && hp >= CONFIG.player.maxHp ? 0 : w[k]));
  return KINDS[weightedIndex(weights)];
}

export class PickupSpawner {
  private timer: number = CONFIG.pickup.firstDelaySec;

  /** Returns a new pickup when it is time to spawn one. */
  update(dt: number, activeCount: number, playerAngle: number, hp: number): Pickup | null {
    if (activeCount >= CONFIG.pickup.maxActive) return null;
    this.timer -= dt;
    if (this.timer > 0) return null;
    this.timer = randRange(CONFIG.pickup.intervalSec.min, CONFIG.pickup.intervalSec.max);
    const gap = CONFIG.pickup.minAngleGap;
    return {
      kind: pickKind(hp),
      angle: playerAngle + randRange(gap, TAU - gap),
      age: 0,
    };
  }
}
