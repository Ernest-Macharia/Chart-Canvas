import { plotWidth } from "./state";
import { getLatestDataTime, getEarliestDataTime } from "./data";
import type { State } from "./types";

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
  
  // Calculate default offset position (30% padding)
  const defaultPaddingRatio = 0.30;
  const defaultOffset = range * defaultPaddingRatio;
  const defaultEndPosition = latestDataTime + defaultOffset;
  
  // Strict right boundary: cannot go beyond default offset position
  // This prevents the offset from ever getting bigger than 30%
  if (newEnd > defaultEndPosition) {
    newEnd = defaultEndPosition;
    newStart = defaultEndPosition - range;
  }
  
  state.timeStart = newStart;
  state.timeEnd = newEnd;
}

export function pan(state: State, dx: number, redraw: () => void, onVisibilityChange?: () => void): void {
  if (Math.abs(dx) < 1) return;
  
  const oldStart = state.timeStart;
  const oldEnd = state.timeEnd;
  
  panTime(state, dx);
  
  if (oldStart !== state.timeStart || oldEnd !== state.timeEnd) {
    redraw();
    if (onVisibilityChange) onVisibilityChange();
  }
}