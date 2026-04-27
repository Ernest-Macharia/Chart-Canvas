import type { ChartDataPoint } from "./data";
import type { Timeframe } from "./types";

export interface CandleData {
  time: number;      // Candle open time (ms)
  open: number;
  high: number;
  low: number;
  close: number;
}

// Convert timeframe to grouping interval in seconds
function getCandleIntervalSeconds(timeframe: Timeframe): number {
  const intervals: Record<Timeframe, number> = {
    "1t": 1, "1m": 60, "2m": 120, "3m": 180, "5m": 300,
    "10m": 600, "15m": 900, "30m": 1800, "1h": 3600,
    "2h": 7200, "4h": 14400, "8h": 28800, "1D": 86400,
  };
  return intervals[timeframe];
}

// Convert tick data to OHLC candles
export function ticksToOHLC(
  ticks: ChartDataPoint[],
  timeframe: Timeframe
): CandleData[] {
  if (ticks.length === 0) return [];
  
  const intervalSeconds = getCandleIntervalSeconds(timeframe);
  const intervalMs = intervalSeconds * 1000;
  const candles: CandleData[] = [];
  
  let currentCandle: CandleData | null = null;
  let currentCandleStartTime: number = 0;
  
  for (const tick of ticks) {
    const tickTimeMs = tick.epoch * 1000;
    const candleStartTime = Math.floor(tickTimeMs / intervalMs) * intervalMs;
    
    if (!currentCandle || candleStartTime !== currentCandleStartTime) {
      if (currentCandle) {
        candles.push(currentCandle);
      }
      
      currentCandle = {
        time: candleStartTime,
        open: tick.quote,
        high: tick.quote,
        low: tick.quote,
        close: tick.quote,
      };
      currentCandleStartTime = candleStartTime;
    } else {
      currentCandle.high = Math.max(currentCandle.high, tick.quote);
      currentCandle.low = Math.min(currentCandle.low, tick.quote);
      currentCandle.close = tick.quote;
    }
  }
  
  if (currentCandle) {
    candles.push(currentCandle);
  }
  
  return candles;
}

// Filter candles to visible time range
export function getVisibleCandles(
  candles: CandleData[],
  timeStart: number,
  timeEnd: number
): CandleData[] {
  return candles.filter(c => c.time >= timeStart && c.time <= timeEnd);
}