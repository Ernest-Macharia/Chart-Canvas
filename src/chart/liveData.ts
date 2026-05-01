import type { ChartDataPoint } from "./data";
import { MASTER_CHART_DATA } from "./hardcodedData";
import type { Timeframe } from "./types";

type LiveDataConfig = {
  updateInterval: number;  // milliseconds between updates
  volatility: number;      // price change volatility
  pip_size: number;        // decimal places
  symbol: string;          // trading symbol
};

function roundTo(price: number, pip_size: number): number {
  return parseFloat(price.toFixed(pip_size));
}

class LiveDataManager {
  private data: ChartDataPoint[];
  private intervalId: number | null = null;
  private config: LiveDataConfig;
  private listeners: ((data: ChartDataPoint[]) => void)[] = [];

  constructor(initialData: ChartDataPoint[], config?: Partial<LiveDataConfig>) {
    this.data = [...initialData];
    this.config = {
      updateInterval: 1000,
      volatility: 0.08,
      pip_size: 4,
      symbol: "R_50",
      ...config
    };
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(() => {
      this.generateNewTick();
    }, this.config.updateInterval);
  }

  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private generateNewTick(): void {
    const lastTick = this.data[this.data.length - 1];
    const lastPrice = lastTick.quote;
    const lastEpoch = lastTick.epoch;
    
    const change = (Math.random() - 0.48) * this.config.volatility;
    let newPrice = lastPrice + change;
    newPrice = Math.max(10, Math.min(1000, newPrice));
    const roundedPrice = roundTo(newPrice, this.config.pip_size);
    
    const newTick: ChartDataPoint = {
      epoch: lastEpoch + 1,
      quote: roundedPrice,
      symbol: this.config.symbol,
      pip_size: this.config.pip_size
    };
    
    this.data.push(newTick);
    
    // Keep last 500,000 points max
    const maxDataPoints = 500000;
    if (this.data.length > maxDataPoints) {
      this.data = this.data.slice(-maxDataPoints);
    }
    
    this.notifyListeners();
  }

  ensureDataForTimeframe(timeframe: Timeframe): void {
    const requiredCandles = 500;
    const candleSeconds = this.getCandleSeconds(timeframe);
    const requiredTicks = requiredCandles * candleSeconds;

    
    if (this.data.length < requiredTicks) {
      console.warn(`Not enough data for ${timeframe}. Consider generating more historical data or reducing required candles.`);
    } else {
      console.log(`Sufficient data for ${timeframe}`);
    }
  }
  
  private getCandleSeconds(timeframe: Timeframe): number {
    const intervals: Record<Timeframe, number> = {
      "1t": 1, "1m": 60, "2m": 120, "3m": 180, "5m": 300,
      "10m": 600, "15m": 900, "30m": 1800, "1h": 3600,
      "2h": 7200, "4h": 14400, "8h": 28800, "1D": 86400,
    };
    return intervals[timeframe];
  }

  addListener(callback: (data: ChartDataPoint[]) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (data: ChartDataPoint[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) this.listeners.splice(index, 1);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.data]));
  }

  getData(): ChartDataPoint[] {
    return [...this.data];
  }

  getLatestTick(): ChartDataPoint | null {
    return this.data.length > 0 ? this.data[this.data.length - 1] : null;
  }

  getStats(): { totalPoints: number; startDate: Date; endDate: Date; durationDays: number } {
    if (this.data.length === 0) {
      return { totalPoints: 0, startDate: new Date(), endDate: new Date(), durationDays: 0 };
    }
    
    const startDate = new Date(this.data[0].epoch * 1000);
    const endDate = new Date(this.data[this.data.length - 1].epoch * 1000);
    const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      totalPoints: this.data.length,
      startDate,
      endDate,
      durationDays
    };
  }
}

export const liveDataManager = new LiveDataManager(MASTER_CHART_DATA, {
  updateInterval: 1000,
  volatility: 0.08,
  pip_size: 4,
  symbol: "R_50"
});

liveDataManager.start();