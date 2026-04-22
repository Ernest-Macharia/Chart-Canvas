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
};

export function setupChartEvents({
  canvas,
  container,
  ctx,
  dpr,
  state,
  redraw,
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
    pan(state, pos.x - lastDragX, redraw);
    lastDragX = pos.x;
  });

  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const pos = getMousePos(canvas, e);
    zoom(state, pos.x, pos.y, e.deltaY, redraw);
  });

  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    state.width = newWidth;
    state.height = newHeight;
    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    redraw();
  });
}
