import type { ChartDataPoint } from "./data";
import { MASTER_CHART_DATA } from "./hardcodedData";

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
      updateInterval: 1000,  // 1 second
      volatility: 0.08,
      pip_size: 4,
      symbol: "R_50",
      ...config
    };
  }

  // Start generating live data
  start(): void {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      this.generateNewTick();
    }, this.config.updateInterval);
  }

  // Stop generating live data
  stop(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Generate a new tick using the same pattern as generateMasterData
  private generateNewTick(): void {
    const lastTick = this.data[this.data.length - 1];
    const lastPrice = lastTick.quote;
    const lastEpoch = lastTick.epoch;
    
    // Same random walk pattern as generateMasterData (slight upward bias)
    const change = (Math.random() - 0.48) * this.config.volatility;
    let newPrice = lastPrice + change;
    
    // Ensure price stays within reasonable bounds (same as generateMasterData)
    newPrice = Math.max(10, Math.min(1000, newPrice));
    
    // Round to pip size using the same rounding function
    const roundedPrice = roundTo(newPrice, this.config.pip_size);
    
    // Create new tick (1 second after last tick)
    const newTick: ChartDataPoint = {
      epoch: lastEpoch + 1,
      quote: roundedPrice,
      symbol: this.config.symbol,
      pip_size: this.config.pip_size
    };
    
    // Add to data array
    this.data.push(newTick);
    
    // Limit data size to keep last 20000 points (same as master)
    if (this.data.length > 20000) {
      this.data = this.data.slice(-20000);
    }
    
    // Notify listeners
    this.notifyListeners();
  }

  // Add listener for data updates
  addListener(callback: (data: ChartDataPoint[]) => void): void {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (data: ChartDataPoint[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) this.listeners.splice(index, 1);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback([...this.data]));
  }

  // Get current data
  getData(): ChartDataPoint[] {
    return [...this.data];
  }

  // Get latest tick
  getLatestTick(): ChartDataPoint | null {
    return this.data.length > 0 ? this.data[this.data.length - 1] : null;
  }

  // Update configuration
  updateConfig(config: Partial<LiveDataConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Create singleton instance with master data
export const liveDataManager = new LiveDataManager(MASTER_CHART_DATA, {
  updateInterval: 1000,
  volatility: 0.08,
  pip_size: 4,
  symbol: "R_50"
});

// Auto-start the live data (you can also start it manually)
liveDataManager.start();