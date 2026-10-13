import type { View } from "../engine/canvas.ts";
import type { SceneManager } from "../engine/scene.ts";
import { CONFIG } from "./config.ts";
import type { DebugOptions } from "./debug.ts";

export interface GameContext {
  view: View;
  scenes: SceneManager;
  debug: DebugOptions;
}

/**
 * Reference radius (px) from the screen size. Asteroid/pickup/player sizes and
 * speeds scale with this, not with the (shrinking) orbit. Recomputed on every
 * call so resizes need no extra handling.
 */
export function baseRadius(view: View): number {
  return Math.min(view.width, view.height) * CONFIG.orbit.baseRadiusRatio;
}
