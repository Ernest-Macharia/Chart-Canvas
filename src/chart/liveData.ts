import { dataPointPool, type ChartDataPoint } from "./data";
import { MASTER_CHART_DATA } from "./hardcodedData";

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

  constructor(initialData: ChartDataPoint[], config?: Partial<LiveDataConfig>) {
    this.data = [...initialData];
    dataPointPool.preAllocate(2000);
    this.config = {
      updateInterval: 1000,
      volatility: 0.08,
      pipSize: 4,
      symbol: "R_50",
      maxDataPoints: 100000,
      ...config,
    };
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
  maxDataPoints: 100000,
});

liveDataManager.start();
