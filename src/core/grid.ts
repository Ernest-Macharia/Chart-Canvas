import { world } from "./world";
import { convertTimeToScreenX, convertPriceToScreenY } from "./transform";
import type { Bounds } from "../types/bound";

/**
 * Draws vertical + horizontal grid lines
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plot: Bounds
) {
  // Define plot boundaries (drawing area)
  const left = plot.left;
  const right = width - plot.right;
  const top = plot.top;
  const bottom = height - plot.bottom;

  ctx.strokeStyle = "#23314f";
  ctx.lineWidth = 1;

  // =============================
  // TIME GRID (vertical lines)
  // =============================

  const timeRange = world.timeEnd - world.timeStart;

  // simple step
  const timeStep = timeRange / 10;

  for (
    let t = world.timeStart;
    t <= world.timeEnd;
    t += timeStep
  ) {
    // convert world → screen
    const x = convertTimeToScreenX(t, width, plot);

    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  // =============================
  // PRICE GRID (horizontal lines)
  // =============================

  const priceRange = world.priceMax - world.priceMin;

  // simple step
  const priceStep = priceRange / 10;

  for (
    let p = world.priceMin;
    p <= world.priceMax;
    p += priceStep
  ) {
    const y = convertPriceToScreenY(p, height, plot);

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}