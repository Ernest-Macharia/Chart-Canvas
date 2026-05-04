import type { Timeframe, State } from "./types";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

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
    defaultRange: 70 * SECOND,
    step: 1 * SECOND,
    minRange: 10 * SECOND,
    maxRange: 8 * MINUTE,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 90,
    gridSteps: [1, 2, 5, 10, 15, 30, 60],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 60 ? fmtHHMMSS(tSec) : fmtHHMM(tSec),
  },

  "1m": {
    defaultRange: 35 * MINUTE,
    step: 1 * MINUTE,
    minRange: 8 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 70,
    gridSteps: [60, 150, 200, 300, 600, 900, 1800, 3600],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "2m": {
    defaultRange: 70 * MINUTE,
    step: 2 * MINUTE,
    minRange: 16 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 75,
    gridSteps: [120, 240, 600, 1200, 1800, 3600],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "3m": {
    defaultRange: 105 * MINUTE,
    step: 3 * MINUTE,
    minRange: 24 * MINUTE,
    maxRange: 6 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 75,
    gridSteps: [180, 360, 900, 1800, 3600, 7200],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "5m": {
    defaultRange: 175 * MINUTE,
    step: 5 * MINUTE,
    minRange: 40 * MINUTE,
    maxRange: 8 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 80,
    gridSteps: [300, 600, 1800, 3600, 7200, 14400],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "10m": {
    defaultRange: 350 * MINUTE,
    step: 10 * MINUTE,
    minRange: 80 * MINUTE,
    maxRange: 12 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 80,
    gridSteps: [600, 1200, 1800, 3600, 7200, 14400],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  "15m": {
    defaultRange: 525 * MINUTE,
    step: 15 * MINUTE,
    minRange: 2 * HOUR,
    maxRange: 16 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [900, 1800, 3600, 7200, 14400, 28800],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "30m": {
    defaultRange: 1050 * MINUTE,
    step: 30 * MINUTE,
    minRange: 4 * HOUR,
    maxRange: 24 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [1800, 3600, 7200, 14400, 28800, 43200],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "1h": {
    defaultRange: 35 * HOUR,
    step: 1 * HOUR,
    minRange: 8 * HOUR,
    maxRange: 48 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [3600, 7200, 14400, 28800, 43200, 86400],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "2h": {
    defaultRange: 70 * HOUR,
    step: 2 * HOUR,
    minRange: 16 * HOUR,
    maxRange: 72 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [7200, 14400, 28800, 43200, 86400, 172800],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "4h": {
    defaultRange: 140 * HOUR,
    step: 4 * HOUR,
    minRange: 32 * HOUR,
    maxRange: 120 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 85,
    gridSteps: [14400, 28800, 43200, 86400, 172800, 259200],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "8h": {
    defaultRange: 280 * HOUR,
    step: 8 * HOUR,
    minRange: 64 * HOUR,
    maxRange: 180 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 105,
    gridSteps: [28800, 43200, 86400, 172800, 345600, 604800],
    formatLabel: (tSec: number, stepSec: number): string =>
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  "1D": {
    defaultRange: 90 * DAY,
    step: 1 * DAY,
    minRange: 10 * DAY,
    maxRange: 365 * DAY,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 90,
    gridSteps: [86400, 172800, 604800, 1209600, 2592000],
    formatLabel: (tSec: number): string => fmtDDMon(tSec),
  },
} as const;

export const DEFAULT_TIMERANGE: Timeframe = "1m";

export function getTimeConfig(state: State) {
  return TIMEFRAME[state.timeframe];
}

export function getUniversalIntervalSec(timeframe: Timeframe): number {
  return Math.max(1, Math.floor(TIMEFRAME[timeframe].step / 1000));
}
