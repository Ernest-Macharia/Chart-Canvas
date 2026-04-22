import { plotHeight, plotWidth } from "./state";
import type { State } from "./types";

// Maps timestamp (ms) to x-coordinate in plot space.
export function timeToX(state: State, timestamp: number): number {
  return state.left + ((timestamp - state.timeStart) / (state.timeEnd - state.timeStart)) * plotWidth(state);
}

// Maps x-coordinate in plot space back to timestamp (ms).
export function xToTime(state: State, x: number): number {
  return state.timeStart + ((x - state.left) / plotWidth(state)) * (state.timeEnd - state.timeStart);
}

// Maps price value to y-coordinate in plot space.
export function priceToY(state: State, price: number): number {
  return state.top + (1 - (price - state.priceMin) / (state.priceMax - state.priceMin)) * plotHeight(state);
}

// Maps y-coordinate in plot space back to price value.
export function yToPrice(state: State, y: number): number {
  return state.priceMin + (1 - (y - state.top) / plotHeight(state)) * (state.priceMax - state.priceMin);
}
