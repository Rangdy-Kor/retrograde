import "./style.css";
import { createCanvasView } from "./engine/canvas.ts";
import { createInput } from "./engine/input.ts";
import { createLoop } from "./engine/loop.ts";
import { SceneManager } from "./engine/scene.ts";
import { CONFIG } from "./game/config.ts";
import { TitleScene } from "./game/scenes/title.ts";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("#game canvas not found");

const { ctx, view, beginFrame } = createCanvasView(canvas);
const scenes = new SceneManager();

const loop = createLoop({
  step: 1 / CONFIG.tickHz,
  update: (dt) => scenes.update(dt),
  render: (alpha) => {
    beginFrame();
    scenes.render(ctx, alpha);
  },
});

createInput((action) => scenes.onAction(action));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) scenes.onHidden();
  else loop.resetClock();
});

scenes.set(new TitleScene({ view, scenes }));
loop.start();
