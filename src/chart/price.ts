import { getVisibleData } from "./data";
import { PRICEFRAME } from "./priceFrame";
import { plotHeight } from "./state";
import { clamp } from "./math";
import { priceToY } from "./transformation";
import type { PriceLabel, PriceTick, State } from "./types";

const NICE_MANTISSAS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5] as const;
const PRICE_PADDING_GRIDS = 2;

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

export function pickNicePriceStep(
  priceRange: number,
  plotHeightPx: number,
  targetPx: number = 60,
  minPx: number = 36,
  maxPx: number = 120,
  prevStep?: number,
  hysteresisPx: number = 10,
): number {
  if (priceRange <= 0 || plotHeightPx <= 0) return 1;

  const rawStep = (priceRange / plotHeightPx) * targetPx;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));

  let bestStep = mag;
  let bestScore = Infinity;

  for (const m of NICE_MANTISSAS) {
    for (const scale of [mag / 10, mag, mag * 10]) {
      const step = m * scale;
      const spacingPx = (step / priceRange) * plotHeightPx;

      const zoomingOutToThisStep = prevStep !== undefined && step > prevStep;
      const effectiveMin = zoomingOutToThisStep ? minPx + hysteresisPx : minPx;

      if (spacingPx < effectiveMin) continue;

      const inBand = spacingPx <= maxPx;
      const dist = Math.abs(spacingPx - targetPx);
      const score = inBand ? dist : dist + 1000;

      if (score < bestScore) {
        bestScore = score;
        bestStep = step;
      }
    }
  }

  return bestStep;
}

function computeVisiblePriceRange(state: State): { priceMin: number; priceMax: number } | null {
  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (!visibleData.length) return null;

  let lo = Infinity;
  let hi = -Infinity;

  for (const p of visibleData) {
    if (p.quote < lo) lo = p.quote;
    if (p.quote > hi) hi = p.quote;
  }

  if (!isFinite(lo) || !isFinite(hi)) return null;

  if (lo === hi) {
    const pad = lo * 0.01 || 1;
    return { priceMin: lo - pad, priceMax: hi + pad };
  }

  const dataRange = hi - lo;
  const midpoint = (hi + lo) / 2;
  const step = pickNicePriceStep(dataRange, plotHeight(state), 60, 36, 120);
  const pad = PRICE_PADDING_GRIDS * step;

  const rawMin = midpoint - dataRange / 2 - pad;
  const rawMax = midpoint + dataRange / 2 + pad;

  return {
    priceMin: Math.floor(rawMin / step) * step,
    priceMax: Math.ceil(rawMax / step) * step,
  };
}

export function getPriceStep(state: State, range: number): number {
  return pickNicePriceStep(range, plotHeight(state), 60, 36, 120);
}

export function snapPrice(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function fitPriceRangeInstant(state: State): void {
  const range = computeVisiblePriceRange(state);
  if (!range) return;

  state.priceMin = Math.max(0.01, range.priceMin);
  state.priceMax = Math.max(state.priceMin + 0.01, range.priceMax);
}

export function updatePriceRangeFromData(state: State): void {
  fitPriceRangeInstant(state);
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
      ticks.push({ value: p, y, tickNumber });
      if (tickNumber % labelEvery === 0) {
        labels.push({ value: p, y, label: formatPriceLabel(step, p) });
      }
    }
  }

  return { step, labelEvery, ticks, labels };
}

export function generatePriceLabels(state: State): PriceLabel[] {
  return buildPriceAxis(state).labels;
}

function formatPriceLabel(step: number, price: number): string {
  let decimals: number;
  if (step >= 1000) decimals = 0;
  else if (step >= 10) decimals = 0;
  else if (step >= 1) decimals = 1;
  else if (step >= 0.1) decimals = 2;
  else if (step >= 0.01) decimals = 3;
  else if (step >= 0.001) decimals = 4;
  else decimals = Math.max(0, Math.ceil(-Math.log10(step)));
  return price.toFixed(decimals);
}

export function validateAndFixPriceRange(state: State): void {
  if (!state.chartData || state.chartData.length === 0) return;

  const visibleData = getVisibleData(state.chartData, state.timeStart, state.timeEnd);
  if (!visibleData.length) return;

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const point of visibleData) {
    dataMin = Math.min(dataMin, point.quote);
    dataMax = Math.max(dataMax, point.quote);
  }

  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) return;

  if (state.priceMin > dataMin || state.priceMax < dataMax) {
    fitPriceRangeInstant(state);
  }

  const currentRange = state.priceMax - state.priceMin;
  if (currentRange < 0.01) {
    state.priceMin = dataMin - 0.5;
    state.priceMax = dataMax + 0.5;
  }
}
