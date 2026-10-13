/**
 * Every drawing routine lives here; game logic never imports this file.
 * To switch to SVG/image art, replace the bodies of drawPlayer / drawAsteroid /
 * drawPickup (they receive everything needed: position, size, state).
 * Origin is the screen center.
 */
import type { View } from "../engine/canvas.ts";
import { TAU } from "../engine/math.ts";
import type { Asteroid } from "./asteroid.ts";
import { CONFIG } from "./config.ts";
import { orbitPoint } from "./collision.ts";
import type { Pickup } from "./pickup.ts";
import type { Player } from "./player.ts";
import type { PickupKind } from "./types.ts";

const COLORS = {
  bg: "#05060f",
  orbit: "rgba(140, 170, 255, 0.28)",
  player: "#7de3ff",
  asteroidFill: "#4a4f66",
  asteroidStroke: "#9aa1c4",
  text: "#e8ecff",
  textDim: "rgba(232, 236, 255, 0.6)",
  hpOn: "#ff5d73",
  hpOff: "rgba(255, 93, 115, 0.2)",
  pickup: { heal: "#5dff9a", score: "#ffd84d", bomb: "#ff8a3d" } satisfies Record<PickupKind, string>,
};

const FONT = '"Segoe UI", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

function blinkVisible(timeLeft: number, hz: number): boolean {
  return Math.floor(timeLeft * hz * 2) % 2 === 0;
}

export function drawBackground(ctx: CanvasRenderingContext2D, view: View, R: number): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(-view.width / 2, -view.height / 2, view.width, view.height);
  ctx.strokeStyle = COLORS.orbit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, TAU);
  ctx.stroke();
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, R: number, alpha: number): void {
  if (p.invincibleLeft > 0 && !blinkVisible(p.invincibleLeft, CONFIG.player.blinkHz)) return;
  const angle = p.angle.at(alpha);
  const pos = orbitPoint(angle, R);
  const s = CONFIG.player.sizeRatio * R;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(angle + (p.dir * Math.PI) / 2); // nose points along the direction of travel
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.7, s * 0.65);
  ctx.lineTo(-s * 0.35, 0);
  ctx.lineTo(-s * 0.7, -s * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const ASTEROID_VERTS = 9;

export function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid, alpha: number): void {
  ctx.save();
  ctx.translate(a.x.at(alpha), a.y.at(alpha));
  ctx.rotate(a.seed * TAU + a.age * (a.seed - 0.5) * 2);
  ctx.fillStyle = COLORS.asteroidFill;
  ctx.strokeStyle = COLORS.asteroidStroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < ASTEROID_VERTS; i++) {
    // Deterministic per-asteroid jitter derived from the seed.
    const jitter = 0.8 + 0.2 * Math.sin((a.seed * 1000 + i * 12.9898) * 43758.5453);
    const ang = (i / ASTEROID_VERTS) * TAU;
    const r = a.radius * jitter;
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawPickup(ctx: CanvasRenderingContext2D, item: Pickup, R: number): void {
  const left = CONFIG.pickup.lifeSec - item.age;
  if (left < CONFIG.pickup.blinkSec && !blinkVisible(left, CONFIG.pickup.blinkHz)) return;
  const pos = orbitPoint(item.angle, R);
  const r = CONFIG.pickup.radiusRatio * R;
  const color = COLORS.pickup[item.kind];
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  switch (item.kind) {
    case "heal": {
      const t = r * 0.35;
      ctx.rect(-t, -r, t * 2, r * 2);
      ctx.rect(-r, -t, r * 2, t * 2);
      ctx.fill();
      break;
    }
    case "score":
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case "bomb":
      ctx.arc(0, 0, r * 0.6, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = "600",
): void {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  view: View,
  hp: number,
  score: number,
): void {
  const unit = Math.min(view.width, view.height);
  const pad = unit * 0.05;
  const left = -view.width / 2 + pad;
  const top = -view.height / 2 + pad;
  const pip = unit * 0.022;
  for (let i = 0; i < CONFIG.player.maxHp; i++) {
    ctx.fillStyle = i < hp ? COLORS.hpOn : COLORS.hpOff;
    ctx.beginPath();
    ctx.arc(left + pip + i * pip * 2.8, top + pip, pip, 0, TAU);
    ctx.fill();
  }
  text(ctx, String(Math.floor(score)), view.width / 2 - pad, top + pip, unit * 0.06, COLORS.text, "right", "700");
}

export function drawTitle(ctx: CanvasRenderingContext2D, view: View, best: number): void {
  const unit = Math.min(view.width, view.height);
  text(ctx, "RETROGRADE", 0, -unit * 0.05, unit * 0.1, COLORS.text, "center", "800");
  text(ctx, "Tap / click / Space to start", 0, unit * 0.04, unit * 0.04, COLORS.textDim);
  text(ctx, "One input: reverse direction", 0, unit * 0.09, unit * 0.032, COLORS.textDim, "center", "400");
  if (best > 0) text(ctx, `BEST ${best}`, 0, unit * 0.16, unit * 0.04, COLORS.text);
}

export function drawPaused(ctx: CanvasRenderingContext2D, view: View): void {
  const unit = Math.min(view.width, view.height);
  ctx.fillStyle = "rgba(5, 6, 15, 0.6)";
  ctx.fillRect(-view.width / 2, -view.height / 2, view.width, view.height);
  text(ctx, "PAUSED", 0, -unit * 0.02, unit * 0.09, COLORS.text, "center", "800");
  text(ctx, "Tap / click / Space to resume", 0, unit * 0.06, unit * 0.04, COLORS.textDim);
}

export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  view: View,
  score: number,
  best: number,
  isNewBest: boolean,
  ready: boolean,
): void {
  const unit = Math.min(view.width, view.height);
  text(ctx, "GAME OVER", 0, -unit * 0.14, unit * 0.09, COLORS.text, "center", "800");
  text(ctx, `SCORE ${score}`, 0, -unit * 0.04, unit * 0.06, COLORS.text);
  text(
    ctx,
    isNewBest ? "NEW BEST!" : `BEST ${best}`,
    0,
    unit * 0.03,
    unit * 0.04,
    isNewBest ? COLORS.pickup.score : COLORS.textDim,
  );
  if (ready) text(ctx, "Tap / click / Space to retry", 0, unit * 0.12, unit * 0.04, COLORS.textDim);
}
