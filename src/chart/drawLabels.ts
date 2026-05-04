import { plotWidth } from "./state";
import type { PriceLabel, State, TimeLabel } from "./types";

export function drawTimeLabels(ctx: CanvasRenderingContext2D, state: State, timeLabels: TimeLabel[]): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "500 12px 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#131722";

  const plotLeft = state.left;
  const plotRight = state.left + plotWidth(state);
  const labelY = state.height - state.bottom + 6;

  for (const label of timeLabels) {
    const halfWidth = ctx.measureText(label.label).width / 2;
    if (label.x - halfWidth < plotLeft) continue;
    if (label.x + halfWidth > plotRight) continue;
    ctx.fillText(label.label, label.x, labelY);
  }
  ctx.restore();
}

export function drawPriceLabels(ctx: CanvasRenderingContext2D, state: State, priceLabels: PriceLabel[]): void {
  ctx.save();
  ctx.fillStyle = "#131722";
  ctx.font = "500 12px 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const fontPx = 12;
  const halfH = fontPx / 2;
  const topBound = state.top;
  const bottomBound = state.top + (state.height - state.top - state.bottom);
  const labelX = state.left + plotWidth(state) + 6;

  for (const label of priceLabels) {
    if (label.y - halfH < topBound) continue;
    if (label.y + halfH > bottomBound) continue;
    ctx.fillText(label.label, labelX, label.y);
  }
  ctx.restore();
}
