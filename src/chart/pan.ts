import { plotWidth } from "./state";
import type { State } from "./types";

// Shifts visible time window based on drag delta in pixels.
function panTime(state: State, deltaX: number): void {
  const tRange = state.timeEnd - state.timeStart;
  const newStart = state.timeStart - deltaX * (tRange / plotWidth(state));
  const newEnd = newStart + tRange;
  state.timeStart = newStart;
  state.timeEnd = newEnd;
}

// Applies pan update then triggers redraw.
export function pan(state: State, dx: number, redraw: () => void): void {
  panTime(state, dx);
  redraw();
}
