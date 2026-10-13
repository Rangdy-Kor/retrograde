import { circlesOverlap } from "../engine/math.ts";
import type { Asteroid } from "./asteroid.ts";
import { CONFIG } from "./config.ts";
import type { Pickup } from "./pickup.ts";
import type { Player } from "./player.ts";

export function orbitPoint(angle: number, orbitR: number): { x: number; y: number } {
  return { x: Math.cos(angle) * orbitR, y: Math.sin(angle) * orbitR };
}

/**
 * orbitR: current orbit radius (player position).
 * baseR: reference radius the player's hit size scales with.
 */
export function playerHitsAsteroid(p: Player, a: Asteroid, orbitR: number, baseR: number): boolean {
  const pos = orbitPoint(p.angle.cur, orbitR);
  return circlesOverlap(pos.x, pos.y, CONFIG.player.hitRatio * baseR, a.x.cur, a.y.cur, a.hitRadius);
}

export function playerHitsPickup(p: Player, item: Pickup, orbitR: number, baseR: number): boolean {
  const pos = orbitPoint(p.angle.cur, orbitR);
  return circlesOverlap(
    pos.x,
    pos.y,
    CONFIG.player.hitRatio * baseR,
    item.x.cur,
    item.y.cur,
    CONFIG.pickup.radiusRatio * baseR,
  );
}
