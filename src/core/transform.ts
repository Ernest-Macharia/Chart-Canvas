import { world } from "./world";
import type { Bounds } from "../types/bound";

/**
 * Converts a time value (WORLD space)
 * into an X position (SCREEN space)
 */
export function convertTimeToScreenX(
  timeValue: number,
  canvasWidth: number,
  plot: Bounds
) {
  // Define the visible horizontal drawing area (PLOT SPACE)
  const screenStartX = plot.left; // left boundary of chart
  const screenEndX = canvasWidth - plot.right; // right boundary

  // Calculate total drawable width in pixels
  const screenWidth = screenEndX - screenStartX;

  // Calculate total visible time range in WORLD space
  const worldTimeRange = world.timeEnd - world.timeStart;

  // Measure how far this value is from the start of the world window
  const distanceFromStart = timeValue - world.timeStart;

  // Normalize → convert to percentage
  const percentage = distanceFromStart / worldTimeRange;

  // Scale → convert percentage to pixels
  const pixels = percentage * screenWidth;

  // Offset → shift into actual screen position
  const screenX = screenStartX + pixels;

  return screenX;
}


/**
 * Converts price (WORLD space)
 * into Y position (SCREEN space)
 */
export function convertPriceToScreenY(
  price: number,
  canvasHeight: number,
  plot: Bounds
) {
  // Define vertical drawing area
  const screenTop = plot.top;
  const screenBottom = canvasHeight - plot.bottom;

  // Total drawable height
  const screenHeight = screenBottom - screenTop;

  // Total visible price range
  const worldRange = world.priceMax - world.priceMin;

  // Distance from lowest price
  const distanceFromMin = price - world.priceMin;

  // Normalize (0 → 1)
  const percentage = distanceFromMin / worldRange;

  // Convert to pixels
  const pixels = percentage * screenHeight;

  // IMPORTANT: invert Y-axis
  // because canvas grows downward but charts grow upward
  const screenY = screenBottom - pixels;

  return screenY;
}
