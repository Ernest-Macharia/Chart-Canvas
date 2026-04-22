import { DEFAULT_TIMERANGE, TIMEFRAME } from "./timeFrame";
import type { State, Timeframe } from "./types";

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

export function plotWidth(state: State): number {
  return state.width - state.left - state.right;
}

export function plotHeight(state: State): number {
  return state.height - state.top - state.bottom;
}

export function setTimeframeState(state: State, timeframe: Timeframe): void {
  state.timeframe = timeframe;
  state.timeZoomLevel = 0;
  state.timeStart = Date.now() - TIMEFRAME[timeframe].defaultRange;
  state.timeEnd = Date.now();
  state.priceZoomLevel = 0;
  state.priceMin = 980;
  state.priceMax = 1020;
}
