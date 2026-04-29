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
  // 1 SECOND (tick chart)
  "1t": {
    defaultRange: 60 * SECOND,           // Show 70 seconds
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

  // 1 MINUTE
  "1m": {
    defaultRange: 30 * MINUTE,           // Show 30 minutes
    step: 1 * MINUTE,
    minRange: 8 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 70,
    gridSteps: [60, 120, 180, 300, 600, 900, 1800, 3600],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  // 2 MINUTES
  "2m": {
    defaultRange: 60 * MINUTE,           // Show 1 hour
    step: 2 * MINUTE,
    minRange: 16 * MINUTE,
    maxRange: 4 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 75,
    gridSteps: [120, 240, 360, 600, 1200, 1800, 3600],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  // 3 MINUTES
  "3m": {
    defaultRange: 90 * MINUTE,           // Show 1.5 hours
    step: 3 * MINUTE,
    minRange: 24 * MINUTE,
    maxRange: 6 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 75,
    gridSteps: [180, 360, 540, 900, 1800, 3600, 7200],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  // 5 MINUTES
  "5m": {
    defaultRange: 150 * MINUTE,          // Show 2.5 hours
    step: 5 * MINUTE,
    minRange: 40 * MINUTE,
    maxRange: 8 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 80,
    gridSteps: [300, 600, 900, 1800, 3600, 7200, 14400],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  // 10 MINUTES
  "10m": {
    defaultRange: 300 * MINUTE,          // Show 5 hours
    step: 10 * MINUTE,
    minRange: 80 * MINUTE,
    maxRange: 12 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 80,
    gridSteps: [600, 1200, 1800, 3600, 7200, 14400, 28800],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },

  // 15 MINUTES
  "15m": {
    defaultRange: 8 * HOUR,              // Show 8 hours
    step: 15 * MINUTE,
    minRange: 2 * HOUR,
    maxRange: 16 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [900, 1800, 3600, 7200, 14400, 28800, 43200],
    formatLabel: (tSec: number, stepSec: number): string => {
      if (stepSec < 86400) return fmtDDMonHHMM(tSec);
      return fmtDDMon(tSec);
    },
  },

  // 30 MINUTES
  "30m": {
    defaultRange: 15 * HOUR,             // Show 15 hours
    step: 30 * MINUTE,
    minRange: 4 * HOUR,
    maxRange: 24 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [1800, 3600, 7200, 14400, 28800, 43200, 86400],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  // 1 HOUR
  "1h": {
    defaultRange: 30 * HOUR,             // Show 30 hours (1.25 days)
    step: 1 * HOUR,
    minRange: 8 * HOUR,
    maxRange: 48 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [3600, 7200, 14400, 28800, 43200, 86400, 129600],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  // 2 HOURS
  "2h": {
    defaultRange: 3 * DAY,               // Show 3 days
    step: 2 * HOUR,
    minRange: 16 * HOUR,
    maxRange: 72 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 100,
    gridSteps: [7200, 14400, 28800, 43200, 86400, 129600, 172800],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  // 4 HOURS
  "4h": {
    defaultRange: 5 * DAY,               // Show 5 days
    step: 4 * HOUR,
    minRange: 32 * HOUR,
    maxRange: 120 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 85,
    gridSteps: [14400, 21600, 28800, 43200, 64800, 86400, 129600, 172800, 259200],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  // 8 HOURS
  "8h": {
    defaultRange: 10 * DAY,              // Show 10 days
    step: 8 * HOUR,
    minRange: 64 * HOUR,
    maxRange: 180 * HOUR,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 105,
    gridSteps: [28800, 43200, 86400, 129600, 172800, 259200, 345600, 518400, 604800],
    formatLabel: (tSec: number, stepSec: number): string => 
      stepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },

  // 1 DAY
  "1D": {
    defaultRange: 90 * DAY,              // Show 90 days (3 months)
    step: 1 * DAY,
    minRange: 10 * DAY,
    maxRange: 365 * DAY,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 90,
    gridSteps: [86400, 172800, 259200, 432000, 604800, 864000, 1209600, 1728000, 2160000, 2592000],
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