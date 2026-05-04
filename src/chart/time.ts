import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { clamp } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";
import { getLatestDataTime } from "./data";

let previousStepSec = 0;

function labelWidthPx(stepSec: number): number {
  const charPx = 7.5;
  const chars = stepSec < 60 ? 8 : stepSec < 86400 ? 5 : 6;
  return chars * charPx + 10;
}

export function pickNiceTimeStepSecondsByPixels(
  rangeSec: number,
  plotWidthPx: number,
  targetPx: number,
  minPx: number,
  maxPx: number,
  prevStepSec: number | undefined,
  candidates: readonly number[],
): number {
  if (rangeSec <= 0 || plotWidthPx <= 0) return candidates[0] || 60;

  const isMobile = plotWidthPx < 400;
  const effectiveMin = isMobile ? Math.max(minPx, 55) : minPx;
  const effectiveTarget = isMobile ? Math.max(targetPx, 80) : targetPx;

  let bestStep = candidates[candidates.length - 1] || 60;
  let bestScore = Infinity;

  for (const step of candidates) {
    const spacingPx = (step / rangeSec) * plotWidthPx;
    const labelMin = labelWidthPx(step);
    const zoomingOut = prevStepSec !== undefined && step > prevStepSec;
    const hardFloor = Math.max(effectiveMin, labelMin, zoomingOut ? labelMin + 25 : 0);

    if (spacingPx < hardFloor) continue;

    const inBand = spacingPx <= maxPx;
    const dist = Math.abs(spacingPx - effectiveTarget);
    const score = inBand ? dist : dist + 1000;

    if (score < bestScore) {
      bestScore = score;
      bestStep = step;
    }
  }

  return bestStep;
}

export function floorToStep(value: number, step: number): number {
  return Math.floor(value / step) * step;
}

export function ceilToStep(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function getTimeConfig(state: State) {
  return TIMEFRAME[state.timeframe];
}

export function clampTimeRange(state: State, range: number): number {
  const config = getTimeConfig(state);
  return clamp(range, config.minRange, config.maxRange);
}

export function getTimeStep(state: State, range: number): number {
  const config = getTimeConfig(state);
  const plotW = plotWidth(state);

  const stepSec = pickNiceTimeStepSecondsByPixels(
    range,
    plotW,
    110,
    80,
    180,
    previousStepSec,
    config.gridSteps,
  );

  previousStepSec = stepSec;
  return stepSec * 1000;
}

export function buildTimeAxis(state: State): { stepMs: number; ticks: TimeTick[]; labels: TimeLabel[] } {
  const config = getTimeConfig(state);
  const rangeMs = state.timeEnd - state.timeStart;
  const stepMs = getTimeStep(state, rangeMs / 1000);
  const stepSec = stepMs / 1000;

  const tStart = floorToStep(state.timeStart / 1000, stepSec);
  const tEnd = ceilToStep(state.timeEnd / 1000, stepSec);

  const ticks: TimeTick[] = [];
  const labels: TimeLabel[] = [];
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);

  let tickNumber = 0;
  for (let tSec = tStart; tSec <= tEnd + stepSec * 0.5; tSec += stepSec) {
    const tMs = tSec * 1000;
    const x = timeToX(state, tMs);

    if (x < plotLeft - 1 || x > plotRight + 1) continue;

    ticks.push({ value: tMs, x, tickNumber });
    labels.push({ value: tMs, x, label: config.formatLabel(tSec, stepSec) });
    tickNumber++;
  }

  return { stepMs, ticks, labels };
}

export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}

export function applyRightPadding(state: State, paddingRatio: number = 0.3): void {
  if (!state.chartData || state.chartData.length === 0) return;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const dataPortion = 1 - paddingRatio;
  const dataRange = currentRange * dataPortion;

  state.timeStart = latestDataTime - dataRange;
  state.timeEnd = latestDataTime + currentRange * paddingRatio;
}

export function removeRightPadding(state: State): void {
  if (!state.chartData || state.chartData.length === 0) return;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const minimalPadding = currentRange * 0.05;
  state.timeEnd = latestDataTime + minimalPadding;
  state.timeStart = latestDataTime + minimalPadding - currentRange;
}

export function isAtLatestData(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;
  const latestDataTime = getLatestDataTime(state.chartData);
  const tolerance = 100;
  return Math.abs(state.timeEnd - latestDataTime) <= tolerance;
}

export function hasRightPadding(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const currentPadding = state.timeEnd - latestDataTime;
  return currentPadding > currentRange * 0.05;
}

export function needsOffset(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;
  const latestDataTime = getLatestDataTime(state.chartData);
  const atLatest = Math.abs(state.timeEnd - latestDataTime) <= 100;
  return atLatest && state.timeEnd <= latestDataTime + 10;
}

export function goToLatest(state: State, paddingRatio: number = 0.3): void {
  if (!state.chartData || state.chartData.length === 0) return;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const dataPortion = 1 - paddingRatio;
  const dataRange = currentRange * dataPortion;

  state.timeStart = latestDataTime - dataRange;
  state.timeEnd = latestDataTime + currentRange * paddingRatio;
}

export function shouldShowLatestButton(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;

  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const expectedOffset = currentRange * 0.3;
  const expectedEnd = latestDataTime + expectedOffset;

  const isAtDefaultPosition = Math.abs(state.timeEnd - expectedEnd) < 100;
  return !isAtDefaultPosition;
}
