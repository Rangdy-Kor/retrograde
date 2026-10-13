import { Interp } from "../engine/interp.ts";
import { TAU } from "../engine/math.ts";
import { CONFIG } from "./config.ts";

export interface Player {
  /** Position on the orbit, radians. Unbounded (not wrapped) so it interpolates cleanly. */
  angle: Interp;
  dir: 1 | -1;
  hp: number;
  invincibleLeft: number;
}

export function createPlayer(): Player {
  return {
    angle: new Interp(-Math.PI / 2),
    dir: 1,
    hp: CONFIG.player.maxHp,
    invincibleLeft: 0,
  };
}

/**
 * The player moves at a fixed linear speed (base linear speed * speedMul), so the
 * angular speed grows as the orbit shrinks: omega = v / R. Capped by minLapSec.
 * baseR cancels out because the base linear speed is angularSpeed * baseR.
 */
export function playerAngularSpeed(speedMul: number, orbitRatio: number): number {
  const omega = (CONFIG.player.angularSpeed * speedMul) / orbitRatio;
  return Math.min(omega, TAU / CONFIG.player.minLapSec);
}

export function updatePlayer(p: Player, dt: number, angularSpeed: number): void {
  p.angle.push(p.angle.cur + p.dir * angularSpeed * dt);
  if (p.invincibleLeft > 0) p.invincibleLeft = Math.max(0, p.invincibleLeft - dt);
}

export function flipPlayer(p: Player): void {
  p.dir = p.dir === 1 ? -1 : 1;
}

export function damagePlayer(p: Player): void {
  p.hp -= 1;
  p.invincibleLeft = CONFIG.player.invincibleSec;
}

export function healPlayer(p: Player): void {
  p.hp = Math.min(CONFIG.player.maxHp, p.hp + 1);
}
