import type { Action } from "../../engine/input.ts";
import type { Scene } from "../../engine/scene.ts";
import { getNumber, setNumber } from "../../engine/storage.ts";
import { updateAsteroid, type Asteroid } from "../asteroid.ts";
import { playerHitsAsteroid, playerHitsPickup } from "../collision.ts";
import { CONFIG } from "../config.ts";
import { baseRadius, type GameContext } from "../context.ts";
import { dToFactors, stageOf, stageToD, type Factors } from "../difficulty.ts";
import { createOrbit, updateOrbit } from "../orbit.ts";
import { PickupSpawner, updatePickup, type Pickup } from "../pickup.ts";
import { createPlayer, damagePlayer, flipPlayer, healPlayer, updatePlayer } from "../player.ts";
import {
  drawAsteroid,
  drawBackground,
  drawDebug,
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
  private bonus: number;
  private stage: number;
  private D: number;
  private factors: Factors;
  private orbit;
  private stageFlash = 0;
  private paused = false;

  constructor(g: GameContext, spawner: Spawner = new RandomSpawner()) {
    this.g = g;
    this.spawner = spawner;
    // ?stage=N starts at N * pointsPerStage with the orbit already at that stage's target.
    this.bonus = (g.debug.stage ?? 0) * CONFIG.score.pointsPerStage;
    this.stage = stageOf(this.bonus);
    this.D = stageToD(this.stage);
    this.factors = dToFactors(this.D);
    this.orbit = createOrbit(this.factors.orbitRatio);
  }

  private get score(): number {
    return this.time * CONFIG.score.perSecond + this.bonus;
  }

  update(dt: number): void {
    if (this.paused) return;
    const view = this.g.view;
    const baseR = baseRadius(view);
    const orbitR = this.orbit.ratio.cur * baseR;
    const targetR = this.orbit.target * baseR;
    const halfW = view.width / 2;
    const halfH = view.height / 2;
    this.time += dt;
    if (this.stageFlash > 0) this.stageFlash = Math.max(0, this.stageFlash - dt);

    updateOrbit(this.orbit, dt);
    updatePlayer(this.player, dt);

    const f = this.factors;
    this.asteroids.push(
      ...this.spawner.update(dt, {
        stats: {
          rate: f.spawnRate,
          speedMul: f.speedMul,
          threatRatio: f.threatRatio,
          smallShare: f.smallShare,
        },
        baseR,
        targetR,
        halfW,
        halfH,
      }),
    );
    this.asteroids = this.asteroids.filter((a) => updateAsteroid(a, dt));

    const item = this.pickupSpawner.update(dt, this.pickups.length, this.player.hp, {
      baseR,
      targetR,
      halfW,
      halfH,
    });
    if (item) this.pickups.push(item);
    this.pickups = this.pickups.filter((p) => updatePickup(p, dt));

    this.collectPickups(orbitR, baseR);
    this.checkAsteroidHits(orbitR, baseR);
    this.updateStage();

    if (this.player.hp <= 0) this.gameOver();
  }

  /** Difficulty only changes when the stage does; existing asteroids keep their values. */
  private updateStage(): void {
    const stage = stageOf(this.score);
    if (stage === this.stage) return;
    this.stage = stage;
    this.D = stageToD(stage);
    this.factors = dToFactors(this.D);
    this.orbit.target = this.factors.orbitRatio;
    this.stageFlash = CONFIG.ui.stageFlashSec;
  }

  private collectPickups(orbitR: number, baseR: number): void {
    this.pickups = this.pickups.filter((item) => {
      if (!playerHitsPickup(this.player, item, orbitR, baseR)) return true;
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

  private checkAsteroidHits(orbitR: number, baseR: number): void {
    if (this.player.invincibleLeft > 0) return;
    const i = this.asteroids.findIndex((a) => playerHitsAsteroid(this.player, a, orbitR, baseR));
    if (i < 0) return;
    this.asteroids.splice(i, 1);
    damagePlayer(this.player);
  }

  private gameOver(): void {
    const score = Math.floor(this.score);
    const best = Math.floor(getNumber(CONFIG.highScoreKey, 0));
    // Runs started with ?stage=N never touch the saved high score.
    const save = this.g.debug.stage === null;
    const isNewBest = save && score > best;
    if (isNewBest) setNumber(CONFIG.highScoreKey, score);
    this.g.scenes.set(new GameOverScene(this.g, score, isNewBest ? score : best, isNewBest));
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    // While paused nothing advances, so render the latest state without blending.
    const a = this.paused ? 1 : alpha;
    const view = this.g.view;
    const baseR = baseRadius(view);
    const orbitR = this.orbit.ratio.at(a) * baseR;
    drawBackground(ctx, view, orbitR);
    for (const item of this.pickups) drawPickup(ctx, item, baseR, a);
    for (const ast of this.asteroids) drawAsteroid(ctx, ast, a);
    drawPlayer(ctx, this.player, orbitR, baseR, a);
    drawHud(
      ctx,
      view,
      this.player.hp,
      this.score,
      this.stage,
      this.stageFlash / CONFIG.ui.stageFlashSec,
    );
    if (this.g.debug.overlay) this.drawDebugOverlay(ctx, orbitR, baseR);
    if (this.paused) drawPaused(ctx, view);
  }

  private drawDebugOverlay(ctx: CanvasRenderingContext2D, orbitR: number, baseR: number): void {
    const f = this.factors;
    const targetR = this.orbit.target * baseR;
    drawDebug(ctx, this.g.view, [
      `stage ${this.stage}  D ${this.D.toFixed(2)}`,
      `spawn ${f.spawnRate.toFixed(2)}/s  speed x${f.speedMul.toFixed(2)}`,
      `threat ${f.threatRatio.toFixed(2)}  small ${f.smallShare.toFixed(2)}`,
      `R ${orbitR.toFixed(0)} -> ${targetR.toFixed(0)} (base ${baseR.toFixed(0)})`,
    ]);
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
