import { getVisibleData } from "./data";
import { PRICEFRAME, PRICE_PADDING } from "./priceFrame";
import { plotHeight } from "./state";
import { clamp, findGridStep } from "./math";
import { priceToY } from "./transformation";
import type { PriceLabel, PriceTick, State } from "./types";


export function getPriceConfig(state: State) {
  return PRICEFRAME[state.timeframe];
}

export function clampPriceRange(state: State, min: number, max: number): { min: number; max: number } {
  const config = getPriceConfig(state);
  let range = max - min;
  range = clamp(range, config.minRange, config.maxRange);
  min = Math.max(0.01, min);
  return { min, max: min + range };
}

export function getPriceStep(state: State, range: number): number {
  const config = getPriceConfig(state);
  const plotH = plotHeight(state);
  const zoomFactor = Math.pow(1.2, state.priceZoomLevel);
  const adjustedMinPixels = config.minPixelsPerTick / zoomFactor;
  
  return findGridStep(config.gridSteps, range, plotH, adjustedMinPixels);
}
export function snapPrice(value: number, step: number): number {
  return Math.round(value / step) * step;
}


export function updatePriceRangeFromData(state: State): void {
  if (!state.chartData || state.chartData.length === 0) return;
  
  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (visibleData.length === 0) return;

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const point of visibleData) {
    dataMin = Math.min(dataMin, point.quote);
    dataMax = Math.max(dataMax, point.quote);
  }
  
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;

  const config = getPriceConfig(state);
  const dataRange = dataMax - dataMin;
  const visibleRangeMs = state.timeEnd - state.timeStart;
  
  // Calculate adaptive padding based on data characteristics
  const density = visibleData.length / Math.max(1, visibleRangeMs / (60 * 1000));
  let topPaddingRatio = PRICE_PADDING.topRatio;
  let bottomPaddingRatio = PRICE_PADDING.bottomRatio;
  
  if (density < 10) {
    topPaddingRatio = Math.max(topPaddingRatio, 0.25);
    bottomPaddingRatio = Math.max(bottomPaddingRatio, 0.20);
  } else if (density < 50) {
    topPaddingRatio = Math.max(topPaddingRatio, 0.18);
    bottomPaddingRatio = Math.max(bottomPaddingRatio, 0.13);
  } else if (density > 500) {
    topPaddingRatio = 0.10;
    bottomPaddingRatio = 0.05;
  }
  
  // Adjust based on price volatility
  if (dataRange > 0) {
    const volatility = dataRange / 100;
    if (volatility > 0.5) {
      topPaddingRatio += 0.05;
      bottomPaddingRatio += 0.03;
    } else if (volatility > 0.2) {
      topPaddingRatio += 0.02;
      bottomPaddingRatio += 0.01;
    }
  }
  
  topPaddingRatio = clamp(topPaddingRatio, 0.08, 0.35);
  bottomPaddingRatio = clamp(bottomPaddingRatio, 0.05, 0.25);

  const effectiveDataRange = Math.max(dataRange, config.minRange * 0.1);

  const topPadding = Math.max(effectiveDataRange * topPaddingRatio, PRICE_PADDING.minTopPadding);
  const bottomPadding = Math.max(effectiveDataRange * bottomPaddingRatio, PRICE_PADDING.minBottomPadding);
  
  let nextMin = dataMin - bottomPadding;
  let nextMax = dataMax + topPadding;
  
  if (nextMin < 0.01) {
    const shift = 0.01 - nextMin;
    nextMin = 0.01;
    nextMax += shift;
  }
  
  let totalRange = nextMax - nextMin;
  
  if (totalRange < config.minRange) {
    const deficit = config.minRange - totalRange;
    const halfDeficit = deficit / 2;
    nextMin -= halfDeficit;
    nextMax += halfDeficit;
    totalRange = nextMax - nextMin;
  }
  
  if (totalRange > config.maxRange) {
    const excess = totalRange - config.maxRange;
    const halfExcess = excess / 2;
    nextMin += halfExcess;
    nextMax -= halfExcess;
    totalRange = nextMax - nextMin;
  }

  const step = getPriceStep(state, totalRange);
  if (!Number.isFinite(step) || step <= 0) return;

  nextMin = Math.floor(nextMin / step) * step;
  nextMax = Math.ceil(nextMax / step) * step;

  if (nextMin < 0.01) {
    const shift = 0.01 - nextMin;
    nextMin = 0.01;
    nextMax += shift;
  }
  
  if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMax <= nextMin) return;

  const minChanged = Math.abs(state.priceMin - nextMin) > step * 0.1;
  const maxChanged = Math.abs(state.priceMax - nextMax) > step * 0.1;
  
  if (minChanged || maxChanged) {
    state.priceMin = nextMin;
    state.priceMax = nextMax;
  }
}

export function buildPriceAxis(state: State): { step: number; labelEvery: number; ticks: PriceTick[]; labels: PriceLabel[] } {
  const range = state.priceMax - state.priceMin;
  const step = getPriceStep(state, range);
  const firstTick = Math.ceil(state.priceMin / step) * step;
  const ticks: PriceTick[] = [];
  const labels: PriceLabel[] = [];
  const pixelsPerTick = step * (plotHeight(state) / range);
  const minLabelSpacing = 30;
  const labelEvery = Math.max(1, Math.ceil(minLabelSpacing / Math.max(1, pixelsPerTick)));

  for (let p = firstTick; p <= state.priceMax; p += step) {
    const y = priceToY(state, p);
    if (y >= state.top && y <= state.top + plotHeight(state)) {
      const tickNumber = Math.round(p / step);
      ticks.push({
        value: p,
        y,
        tickNumber,
      });
      if (tickNumber % labelEvery === 0) {
        labels.push({
          value: p,
          y,
          label: formatPriceLabel(state, p),
        });
      }
    }
  }

  return { step, labelEvery, ticks, labels };
}

export function generatePriceLabels(state: State): PriceLabel[] {
  return buildPriceAxis(state).labels;
}

function getPipSize(state: State): number {
  if (state.chartData && state.chartData.length > 0) {
    return state.chartData[0].pip_size || 4;
  }
  return 4;
}

// Formats prices with precision based on pip_size from the data
function formatPriceLabel(state: State, price: number): string {
  const pipSize = getPipSize(state);
  return price.toFixed(pipSize);
}

export function validateAndFixPriceRange(state: State): void {
  if (!state.chartData || state.chartData.length === 0) return;
  
  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (visibleData.length === 0) return;
  
  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const point of visibleData) {
    dataMin = Math.min(dataMin, point.quote);
    dataMax = Math.max(dataMax, point.quote);
  }
  
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;
  
  if (state.priceMin > dataMin || state.priceMax < dataMax) {
    updatePriceRangeFromData(state);
  }

  const currentRange = state.priceMax - state.priceMin;
  if (currentRange < 0.01) {
    state.priceMin = dataMin - 0.5;
    state.priceMax = dataMax + 0.5;
  }
}
