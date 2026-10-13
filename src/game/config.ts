/**
 * All tunable numbers live here.
 * "ratio" values are fractions of the orbit radius R (unless noted),
 * so the game feels the same on any screen size.
 */
export const CONFIG = {
  /** Fixed simulation rate (Hz). */
  tickHz: 60,
  highScoreKey: "retrograde.highScore",

  orbit: {
    /** R = min(width, height) * radiusRatio */
    radiusRatio: 0.3,
  },

  player: {
    /** rad/s */
    angularSpeed: 2.2,
    maxHp: 3,
    invincibleSec: 1,
    blinkHz: 8,
    /** Drawn triangle size / R */
    sizeRatio: 0.075,
    hitRatio: 0.045,
  },

  asteroid: {
    /** radius: / R. speed: R per second (at difficulty speedMul = 1). radius * speed is constant. */
    sizes: {
      small: { radius: 0.06, speed: 1.8, weight: 3 },
      medium: { radius: 0.1, speed: 1.08, weight: 3 },
      large: { radius: 0.15, speed: 0.72, weight: 2 },
    },
    /** Collision radius = radius * hitScale */
    hitScale: 0.9,
    /** Threatening: the line's closest point to the center is d * R away. Avoids d ~ 0. */
    threat: { dMin: 0.15, dMax: 0.9 },
    /** Missing: d >= dMin * R, capped (screenMargin * screen extent) so the line still crosses the screen. */
    miss: { dMin: 1.3, screenMargin: 0.9 },
    /** Extra distance (px) outside the screen where asteroids appear. */
    spawnPadding: 16,
    firstSpawnDelaySec: 0.8,
  },

  /** Every curve eases from start toward its limit as t / (t + halfTimeSec). */
  difficulty: {
    halfTimeSec: 60,
    spawnIntervalSec: { start: 1.2, min: 0.35 },
    threatRatio: { start: 0.4, max: 0.75 },
    speedMul: { start: 1, max: 1.8 },
  },

  pickup: {
    lifeSec: 5,
    blinkSec: 1.5,
    blinkHz: 8,
    /** Min angular distance (rad) from the player when spawning. */
    minAngleGap: 0.9,
    intervalSec: { min: 4, max: 8 },
    firstDelaySec: 3,
    maxActive: 1,
    /** Selection weights. Heal is skipped while hp is full. */
    weights: { heal: 55, score: 35, bomb: 10 },
    scoreBonus: 50,
    radiusRatio: 0.07,
  },

  score: {
    perSecond: 10,
  },

  ui: {
    /** Ignore input on the game over screen for this long. */
    gameOverInputLockSec: 0.3,
  },
} as const;
