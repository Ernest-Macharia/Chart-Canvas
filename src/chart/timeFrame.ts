import type { Timeframe } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

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
  return `${d.getUTCDate()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" })}`;
};

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
