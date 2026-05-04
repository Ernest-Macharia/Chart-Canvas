import { getMousePos } from "./mouse";
import { pan } from "./pan";
import { zoom } from "./zoom";
import type { State } from "./types";

type SetupChartEventsArgs = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  state: State;
  redraw: () => void;
  onVisibilityChange?: () => void;
};

// Wires mouse and wheel handlers for chart interactions.
export function setupChartEvents({
  canvas,
  state,
  redraw,
  onVisibilityChange,
}: SetupChartEventsArgs): void {
  let lastDragX = 0;

  canvas.addEventListener("mousedown", (e) => {
    state.isDragging = true;
    const pos = getMousePos(canvas, e);
    lastDragX = pos.x;
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!state.isDragging) return;
    const pos = getMousePos(canvas, e);
    pan(state, pos.x - lastDragX, redraw, onVisibilityChange);
    lastDragX = pos.x;
  });

  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const pos = getMousePos(canvas, e);
    zoom(state, pos.x, pos.y, e.deltaY, redraw, onVisibilityChange);
  });
}
