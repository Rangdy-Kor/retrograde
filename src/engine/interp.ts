/**
 * A number tracked across fixed-timestep updates so rendering can blend
 * between the previous and current step. Call push() once per update and
 * at(alpha) in render; use reset() when a value should teleport.
 */
export class Interp {
  prev: number;
  cur: number;

  constructor(value = 0) {
    this.prev = value;
    this.cur = value;
  }

  reset(value: number): void {
    this.prev = value;
    this.cur = value;
  }

  push(value: number): void {
    this.prev = this.cur;
    this.cur = value;
  }

  at(alpha: number): number {
    return this.prev + (this.cur - this.prev) * alpha;
  }
}
