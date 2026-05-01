import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { clamp } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";
import { getLatestDataTime } from "./data";

let previousStepSec: number = 0;


export function pickNiceTimeStepSecondsByPixels(
  rangeSec: number,
  plotWidthPx: number,
  targetPx: number,
  minPx: number,
  maxPx: number,
  prevStepSec: number | undefined,
  candidates: readonly number[]
): number {
  if (rangeSec <= 0 || plotWidthPx <= 0) return candidates[0] || 60;
  
  const pixelsPerSec = plotWidthPx / rangeSec;
  
  // Adjust target/min for different range sizes
  let effectiveTargetPx = targetPx;
  let effectiveMinPx = minPx;
  
  if (rangeSec < 300) { 
    effectiveTargetPx = Math.min(targetPx, 80);
    effectiveMinPx = Math.max(minPx, 50);
  } else if (rangeSec > 3600) {
    effectiveTargetPx = Math.min(targetPx + 50, 150);
  }
  
  
  let bestStep = candidates[0];
  let bestScore = Infinity;
  
  for (const step of candidates) {
    // Skip steps larger than range (would give zero or one label)
    if (step > rangeSec * 1.5) continue;
    
    const spacingPx = step * pixelsPerSec;

    if (spacingPx < effectiveMinPx) continue;
    let score;
    if (rangeSec < 300) {
      score = Math.abs(spacingPx - effectiveTargetPx);
      if (step <= 5) score *= 0.8;
    } else {
      const inBand = spacingPx <= maxPx;
      const distance = Math.abs(spacingPx - effectiveTargetPx);
      score = inBand ? distance : distance + 1000;
    }
    
    if (prevStepSec !== undefined && Math.abs(step - prevStepSec) <= step * 0.5) {
      score *= 0.9;
    }
    
    if (score < bestScore) {
      bestScore = score;
      bestStep = step;
    }
  }
  
  if (bestScore === Infinity) {
    return candidates[0];
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
  
  const minPx = config.minPixelsPerTick;
  const targetPx = Math.min(120, minPx + 35);
  const maxPx = targetPx * 2;
  
  const stepSec = pickNiceTimeStepSecondsByPixels(
    range,
    plotW,
    targetPx,
    minPx,
    maxPx,
    previousStepSec,
    config.gridSteps
  );
  
  previousStepSec = stepSec;
  return stepSec * 1000;
}

// Build time axis - EVERY tick at the chosen step gets BOTH a grid line AND a label
export function buildTimeAxis(state: State): { stepMs: number; ticks: TimeTick[]; labels: TimeLabel[] } {
  const config = getTimeConfig(state);
  const rangeMs = state.timeEnd - state.timeStart;
  const range = rangeMs / 1000;
  const stepMs = getTimeStep(state, range);
  const stepSec = stepMs / 1000;


  let tStart: number;
  let tEnd: number;
  
  if (rangeMs < 300 && stepSec <= 10) {
    tStart = state.timeStart / 1000;
    tEnd = state.timeEnd / 1000;
  } else {
    tStart = floorToStep(state.timeStart / 1000, stepSec);
    tEnd = ceilToStep(state.timeEnd / 1000, stepSec);
  }
  
  const ticks: TimeTick[] = [];
  const labels: TimeLabel[] = [];
  const plotW = plotWidth(state);
  const plotLeft = state.left;
  const plotRight = state.left + plotW;
  
  const maxLabels = Math.min(20, Math.ceil(plotW / 40));
  let labelsAdded = 0;
  let labelStep = 1;
  
  if (rangeMs < 300 && stepSec <= 5) {
    const estimatedLabels = (tEnd - tStart) / stepSec;
    if (estimatedLabels > maxLabels) {
      labelStep = Math.ceil(estimatedLabels / maxLabels);
    }
  }
  
  let tickNumber = 0;
  for (let tSec = tStart; tSec <= tEnd + stepSec * 0.5; tSec += stepSec) {
    const tMs = tSec * 1000;
    const x = timeToX(state, tMs);
    
    if (x >= plotLeft - 10 && x <= plotRight + 10) {
      ticks.push({ value: tMs, x, tickNumber });
      
      if (labelsAdded % labelStep === 0) {
        labels.push({ 
          value: tMs, 
          x, 
          label: config.formatLabel(tSec, stepSec)
        });
      }
      labelsAdded++;
      tickNumber++;
    }
  }

  return { stepMs, ticks, labels };
}

export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}

export function applyRightPadding(state: State, paddingRatio: number = 0.30): void {
  if (!state.chartData || state.chartData.length === 0) return;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  
  const dataPortion = 1 - paddingRatio;
  const dataRange = currentRange * dataPortion;
  
  // Set time range with offset (30% empty space on the right)
  state.timeStart = latestDataTime - dataRange;
  state.timeEnd = latestDataTime + (currentRange * paddingRatio);
}

// Remove right padding and snap to latest data
export function removeRightPadding(state: State): void {
  if (!state.chartData || state.chartData.length === 0) return;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  
  const minimalPadding = currentRange * 0.05;
  state.timeEnd = latestDataTime + minimalPadding;
  state.timeStart = latestDataTime + minimalPadding - currentRange;
}

// Check if chart's right edge is at or near the latest data
export function isAtLatestData(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const tolerance = 100; // 100ms tolerance
  
  return Math.abs(state.timeEnd - latestDataTime) <= tolerance;
}

// Check if right padding is currently applied
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

// Go to latest data with offset
export function goToLatest(state: State, paddingRatio: number = 0.30): void {
  if (!state.chartData || state.chartData.length === 0) return;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  
  // Calculate data portion (70% of total range)
  const dataPortion = 1 - paddingRatio;
  const dataRange = currentRange * dataPortion;
  
  // Set to latest with 30% offset
  state.timeStart = latestDataTime - dataRange;
  state.timeEnd = latestDataTime + (currentRange * paddingRatio);
}

// Show LATEST button only when panned away from default position
export function shouldShowLatestButton(state: State): boolean {
  if (!state.chartData || state.chartData.length === 0) return false;
  
  const latestDataTime = getLatestDataTime(state.chartData);
  const currentRange = state.timeEnd - state.timeStart;
  const expectedOffset = currentRange * 0.30; // 30% offset
  const expectedEnd = latestDataTime + expectedOffset;
  
  const isAtDefaultPosition = Math.abs(state.timeEnd - expectedEnd) < 100;
  
  return !isAtDefaultPosition;
}