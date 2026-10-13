import type { Action } from "./input.ts";

export interface Scene {
  enter?(): void;
  update(dt: number): void;
  render(ctx: CanvasRenderingContext2D, alpha: number): void;
  onAction(action: Action): void;
  /** Called when the page becomes hidden. */
  onHidden?(): void;
}

export class SceneManager {
  private current: Scene | null = null;

  set(scene: Scene): void {
    this.current = scene;
    scene.enter?.();
  }

  update(dt: number): void {
    this.current?.update(dt);
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    this.current?.render(ctx, alpha);
  }

  onAction(action: Action): void {
    this.current?.onAction(action);
  }

  onHidden(): void {
    this.current?.onHidden?.();
  }
}
