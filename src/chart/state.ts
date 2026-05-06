import { DEFAULT_TIMERANGE, TIMEFRAME } from "./timeFrame";
import type { State, Timeframe } from "./types";

const GUTTERS = {
  left: 3,
  right: 60,
  top: 30,
  bottom: 40,
};

export function createState(width: number, height: number): State {
  const now = Date.now();
  const tf = TIMEFRAME[DEFAULT_TIMERANGE];

  return {
    width,
    height,

    timeStart: now - tf.defaultRange,
    timeEnd: now,
    timeZoomLevel: 0,

    priceMin: 980,
    priceMax: 1020,
    priceZoomLevel: 0,

    left: GUTTERS.left,
    right: GUTTERS.right,
    top: GUTTERS.top,
    bottom: GUTTERS.bottom,

    timeframe: DEFAULT_TIMERANGE,
    isDragging: false,
    zoomCooldown: 16,
    zoomLastTime: 0,

    chartData: [],
    chartType: "line",
    indicatorType: "none",
    indicatorPeriod: 20,
    indicatorColor: "#1d4ed8",
    indicatorLineWidth: 2,
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
