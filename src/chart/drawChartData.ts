import { plotHeight, plotWidth } from "./state";
import { priceToY, timeToX } from "./transformation";
import type { State } from "./types";
import type { ChartDataPoint } from "./data";

// Draws a polyline through visible chart data points.
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
    const x = timeToX(state, point.time * 1000);
    const y = priceToY(state, point.value);
    
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
    const x = timeToX(state, point.time * 1000);
    const y = priceToY(state, point.value);
    
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
    const lastX = timeToX(state, lastPoint.time * 1000);
    ctx.lineTo(lastX, baseY);
    
    const firstPoint = data[0];
    const firstX = timeToX(state, firstPoint.time * 1000);
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

// Draws a line chart and marker dots at each visible point.
export function drawLineChartWithDots(
  ctx: CanvasRenderingContext2D,
  state: State,
  data: ChartDataPoint[],
  color: string = "#3b82f6",
  dotRadius: number = 3
): void {
  drawLineChart(ctx, state, data, color, 2);
  
  ctx.save();
  ctx.fillStyle = color;
  
  for (const point of data) {
    const x = timeToX(state, point.time * 1000);
    const y = priceToY(state, point.value);
    
    if (x >= state.left && x <= state.left + plotWidth(state)) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}
