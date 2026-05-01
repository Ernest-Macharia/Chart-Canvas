import type { ChartDataPoint } from "./data";
import type { Timeframe } from "./types";

export interface CandleData {
  time: number;      // Candle open time in milliseconds (for x-axis positioning)
  open: number;      // First price in the candle period (where candle starts)
  high: number;      // Highest price in the candle period (top of wick)
  low: number;       // Lowest price in the candle period (bottom of wick)
  close: number;     // Last price in the candle period (where candle ends)
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
  
  const candleMap = new Map<number, CandleData>();
  
  for (const tick of ticks) {
    const tickTimeMs = tick.epoch * 1000;
    const candleStartTime = Math.floor(tickTimeMs / intervalMs) * intervalMs;
    
    const existing = candleMap.get(candleStartTime);
    if (!existing) {
      candleMap.set(candleStartTime, {
        time: candleStartTime,
        open: tick.quote,
        high: tick.quote,
        low: tick.quote,
        close: tick.quote,
      });
    } else {
      existing.high = Math.max(existing.high, tick.quote);
      existing.low = Math.min(existing.low, tick.quote);
      existing.close = tick.quote;
    }
  }

  const candles = Array.from(candleMap.values());
  candles.sort((a, b) => a.time - b.time);
  
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