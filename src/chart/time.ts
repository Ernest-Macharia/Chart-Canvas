import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { clamp } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";

let previousStepSec: number = 0;

function estimateLabelWidthPx(stepSec: number): number {
  const charPx = 7.5;
  let chars = 8;
  if (stepSec < 60) chars = 8;
  else if (stepSec < 86400) chars = 5;
  else chars = 6;
  return chars * charPx + 12;
}

export function timeStepSecondsByPixels(
  rangeSec: number,
  plotWidthPx: number,
  targetPx: number = 100,
  minPx: number = 70,
  maxPx: number = 200,
  prevStepSec?: number,
  hysteresisPx: number = 25,
  candidates?: readonly number[]
): number {
  if (rangeSec <= 0 || plotWidthPx <= 0) return 60;
  
  const steps = candidates || [1, 2, 5, 10, 15, 30, 60, 120, 180, 300, 600, 900, 1800, 3600, 7200, 14400, 28800, 86400];
  const isMobile = plotWidthPx < 500;
  const effectiveMin = isMobile ? Math.max(minPx, 55) : minPx;
  const effectiveTarget = isMobile ? Math.max(targetPx, 80) : targetPx;
  
  let bestStep = steps[steps.length - 1];
  let bestScore = Infinity;
  
  for (const step of steps) {
    const spacingPx = (step / rangeSec) * plotWidthPx;
    const labelMinPx = estimateLabelWidthPx(step);
    const zoomingOut = prevStepSec !== undefined && step > prevStepSec;
    const hardFloor = Math.max(effectiveMin, labelMinPx, zoomingOut ? labelMinPx + hysteresisPx : 0);
    
    if (spacingPx < hardFloor) continue;
    
    const inBand = spacingPx <= maxPx;
    const distance = Math.abs(spacingPx - effectiveTarget);
    const score = inBand ? distance : distance + 1000;
    
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
  
  const stepSec = timeStepSecondsByPixels(
    range, plotW, 100, 60, 180, previousStepSec, 25, config.gridSteps
  );
  
  previousStepSec = stepSec;
  return stepSec * 1000;
}

export function buildTimeAxis(state: State): { stepMs: number; labelEvery: number; ticks: TimeTick[]; labels: TimeLabel[] } {
  const config = getTimeConfig(state);
  const rangeMs = state.timeEnd - state.timeStart;
  const range = rangeMs / 1000;
  const stepMs = getTimeStep(state, range);
  const stepSec = stepMs / 1000;

  const firstTick = ceilToStep(state.timeStart, stepMs);
  const ticks: TimeTick[] = [];
  const labels: TimeLabel[] = [];
  const plotW = plotWidth(state);
  const plotLeft = state.left;
  const plotRight = state.left + plotW;
  const labelWidthPx = estimateLabelWidthPx(stepSec);
  
  let lastLabelX = -Infinity;
  let tickIndex = 0;
  
  for (let t = firstTick; t <= state.timeEnd; t += stepMs) {
    const x = timeToX(state, t);
    
    if (x >= plotLeft - 10 && x <= plotRight + 10) {
      const tickNumber = Math.round(t / stepMs);
      ticks.push({ value: t, x, tickNumber });
      
      const shouldAddLabel = (x - lastLabelX) >= labelWidthPx;
      if (shouldAddLabel) {
        labels.push({ value: t, x, label: config.formatLabel(t / 1000, stepSec) });
        lastLabelX = x;
      }
      tickIndex++;
    }
  }
  
  // Ensure first and last labels exist
  if (labels.length === 0 && ticks.length > 0) {
    if (ticks[0]) {
      labels.push({ 
        value: ticks[0].value, 
        x: ticks[0].x, 
        label: config.formatLabel(ticks[0].value / 1000, stepSec) 
      });
    }
    if (ticks.length > 1 && ticks[ticks.length - 1]) {
      const lastTick = ticks[ticks.length - 1];
      if (Math.abs(lastTick.x - (labels[0]?.x ?? 0)) > labelWidthPx) {
        labels.push({ 
          value: lastTick.value, 
          x: lastTick.x, 
          label: config.formatLabel(lastTick.value / 1000, stepSec) 
        });
      }
    }
  }

  return { stepMs, labelEvery: 1, ticks, labels };
}

export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}