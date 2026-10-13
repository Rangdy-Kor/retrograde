/**
 * All tunable numbers live here.
 * "ratio" values are fractions of the base orbit radius baseR
 * (baseR = min(width, height) * orbit.baseRadiusRatio), so the game feels the
 * same on any screen size. The orbit itself shrinks below baseR as stages rise;
 * sizes and speeds stay tied to baseR so shrinking makes the game harder.
 */
export const CONFIG = {
  /** Fixed simulation rate (Hz). */
  tickHz: 60,
  highScoreKey: "retrograde.highScore",

  orbit: {
    /** baseR = min(width, height) * baseRadiusRatio */
    baseRadiusRatio: 0.3,
    /** Time constant (s) of the exponential ease toward the target radius. */
    easeSec: 1.5,
  },

  player: {
    /**
     * Angular speed (rad/s) on the full-size orbit. Together with baseR this defines the base
     * linear speed (angularSpeed * baseR); the actual angular speed is linear speed / current radius.
     */
    angularSpeed: 2.2,
    /** Angular speed is clamped so one lap never takes less than this. */
    minLapSec: 1.3,
    maxHp: 3,
    invincibleSec: 1,
    blinkHz: 8,
    /** Drawn triangle size / baseR */
    sizeRatio: 0.075,
    hitRatio: 0.045,
  },

  asteroid: {
    /** radius: / baseR. speed: baseR per second at speedMul = 1. radius * speed is constant. */
    sizes: {
      small: { radius: 0.06, speed: 1.8 },
      medium: { radius: 0.1, speed: 1.08 },
      large: { radius: 0.15, speed: 0.72 },
    },
    /** Medium:large split of the share that is not small. */
    restWeights: { medium: 3, large: 2 },
    /** Collision radius = radius * hitScale */
    hitScale: 0.9,
    /** Threatening: the line's closest point to the center is d * targetR away. Avoids d ~ 0. */
    threat: { dMin: 0.15, dMax: 0.9 },
    /** Missing: d >= dMin * targetR, capped (screenMargin * screen extent) so the line still crosses the screen. */
    miss: { dMin: 1.3, screenMargin: 0.9 },
    /** Extra distance (px) outside the screen where asteroids and pickups appear. */
    spawnPadding: 16,
    firstSpawnDelaySec: 0.8,
  },

  score: {
    /** 1000 points per minute. */
    perSecond: 1000 / 60,
    /** stage = floor(totalScore / pointsPerStage), pickup bonuses included. */
    pointsPerStage: 100,
  },

  /**
   * Two layers: stage -> D (curve), then D -> game factors.
   * Saturating factors: start + (max - start) * (1 - e^(-D / scale)).
   */
  difficulty: {
    /**
     * D(n) = A * ln(1 + (n / T)^k).
     * Fitted to pass through (stage, D) = (8, 1.5), (25, 6.0), (45, 8.5):
     * gentle early, steep around stages 5-12, then flattening without a cap.
     */
    curve: { A: 1.149, T: 6.127, k: 3.71 },
    /** Uncapped: asteroids per second = base + slope * D. Late-game attrition comes from this. */
    spawnRate: { base: 1.4, slope: 0.55 },
    speedMul: { start: 1, max: 1.8, scale: 4 },
    /** Player linear speed multiplier; applies immediately when the stage changes. */
    playerSpeedMul: { start: 1, max: 1.3, scale: 4 },
    threatRatio: { start: 0.5, max: 0.85, scale: 4 },
    smallShare: { start: 0.3, max: 0.6, scale: 5 },
    /** Target orbit radius as a fraction of baseR. */
    orbitRatio: { start: 1, max: 0.5, scale: 5 },
  },

  pickup: {
    /** baseR per second. Must stay below the slowest asteroid speed. Not scaled by difficulty. */
    speed: 0.35,
    /** Closest-approach distance d is drawn from [0, dMax * targetR], so it always crosses the orbit. */
    dMax: 0.8,
    intervalSec: { min: 4, max: 8 },
    firstDelaySec: 3,
    maxActive: 1,
    /** Selection weights. Heal is skipped while hp is full. */
    weights: { heal: 55, score: 35, bomb: 10 },
    scoreBonus: 100,
    radiusRatio: 0.07,
  },

  ui: {
    /** Ignore input on the game over screen for this long. */
    gameOverInputLockSec: 0.3,
    /** Highlight duration of the stage readout when the stage changes. */
    stageFlashSec: 0.5,
  },
} as const;
