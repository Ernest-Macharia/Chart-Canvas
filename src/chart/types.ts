import type { ChartDataPoint } from "./data";

export type Timeframe = "1m" | "1D";
export type ChartType = "line" | "area" | "candle";

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
