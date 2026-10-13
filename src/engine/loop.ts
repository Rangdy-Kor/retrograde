export interface LoopOptions {
  /** Fixed simulation step in seconds. */
  step: number;
  update(dt: number): void;
  /** alpha in [0, 1): how far the render time is between the last two updates. */
  render(alpha: number): void;
}

const MAX_FRAME = 0.25;

export function createLoop(opts: LoopOptions) {
  let acc = 0;
  let last = 0;
  let raf = 0;

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    acc += dt;
    while (acc >= opts.step) {
      opts.update(opts.step);
      acc -= opts.step;
    }
    opts.render(acc / opts.step);
    raf = requestAnimationFrame(frame);
  };

  return {
    start() {
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    /** Discards elapsed time, e.g. after the tab was hidden. */
    resetClock() {
      last = performance.now();
      acc = 0;
    },
  };
}
