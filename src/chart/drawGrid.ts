import { plotHeight, plotWidth } from "./state";
import type { PriceTick, State, TimeTick } from "./types";

export function drawTimeGrid(ctx: CanvasRenderingContext2D, state: State, timeTicks: TimeTick[]): void {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  for (const tick of timeTicks) {
    ctx.beginPath();
    ctx.moveTo(tick.x, state.top);
    ctx.lineTo(tick.x, state.top + plotHeight(state));
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPriceGrid(ctx: CanvasRenderingContext2D, state: State, priceTicks: PriceTick[]): void {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.8;
  for (const tick of priceTicks) {
    ctx.beginPath();
    ctx.moveTo(state.left, tick.y);
    ctx.lineTo(state.left + plotWidth(state), tick.y);
    ctx.stroke();
  }
  ctx.restore();
}
