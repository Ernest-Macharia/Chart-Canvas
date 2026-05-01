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
  return findGridStep(config.gridSteps, range, plotHeight(state), config.minPixelsPerTick);
}

export function snapPrice(value: number, step: number): number {
  return Math.round(value / step) * step;
}


// price.ts - Update updatePriceRangeFromData to be more aggressive

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
  
  // If data range is too small, use a minimum range
  const effectiveDataRange = Math.max(dataRange, config.minRange * 0.1);
  
  // Calculate padding based on data range
  const topPadding = Math.max(effectiveDataRange * PRICE_PADDING.topRatio, PRICE_PADDING.minTopPadding);
  const bottomPadding = Math.max(effectiveDataRange * PRICE_PADDING.bottomRatio, PRICE_PADDING.minBottomPadding);
  
  // Apply padding
  let nextMin = dataMin - bottomPadding;
  let nextMax = dataMax + topPadding;
  
  let totalRange = nextMax - nextMin;
  
  // Ensure range meets minimum requirements
  if (totalRange < config.minRange) {
    const deficit = config.minRange - totalRange;
    const halfDeficit = deficit / 2;
    nextMin -= halfDeficit;
    nextMax += halfDeficit;
    totalRange = nextMax - nextMin;
  }
  
  // Enforce max range limit
  if (totalRange > config.maxRange) {
    const excess = totalRange - config.maxRange;
    const halfExcess = excess / 2;
    nextMin += halfExcess;
    nextMax -= halfExcess;
    totalRange = nextMax - nextMin;
  }

  // Snap to grid steps for clean labels
  const step = getPriceStep(state, totalRange);
  if (!Number.isFinite(step) || step <= 0) return;

  nextMin = Math.floor(nextMin / step) * step;
  nextMax = Math.ceil(nextMax / step) * step;
  
  // Ensure positive prices
  if (nextMin < 0.01) {
    const shift = 0.01 - nextMin;
    nextMin = 0.01;
    nextMax += shift;
  }
  
  // Final validation - ensure we have valid numbers
  if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMax <= nextMin) return;

  // Only update if values changed significantly (prevents excessive updates)
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
  // Check if chart data exists and has at least one point
  if (state.chartData && state.chartData.length > 0) {
    return state.chartData[0].pip_size || 4;  // Return pip_size from first tick, default to 4
  }
  return 4;  // Default to 4 decimal places if no data
}

// Formats prices with precision based on pip_size from the data
function formatPriceLabel(state: State, price: number): string {
  const pipSize = getPipSize(state);  // Get the number of decimal places from data
  return price.toFixed(pipSize);      // Format price with correct decimal places
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
  
  // Check if current price range contains all data
  if (state.priceMin > dataMin || state.priceMax < dataMax) {
    // Data is outside the current range - force full update
    updatePriceRangeFromData(state);
  }
  
  // Additional safety: ensure minimum range
  const currentRange = state.priceMax - state.priceMin;
  if (currentRange < 0.01) {
    state.priceMin = dataMin - 0.5;
    state.priceMax = dataMax + 0.5;
  }
}
