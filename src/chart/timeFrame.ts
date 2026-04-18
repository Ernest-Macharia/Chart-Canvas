import type { Timeframe } from "./types";

export const TIMEFRAME = {
  "1m": {
    defaultRange: 35 * 60 * 1000,
    step: 60 * 1000,
    minRange: 8 * 60 * 1000,
    maxRange: 4 * 3600 * 1000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    gridSteps: [60, 150, 200, 300, 600, 900, 1800, 3600],
  },
  "1D": {
    defaultRange: 35 * 3600 * 1000,
    step: 24 * 3600 * 1000,
    minRange: 8 * 3600 * 1000,
    maxRange: 48 * 3600 * 1000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    gridSteps: [3600, 7200, 14400, 28800, 43200, 86400],
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
    gridSteps: readonly number[];
  }
>;

export const DEFAULT_TIMERANGE: Timeframe = "1m";
