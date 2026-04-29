import { plotWidth } from "./state";
import { TIMEFRAME } from "./timeFrame";
import { clamp } from "./math";
import { timeToX } from "./transformation";
import type { State, TimeLabel, TimeTick } from "./types";

let previousStepSec: number = 0;

// Estimate label width in pixels (used by step calculation only)
function estimateLabelWidthPx(stepSec: number): number {
  const charPx = 7.5;
  let chars = 8;
  if (stepSec < 60) chars = 8;           // "14:50:30" = 8 chars
  else if (stepSec < 86400) chars = 5;   // "14:50" = 5 chars
  else chars = 6;                         // "23 Apr" = 6 chars
  return chars * charPx + 12;
}

// Core step selection algorithm (matches reference chart)
export function pickNiceTimeStepSecondsByPixels(
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
  
  // Mobile adjustment (same as reference chart)
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

// Get the time step in milliseconds
// Target spacing calculated to produce ~10 labels at default zoom
export function getTimeStep(state: State, range: number): number {
  const config = getTimeConfig(state);
  const plotW = plotWidth(state);
  
  // Use config values as the base (already adjusted for ~10 labels)
  const minPx = config.minPixelsPerTick;
  
  // Target spacing: aim for 80-120px between labels
  // On 800px screen: 800/80 = 10 labels, 800/120 = 6-7 labels
  const targetPx = Math.min(120, minPx + 35);
  const maxPx = targetPx * 2;  // Max is 2x target (for very zoomed out)
  
  const stepSec = pickNiceTimeStepSecondsByPixels(
    range, plotW, targetPx, minPx, maxPx, previousStepSec, 25, config.gridSteps
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

  // Round to nice boundaries (floor start, ceil end)
  const tStart = floorToStep(state.timeStart / 1000, stepSec);
  const tEnd = ceilToStep(state.timeEnd / 1000, stepSec);
  
  const ticks: TimeTick[] = [];
  const labels: TimeLabel[] = [];
  const plotW = plotWidth(state);
  const plotLeft = state.left;
  const plotRight = state.left + plotW;
  
  // Loop through each step - EVERY step gets a tick AND a label
  for (let tSec = tStart; tSec <= tEnd + stepSec * 0.5; tSec += stepSec) {
    const tMs = tSec * 1000;
    const x = timeToX(state, tMs);
    
    // Only include if within or near plot area (with small margin)
    if (x >= plotLeft - 10 && x <= plotRight + 10) {
      const tickNumber = Math.round(tMs / stepMs);
      ticks.push({ value: tMs, x, tickNumber });
      
      // ALWAYS add a label for EVERY tick - the step algorithm already ensures no overlap
      labels.push({ 
        value: tMs, 
        x, 
        label: config.formatLabel(tSec, stepSec) 
      });
    }
  }

  return { stepMs, ticks, labels };
}

export function generateTimeLabels(state: State): TimeLabel[] {
  return buildTimeAxis(state).labels;
}