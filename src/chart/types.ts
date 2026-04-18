export type Timeframe = "1m" | "1D";

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
