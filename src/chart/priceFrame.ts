import type { Timeframe, State } from "./types";

export const PRICE_PADDING = {
  topRatio: 0.15,    // 15% padding at the top
  bottomRatio: 0.10, // 10% padding at the bottom
  minTopPadding: 5,  // Minimum 5 units at top (for very small ranges)
  minBottomPadding: 3 // Minimum 3 units at bottom
} as const;

export const PRICEFRAME = {
  "1t": {
    defaultRange: 2.0,
    minRange: 0.1,
    maxRange: 10.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 40,
    gridSteps: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0],
  },
  
  "1m": {
    defaultRange: 5.0,
    minRange: 0.5,
    maxRange: 50.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
  },
  
  "2m": {
    defaultRange: 5.0,
    minRange: 0.5,
    maxRange: 50.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
  },
  
  "3m": {
    defaultRange: 6.0,
    minRange: 0.5,
    maxRange: 60.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
  },
  
  "5m": {
    defaultRange: 8.0,
    minRange: 1.0,
    maxRange: 100.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0],
  },
  
  "10m": {
    defaultRange: 10.0,
    minRange: 1.0,
    maxRange: 100.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0],
  },
  
  "15m": {
    defaultRange: 12.0,
    minRange: 2.0,
    maxRange: 150.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  },
  
  "30m": {
    defaultRange: 15.0,
    minRange: 2.0,
    maxRange: 200.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 45,
    gridSteps: [0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0],
  },
  
  "1h": {
    defaultRange: 20.0,
    minRange: 5.0,
    maxRange: 300.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0],
  },
  
  "2h": {
    defaultRange: 25.0,
    minRange: 5.0,
    maxRange: 400.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0],
  },
  
  "4h": {
    defaultRange: 30.0,
    minRange: 10.0,
    maxRange: 500.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 50,
    gridSteps: [1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0],
  },
  
  "8h": {
    defaultRange: 40.0,
    minRange: 10.0,
    maxRange: 800.0,
    minZoomLevel: -2,
    maxZoomLevel: 3,
    minPixelsPerTick: 55,
    gridSteps: [1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0],
  },
  
  "1D": {
    defaultRange: 100.0,
    minRange: 20.0,
    maxRange: 2000.0,
    minZoomLevel: -3,
    maxZoomLevel: 2,
    minPixelsPerTick: 60,
    gridSteps: [2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0, 1000.0],
  },
} as const;

// Helper functions - FIXED with proper types
export function getPriceConfig(state: State) {
  return PRICEFRAME[state.timeframe];
}

export function getPriceConfigByTimeframe(timeframe: Timeframe) {
  return PRICEFRAME[timeframe];
}