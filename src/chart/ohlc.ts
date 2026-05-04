import type { ChartDataPoint } from "./data";
import type { Timeframe } from "./types";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function getCandleIntervalSeconds(timeframe: Timeframe): number {
  const intervals: Record<Timeframe, number> = {
    "1t": 1,
    "1m": 60,
    "2m": 120,
    "3m": 180,
    "5m": 300,
    "10m": 600,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "2h": 7200,
    "4h": 14400,
    "8h": 28800,
    "1D": 86400,
  };
  return intervals[timeframe];
}

function lowerBoundCandles(candles: CandleData[], timeMs: number): number {
  let lo = 0;
  let hi = candles.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time < timeMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBoundCandles(candles: CandleData[], timeMs: number): number {
  let lo = 0;
  let hi = candles.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (candles[mid].time <= timeMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

type CandleCache = {
  candles: CandleData[];
  lastAccess: number;
  dataLength: number;
  firstEpoch: number;
  lastEpoch: number;
};

const lruCache = new Map<string, CandleCache>();
const MAX_CACHE_SIZE = 5;

function getCacheKey(
  timeframe: Timeframe,
  dataLength: number,
  firstEpoch: number,
  lastEpoch: number,
): string {
  return `${timeframe}_${dataLength}_${firstEpoch}_${lastEpoch}`;
}

function evictLRUIfNeeded(): void {
  if (lruCache.size < MAX_CACHE_SIZE) return;

  let oldestKey: string | null = null;
  let oldestAccess = Infinity;

  for (const [key, entry] of lruCache) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }

  if (oldestKey) lruCache.delete(oldestKey);
}

export function invalidateTimeframeCache(timeframe: Timeframe): void {
  for (const key of Array.from(lruCache.keys())) {
    if (key.startsWith(`${timeframe}_`)) lruCache.delete(key);
  }
}

export function clearAllCache(): void {
  lruCache.clear();
}

export function precomputeTimeframeCache(ticks: ChartDataPoint[], timeframe: Timeframe): void {
  ticksToOHLC(ticks, timeframe);
}

export function getCacheStats(): { size: number; capacity: number } {
  return { size: lruCache.size, capacity: MAX_CACHE_SIZE };
}

type LegacyCache = {
  candles: CandleData[];
};

// Legacy single-entry fallback value retained for compatibility when ticks are empty.
const cache: LegacyCache = {
  candles: [],
};

export function ticksToOHLC(ticks: ChartDataPoint[], timeframe: Timeframe): CandleData[] {
  if (!ticks.length) return [];

  const firstEpoch = ticks[0].epoch;
  const lastEpoch = ticks[ticks.length - 1].epoch;

  const cacheKey = getCacheKey(timeframe, ticks.length, firstEpoch, lastEpoch);
  const cached = lruCache.get(cacheKey);
  if (cached) {
    cached.lastAccess = Date.now();
    return cached.candles;
  }

  const intervalMs = getCandleIntervalSeconds(timeframe) * 1000;
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

  cache.candles = candles;
  evictLRUIfNeeded();
  lruCache.set(cacheKey, {
    candles,
    lastAccess: Date.now(),
    dataLength: ticks.length,
    firstEpoch,
    lastEpoch,
  });

  return candles;
}

export function getVisibleCandles(candles: CandleData[], timeStart: number, timeEnd: number): CandleData[] {
  if (!candles.length) return [];
  const from = lowerBoundCandles(candles, timeStart);
  const to = upperBoundCandles(candles, timeEnd);
  if (to <= from) return [];
  return candles.slice(from, to);
}
