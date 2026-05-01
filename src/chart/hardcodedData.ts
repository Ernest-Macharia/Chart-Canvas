import type { ChartDataPoint } from "./data";

function roundTo(price: number, pip_size: number) {
  return parseFloat(price.toFixed(pip_size));
}


export function generateMasterData(
  tickCount: number = 500000, // 500k ticks = 5.7 days of 1-second data
  intervalSecs: number = 1,
  startPrice: number = 85.80,
  pip_size: number = 4,
  symbol: string = "R_50"
): ChartDataPoint[] {
  let currentPrice = startPrice;
  const startTime = Math.floor(Date.now() / 1000) - (tickCount * intervalSecs);
  const ticks: ChartDataPoint[] = [];
  
  for (let i = 0; i < tickCount; i++) {
    const change = (Math.random() - 0.48) * 0.08;
    currentPrice = currentPrice + change;
    currentPrice = Math.max(10, Math.min(1000, currentPrice));

    ticks.push({
      epoch: startTime + i,
      quote: roundTo(currentPrice, pip_size),
      symbol: symbol,
      pip_size: pip_size
    });
  }
  return ticks;
}

export const MASTER_CHART_DATA: ChartDataPoint[] = generateMasterData(500000, 1, 85.80, 4);