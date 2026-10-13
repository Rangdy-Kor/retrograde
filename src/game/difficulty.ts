import { lerp } from "../engine/math.ts";
import { CONFIG } from "./config.ts";

export interface Difficulty {
  spawnIntervalSec: number;
  threatRatio: number;
  speedMul: number;
}

export function getDifficulty(timeSec: number): Difficulty {
  const c = CONFIG.difficulty;
  const e = timeSec / (timeSec + c.halfTimeSec);
  return {
    spawnIntervalSec: lerp(c.spawnIntervalSec.start, c.spawnIntervalSec.min, e),
    threatRatio: lerp(c.threatRatio.start, c.threatRatio.max, e),
    speedMul: lerp(c.speedMul.start, c.speedMul.max, e),
  };
}
