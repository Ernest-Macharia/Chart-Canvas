import type { Timeframe, State } from "./types";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Grid step constants (in seconds, for findGridStep)
// const SEC = 1;
const MIN = 60;
const HR = 3600;
const D = 86400;
// const WEEK = 7 * D;
// const MONTH = 30 * D;

const pad = (n: number) => String(n).padStart(2, "0");
const UTC_MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const fmtHHMMSS = (tSec: number): string => {
  const d = new Date(tSec * 1000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

const fmtHHMM = (tSec: number): string => {
  const d = new Date(tSec * 1000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};

const fmtDDMon = (tSec: number): string => {
  const d = new Date(tSec * 1000);
  return `${d.getUTCDate()} ${UTC_MONTH_SHORT[d.getUTCMonth()]}`;
};

const fmtDDMonHHMM = (tSec: number): string => `${fmtDDMon(tSec)} ${fmtHHMM(tSec)}`;

export const TIMEFRAME = {
  "1t": {
    defaultRange: 50 * SECOND,
    step: 1 * SECOND,
    minRange: 10 * SECOND,
    maxRange: 8 * MINUTE,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [1, 2, 5, 10, 15, 30, 60],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 60 ? fmtHHMMSS(tSec) : fmtHHMM(tSec),
  },

  "1m": {
    defaultRange: 30 * MINUTE,
    step: 1 * MINUTE,
    minRange: 5 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [1 * MIN, 2 * MIN, 3 * MIN, 5 * MIN, 10 * MIN, 15 * MIN, 30 * MIN, 1 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * HR ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "2m": {
    defaultRange: 30 * 2 * MINUTE,
    step: 2 * MINUTE,
    minRange: 5 * 2 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [2 * MIN, 4 * MIN, 10 * MIN, 20 * MIN, 30 * MIN, 1 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * HR ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "3m": {
    defaultRange: 30 * 3 * MINUTE,
    step: 3 * MINUTE,
    minRange: 5 * 3 * MINUTE,
    maxRange: 6 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [3 * MIN, 6 * MIN, 15 * MIN, 30 * MIN, 1 * HR, 2 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * HR ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "5m": {
    defaultRange: 30 * 5 * MINUTE,
    step: 5 * MINUTE,
    minRange: 5 * 5 * MINUTE,
    maxRange: 8 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [5 * MIN, 10 * MIN, 30 * MIN, 1 * HR, 2 * HR, 4 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * HR ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "10m": {
    defaultRange: 30 * 10 * MINUTE,
    step: 10 * MINUTE,
    minRange: 5 * 10 * MINUTE,
    maxRange: 12 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [10 * MIN, 20 * MIN, 30 * MIN, 1 * HR, 2 * HR, 4 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * HR ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "15m": {
    defaultRange: 4 * HOUR,
    step: 15 * MINUTE,
    minRange: 1 * HOUR,
    maxRange: 12 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [15 * MIN, 30 * MIN, 1 * HR, 2 * HR, 3 * HR, 4 * HR, 6 * HR],
    formatLabel: (tSec: number, stepSec: number): string => {
      if (stepSec < 1 * HR) return fmtHHMM(tSec);
      return fmtDDMonHHMM(tSec);
    },
  },

  "30m": {
    defaultRange: 12 * HOUR,
    step: 30 * MINUTE,
    minRange: 2 * HOUR,
    maxRange: 24 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [30 * MIN, 1 * HR, 2 * HR, 4 * HR, 6 * HR, 12 * HR],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * D ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "1h": {
    defaultRange: 24 * HOUR,
    step: 1 * HOUR,
    minRange: 4 * HOUR,
    maxRange: 7 * DAY,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [1 * HR, 2 * HR, 4 * HR, 8 * HR, 12 * HR, 1 * D],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * D ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "2h": {
    defaultRange: 2 * DAY,
    step: 2 * HOUR,
    minRange: 8 * HOUR,
    maxRange: 14 * DAY,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [2 * HR, 4 * HR, 8 * HR, 12 * HR, 1 * D, 2 * D],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * D ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "4h": {
    defaultRange: 4 * DAY,
    step: 4 * HOUR,
    minRange: 1 * DAY,
    maxRange: 30 * DAY,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 55,
    gridSteps: [4 * HR, 8 * HR, 12 * HR, 1 * D, 2 * D, 3 * D],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * D ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "8h": {
    defaultRange: 6 * DAY,
    step: 8 * HOUR,
    minRange: 2 * DAY,
    maxRange: 60 * DAY,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 55,
    gridSteps: [6 * HR, 8 * HR, 12 * HR, 1 * D, 2 * D, 4 * D, 7 * D, 14 * D],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 1 * D ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "1D": {
    defaultRange: 30 * DAY,
    step: 1 * DAY,
    minRange: 7 * DAY,
    maxRange: 365 * DAY,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 60,
    gridSteps: [1 * D, 2 * D, 7 * D, 14 * D, 30 * D],
    formatLabel: (tSec: number, _stepSec: number): string => fmtDDMon(tSec),
  },
} as const;

export const DEFAULT_TIMERANGE: Timeframe = "1m";

export function getTimeConfig(state: State) {
  return TIMEFRAME[state.timeframe];
}

export function getUniversalIntervalSec(timeframe: Timeframe): number {
  return Math.max(1, Math.floor(TIMEFRAME[timeframe].step / 1000));
}