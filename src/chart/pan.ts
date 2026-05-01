import { plotWidth } from "./state";
import { getLatestDataTime, getEarliestDataTime } from "./data";
import type { State } from "./types";

// Shifts visible time window based on drag delta in pixels
function panTime(state: State, deltaX: number): void {
  const tRange = state.timeEnd - state.timeStart;
  const deltaTime = -deltaX * (tRange / plotWidth(state));
  
  let newStart = state.timeStart + deltaTime;
  let newEnd = state.timeEnd + deltaTime;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const earliestDataTime = getEarliestDataTime(state.chartData);
  const range = tRange;
  
  // Left boundary: cannot go before earliest data
  if (newStart < earliestDataTime) {
    newStart = earliestDataTime;
    newEnd = earliestDataTime + range;
  }
  
  // Right boundary: cannot go beyond latest data
  if (newEnd > latestDataTime) {
    newEnd = latestDataTime;
    newStart = latestDataTime - range;
  }
  
  state.timeStart = newStart;
  state.timeEnd = newEnd;
}

// Applies pan update then triggers redraw
export function pan(state: State, dx: number, redraw: () => void, onVisibilityChange?: () => void): void {
  if (Math.abs(dx) < 1) return;
  
  // Store old values to check if anything changed
  const oldStart = state.timeStart;
  const oldEnd = state.timeEnd;
  
  // Apply pan - NO padding adjustments during pan
  panTime(state, dx);
  
  // Only redraw if something actually changed
  if (oldStart !== state.timeStart || oldEnd !== state.timeEnd) {
    redraw();
    if (onVisibilityChange) onVisibilityChange();
  }
}