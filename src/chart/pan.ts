import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { getLatestDataTime, getEarliestDataTime } from "./data";
import type { State } from "./types";
import { updatePriceRangeFromData } from "./price";

const LEFT_BUFFER_CANDLES = 10;
const LATEST_OFFSET_RATIO = 0.3;

function panTime(state: State, deltaX: number): void {
  const plotW = plotWidth(state);
  if (plotW <= 0) return;

  const tRange = state.timeEnd - state.timeStart;
  const deltaTime = -deltaX * (tRange / plotW);

  let newStart = state.timeStart + deltaTime;
  let newEnd = state.timeEnd + deltaTime;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;

  const candleSec = Math.floor(TIMEFRAME[state.timeframe].step / 1000);
  const defaultLatestEnd = latestDataTime + currentRange * LATEST_OFFSET_RATIO;
  const rightLimit = defaultLatestEnd;
  const leftLimit = getEarliestDataTime(state.chartData) - LEFT_BUFFER_CANDLES * candleSec * 1000;
  const availableSpan = rightLimit - leftLimit;

  // When the current window is larger than available pannable span
  // (common on higher timeframes), use a stable pinned range to avoid
  // boundary "fighting" that feels like sticky or broken panning.
  if (availableSpan <= 0) return;
  if (currentRange >= availableSpan) {
    return;
  }

  if (newEnd > rightLimit) {
    const overflow = newEnd - rightLimit;
    newEnd -= overflow;
    newStart -= overflow;
  }

  // Snap cleanly to the exact default latest anchor when user pans back near it.
  const snapTolerance = currentRange * 0.02;
  if (Math.abs(newEnd - defaultLatestEnd) <= snapTolerance) {
    newEnd = defaultLatestEnd;
    newStart = newEnd - currentRange;
  }

  if (newStart < leftLimit) {
    const overflow = leftLimit - newStart;
    newStart += overflow;
    newEnd += overflow;
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
    if (state.useDataRange) updatePriceRangeFromData(state);
    redraw();
    if (onVisibilityChange) onVisibilityChange();
  }
}
