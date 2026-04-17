import { world } from "./world";
import { convertTimeToScreenX, convertPriceToScreenY } from "./transform";
import type { Bounds } from "../types/bound";

export function drawLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plot: Bounds
) {
  // =============================
  // DEFINE DRAWING BOUNDARIES
  // =============================

  // Right edge of plot area (where Y-axis labels will be placed)
  const right = width - plot.right;

  // Bottom edge of plot area (where X-axis labels will be placed)
  const bottom = height - plot.bottom;

  // =============================
  // TEXT STYLE (GLOBAL)
  // =============================

  ctx.fillStyle = "#9bb0d5"; // label color
  ctx.font = "12px monospace"; // consistent readable font

  // =====================================================
  // TIME LABELS (X-AXIS → bottom of the chart)
  // =====================================================

  // Align text horizontally centered on tick
  ctx.textAlign = "center";

  // Place text BELOW the axis line
  ctx.textBaseline = "top";

  // Determine spacing between time labels
  // Here we just divide the world range into 10 equal steps
  const numTimeLabels = 10;
  const timeStep = (world.timeEnd - world.timeStart) / numTimeLabels;

  // Start at the first label >= world.timeStart
  for (
    let t = world.timeStart;
    t <= world.timeEnd;
    t += timeStep
  ) {
    // Convert time (WORLD space) → X position (SCREEN space)
    const x = convertTimeToScreenX(t, width, plot);

    // Draw label slightly below the plot
    ctx.fillText(
      t.toFixed(1), // format number for display
      x,            // horizontal position
      bottom + 6    // vertical offset below chart
    );
  }

  // =====================================================
  // PRICE LABELS (Y-AXIS → right side)
  // =====================================================

  // Align text to the LEFT of its position
  ctx.textAlign = "left";

  // Vertically center text on grid line
  ctx.textBaseline = "middle";

  // Determine spacing between price labels
  const numPriceLabels = 10;
  const valueStep = (world.priceMax - world.priceMin) / numPriceLabels;

  // Start at the first label >= world.priceMin
  for (
    let v = world.priceMin;
    v <= world.priceMax;
    v += valueStep
  ) {
    // Convert price (WORLD space) → Y position (SCREEN space)
    const y = convertPriceToScreenY(v, height, plot);

    // Draw label slightly to the right of chart
    ctx.fillText(
      v.toFixed(2), // format price
      right + 8,    // offset to the right of axis
      y             // vertical position
    );
  }
}