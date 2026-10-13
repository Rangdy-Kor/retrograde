import type { Action } from "../../engine/input.ts";
import type { Scene } from "../../engine/scene.ts";
import { getNumber } from "../../engine/storage.ts";
import { CONFIG } from "../config.ts";
import { orbitRadius, type GameContext } from "../context.ts";
import { drawBackground, drawTitle } from "../renderer.ts";
import { PlayScene } from "./play.ts";

export class TitleScene implements Scene {
  private g: GameContext;
  private best = 0;

  constructor(g: GameContext) {
    this.g = g;
  }

  enter(): void {
    this.best = Math.floor(getNumber(CONFIG.highScoreKey, 0));
  }

  update(): void {}

  render(ctx: CanvasRenderingContext2D): void {
    drawBackground(ctx, this.g.view, orbitRadius(this.g.view));
    drawTitle(ctx, this.g.view, this.best);
  }

  // The starting input is consumed here; the play scene never sees it.
  onAction(_action: Action): void {
    this.g.scenes.set(new PlayScene(this.g));
  }
}
