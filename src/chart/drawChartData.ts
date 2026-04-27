import { plotHeight, plotWidth } from "./state";
import { priceToY, timeToX } from "./transformation";
import type { State } from "./types";
import type { ChartDataPoint } from "./data";
import type { CandleData } from "./ohlc";

// Draws a line through chart data points.
export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  data: ChartDataPoint[],
  color: string = "#3b82f6",
  lineWidth: number = 2
): void {
  if (data.length < 2) return;
  
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  
  let isFirst = true;
  for (const point of data) {
    // Convert epoch (seconds) to ms for timeToX
    const x = timeToX(state, point.epoch * 1000);
    const y = priceToY(state, point.quote);
    
    if (x < state.left || x > state.left + plotWidth(state)) continue;
    
    if (isFirst) {
      ctx.moveTo(x, y);
      isFirst = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
  ctx.restore();
}

// Draws filled area under the data line plus its outline.
export function drawAreaChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  data: ChartDataPoint[],
  color: string = "#3b82f6",
  opacity: number = 0.3
): void {
  if (data.length < 2) return;
  
  const plot = { x: state.left, y: state.top };
  const plotH = plotHeight(state);
  const baseY = plot.y + plotH;
  
  ctx.save();
  ctx.beginPath();
  
  let isFirst = true;
  for (const point of data) {
    const x = timeToX(state, point.epoch * 1000);
    const y = priceToY(state, point.quote);
    
    if (x < state.left || x > state.left + plotWidth(state)) continue;
    
    if (isFirst) {
      ctx.moveTo(x, y);
      isFirst = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  if (data.length > 0) {
    const lastPoint = data[data.length - 1];
    const lastX = timeToX(state, lastPoint.epoch * 1000);
    ctx.lineTo(lastX, baseY);
    
    const firstPoint = data[0];
    const firstX = timeToX(state, firstPoint.epoch * 1000);
    ctx.lineTo(firstX, baseY);
  }
  
  ctx.closePath();
  
  const gradient = ctx.createLinearGradient(0, plot.y, 0, baseY);
  const alphaHex = Math.floor(opacity * 255).toString(16).padStart(2, '0');
  gradient.addColorStop(0, `${color}${alphaHex}`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  drawLineChart(ctx, state, data, color, 2);
  
  ctx.restore();
}


//draw candles
export function drawCandleChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  upColor: string = "#26a69a",
  downColor: string = "#ef5350",
  wickColor: string = "#666666",
  candleWidth: number = 6
): void {
  if (candles.length === 0) return;
  
  ctx.save();
  
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  
  for (const candle of candles) {
    const x = timeToX(state, candle.time);
    
    if (x + candleWidth/2 < plotLeft || x - candleWidth/2 > plotRight) continue;
    
    const yOpen = priceToY(state, candle.open);
    const yClose = priceToY(state, candle.close);
    const yHigh = priceToY(state, candle.high);
    const yLow = priceToY(state, candle.low);
    
    const isBullish = candle.close >= candle.open;
    const bodyTop = isBullish ? yClose : yOpen;
    const bodyBottom = isBullish ? yOpen : yClose;
    const bodyHeight = Math.max(1, bodyBottom - bodyTop);
    
    ctx.fillStyle = isBullish ? upColor : downColor;
    ctx.strokeStyle = isBullish ? upColor : downColor;
    
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    const halfWidth = candleWidth / 2;
    ctx.fillRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
    
    ctx.strokeStyle = isBullish ? upColor : downColor;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
  }
  
  ctx.restore();
}