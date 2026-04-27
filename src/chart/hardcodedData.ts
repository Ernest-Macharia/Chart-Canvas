import type { ChartDataPoint } from "./data";



// Direct export - no conversion needed
export const RANDOM_CHART_DATA: ChartDataPoint[] = generateData();

function roundTo(price: number, pip_size: number) {
  return parseFloat(price.toFixed(pip_size));
}

export function generateData(
  startTime: number = 1776873000,
  tickCount: number = 1000,
  intervalSecs: number = 1,
  startPrice: number = 85.8048,
  pip_size: number = 4,
  symbol: string = "R_50"
): ChartDataPoint[] {
  let currentPrice = startPrice;
  let currentTime = startTime;
  const ticks: ChartDataPoint[] = [];

  for (let i=0; i < tickCount;  i++){
    const change = (Math.random() - 0.5) * 0.1;
    currentPrice = currentPrice + change;

      const roundedPrice = roundTo(currentPrice, pip_size);
      ticks.push({
        epoch: currentTime,
        quote: roundedPrice,
        symbol: symbol,
        pip_size: pip_size
      })
    currentTime += intervalSecs;
  }
  return ticks;
}

// Get min/max for initial view (epoch in seconds, convert to ms for state)
export const getDataTimeRange = () => {
  const timesMs = RANDOM_CHART_DATA.map(t => t.epoch * 1000);
  return {
    minTime: Math.min(...timesMs),
    maxTime: Math.max(...timesMs),
    minPrice: Math.min(...RANDOM_CHART_DATA.map(t => t.quote)),
    maxPrice: Math.max(...RANDOM_CHART_DATA.map(t => t.quote)),
  };
};