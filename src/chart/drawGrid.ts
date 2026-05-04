import { plotHeight, plotWidth } from "./state";
import type { PriceTick, State, TimeTick } from "./types";

export function drawTimeGrid(ctx: CanvasRenderingContext2D, state: State, timeTicks: TimeTick[]): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(state.left, state.top, plotWidth(state), plotHeight(state));
  ctx.clip();

  ctx.strokeStyle = "#E0E3EB";
  ctx.lineWidth = 1;

  for (const tick of timeTicks) {
    const x = Math.round(tick.x) + 0.5;
    ctx.moveTo(x, state.top);
    ctx.lineTo(x, state.top + plotHeight(state));
  }

  ctx.stroke();
  ctx.restore();
}

export function drawPriceGrid(ctx: CanvasRenderingContext2D, state: State, priceTicks: PriceTick[]): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(state.left, state.top, plotWidth(state), plotHeight(state));
  ctx.clip();

  ctx.strokeStyle = "#E0E3EB";
  ctx.lineWidth = 1;

  for (const tick of priceTicks) {
    const y = Math.round(tick.y) + 0.5;
    ctx.moveTo(state.left, y);
    ctx.lineTo(state.left + plotWidth(state), y);
  }

  ctx.stroke();
  ctx.restore();
}
