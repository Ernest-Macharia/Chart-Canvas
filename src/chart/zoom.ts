import { getPriceConfig, getPriceStep, clampPriceRange, snapPrice, updatePriceRangeFromData } from "./price";
import { getTimeConfig, clampTimeRange, isAtLatestData, applyRightPadding } from "./time";
import { clamp } from "./math";
import { xToTime, yToPrice } from "./transformation";
import type { State } from "./types";
import { getVisibleData } from "./data";
import { PRICE_PADDING } from "./priceFrame";


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

// Calculate adaptive padding based on data characteristics
function getAdaptivePadding(dataMin: number, dataMax: number, dataPoints: number, visibleRangeMs: number): { topRatio: number; bottomRatio: number } {
  const dataRange = dataMax - dataMin;

  const visibleMinutes = visibleRangeMs / (60 * 1000);
  const density = dataPoints / Math.max(1, visibleMinutes);
  
  // Calculate volatility
  let volatility = 0.1;
  if (dataRange > 0 && dataPoints > 1) {
    volatility = Math.min(0.5, dataRange / 100);
  }
  
  let topPaddingRatio = PRICE_PADDING.topRatio;
  let bottomPaddingRatio = PRICE_PADDING.bottomRatio;

  if (density < 10) {
    topPaddingRatio = Math.max(topPaddingRatio, 0.25);
    bottomPaddingRatio = Math.max(bottomPaddingRatio, 0.20);
  } else if (density < 50) {
    topPaddingRatio = Math.max(topPaddingRatio, 0.20);
    bottomPaddingRatio = Math.max(bottomPaddingRatio, 0.15);
  } else if (density > 500) {
    topPaddingRatio = 0.12;
    bottomPaddingRatio = 0.08;
  }
  
  // High volatility = more padding
  if (volatility > 0.3) {
    topPaddingRatio = Math.min(0.35, topPaddingRatio + 0.05);
    bottomPaddingRatio = Math.min(0.25, bottomPaddingRatio + 0.03);
  } else if (volatility > 0.2) {
    topPaddingRatio = Math.min(0.35, topPaddingRatio + 0.03);
    bottomPaddingRatio = Math.min(0.25, bottomPaddingRatio + 0.02);
  }
  
  // Ensure minimum and maximum bounds
  topPaddingRatio = clamp(topPaddingRatio, 0.08, 0.35);
  bottomPaddingRatio = clamp(bottomPaddingRatio, 0.05, 0.25);
  
  return { topRatio: topPaddingRatio, bottomRatio: bottomPaddingRatio };
}

// Zooms price range while maintaining adaptive padding
function zoomPrice(state: State, cursorY: number, targetRange: number): void {
  const cursorPrice = yToPrice(state, cursorY);
  
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
  const visibleRangeMs = state.timeEnd - state.timeStart;
  
  // Get adaptive padding based on current data
  const { topRatio, bottomRatio } = getAdaptivePadding(
    dataMin, 
    dataMax, 
    visibleData.length, 
    visibleRangeMs
  );
  
  const topPadding = Math.max(dataRange * topRatio, PRICE_PADDING.minTopPadding);
  const bottomPadding = Math.max(dataRange * bottomRatio, PRICE_PADDING.minBottomPadding);
  const totalPadding = topPadding + bottomPadding;

  const dataOnlyTargetRange = Math.max(targetRange - totalPadding, dataRange * 0.3);
  
  const priceRatio = (cursorPrice - dataMin) / dataRange;
  let newDataMin = cursorPrice - priceRatio * dataOnlyTargetRange;
  let newDataMax = newDataMin + dataOnlyTargetRange;
  
  const minDataRange = Math.max(dataRange * 0.1, 0.01);
  if (newDataMax - newDataMin < minDataRange) {
    const center = (newDataMin + newDataMax) / 2;
    newDataMin = center - minDataRange / 2;
    newDataMax = center + minDataRange / 2;
  }
  
  if (newDataMin < 0) {
    newDataMax = newDataMax - newDataMin;
    newDataMin = 0;
  }
  
  let newPriceMin = newDataMin - bottomPadding;
  let newPriceMax = newDataMax + topPadding;

  newPriceMin = Math.max(0, newPriceMin);
  newPriceMax = Math.max(newPriceMin + 0.01, newPriceMax);
  
  const priceClamp = clampPriceRange(state, newPriceMin, newPriceMax);
  const priceStep = getPriceStep(state, priceClamp.max - priceClamp.min);
  
  if (priceStep > 0) {
    priceClamp.min = snapPrice(priceClamp.min, priceStep);
    priceClamp.max = priceClamp.min + Math.ceil((priceClamp.max - priceClamp.min) / priceStep) * priceStep;
  }
  
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
  
  if (wasAtLatest) {
    applyRightPadding(state);
  }

  updatePriceRangeFromData(state);

  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (visibleData.length > 0) {
    let actualMin = Infinity;
    let actualMax = -Infinity;
    for (const point of visibleData) {
      actualMin = Math.min(actualMin, point.quote);
      actualMax = Math.max(actualMax, point.quote);
    }
    
    // If data is outside range, expand range with adaptive padding
    if (actualMin < state.priceMin || actualMax > state.priceMax) {
      const neededMin = Math.min(state.priceMin, actualMin);
      const neededMax = Math.max(state.priceMax, actualMax);
      const neededRange = neededMax - neededMin;
      
      // Calculate adaptive padding based on current data
      const visibleRangeMs = state.timeEnd - state.timeStart;
      const { topRatio, bottomRatio } = getAdaptivePadding(
        neededMin,
        neededMax,
        visibleData.length,
        visibleRangeMs
      );
      
      const padding = neededRange * Math.max(topRatio, bottomRatio);
      
      state.priceMin = neededMin - padding;
      state.priceMax = neededMax + padding;
      
      const priceStep = getPriceStep(state, state.priceMax - state.priceMin);
      if (priceStep > 0) {
        state.priceMin = snapPrice(state.priceMin, priceStep);
        state.priceMax = state.priceMin + Math.ceil((state.priceMax - state.priceMin) / priceStep) * priceStep;
      }
    }
  }

  state.timeZoomLevel = newTimeZoomLevel;
  state.priceZoomLevel = newPriceZoomLevel;
  
  redraw();
  if (onVisibilityChange) onVisibilityChange();
}