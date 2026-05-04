// Single ChartDataPoint interface using epoch and quote directly
export interface ChartDataPoint {
  epoch: number;     // Unix timestamp in seconds
  quote: number;     // Current price
  symbol: string;    // Trading symbol
  pip_size: number;  // Decimal places
}

export class ChartDataPointPool {
  private freeList: ChartDataPoint[] = [];
  private allocated = 0;
  private readonly maxPoolSize: number;

  constructor(maxPoolSize: number = 10000) {
    this.maxPoolSize = maxPoolSize;
  }

  acquire(epoch: number, quote: number, symbol: string, pipSize: number): ChartDataPoint {
    let point = this.freeList.pop();
    if (!point) {
      point = { epoch, quote, symbol, pip_size: pipSize };
      this.allocated += 1;
    } else {
      point.epoch = epoch;
      point.quote = quote;
      point.symbol = symbol;
      point.pip_size = pipSize;
    }
    return point;
  }

  release(point: ChartDataPoint): void {
    if (this.freeList.length >= this.maxPoolSize) return;
    this.freeList.push(point);
  }

  preAllocate(count: number): void {
    const target = Math.min(this.maxPoolSize, this.freeList.length + count);
    while (this.freeList.length < target) {
      this.freeList.push({ epoch: 0, quote: 0, symbol: "", pip_size: 0 });
      this.allocated += 1;
    }
  }

  getStats(): { allocated: number; free: number } {
    return { allocated: this.allocated, free: this.freeList.length };
  }
}

export const dataPointPool = new ChartDataPointPool(20000);

function lowerBoundEpoch(data: { epoch: number }[], targetSec: number): number {
  let lo = 0;
  let hi = data.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (data[mid].epoch < targetSec) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBoundEpoch(data: { epoch: number }[], targetSec: number): number {
  let lo = 0;
  let hi = data.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (data[mid].epoch <= targetSec) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// Filters series data to the active visible time window.
export function getVisibleData<T extends { epoch: number }>(
  data: T[],
  timeStartMs: number,
  timeEndMs: number,
): T[] {
  if (!data.length) return [];
  const startSec = Math.floor(timeStartMs / 1000);
  const endSec = Math.ceil(timeEndMs / 1000);
  const from = lowerBoundEpoch(data, startSec);
  const to = upperBoundEpoch(data, endSec);
  if (to <= from) return [];
  return data.slice(from, to);
}

// Get the latest data timestamp in milliseconds
export function getLatestDataTime(data: ChartDataPoint[]): number {
  if (!data || data.length === 0) return Date.now();
  return data[data.length - 1].epoch * 1000;
}

// Get the earliest data timestamp in milliseconds
export function getEarliestDataTime(data: ChartDataPoint[]): number {
  if (!data || data.length === 0) return Date.now();
  return data[0].epoch * 1000;
}

// Get the time range of the data
export function getDataTimeRange(data: ChartDataPoint[]): { start: number; end: number } {
  if (!data || data.length === 0) {
    const now = Date.now();
    return { start: now, end: now };
  }
  return {
    start: data[0].epoch * 1000,
    end: data[data.length - 1].epoch * 1000,
  };
}
