
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