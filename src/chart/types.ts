import type { ChartDataPoint } from "./data";

export type Timeframe = 
  | "1t"   // 1 tick (1 second)
  | "1m"   // 1 minute
  | "2m"   // 2 minutes
  | "3m"   // 3 minutes
  | "5m"   // 5 minutes
  | "10m"  // 10 minutes
  | "15m"  // 15 minutes
  | "30m"  // 30 minutes
  | "1h"   // 1 hour
  | "2h"   // 2 hours
  | "4h"   // 4 hours
  | "8h"   // 8 hours
  | "1D";  // 1 day
export type ChartType = "line" | "area" | "candle" | "hollow" | "ohlc";

export type State = {
  width: number;
  height: number;
  timeStart: number;
  timeEnd: number;
  timeZoomLevel: number;
  priceMin: number;
  priceMax: number;
  priceZoomLevel: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  timeframe: Timeframe;
  isDragging: boolean;
  zoomCooldown: number;
  zoomLastTime: number;
  chartData: ChartDataPoint[];
  chartType: ChartType;
  useDataRange: boolean;
};

export type TimeLabel = {
  value: number;
  x: number;
  label: string;
};

export type TimeTick = {
  value: number;
  x: number;
  tickNumber: number;
};

export type PriceLabel = {
  value: number;
  y: number;
  label: string;
};

export type PriceTick = {
  value: number;
  y: number;
  tickNumber: number;
};
