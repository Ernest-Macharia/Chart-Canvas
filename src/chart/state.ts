import { DEFAULT_TIMERANGE, TIMEFRAME } from "./timeFrame";
import type { State, Timeframe } from "./types";

// Creates initial chart state for a given canvas size.
export function createState(width: number, height: number): State {
  const now = Date.now();

  return {
    width,
    height,

    timeStart: now - TIMEFRAME[DEFAULT_TIMERANGE].defaultRange,
    timeEnd: now,
    timeZoomLevel: 0,

    priceMin: 980,
    priceMax: 1020,
    priceZoomLevel: 0,

    left: 20,
    right: 70,
    top: 20,
    bottom: 40,

    timeframe: DEFAULT_TIMERANGE,
    isDragging: false,
    zoomCooldown: 80,
    zoomLastTime: 0,

    chartData: [],
    chartType: "line",
    useDataRange: true,
  };
}

// Returns plot width inside left/right margins.
export function plotWidth(state: State): number {
  return state.width - state.left - state.right;
}

// Returns plot height inside top/bottom margins.
export function plotHeight(state: State): number {
  return state.height - state.top - state.bottom;
}

// Resets state for a new timeframe and default zoom/ranges.
export function setTimeframeState(state: State, timeframe: Timeframe): void {
  state.timeframe = timeframe;
  state.timeZoomLevel = 0;
  state.timeStart = Date.now() - TIMEFRAME[timeframe].defaultRange;
  state.timeEnd = Date.now();
  state.priceZoomLevel = 0;
  state.priceMin = 980;
  state.priceMax = 1020;
}
