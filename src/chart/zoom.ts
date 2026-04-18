import { getPriceConfig, getPriceStep, clampPriceRange, snapPrice } from "./price";
import { getTimeConfig, clampTimeRange } from "./time";
import { clamp } from "./math";
import { xToTime, yToPrice } from "./transformation";
import type { State } from "./types";

function getZoomScale(level: number): number {
  return Math.pow(2, -level);
}

function zoomTime(state: State, cursorX: number, targetRange: number): void {
  const cursorTime = xToTime(state, cursorX);
  const timeRatio = (cursorTime - state.timeStart) / (state.timeEnd - state.timeStart);
  const newTimeStart = cursorTime - timeRatio * targetRange;
  const newTimeEnd = newTimeStart + targetRange;
  state.timeStart = newTimeStart;
  state.timeEnd = newTimeEnd;
}

function zoomPrice(state: State, cursorY: number, targetRange: number): void {
  const cursorPrice = yToPrice(state, cursorY);
  const priceRatio = (cursorPrice - state.priceMin) / (state.priceMax - state.priceMin);
  const newPriceMin = cursorPrice - priceRatio * targetRange;
  const newPriceMax = newPriceMin + targetRange;
  const priceClamp = clampPriceRange(state, newPriceMin, newPriceMax);
  const priceStep = getPriceStep(state, priceClamp.max - priceClamp.min);
  priceClamp.min = snapPrice(priceClamp.min, priceStep);
  priceClamp.max = priceClamp.min + Math.ceil((priceClamp.max - priceClamp.min) / priceStep) * priceStep;
  state.priceMin = priceClamp.min;
  state.priceMax = priceClamp.max;
}

export function zoom(state: State, mx: number, my: number, delta: number, redraw: () => void): void {
  const nowTime = Date.now();
  if (nowTime - state.zoomLastTime < state.zoomCooldown) return;
  state.zoomLastTime = nowTime;

  const zoomIn = delta < 0;
  const zoomDelta = zoomIn ? 1 : -1;
  const timeConfig = getTimeConfig(state);
  const priceConfig = getPriceConfig(state);

  let newTimeZoomLevel = state.timeZoomLevel + zoomDelta;
  let newPriceZoomLevel = state.priceZoomLevel + zoomDelta;

  newTimeZoomLevel = clamp(newTimeZoomLevel, timeConfig.minZoomLevel, timeConfig.maxZoomLevel);
  newPriceZoomLevel = clamp(newPriceZoomLevel, priceConfig.minZoomLevel, priceConfig.maxZoomLevel);

  if (newTimeZoomLevel === state.timeZoomLevel && newPriceZoomLevel === state.priceZoomLevel) return;

  const timeScale = getZoomScale(newTimeZoomLevel);
  const priceScale = getZoomScale(newPriceZoomLevel);

  let targetTimeRange = timeConfig.defaultRange * timeScale;
  let targetPriceRange = priceConfig.defaultRange * priceScale;

  targetTimeRange = clampTimeRange(state, targetTimeRange);
  targetPriceRange = clamp(targetPriceRange, priceConfig.minRange, priceConfig.maxRange);

  zoomTime(state, mx, targetTimeRange);
  zoomPrice(state, my, targetPriceRange);

  state.timeZoomLevel = newTimeZoomLevel;
  state.priceZoomLevel = newPriceZoomLevel;
  redraw();
}
