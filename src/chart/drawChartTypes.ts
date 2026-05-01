import { plotHeight, plotWidth } from "./state";
import { priceToY, timeToX } from "./transformation";
import type { State } from "./types";
import type { ChartDataPoint } from "./data";
import type { CandleData } from "./ohlc";
import { TIMEFRAME } from "./timeFrame";

function getDynamicCandleWidthDramatic(state: State, minWidth: number = 1.5, maxWidth: number = 26): number {
  const visibleRangeMs = state.timeEnd - state.timeStart;
  const visiblePx = plotWidth(state);
  const timeframeStep = TIMEFRAME[state.timeframe].step;
  const estimatedCandles = visibleRangeMs / timeframeStep;
  const pixelsPerCandle = visiblePx / Math.max(1, estimatedCandles);
  
  const zoomLevel = state.timeZoomLevel;
  
  // THINNER: Progressive thinning when zoomed in
  // At -2 (zoomed in): multiplier = 0.45 (45% of space = 55% gap - very thin)
  // At 0 (default): multiplier = 0.75 (75% of space = 25% gap)
  // At 3 (zoomed out): multiplier = 0.96 (96% of space = 4% gap)
  const minMultiplier = 0.45;  // Even thinner when zoomed in
  const maxMultiplier = 0.96;
  const normalizedZoom = (zoomLevel + 2) / 5;
  const multiplier = minMultiplier + (normalizedZoom * (maxMultiplier - minMultiplier));
  
  let dynamicWidth = pixelsPerCandle * multiplier;
  
  dynamicWidth = Math.max(minWidth, Math.min(maxWidth, dynamicWidth));
  
  const minGap = 0.8;
  const maxAllowedWidth = pixelsPerCandle - minGap;
  dynamicWidth = Math.min(dynamicWidth, maxAllowedWidth);
  
  return Math.round(dynamicWidth * 2) / 2;
}

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
// For regular candles
export function drawCandleChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  upColor: string = "#26a69a",
  downColor: string = "#ef5350",
  wickColor: string = "#666666"
): void {
  if (candles.length === 0) return;
  
  ctx.save();
  
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  const candleWidth = getDynamicCandleWidthDramatic(state, 1.5, 24);
  
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
    
    // Draw wick - keep thin but visible
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = Math.max(0.8, Math.min(1.5, candleWidth / 8));
    ctx.stroke();
    
    // Draw body
    const halfWidth = candleWidth / 2;
    ctx.fillStyle = isBullish ? upColor : downColor;
    ctx.fillRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
    
    // Add border for very thick candles (zoomed out)
    if (candleWidth >= 8) {
      ctx.strokeStyle = isBullish ? upColor : downColor;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
    }
  }
  
  ctx.restore();
}

// For hollow candles
export function drawHollowCandleChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  upColor: string = "#26a69a",
  downColor: string = "#ef5350",
  wickColor: string = "#666666"
): void {
  if (candles.length === 0) return;
  
  ctx.save();
  
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  const candleWidth = getDynamicCandleWidthDramatic(state, 1.5, 24);
  
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
    
    // Draw wick
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.strokeStyle = wickColor;
    ctx.lineWidth = Math.max(0.8, Math.min(1.5, candleWidth / 8));
    ctx.stroke();
    
    // Draw body
    const halfWidth = candleWidth / 2;
    if (isBullish) {
      // Hollow body - thicker border when zoomed out
      ctx.clearRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
      ctx.strokeStyle = upColor;
      ctx.lineWidth = Math.max(0.8, Math.min(2, candleWidth / 6));
      ctx.strokeRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
    } else {
      // Filled body
      ctx.fillStyle = downColor;
      ctx.fillRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
      if (candleWidth >= 6) {
        ctx.strokeStyle = downColor;
        ctx.lineWidth = 0.6;
        ctx.strokeRect(x - halfWidth, bodyTop, candleWidth, bodyHeight);
      }
    }
  }
  
  ctx.restore();
}

// For OHLC bars
export function drawOHLCChart(
  ctx: CanvasRenderingContext2D,
  state: State,
  candles: CandleData[],
  upColor: string = "#26a69a",
  downColor: string = "#ef5350"
): void {
  if (candles.length === 0) return;
  
  ctx.save();
  
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  // OHLC bars also scale with zoom
  const barWidth = getDynamicCandleWidthDramatic(state, 2, 16);
  const halfBarWidth = barWidth / 2;
  
  for (const candle of candles) {
    const x = timeToX(state, candle.time);
    
    if (x + halfBarWidth < plotLeft || x - halfBarWidth > plotRight) continue;
    
    const yOpen = priceToY(state, candle.open);
    const yClose = priceToY(state, candle.close);
    const yHigh = priceToY(state, candle.high);
    const yLow = priceToY(state, candle.low);
    
    const isBullish = candle.close >= candle.open;
    const barColor = isBullish ? upColor : downColor;
    
    // Line thickness scales with zoom
    const lineWidth = Math.max(1, Math.min(2.5, barWidth / 4));
    
    ctx.strokeStyle = barColor;
    ctx.lineWidth = lineWidth;
    
    // Draw vertical line (high to low)
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();
    
    // Draw left tick for open
    ctx.beginPath();
    ctx.moveTo(x - halfBarWidth, yOpen);
    ctx.lineTo(x, yOpen);
    ctx.stroke();
    
    // Draw right tick for close
    ctx.beginPath();
    ctx.moveTo(x, yClose);
    ctx.lineTo(x + halfBarWidth, yClose);
    ctx.stroke();
  }
  
  ctx.restore();
}