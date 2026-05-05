// liveData.ts - Manages real-time price data with dynamic limits per timeframe

import { dataPointPool, type ChartDataPoint } from "./data";
import { MASTER_CHART_DATA } from "./hardcodedData";
import type { Timeframe } from "./types";

type LiveDataConfig = {
  updateInterval: number;
  volatility: number;
  pipSize: number;
  symbol: string;
  maxDataPoints: number;
};

function roundTo(price: number, pipSize: number): number {
  return parseFloat(price.toFixed(pipSize));
}

class LiveDataManager {
  private data: ChartDataPoint[];
  private intervalId: number | null = null;
  private config: LiveDataConfig;
  private listeners: ((data: ChartDataPoint[]) => void)[] = [];
  private drift = 0;
  private tickCounter = 0;
  private isGeneratingHistorical = false;

  constructor(initialData: ChartDataPoint[], config?: Partial<LiveDataConfig>) {
    this.data = [...initialData];
    dataPointPool.preAllocate(2000);
    this.config = {
      updateInterval: 1000,
      volatility: 0.08,
      pipSize: 4,
      symbol: "R_50",
      maxDataPoints: this.getMaxDataPointsForTimeframe("1m"),
      ...config,
    };
  }

  // Calculate required data points for a timeframe (to show enough candles)
  private getRequiredDataPointsForTimeframe(timeframe: Timeframe): number {
    const requiredCandles = 200; // Show at least 200 candles
    const candleSeconds: Record<Timeframe, number> = {
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
    return requiredCandles * candleSeconds[timeframe];
  }

  // Get max data points based on current timeframe (with upper limit)
  private getMaxDataPointsForTimeframe(timeframe: Timeframe): number {
    const required = this.getRequiredDataPointsForTimeframe(timeframe);
    // Keep 2x required for buffer, but cap at 500,000 to prevent memory issues
    return Math.min(required * 2, 500000);
  }

  // Update data retention when timeframe changes
  updateForTimeframe(timeframe: Timeframe): void {
    const newMaxPoints = this.getMaxDataPointsForTimeframe(timeframe);
    
    if (newMaxPoints !== this.config.maxDataPoints) {
      this.config.maxDataPoints = newMaxPoints;
      
      // Trim data if needed
      if (this.data.length > newMaxPoints) {
        const overflow = this.data.length - newMaxPoints;
        const removed = this.data.splice(0, overflow);
        for (const point of removed) dataPointPool.release(point);
      }
    }
  }

  // Generate historical data on demand for higher timeframes
  private async generateHistoricalData(additionalTicks: number): Promise<void> {
    if (this.isGeneratingHistorical) return;
    this.isGeneratingHistorical = true;
    
    const firstTick = this.data[0];
    let currentPrice = firstTick.quote;
    const newTicks: ChartDataPoint[] = [];
    const startEpoch = firstTick.epoch - additionalTicks;
    
    // Generate in chunks to avoid blocking UI
    const chunkSize = 50000;
    for (let i = 0; i < additionalTicks; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize, additionalTicks);
      
      for (let j = i; j < chunkEnd; j++) {
        const change = (Math.random() - 0.48) * this.config.volatility;
        currentPrice = currentPrice + change;
        currentPrice = Math.max(10, Math.min(1000, currentPrice));
        
        newTicks.push({
          epoch: startEpoch + j,
          quote: roundTo(currentPrice, this.config.pipSize),
          symbol: this.config.symbol,
          pip_size: this.config.pipSize,
        });
      }
      
      // Yield to UI to prevent freezing
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Combine and sort
    this.data = [...newTicks, ...this.data];
    this.data.sort((a, b) => a.epoch - b.epoch);
    
    this.isGeneratingHistorical = false;
    this.notifyListeners();
  }

  // Ensure enough data for current timeframe
  async ensureDataForTimeframe(timeframe: Timeframe): Promise<void> {
    const requiredPoints = this.getRequiredDataPointsForTimeframe(timeframe);
    
    if (this.data.length < requiredPoints) {
      const needed = requiredPoints - this.data.length;
      await this.generateHistoricalData(needed);
    }
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = window.setInterval(() => {
      this.generateNewTick();
    }, this.config.updateInterval);
  }

  stop(): void {
    if (!this.intervalId) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private generateNewTick(): void {
    const lastTick = this.data[this.data.length - 1];
    if (!lastTick) return;

    this.tickCounter += 1;
    if (this.tickCounter % 1800 === 0) {
      this.drift = (Math.random() - 0.5) * 0.012;
    }

    const microVol = this.config.volatility * (0.7 + Math.random() * 0.8);
    const shock = (Math.random() - 0.5) * microVol;
    const newPrice = Math.max(10, Math.min(1000, lastTick.quote + this.drift + shock));

    const newTick = dataPointPool.acquire(
      lastTick.epoch + 1,
      roundTo(newPrice, this.config.pipSize),
      this.config.symbol,
      this.config.pipSize,
    );
    this.data.push(newTick);

    if (this.data.length > this.config.maxDataPoints) {
      const overflow = this.data.length - this.config.maxDataPoints;
      const removed = this.data.splice(0, overflow);
      for (const point of removed) dataPointPool.release(point);
    }

    this.notifyListeners();
  }

  addListener(callback: (data: ChartDataPoint[]) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (data: ChartDataPoint[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) this.listeners.splice(index, 1);
  }

  private notifyListeners(): void {
    for (const callback of this.listeners) callback(this.data);
  }

  getData(): ChartDataPoint[] {
    return this.data;
  }

  getLatestTick(): ChartDataPoint | null {
    return this.data.length ? this.data[this.data.length - 1] : null;
  }
}

export const liveDataManager = new LiveDataManager(MASTER_CHART_DATA, {
  updateInterval: 1000,
  volatility: 0.08,
  pipSize: 4,
  symbol: "R_50",
  maxDataPoints: 200000,
});

liveDataManager.start();
