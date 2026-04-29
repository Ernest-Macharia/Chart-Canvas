import type { ChartDataPoint } from "./data";

function roundTo(price: number, pip_size: number) {
  return parseFloat(price.toFixed(pip_size));
}

// Generate ONE master dataset - enough for ALL timeframes
export function generateMasterData(
  tickCount: number = 20000,
  intervalSecs: number = 1,
  startPrice: number = 85.80,
  pip_size: number = 4,
  symbol: string = "R_50"
): ChartDataPoint[] {
  let currentPrice = startPrice;
  const startTime = Math.floor(Date.now() / 1000) - (tickCount * intervalSecs);
  const ticks: ChartDataPoint[] = [];

  for (let i = 0; i < tickCount; i++) {
    const change = (Math.random() - 0.48) * 0.08; // Slight upward bias
    currentPrice = currentPrice + change;
    currentPrice = Math.max(10, Math.min(1000, currentPrice));

    ticks.push({
      epoch: startTime + (i * intervalSecs),
      quote: roundTo(currentPrice, pip_size),
      symbol: symbol,
      pip_size: pip_size
    });
  }

  return ticks;
}

// Master data - used for ALL timeframes
export const MASTER_CHART_DATA: ChartDataPoint[] = generateMasterData(20000, 1, 85.80, 4);

// For backward compatibility
export const RANDOM_CHART_DATA: ChartDataPoint[] = MASTER_CHART_DATA;

// Get min/max for initial view
export const getDataTimeRange = (data: ChartDataPoint[] = MASTER_CHART_DATA) => {
  const timesMs = data.map(t => t.epoch * 1000);
  const quotes = data.map(t => t.quote);
  return {
    minTime: Math.min(...timesMs),
    maxTime: Math.max(...timesMs),
    minPrice: Math.min(...quotes),
    maxPrice: Math.max(...quotes),
  };
};