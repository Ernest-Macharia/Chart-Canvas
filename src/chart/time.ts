import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { clamp, findGridStep } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";

export function getTimeConfig(state: State) {
  return TIMEFRAME[state.timeframe];
}

export function clampTimeRange(state: State, range: number): number {
  const config = getTimeConfig(state);
  return clamp(range, config.minRange, config.maxRange);
}

export function getTimeStep(state: State, rangeSec: number): number {
  const config = getTimeConfig(state);
  const stepSec = findGridStep(config.gridSteps, rangeSec, plotWidth(state), 60);
  return stepSec * 1000;
}

export function buildTimeAxis(state: State): { stepMs: number; labelEvery: number; ticks: TimeTick[]; labels: TimeLabel[] } {
  const config = getTimeConfig(state);
  const rangeMs = state.timeEnd - state.timeStart;
  const rangeSec = rangeMs / 1000;
  const stepMs = getTimeStep(state, rangeSec);
  const stepSec = stepMs / 1000;
  const firstTick = Math.ceil(state.timeStart / stepMs) * stepMs;
  const ticks: TimeTick[] = [];
  const labels: TimeLabel[] = [];
  const pixelsPerMs = plotWidth(state) / rangeMs;
  const pixelsPerTick = stepMs * pixelsPerMs;
  const sampleLabel = config.formatLabel(firstTick / 1000, stepSec);
  const minLabelSpacing = estimateLabelSpacingPx(sampleLabel);
  const labelEvery = Math.max(1, Math.ceil(minLabelSpacing / Math.max(1, pixelsPerTick)));

  for (let t = firstTick; t <= state.timeEnd; t += stepMs) {
    const x = timeToX(state, t);
    if (x >= state.left && x <= state.left + plotWidth(state)) {
      const tickNumber = Math.round(t / stepMs);
      ticks.push({
        value: t,
        x,
        tickNumber,
      });
      if (tickNumber % labelEvery === 0) {
        labels.push({
          value: t,
          x,
          label: config.formatLabel(t / 1000, stepSec),
        });
      }
    }
  }

  return { stepMs, labelEvery, ticks, labels };
}

export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}

function estimateLabelSpacingPx(label: string): number {
  // 11px monospace is roughly 6.6px per character; extra padding keeps labels readable.
  return Math.ceil(label.length * 6.6 + 12);
}
