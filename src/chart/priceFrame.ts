// priceFrame.ts
import type { Timeframe } from "./types";

// Number of price steps to add as margin above/below visible data
export const PRICE_GRID_MARGIN_STEPS = 1.5;

// Price configuration for all timeframes
export const PRICEFRAME = {
  // 1 tick (1 second) - high frequency trading
  "1t": {
    defaultRange: 40,
    minRange: 0.5,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 1 minute
  "1m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 2 minutes
  "2m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 3 minutes
  "3m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 5 minutes
  "5m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 10 minutes
  "10m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 15 minutes
  "15m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 30 minutes
  "30m": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 1 hour
  "1h": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 2 hours
  "2h": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 4 hours
  "4h": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 8 hours
  "8h": {
    defaultRange: 40,
    minRange: 1,
    maxRange: 5000,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000],
  },
  
  // 1 day
  "1D": {
    defaultRange: 200,
    minRange: 1,
    maxRange: 50000,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 40,
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
    minPixelsPerTick: number;
    gridSteps: readonly number[];
  }
>;

// Helper function to get price config for current timeframe
export function getPriceConfigByTimeframe(timeframe: Timeframe) {
  return PRICEFRAME[timeframe];
}