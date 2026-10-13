export interface DebugOptions {
  /** ?stage=N: start at stage N. Such runs do not save the high score. */
  stage: number | null;
  /** ?debug=1: show the debug overlay. */
  overlay: boolean;
}

export function parseDebugOptions(search: string): DebugOptions {
  const params = new URLSearchParams(search);
  const raw = params.get("stage");
  const n = raw === null ? NaN : Math.floor(Number(raw));
  return {
    stage: Number.isFinite(n) && n >= 0 ? n : null,
    overlay: params.get("debug") === "1",
  };
}
