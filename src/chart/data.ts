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

// "tick": {
//     "epoch": 1776873094,
//     "quote": 85.8048,
//     "symbol": "R_50",
//     "pip_size": 4,
    
//   }

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

  // Determine appropriate start time based on timeframe
  switch (timeframe) {
    case "1t":
      startTime = now - 300;  // 5 minutes ago for tick data
      break;
    case "1m":
      startTime = now - 4 * 3600;  // 4 hours ago
      break;
    case "2m":
      startTime = now - 8 * 3600;  // 8 hours ago
      break;
    case "3m":
      startTime = now - 12 * 3600;  // 12 hours ago
      break;
    case "5m":
      startTime = now - 20 * 3600;  // 20 hours ago
      break;
    case "10m":
      startTime = now - 40 * 3600;  // 40 hours ago
      break;
    case "15m":
      startTime = now - 60 * 3600;  // 60 hours ago (2.5 days)
      break;
    case "30m":
      startTime = now - 120 * 3600;  // 120 hours ago (5 days)
      break;
    case "1h":
      startTime = now - 240 * 3600;  // 240 hours ago (10 days)
      break;
    case "2h":
      startTime = now - 480 * 3600;  // 480 hours ago (20 days)
      break;
    case "4h":
      startTime = now - 960 * 3600;  // 960 hours ago (40 days)
      break;
    case "8h":
      startTime = now - 1920 * 3600;  // 1920 hours ago (80 days)
      break;
    case "1D":
      startTime = now - 365 * 86400;  // 365 days ago (1 year)
      break;
    default:
      startTime = now - 24 * 3600;
  }

  return generateRandomPriceData(startTime, now, timeframe, startPrice);
}
