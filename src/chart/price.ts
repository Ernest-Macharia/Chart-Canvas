import { getVisibleData } from "./data";
import { PRICEFRAME, PRICE_PADDING } from "./priceFrame";
import { plotHeight } from "./state";
import { clamp, findGridStep } from "./math";
import { priceToY } from "./transformation";
import type { PriceLabel, PriceTick, State, Timeframe } from "./types";

type PriceRangeCacheEntry = {
  timeframe: Timeframe;
  timeStart: number;
  timeEnd: number;
  dataLength: number;
  firstTime: number;
  lastTime: number;
};

const priceRangeCache = new WeakMap<State, PriceRangeCacheEntry>();

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


export function updatePriceRangeFromData(state: State): void {
  if (state.chartData.length === 0) return;
  const firstDataPoint = state.chartData[0];
  const lastDataPoint = state.chartData[state.chartData.length - 1];
  if (!firstDataPoint || !lastDataPoint) return;

  const cached = priceRangeCache.get(state);
  const unchanged =
    cached &&
    cached.timeframe === state.timeframe &&
    cached.timeStart === state.timeStart &&
    cached.timeEnd === state.timeEnd &&
    cached.dataLength === state.chartData.length &&
    cached.firstTime === firstDataPoint.epoch * 1000 &&
    cached.lastTime === lastDataPoint.epoch * 1000;
  if (unchanged) return;

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
  
  // Calculate padding based on data range
  const topPadding = Math.max(
    dataRange * PRICE_PADDING.topRatio,
    PRICE_PADDING.minTopPadding
  );
  const bottomPadding = Math.max(
    dataRange * PRICE_PADDING.bottomRatio,
    PRICE_PADDING.minBottomPadding
  );
  
  // Apply padding to min and max
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
  
  totalRange = nextMax - nextMin;
  
  // Final validation
  if (totalRange < config.minRange) {
    nextMin = nextMin - step;
    totalRange = nextMax - nextMin;
    
    if (totalRange < config.minRange) {
      nextMax = nextMax + step;
    }
  }
  
  if (totalRange > config.maxRange) {
    const excess = totalRange - config.maxRange;
    const halfExcess = excess / 2;
    nextMin += halfExcess;
    nextMax -= halfExcess;
    nextMin = Math.floor(nextMin / step) * step;
    nextMax = Math.ceil(nextMax / step) * step;
  }
  
  // Ensure positive prices
  if (nextMin < 0.01) {
    const shift = 0.01 - nextMin;
    nextMin = 0.01;
    nextMax += shift;
  }
  
  if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMax <= nextMin) return;

  state.priceMin = nextMin;
  state.priceMax = nextMax;

  priceRangeCache.set(state, {
    timeframe: state.timeframe,
    timeStart: state.timeStart,
    timeEnd: state.timeEnd,
    dataLength: state.chartData.length,
    firstTime: firstDataPoint.epoch * 1000,
    lastTime: lastDataPoint.epoch * 1000,
  });
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