import { plotHeight } from "./state";
import { priceToY, timeToX } from "./transformation";
import type { State } from "./types";
import type { ChartDataPoint } from "./data";
import type { CandleData } from "./ohlc";
import { TIMEFRAME } from "./timeFrame";

export type DirtyRect = { x: number; y: number; w: number; h: number };
let dirtyRects: DirtyRect[] = [];

export function markDirty(x: number, y: number, w: number, h: number): void {
  dirtyRects.push({ x, y, w, h });
}

export function clearDirtyRects(): void {
  dirtyRects = [];
}

export function getDirtyRects(): DirtyRect[] {
  return dirtyRects;
}

function getSlotWidthPx(state: State): number {
  const stepMs = TIMEFRAME[state.timeframe].step;
  const xA = timeToX(state, state.timeStart);
  const xB = timeToX(state, state.timeStart + stepMs);
  return Math.max(0.1, Math.abs(xB - xA));
}

function getCandleBodyWidthPx(slotWidth: number): number {
  if (slotWidth < 2) return 1;
  if (slotWidth > 40) return 30;
  if (slotWidth > 20) return Math.min(30, slotWidth * 0.8);
  return Math.max(1, slotWidth * 0.7);
}

function getWickCompressionFactor(visibleCandlesCount: number): number {
  return visibleCandlesCount < 15 ? 0.6 : 1.0;
}

function getCandleMinBodyHeightPx(): number {
  return 2;
}

function getWickLineWidthPx(): number {
  return 1;
}

function getOHLCLineWidthPx(slotWidth: number): number {
  return Math.max(1, slotWidth > 20 ? 2 : 1);
}

function getHollowLineWidthPx(): number {
  return 1;
}

function getOHLCTickWidthPx(slotWidth: number): number {
  if (slotWidth < 3) return 1;
  if (slotWidth > 40) return 15;
  return Math.max(2, Math.min(15, slotWidth * 0.4));
}

export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  data: ChartDataPoint[],
  from: number = 0,
  to: number = data.length,
  color: string = "#26A69A",
  lineWidth: number = 2,
): void {
  if (to - from < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  let started = false;
  for (let i = from; i < to; i++) {
    const point = data[i];
    const x = timeToX(state, point.epoch * 1000);
    const y = priceToY(state, point.quote);

    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

export function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  data: ChartDataPoint[],
  from: number = 0,
  to: number = data.length,
  color: string = "#26A69A",
): void {
  if (to - from < 2) return;

  const baseY = state.top + plotHeight(state);
  ctx.save();

  const gradient = ctx.createLinearGradient(0, state.top, 0, baseY);
  gradient.addColorStop(0, `${color}60`);
  gradient.addColorStop(1, `${color}00`);

  ctx.beginPath();
  const first = data[from];
  const firstX = timeToX(state, first.epoch * 1000);
  ctx.moveTo(firstX, baseY);
  ctx.lineTo(firstX, priceToY(state, first.quote));

  for (let i = from + 1; i < to; i++) {
    ctx.lineTo(timeToX(state, data[i].epoch * 1000), priceToY(state, data[i].quote));
  }

  const lastX = timeToX(state, data[to - 1].epoch * 1000);
  ctx.lineTo(lastX, baseY);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  drawLineChart(ctx, state, data, from, to, color, 2);
  ctx.restore();
}

export function drawCandleChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  from: number = 0,
  to: number = candles.length,
  upColor: string = "#26A69A",
  downColor: string = "#EF5350",
  wickColor: string = "#666666",
): void {
  if (to <= from) return;

  const slotWidth = getSlotWidthPx(state);
  const bodyWidth = getCandleBodyWidthPx(slotWidth);
  const half = bodyWidth / 2;
  const wickCompressionFactor = getWickCompressionFactor(to - from);

  ctx.save();
  clearDirtyRects();
  for (let i = from; i < to; i++) {
    const candle = candles[i];
    const x = timeToX(state, candle.time);

    const yOpen = priceToY(state, candle.open);
    const yClose = priceToY(state, candle.close);
    let yHigh = priceToY(state, candle.high);
    let yLow = priceToY(state, candle.low);

    const up = candle.close >= candle.open;

    if (wickCompressionFactor < 1) {
      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      yHigh = bodyTop - (bodyTop - yHigh) * wickCompressionFactor;
      yLow = bodyBottom + (yLow - bodyBottom) * wickCompressionFactor;
    }

    ctx.strokeStyle = wickColor;
    ctx.lineWidth = getWickLineWidthPx();
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    ctx.fillStyle = up ? upColor : downColor;
    const top = Math.min(yOpen, yClose);
    const bottom = Math.max(yOpen, yClose);
    const height = Math.max(getCandleMinBodyHeightPx(), bottom - top);
    markDirty(x - half - 2, Math.min(yHigh, top) - 2, bodyWidth + 4, Math.max(yLow, top + height) - Math.min(yHigh, top) + 4);
    ctx.fillRect(x - half, top, bodyWidth, height);
  }
  ctx.restore();
}

export function drawHollowCandleChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  from: number = 0,
  to: number = candles.length,
  upColor: string = "#26A69A",
  downColor: string = "#EF5350",
  wickColor: string = "#666666",
): void {
  if (to <= from) return;

  const slotWidth = getSlotWidthPx(state);
  const bodyWidth = getCandleBodyWidthPx(slotWidth);
  const half = bodyWidth / 2;
  const wickCompressionFactor = getWickCompressionFactor(to - from);

  ctx.save();
  ctx.lineWidth = getHollowLineWidthPx();
  clearDirtyRects();
  for (let i = from; i < to; i++) {
    const candle = candles[i];
    const x = timeToX(state, candle.time);

    const yOpen = priceToY(state, candle.open);
    const yClose = priceToY(state, candle.close);
    let yHigh = priceToY(state, candle.high);
    let yLow = priceToY(state, candle.low);

    const up = candle.close >= candle.open;

    if (wickCompressionFactor < 1) {
      const bodyTop = Math.min(yOpen, yClose);
      const bodyBottom = Math.max(yOpen, yClose);
      yHigh = bodyTop - (bodyTop - yHigh) * wickCompressionFactor;
      yLow = bodyBottom + (yLow - bodyBottom) * wickCompressionFactor;
    }

    ctx.strokeStyle = wickColor;
    ctx.lineWidth = getWickLineWidthPx();
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    const top = Math.min(yOpen, yClose);
    const bottom = Math.max(yOpen, yClose);
    const height = Math.max(getCandleMinBodyHeightPx(), bottom - top);
    markDirty(x - half - 2, Math.min(yHigh, top) - 2, bodyWidth + 4, Math.max(yLow, top + height) - Math.min(yHigh, top) + 4);

    if (up) {
      ctx.strokeStyle = upColor;
      ctx.strokeRect(x - half, top, bodyWidth, height);
    } else {
      ctx.fillStyle = downColor;
      ctx.fillRect(x - half, top, bodyWidth, height);
    }
  }
  ctx.restore();
}

export function drawOHLCChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  from: number = 0,
  to: number = candles.length,
  upColor: string = "#26A69A",
  downColor: string = "#EF5350",
): void {
  if (to <= from) return;

  const slotWidth = getSlotWidthPx(state);
  const tickWidth = getOHLCTickWidthPx(slotWidth);
  const wickCompressionFactor = getWickCompressionFactor(to - from);

  ctx.save();
  ctx.lineWidth = getOHLCLineWidthPx(slotWidth);
  clearDirtyRects();

  for (let i = from; i < to; i++) {
    const candle = candles[i];
    const x = timeToX(state, candle.time);
    const yOpen = priceToY(state, candle.open);
    const yClose = priceToY(state, candle.close);
    let yHigh = priceToY(state, candle.high);
    let yLow = priceToY(state, candle.low);

    if (wickCompressionFactor < 1) {
      const center = (yOpen + yClose) / 2;
      yHigh = center - (center - yHigh) * wickCompressionFactor;
      yLow = center + (yLow - center) * wickCompressionFactor;
    }

    const up = candle.close >= candle.open;
    ctx.strokeStyle = up ? upColor : downColor;
    markDirty(x - tickWidth - 2, yHigh - 2, tickWidth * 2 + 4, yLow - yHigh + 4);

    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.moveTo(x - tickWidth, yOpen);
    ctx.lineTo(x, yOpen);
    ctx.moveTo(x, yClose);
    ctx.lineTo(x + tickWidth, yClose);
    ctx.stroke();
  }

  ctx.restore();
}
