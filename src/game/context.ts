import type { View } from "../engine/canvas.ts";
import type { SceneManager } from "../engine/scene.ts";
import { CONFIG } from "./config.ts";

export interface GameContext {
  view: View;
  scenes: SceneManager;
}

/** Orbit radius (px), recomputed from the current view so resizes need no extra handling. */
export function orbitRadius(view: View): number {
  return Math.min(view.width, view.height) * CONFIG.orbit.radiusRatio;
}
