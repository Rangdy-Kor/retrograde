import { Interp } from "../engine/interp.ts";
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

export function updatePlayer(p: Player, dt: number): void {
  p.angle.push(p.angle.cur + p.dir * CONFIG.player.angularSpeed * dt);
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
