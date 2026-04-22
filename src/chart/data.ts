import type { Timeframe } from "./types";
import { getUniversalIntervalSec } from "./timeFrame";

export interface ChartDataPoint {
  time: number;
  value: number;
}

// how data is received
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Returns base sampling interval (seconds) for a timeframe.
function getDataInterval(timeframe: Timeframe): number {
  return getUniversalIntervalSec(timeframe);
}


// Generates synthetic random-walk price data.
export function generateRandomPriceData(
  startTime: number,
  endTime: number,
  timeframe: Timeframe,
  startPrice: number = 100,
): ChartDataPoint[] {
  const interval = getDataInterval(timeframe);
  const data: ChartDataPoint[] = [];
  let price = startPrice;

  const firstTime = Math.ceil(startTime / interval) * interval;

  for (let time = firstTime; time <= endTime; time += interval) {
    const volatility = timeframe === "1m" ? 0.5 : 2;
    const change = (Math.random() - 0.48) * volatility;
    price = Math.max(10, price + change);

    data.push({
      time: Math.floor(time),
      value: parseFloat(price.toFixed(2)),
    });
  }

  return data;
}


// Filters series data to the active visible time window.
export function getVisibleData<T extends { time: number }>(
  data: T[],
  timeStart: number,
  timeEnd: number,
): T[] {
  return data.filter(d => d.time >= timeStart && d.time <= timeEnd);
}


// Builds a fresh timeframe-aligned data window ending at now.
export function regenerateDataForTimeframe(
  timeframe: Timeframe,
  startPrice: number = 100,
): ChartDataPoint[] {
  const now = Math.floor(Date.now() / 1000);
  let startTime: number;

  switch (timeframe) {
    case "1m":
      startTime = now - 4 * 3600;
      break;
    case "1D":
      startTime = now - 365 * 86400;
      break;
    default:
      startTime = now - 24 * 3600;
  }

  return generateRandomPriceData(startTime, now, timeframe, startPrice);
}
