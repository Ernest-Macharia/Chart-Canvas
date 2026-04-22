import { plotWidth } from "./state";
import type { PriceLabel, State, TimeLabel } from "./types";

// Draws time-axis labels beneath the plot area.
export function drawTimeLabels(ctx: CanvasRenderingContext2D, state: State, timeLabels: TimeLabel[]): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "11px monospace";
  ctx.fillStyle = "#1e293b";
  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  const labelY = state.height - state.bottom + 8;
  for (const label of timeLabels) {
    const halfWidth = ctx.measureText(label.label).width / 2;
    if (label.x - halfWidth < plotLeft || label.x + halfWidth > plotRight) continue;
    ctx.fillText(label.label, label.x, labelY);
  }
  ctx.restore();
}

// Draws price-axis labels on the right side of the plot.
export function drawPriceLabels(ctx: CanvasRenderingContext2D, state: State, priceLabels: PriceLabel[]): void {
  ctx.save();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const topBound = state.top + 6;
  const bottomBound = state.top + (state.height - state.top - state.bottom) - 6;
  for (const label of priceLabels) {
    if (label.y < topBound || label.y > bottomBound) continue;
    ctx.fillText(label.label, state.left + plotWidth(state) + 6, label.y);
  }
  ctx.restore();
}
