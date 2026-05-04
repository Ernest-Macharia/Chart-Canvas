import type { ChartDataPoint } from "./data";

function roundTo(price: number, pipSize: number) {
  return parseFloat(price.toFixed(pipSize));
}

// Generates synthetic historical ticks with volatility regimes.
export function generateMasterData(
  tickCount: number = 200000,
  intervalSecs: number = 1,
  startPrice: number = 85.8,
  pipSize: number = 4,
  symbol: string = "R_50",
): ChartDataPoint[] {
  let currentPrice = startPrice;
  let drift = 0;
  let volatility = 0.06;
  const startTime = Math.floor(Date.now() / 1000) - tickCount * intervalSecs;
  const ticks: ChartDataPoint[] = [];

  for (let i = 0; i < tickCount; i++) {
    if (i % 2400 === 0) {
      drift = (Math.random() - 0.5) * 0.01;
      volatility = 0.03 + Math.random() * 0.12;
    }

    const shock = (Math.random() - 0.5) * volatility;
    currentPrice = currentPrice + drift + shock;
    currentPrice = Math.max(10, Math.min(1000, currentPrice));

    ticks.push({
      epoch: startTime + i * intervalSecs,
      quote: roundTo(currentPrice, pipSize),
      symbol,
      pip_size: pipSize,
    });
  }

  return ticks;
}

export const MASTER_CHART_DATA: ChartDataPoint[] = generateMasterData();
