/** Logical size in CSS pixels. Drawing coordinates have their origin at the center. */
export interface View {
  width: number;
  height: number;
  dpr: number;
}

export function createCanvasView(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not supported");

  const view: View = { width: 0, height: 0, dpr: 1 };

  const resize = () => {
    view.dpr = window.devicePixelRatio || 1;
    view.width = canvas.clientWidth;
    view.height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(view.width * view.dpr));
    canvas.height = Math.max(1, Math.round(view.height * view.dpr));
  };

  resize();
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);

  return {
    ctx,
    view,
    /** Resets the transform for a new frame: DPR scaling, origin at the center. */
    beginFrame() {
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.clearRect(0, 0, view.width, view.height);
      ctx.translate(view.width / 2, view.height / 2);
    },
  };
}
