import { getPriceConfig, getPriceStep, clampPriceRange, snapPrice } from "./price";
import { getTimeConfig, clampTimeRange } from "./time";
import { clamp } from "./math";
import { xToTime, yToPrice } from "./transformation";
import type { State } from "./types";
import { getVisibleData } from "./data";
import { PRICE_PADDING } from "./priceFrame";

// Converts discrete zoom level into multiplicative scale.
function getZoomScale(level: number): number {
  return Math.pow(2, -level);
}

// Zooms time range around cursor x-position.
function zoomTime(state: State, cursorX: number, targetRange: number): void {
  const cursorTime = xToTime(state, cursorX);
  const timeRatio = (cursorTime - state.timeStart) / (state.timeEnd - state.timeStart);
  const newTimeStart = cursorTime - timeRatio * targetRange;
  const newTimeEnd = newTimeStart + targetRange;
  state.timeStart = newTimeStart;
  state.timeEnd = newTimeEnd;
}

// Zooms price range around cursor y-position.
// zoom.ts - Modify zoomPrice function to maintain padding

// Zooms price range around cursor y-position while preserving padding
function zoomPrice(state: State, cursorY: number, targetRange: number): void {
  const cursorPrice = yToPrice(state, cursorY);
  
  // Calculate current visible data range (without padding)
  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (visibleData.length > 0) {
    let dataMin = Infinity;
    let dataMax = -Infinity;
    for (const point of visibleData) {
      dataMin = Math.min(dataMin, point.quote);
      dataMax = Math.max(dataMax, point.quote);
    }
    
    if (Number.isFinite(dataMin) && Number.isFinite(dataMax)) {
      const dataRange = dataMax - dataMin;
      const topPadding = Math.max(dataRange * PRICE_PADDING.topRatio, PRICE_PADDING.minTopPadding);
      const bottomPadding = Math.max(dataRange * PRICE_PADDING.bottomRatio, PRICE_PADDING.minBottomPadding);
      
      // The target range includes padding, so we need to calculate the data-only range
      const paddingTotal = topPadding + bottomPadding;
      const dataOnlyTargetRange = Math.max(targetRange - paddingTotal, dataRange * 0.5);
      
      // Calculate new range with padding
      const priceRatio = (cursorPrice - dataMin) / dataRange;
      const newDataMin = cursorPrice - priceRatio * dataOnlyTargetRange;
      const newDataMax = newDataMin + dataOnlyTargetRange;
      
      // Add padding back
      let newPriceMin = newDataMin - bottomPadding;
      let newPriceMax = newDataMax + topPadding;
      
      const priceClamp = clampPriceRange(state, newPriceMin, newPriceMax);
      const priceStep = getPriceStep(state, priceClamp.max - priceClamp.min);
      priceClamp.min = snapPrice(priceClamp.min, priceStep);
      priceClamp.max = priceClamp.min + Math.ceil((priceClamp.max - priceClamp.min) / priceStep) * priceStep;
      
      state.priceMin = priceClamp.min;
      state.priceMax = priceClamp.max;
      return;
    }
  }
  
  // Fallback to original behavior if no visible data
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

// Handles wheel zoom for both time and price axes.
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
