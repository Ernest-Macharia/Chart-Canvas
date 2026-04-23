// timeFrame.ts
import type { Timeframe } from "./types";
import { findGridStep } from "./math";

const pad = (n: number) => String(n).padStart(2, "0");
const UTC_MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// Converts Unix seconds into UTC DD/MM/YYYY HH:MM:SS.
export function formatUnixToDmyHisUtc(tSec: number): string {
  const d = new Date(tSec * 1000);
  const day = pad(d.getUTCDate());
  const month = pad(d.getUTCMonth() + 1);
  const year = d.getUTCFullYear();
  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// Formats Unix seconds as HH:MM:SS.
const fmtHHMMSS = (tSec: number): string => {
  return formatUnixToDmyHisUtc(tSec).split(" ")[1];
};

// Formats Unix seconds as HH:MM.
const fmtHHMM = (tSec: number): string => {
  return formatUnixToDmyHisUtc(tSec).split(" ")[1].slice(0, 5);
};

// Formats Unix seconds as D Mon.
const fmtDDMon = (tSec: number): string => {
  const [datePart] = formatUnixToDmyHisUtc(tSec).split(" ");
  const [day, month] = datePart.split("/");
  const dayNum = Number(day);
  const monthIndex = Number(month) - 1;
  const monthShort = UTC_MONTH_SHORT[monthIndex] ?? "Jan";
  return `${dayNum} ${monthShort}`;
};

// Formats Unix seconds as D Mon HH:MM.
const fmtDDMonHHMM = (tSec: number): string => `${fmtDDMon(tSec)} ${fmtHHMM(tSec)}`;

// Formats Unix seconds as full date DD/MM/YYYY (for very wide ranges)
// const fmtDDMMYYYY = (tSec: number): string => {
//   const d = new Date(tSec * 1000);
//   const day = pad(d.getUTCDate());
//   const month = pad(d.getUTCMonth() + 1);
//   const year = d.getUTCFullYear();
//   return `${day}/${month}/${year}`;
// };

export const TIMEFRAME = {
  // 1 tick (1 second) - for high frequency trading
  "1t": {
    defaultRange: 70 * 1000,           // 70 seconds (shows ~2 minutes of ticks)
    step: 1 * 1000,                    // 1 second step
    minRange: 10 * 1000,               // Minimum 10 seconds
    maxRange: 480 * 1000,              // Maximum 8 minutes (480 seconds)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [1, 2, 5, 10, 15, 30, 60],  // Grid steps in seconds
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : fmtHHMM(tSec),
  },
  
  // 1 minute
  "1m": {
    defaultRange: 35 * 60 * 1000,      // 35 minutes
    step: 60 * 1000,                   // 1 minute step
    minRange: 8 * 60 * 1000,           // Minimum 8 minutes
    maxRange: 4 * 3600 * 1000,         // Maximum 4 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [60, 150, 200, 300, 600, 900, 1800, 3600],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  
  // 2 minutes
  "2m": {
    defaultRange: 35 * 120 * 1000,     // 70 minutes
    step: 120 * 1000,                  // 2 minute step
    minRange: 8 * 120 * 1000,          // Minimum 16 minutes
    maxRange: 4 * 3600 * 1000,         // Maximum 4 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [120, 240, 600, 1200, 1800, 3600],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  
  // 3 minutes
  "3m": {
    defaultRange: 35 * 180 * 1000,     // 105 minutes
    step: 180 * 1000,                  // 3 minute step
    minRange: 8 * 180 * 1000,          // Minimum 24 minutes
    maxRange: 6 * 3600 * 1000,         // Maximum 6 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [180, 360, 900, 1800, 3600, 7200],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  
  // 5 minutes
  "5m": {
    defaultRange: 35 * 300 * 1000,     // 175 minutes (~2.9 hours)
    step: 300 * 1000,                  // 5 minute step
    minRange: 8 * 300 * 1000,          // Minimum 40 minutes
    maxRange: 8 * 3600 * 1000,         // Maximum 8 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [300, 600, 1800, 3600, 7200, 14400],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  
  // 10 minutes
  "10m": {
    defaultRange: 35 * 600 * 1000,     // 350 minutes (~5.8 hours)
    step: 600 * 1000,                  // 10 minute step
    minRange: 8 * 600 * 1000,          // Minimum 80 minutes
    maxRange: 12 * 3600 * 1000,        // Maximum 12 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [600, 1200, 1800, 3600, 7200, 14400],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  
  // 15 minutes
  "15m": {
    defaultRange: 35 * 900 * 1000,     // 525 minutes (~8.75 hours)
    step: 900 * 1000,                  // 15 minute step
    minRange: 8 * 900 * 1000,          // Minimum 120 minutes (2 hours)
    maxRange: 16 * 3600 * 1000,        // Maximum 16 hours
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [900, 1800, 3600, 7200, 14400, 28800],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 30 minutes
  "30m": {
    defaultRange: 35 * 1800 * 1000,    // 1050 minutes (17.5 hours)
    step: 1800 * 1000,                 // 30 minute step
    minRange: 8 * 1800 * 1000,         // Minimum 240 minutes (4 hours)
    maxRange: 24 * 3600 * 1000,        // Maximum 24 hours (1 day)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [1800, 3600, 7200, 14400, 28800, 43200],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 1 hour
  "1h": {
    defaultRange: 35 * 3600 * 1000,    // 35 hours (~1.5 days)
    step: 3600 * 1000,                 // 1 hour step
    minRange: 8 * 3600 * 1000,         // Minimum 8 hours
    maxRange: 48 * 3600 * 1000,        // Maximum 48 hours (2 days)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [3600, 7200, 14400, 28800, 43200, 86400],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 2 hours
  "2h": {
    defaultRange: 35 * 7200 * 1000,    // 70 hours (~3 days)
    step: 7200 * 1000,                 // 2 hour step
    minRange: 8 * 7200 * 1000,         // Minimum 16 hours
    maxRange: 72 * 3600 * 1000,        // Maximum 72 hours (3 days)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [7200, 14400, 28800, 43200, 86400, 172800],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 4 hours
  "4h": {
    defaultRange: 35 * 14400 * 1000,   // 140 hours (~6 days)
    step: 14400 * 1000,                // 4 hour step
    minRange: 8 * 14400 * 1000,        // Minimum 32 hours
    maxRange: 120 * 3600 * 1000,       // Maximum 120 hours (5 days)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [14400, 28800, 43200, 86400, 172800, 259200],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 8 hours
  "8h": {
    defaultRange: 35 * 28800 * 1000,   // 280 hours (~12 days)
    step: 28800 * 1000,                // 8 hour step
    minRange: 8 * 28800 * 1000,        // Minimum 64 hours
    maxRange: 180 * 3600 * 1000,       // Maximum 180 hours (7.5 days)
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [28800, 43200, 86400, 172800, 345600, 604800],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
  
  // 1 day
  "1D": {
    defaultRange: 90 * 86400 * 1000,   // 90 days (~3 months)
    step: 24 * 3600 * 1000,            // 1 day step
    minRange: 10 * 86400 * 1000,       // Minimum 10 days
    maxRange: 365 * 86400 * 1000,      // Maximum 365 days (1 year)
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 90,
    gridSteps: [86400, 172800, 604800, 1209600, 2592000],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 86400 ? fmtDDMonHHMM(tSec) : fmtDDMon(tSec),
  },
} as const satisfies Record<
  Timeframe,
  {
    defaultRange: number;
    step: number;
    minRange: number;
    maxRange: number;
    minZoomLevel: number;
    maxZoomLevel: number;
    minPixelsPerTick: number;
    gridSteps: readonly number[];
    formatLabel: (tSec: number, gridStepSec: number) => string;
  }
>;

export const DEFAULT_TIMERANGE: Timeframe = "1m";

// Returns base data interval in seconds for a timeframe.
export function getUniversalIntervalSec(timeframe: Timeframe): number {
  return Math.max(1, Math.floor(TIMEFRAME[timeframe].step / 1000));
}

// Returns best grid step in seconds for a timeframe and viewport width.
export function getUniversalStepSec(timeframe: Timeframe, range: number, plotWidthPx: number): number {
  const config = TIMEFRAME[timeframe];
  return findGridStep(config.gridSteps, range, plotWidthPx, config.minPixelsPerTick);
}