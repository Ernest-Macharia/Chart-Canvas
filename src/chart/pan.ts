import { plotWidth } from "./state";
import type { State } from "./types";

function panTime(state: State, deltaX: number): void {
  const tRange = state.timeEnd - state.timeStart;
  const newStart = state.timeStart - deltaX * (tRange / plotWidth(state));
  const newEnd = newStart + tRange;
  state.timeStart = newStart;
  state.timeEnd = newEnd;
}

export function pan(state: State, dx: number, redraw: () => void): void {
  panTime(state, dx);
  redraw();
}
