import { getVisibleData } from "./data";
import { PRICEFRAME, PRICE_GRID_MARGIN_STEPS } from "./priceFrame";
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
    cached.firstTime === firstDataPoint.time &&
    cached.lastTime === lastDataPoint.time;
  if (unchanged) return;

  const visibleData = getVisibleData(state.chartData, state.timeStart / 1000, state.timeEnd / 1000);
  if (visibleData.length === 0) return;

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const point of visibleData) {
    dataMin = Math.min(dataMin, point.value);
    dataMax = Math.max(dataMax, point.value);
  }
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;

  const config = getPriceConfig(state);
  const dataRange = Math.max(0, dataMax - dataMin);
  const step = getPriceStep(state, Math.max(dataRange, config.minRange));
  if (!Number.isFinite(step) || step <= 0) return;

  const margin = PRICE_GRID_MARGIN_STEPS * step;
  let nextMin = dataMin - margin;
  let nextMax = dataMax + margin;

  const dataMid = (dataMin + dataMax) / 2;
  const clampedRange = clamp(nextMax - nextMin, config.minRange, config.maxRange);
  nextMin = dataMid - clampedRange / 2;
  nextMax = dataMid + clampedRange / 2;

  nextMin = Math.floor(nextMin / step) * step;
  nextMax = Math.ceil(nextMax / step) * step;
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
    firstTime: firstDataPoint.time,
    lastTime: lastDataPoint.time,
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
          label: formatPriceLabel(p),
        });
      }
    }
  }

  return { step, labelEvery, ticks, labels };
}

export function generatePriceLabels(state: State): PriceLabel[] {
  return buildPriceAxis(state).labels;
}

function formatPriceLabel(price: number): string {
  if (price >= 100) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}
