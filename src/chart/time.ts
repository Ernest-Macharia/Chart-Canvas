import { plotWidth } from "./state";
import { TIMEFRAME, getUniversalStepSec } from "./timeFrame";
import { clamp } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";

// Returns active timeframe configuration from state.
export function getTimeConfig(state: State) {
  return TIMEFRAME[state.timeframe];
}

// Clamps a proposed time range to configured min/max bounds.
export function clampTimeRange(state: State, range: number): number {
  const config = getTimeConfig(state);
  return clamp(range, config.minRange, config.maxRange);
}

// Computes grid step in milliseconds for current range and width.
export function getTimeStep(state: State, range: number): number {
  const plotW = plotWidth(state);
  const stepSec = getUniversalStepSec(state.timeframe, range, plotW);
  return stepSec * 1000;
}

// Builds time-axis ticks and labels for the current viewport.
export function buildTimeAxis(state: State): { stepMs: number; labelEvery: number; ticks: TimeTick[]; labels: TimeLabel[] } {
  const config = getTimeConfig(state);
  const rangeMs = state.timeEnd - state.timeStart;
  const range = rangeMs / 1000;
  const stepMs = getTimeStep(state, range);
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

// Convenience helper that returns only time labels.
export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}

// Estimates horizontal label spacing in pixels.
function estimateLabelSpacingPx(label: string): number {
  return Math.ceil(label.length * 6.6 + 12);
}
