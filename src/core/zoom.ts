import { world } from "./world";
import { LIMITS } from "./limits";
import { clampTimeRange, clampPriceRange } from "./clamp";

/**
 * Zooms time axis around cursor position
 */
export function zoomTime(
  mouseX: number,
  canvasWidth: number,
  zoomFactor: number,
  plotLeft: number,
  plotRight: number,
  dataMin: number,
  dataMax: number
) {
  // Define plot width
  const screenStart = plotLeft;
  const screenEnd = canvasWidth - plotRight;
  const screenWidth = screenEnd - screenStart;

  // Where is mouse
  const percentage = (mouseX - screenStart) / screenWidth;

  // Guard against invalid percentage
  if (percentage < 0 || percentage > 1) return;

  // Current world range
  const worldRange = world.timeEnd - world.timeStart;

  // Find time under cursor
  const centerTime =
    world.timeStart + percentage * worldRange;

  // Adjust zoom level
  const newRange =
    worldRange * (zoomFactor > 0 ? 1.1 : 0.9);

  // LIMIT ZOOM
  if (
    newRange < LIMITS.minTimeRange ||
    newRange > LIMITS.maxTimeRange
  ) {
    return;
  }


  // Calculate new bounds
  let newStart = centerTime - percentage * newRange;
  let newEnd = centerTime + (1 - percentage) * newRange;

  // Check if new bounds would go out of data range
  if (newStart < dataMin) {
    newStart = dataMin;
    newEnd = Math.min(dataMin + newRange, dataMax);
  }
  
  if (newEnd > dataMax) {
    newEnd = dataMax;
    newStart = Math.max(dataMax - newRange, dataMin);
  }

  // Only apply if we have valid bounds
  if (newStart >= dataMin && newEnd <= dataMax && newStart < newEnd) {
    world.timeStart = newStart;
    world.timeEnd = newEnd;
  }

  // Clamp after zoom
  clampTimeRange(dataMin, dataMax);
}


export function zoomPrice(
  mouseY: number,
  canvasHeight: number,
  zoomFactor: number,
  plotTop: number,
  plotBottom: number,
  priceMinLimit: number,
  priceMaxLimit: number
) {
  const screenTop = plotTop;
  const screenBottom = canvasHeight - plotBottom;
  const screenHeight = screenBottom - screenTop;

  // mouse position → percentage
  const percentage =
    (screenBottom - mouseY) / screenHeight;

  const worldRange =
    world.priceMax - world.priceMin;

  // price under mouse
  const centerPrice =
    world.priceMin + percentage * worldRange;

  // zoom calculation
  const newRange =
    worldRange * (zoomFactor > 0 ? 1.1 : 0.9);

  // LIMIT ZOOM
  if (
    newRange < LIMITS.minPriceRange ||
    newRange > LIMITS.maxPriceRange
  ) {
    return;
  }

  // update world
  world.priceMin =
    centerPrice - percentage * newRange;

  world.priceMax =
    centerPrice + (1 - percentage) * newRange;

  clampPriceRange(priceMinLimit, priceMaxLimit)

}