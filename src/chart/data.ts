import type { Timeframe } from "./types";
import { getUniversalIntervalSec } from "./timeFrame";

export interface ChartDataPoint {
  time: number;
  value: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

function getDataInterval(timeframe: Timeframe): number {
  return getUniversalIntervalSec(timeframe);
}


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

export function generateTrendingData(
  startTime: number,
  endTime: number,
  timeframe: Timeframe,
  trend: "up" | "down" | "sideways" = "up",
  startPrice: number = 100,
): ChartDataPoint[] {
  const interval = getDataInterval(timeframe);
  const data: ChartDataPoint[] = [];
  let price = startPrice;

  const firstTime = Math.ceil(startTime / interval) * interval;
  const totalPoints = Math.floor((endTime - firstTime) / interval);

  const trendFactor = trend === "up" ? 0.3 : trend === "down" ? -0.3 : 0;
  const volatility = timeframe === "1m" ? 1.5 : 3;

  for (let i = 0; i <= totalPoints; i++) {
    const time = firstTime + interval * i;
    if (time > endTime) break;

    const randomWalk = (Math.random() - 0.5) * volatility;
    const trendWalk = trendFactor * (i / totalPoints) * (timeframe === "1D" ? 50 : 10);
    price = Math.max(10, price + randomWalk + trendWalk / totalPoints);

    const noise = (Math.random() - 0.5) * 0.5;
    const finalPrice = price + noise;

    data.push({
      time: Math.floor(time),
      value: parseFloat(finalPrice.toFixed(2)),
    });
  }

  return data;
}

export function getVisibleData<T extends { time: number }>(
  data: T[],
  timeStart: number,
  timeEnd: number,
): T[] {
  return data.filter(d => d.time >= timeStart && d.time <= timeEnd);
}

export function getPriceRangeWithMargin(
  data: ChartDataPoint[],
): { min: number; max: number } {
  if (data.length === 0) return { min: 0, max: 100 };

  let min = Infinity;
  let max = -Infinity;

  for (const point of data) {
    min = Math.min(min, point.value);
    max = Math.max(max, point.value);
  }

  const range = max - min;
  const margin = range * 0.15;
  const gridTopMargin = margin * 1.0;
  const gridBottomMargin = margin * 0.5;

  return {
    min: min - gridBottomMargin,
    max: max + gridTopMargin,
  };
}

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
