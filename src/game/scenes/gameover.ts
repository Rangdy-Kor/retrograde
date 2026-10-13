import type { Action } from "../../engine/input.ts";
import type { Scene } from "../../engine/scene.ts";
import { CONFIG } from "../config.ts";
import { orbitRadius, type GameContext } from "../context.ts";
import { drawBackground, drawGameOver } from "../renderer.ts";
import { PlayScene } from "./play.ts";

export class GameOverScene implements Scene {
  private g: GameContext;
  private score: number;
  private best: number;
  private isNewBest: boolean;
  private lock: number = CONFIG.ui.gameOverInputLockSec;

  constructor(g: GameContext, score: number, best: number, isNewBest: boolean) {
    this.g = g;
    this.score = score;
    this.best = best;
    this.isNewBest = isNewBest;
  }

  update(dt: number): void {
    if (this.lock > 0) this.lock -= dt;
  }

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx, this.g.view, orbitRadius(this.g.view));
    drawGameOver(ctx, this.g.view, this.score, this.best, this.isNewBest, this.lock <= 0);
  }

  onAction(_action: Action): void {
    if (this.lock > 0) return;
    this.g.scenes.set(new PlayScene(this.g));
  }
}
