import type { Timeframe } from "./types";
import { getUniversalIntervalSec } from "./timeFrame";
import { RANDOM_CHART_DATA } from "./hardcodedData";

// Single ChartDataPoint interface using epoch and quote directly
export interface ChartDataPoint {
  epoch: number;     // Unix timestamp in seconds
  quote: number;     // Current price
  symbol: string;    // Trading symbol
  pip_size: number;  // Decimal places
}

// how data is received
export interface CandleData {
  time: number;      // Candle open time (ms)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export function getHardcodedData(): ChartDataPoint[] {
  return [...RANDOM_CHART_DATA];
}

// Returns base sampling interval (seconds) for a timeframe.
function getDataInterval(_timeframe: Timeframe): number {
  return getUniversalIntervalSec(_timeframe);
}

// Generates synthetic random-walk price data (kept for reference, not used)
export function generateRandomPriceData(
  startTime: number,
  endTime: number,
  _timeframe: Timeframe,
  startPrice: number = 100,
): ChartDataPoint[] {
  const interval = getDataInterval(_timeframe);
  const data: ChartDataPoint[] = [];
  let price = startPrice;

  const firstTime = Math.ceil(startTime / interval) * interval;

  for (let time = firstTime; time <= endTime; time += interval) {
    const volatility = _timeframe === "1m" ? 0.5 : 2;
    const change = (Math.random() - 0.48) * volatility;
    price = Math.max(10, price + change);

    data.push({
      epoch: Math.floor(time),
      quote: parseFloat(price.toFixed(2)),
      symbol: "R_50",
      pip_size: 4,
    });
  }

  return data;
}

// Filters series data to the active visible time window.
export function getVisibleData<T extends { epoch: number }>(
  data: T[],
  timeStartMs: number,
  timeEndMs: number,
): T[] {
  const filtered = data.filter(d => {
    const epochMs = d.epoch * 1000;
    return epochMs >= timeStartMs && epochMs <= timeEndMs;
  });
  
  return filtered;
}

// Builds a fresh timeframe-aligned data window ending at now.
export function regenerateDataForTimeframe(
  _timeframe: Timeframe,
  _startPrice: number = 100,
): ChartDataPoint[] {
  return RANDOM_CHART_DATA;
}