import { circlesOverlap } from "../engine/math.ts";
import type { Asteroid } from "./asteroid.ts";
import { CONFIG } from "./config.ts";
import type { Pickup } from "./pickup.ts";
import type { Player } from "./player.ts";

export function orbitPoint(angle: number, R: number): { x: number; y: number } {
  return { x: Math.cos(angle) * R, y: Math.sin(angle) * R };
}

export function playerHitsAsteroid(p: Player, a: Asteroid, R: number): boolean {
  const pos = orbitPoint(p.angle.cur, R);
  return circlesOverlap(pos.x, pos.y, CONFIG.player.hitRatio * R, a.x.cur, a.y.cur, a.hitRadius);
}

export function playerHitsPickup(p: Player, item: Pickup, R: number): boolean {
  const a = orbitPoint(p.angle.cur, R);
  const b = orbitPoint(item.angle, R);
  return circlesOverlap(
    a.x,
    a.y,
    CONFIG.player.hitRatio * R,
    b.x,
    b.y,
    CONFIG.pickup.radiusRatio * R,
  );
}
