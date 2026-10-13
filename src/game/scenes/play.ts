import type { Action } from "../../engine/input.ts";
import type { Scene } from "../../engine/scene.ts";
import { getNumber, setNumber } from "../../engine/storage.ts";
import { updateAsteroid, type Asteroid } from "../asteroid.ts";
import { playerHitsAsteroid, playerHitsPickup } from "../collision.ts";
import { CONFIG } from "../config.ts";
import { orbitRadius, type GameContext } from "../context.ts";
import { PickupSpawner, type Pickup } from "../pickup.ts";
import { createPlayer, damagePlayer, flipPlayer, healPlayer, updatePlayer } from "../player.ts";
import {
  drawAsteroid,
  drawBackground,
  drawHud,
  drawPaused,
  drawPickup,
  drawPlayer,
} from "../renderer.ts";
import { RandomSpawner, type Spawner } from "../spawner.ts";
import { GameOverScene } from "./gameover.ts";

export class PlayScene implements Scene {
  private g: GameContext;
  private spawner: Spawner;
  private pickupSpawner = new PickupSpawner();
  private player = createPlayer();
  private asteroids: Asteroid[] = [];
  private pickups: Pickup[] = [];
  private time = 0;
  private bonus = 0;
  private paused = false;

  constructor(g: GameContext, spawner: Spawner = new RandomSpawner()) {
    this.g = g;
    this.spawner = spawner;
  }

  private get score(): number {
    return this.time * CONFIG.score.perSecond + this.bonus;
  }

  update(dt: number): void {
    if (this.paused) return;
    const view = this.g.view;
    const R = orbitRadius(view);
    this.time += dt;

    updatePlayer(this.player, dt);

    this.asteroids.push(
      ...this.spawner.update(dt, { time: this.time, R, halfW: view.width / 2, halfH: view.height / 2 }),
    );
    this.asteroids = this.asteroids.filter((a) => updateAsteroid(a, dt));

    const item = this.pickupSpawner.update(dt, this.pickups.length, this.player.angle.cur, this.player.hp);
    if (item) this.pickups.push(item);
    for (const p of this.pickups) p.age += dt;
    this.pickups = this.pickups.filter((p) => p.age < CONFIG.pickup.lifeSec);

    this.collectPickups(R);
    this.checkAsteroidHits(R);

    if (this.player.hp <= 0) this.gameOver();
  }

  private collectPickups(R: number): void {
    this.pickups = this.pickups.filter((item) => {
      if (!playerHitsPickup(this.player, item, R)) return true;
      switch (item.kind) {
        case "heal":
          healPlayer(this.player);
          break;
        case "score":
          this.bonus += CONFIG.pickup.scoreBonus;
          break;
        case "bomb":
          this.asteroids = [];
          break;
      }
      return false;
    });
  }

  private checkAsteroidHits(R: number): void {
    if (this.player.invincibleLeft > 0) return;
    const i = this.asteroids.findIndex((a) => playerHitsAsteroid(this.player, a, R));
    if (i < 0) return;
    this.asteroids.splice(i, 1);
    damagePlayer(this.player);
  }

  private gameOver(): void {
    const score = Math.floor(this.score);
    const best = Math.floor(getNumber(CONFIG.highScoreKey, 0));
    const isNewBest = score > best;
    if (isNewBest) setNumber(CONFIG.highScoreKey, score);
    this.g.scenes.set(new GameOverScene(this.g, score, Math.max(score, best), isNewBest));
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    // While paused nothing advances, so render the latest state without blending.
    const a = this.paused ? 1 : alpha;
    const view = this.g.view;
    const R = orbitRadius(view);
    drawBackground(ctx, view, R);
    for (const item of this.pickups) drawPickup(ctx, item, R);
    for (const ast of this.asteroids) drawAsteroid(ctx, ast, a);
    drawPlayer(ctx, this.player, R, a);
    drawHud(ctx, view, this.player.hp, this.score);
    if (this.paused) drawPaused(ctx, view);
  }

  onAction(_action: Action): void {
    if (this.paused) {
      // The resuming input is consumed; it must not also flip direction.
      this.paused = false;
      return;
    }
    flipPlayer(this.player);
  }

  onHidden(): void {
    this.paused = true;
  }
}
