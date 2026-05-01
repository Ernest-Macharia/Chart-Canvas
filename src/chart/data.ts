// Single ChartDataPoint interface using epoch and quote directly
export interface ChartDataPoint {
  epoch: number;     // Unix timestamp in seconds
  quote: number;     // Current price
  symbol: string;    // Trading symbol
  pip_size: number;  // Decimal places
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
    end: data[data.length - 1].epoch * 1000
  };
}
