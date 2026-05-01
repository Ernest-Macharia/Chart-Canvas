import { getPriceConfig, getPriceStep, clampPriceRange, snapPrice, updatePriceRangeFromData } from "./price";
import { getTimeConfig, clampTimeRange, isAtLatestData, applyRightPadding } from "./time";
import { clamp } from "./math";
import { xToTime, yToPrice } from "./transformation";
import type { State } from "./types";
import { getVisibleData } from "./data";
import { PRICE_PADDING } from "./priceFrame";

// Converts discrete zoom level into multiplicative scale.
function getZoomScale(level: number): number {
  return Math.pow(2, -level);
}

// Zooms time range around cursor x-position
function zoomTime(state: State, cursorX: number, targetRange: number): void {
  const cursorTime = xToTime(state, cursorX);
  const timeRatio = (cursorTime - state.timeStart) / (state.timeEnd - state.timeStart);
  
  state.timeStart = cursorTime - timeRatio * targetRange;
  state.timeEnd = state.timeStart + targetRange;
}

// Zooms price range while maintaining padding
function zoomPrice(state: State, cursorY: number, targetRange: number): void {
  const cursorPrice = yToPrice(state, cursorY);
  
  // Get current visible data range
  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (visibleData.length === 0) return;
  
  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const point of visibleData) {
    dataMin = Math.min(dataMin, point.quote);
    dataMax = Math.max(dataMax, point.quote);
  }
  
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;
  
  const dataRange = dataMax - dataMin;
  
  // Calculate padding based on data range
  const topPadding = Math.max(dataRange * PRICE_PADDING.topRatio, PRICE_PADDING.minTopPadding);
  const bottomPadding = Math.max(dataRange * PRICE_PADDING.bottomRatio, PRICE_PADDING.minBottomPadding);
  const totalPadding = topPadding + bottomPadding;
  
  // Target range includes padding, calculate data-only range
  const dataOnlyTargetRange = Math.max(targetRange - totalPadding, dataRange * 0.3);
  
  // Calculate new data range based on cursor position
  const priceRatio = (cursorPrice - dataMin) / dataRange;
  let newDataMin = cursorPrice - priceRatio * dataOnlyTargetRange;
  let newDataMax = newDataMin + dataOnlyTargetRange;
  
  // Ensure minimum data range
  if (newDataMax - newDataMin < dataRange * 0.1) {
    const center = (newDataMin + newDataMax) / 2;
    const minRange = dataRange * 0.1;
    newDataMin = center - minRange / 2;
    newDataMax = center + minRange / 2;
  }
  
  // Add padding back
  let newPriceMin = newDataMin - bottomPadding;
  let newPriceMax = newDataMax + topPadding;
  
  // Clamp to config limits
  const priceClamp = clampPriceRange(state, newPriceMin, newPriceMax);
  const priceStep = getPriceStep(state, priceClamp.max - priceClamp.min);
  
  // Snap to step
  priceClamp.min = snapPrice(priceClamp.min, priceStep);
  priceClamp.max = priceClamp.min + Math.ceil((priceClamp.max - priceClamp.min) / priceStep) * priceStep;
  
  // Final validation
  if (priceClamp.max > priceClamp.min && Number.isFinite(priceClamp.min) && Number.isFinite(priceClamp.max)) {
    state.priceMin = priceClamp.min;
    state.priceMax = priceClamp.max;
  }
}

// Handles wheel zoom for both time and price axes.
export function zoom(state: State, mx: number, my: number, delta: number, redraw: () => void, onVisibilityChange?: () => void): void {
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

  // Store current state
  const wasAtLatest = isAtLatestData(state);
  
  // Apply zoom
  zoomTime(state, mx, targetTimeRange);
  zoomPrice(state, my, targetPriceRange);
  
  // After zoom, if we were at latest data, reapply the offset
  if (wasAtLatest) {
    applyRightPadding(state);
  }

  updatePriceRangeFromData(state);

  state.timeZoomLevel = newTimeZoomLevel;
  state.priceZoomLevel = newPriceZoomLevel;
  
  redraw();
  if (onVisibilityChange) onVisibilityChange();
}