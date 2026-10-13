export type Action = "primary";

/**
 * Maps pointer (mouse/touch/pen) presses and the Space key onto a single
 * action. Returns a function that removes the listeners.
 */
export function createInput(onAction: (action: Action) => void): () => void {
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    onAction("primary");
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (e.repeat) return;
    onAction("primary");
  };
  const onContextMenu = (e: Event) => e.preventDefault();

  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("contextmenu", onContextMenu);
  return () => {
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("contextmenu", onContextMenu);
  };
}
