import { PRICEFRAME } from "./priceFrame";
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
  return findGridStep(config.gridSteps, range, plotHeight(state), 40);
}

export function snapPrice(value: number, step: number): number {
  return Math.round(value / step) * step;
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
