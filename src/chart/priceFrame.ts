import type { Timeframe } from "./types";

export const PRICEFRAME = {
  "1m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  "1D": {
    defaultRange: 200,
    minRange: 1,
    maxRange: 50000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  },
} as const satisfies Record<
  Timeframe,
  {
    defaultRange: number;
    minRange: number;
    maxRange: number;
    minZoomLevel: number;
    maxZoomLevel: number;
    gridSteps: readonly number[];
  }
>;
