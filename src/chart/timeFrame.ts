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

export const TIMEFRAME = {
  "1m": {
    defaultRange: 35 * 60 * 1000,
    step: 60 * 1000,
    minRange: 8 * 60 * 1000,
    maxRange: 4 * 3600 * 1000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 60,
    gridSteps: [60, 150, 200, 300, 600, 900, 1800, 3600],
    formatLabel: (tSec: number, gridStepSec: number): string =>
      gridStepSec < 60 ? fmtHHMMSS(tSec) : gridStepSec < 3600 ? fmtHHMM(tSec) : fmtDDMonHHMM(tSec),
  },
  "1D": {
    defaultRange: 20 * 86400 * 1000,
    step: 24 * 3600 * 1000,
    minRange: 10 * 86400 * 1000,
    maxRange: 365 * 86400 * 1000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 90,
    gridSteps: [43200, 86400, 172800, 604800, 1209600],
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
