import { getPriceConfig, updatePriceRangeFromData } from "./price";
import { getTimeConfig } from "./time";
import { xToTime } from "./transformation";
import type { State } from "./types";
import { getLatestDataTime, getEarliestDataTime } from "./data";
import { TIMEFRAME } from "./timeFrame";

const ZOOM_SPEED = 0.01;
const RIGHT_BUFFER_CANDLES = 10;
const LEFT_BUFFER_CANDLES = 10;

export function zoom(
  state: State,
  mx: number,
  _my: number,
  delta: number,
  redraw: () => void,
  onVisibilityChange?: () => void,
): void {
  const now = performance.now();
  if (now - state.zoomLastTime < state.zoomCooldown) return;
  state.zoomLastTime = now;
  const tCfg = getTimeConfig(state);
  const pCfg = getPriceConfig(state);

  const minTime = tCfg.minRange;
  const maxTime = tCfg.maxRange;

  const range = state.timeEnd - state.timeStart;
  if (range <= 0) return;

  const anchorTime = xToTime(state, mx);
  const zoomFactor = Math.exp(delta * ZOOM_SPEED);
  const targetRange = range * zoomFactor;
  const clampedRange = Math.min(maxTime, Math.max(minTime, targetRange));
  if (clampedRange === range) return;

  const appliedFactor = clampedRange / range;
  const leftSpan = anchorTime - state.timeStart;
  const rightSpan = state.timeEnd - anchorTime;

  let newStart = anchorTime - leftSpan * appliedFactor;
  let newEnd = anchorTime + rightSpan * appliedFactor;

  const drift = (newEnd - newStart) - clampedRange;
  newStart -= drift * (leftSpan / range);
  newEnd -= drift * (rightSpan / range);

  const candleSec = Math.floor(TIMEFRAME[state.timeframe].step / 1000);
  const rightLimit = getLatestDataTime(state.chartData) + RIGHT_BUFFER_CANDLES * candleSec * 1000;
  const leftLimit = getEarliestDataTime(state.chartData) - LEFT_BUFFER_CANDLES * candleSec * 1000;

  if (newEnd > rightLimit) {
    const overflow = newEnd - rightLimit;
    newEnd -= overflow;
    newStart -= overflow;
  }
  if (newStart < leftLimit) {
    const overflow = leftLimit - newStart;
    newStart += overflow;
    newEnd += overflow;
  }

  state.timeStart = newStart;
  state.timeEnd = newEnd;

  updatePriceRangeFromData(state);

  const newTimeLevel = Math.round(Math.log2(tCfg.defaultRange / clampedRange));
  state.timeZoomLevel = Math.max(tCfg.minZoomLevel, Math.min(tCfg.maxZoomLevel, newTimeLevel));
  state.priceZoomLevel = Math.max(
    pCfg.minZoomLevel,
    Math.min(pCfg.maxZoomLevel, state.timeZoomLevel),
  );

  redraw();
  if (onVisibilityChange) onVisibilityChange();
}
