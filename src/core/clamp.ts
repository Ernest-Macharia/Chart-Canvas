import { world } from "./world";

/**
 * Ensures time stays within allowed bounds
 */
export function clampTimeRange(
  dataMin: number,
  dataMax: number
) {
  const worldRange = world.timeEnd - world.timeStart;

  // Clamp start to minimum
  if (world.timeStart < dataMin) {
    world.timeStart = dataMin;
    world.timeEnd = Math.min(dataMin + worldRange, dataMax);
  }

  // Clamp end to maximum
  if (world.timeEnd > dataMax) {
    world.timeEnd = dataMax;
    world.timeStart = Math.max(dataMax - worldRange, dataMin);
  }

  // Ensure we never have negative or invalid ranges
  if (world.timeStart < dataMin) world.timeStart = dataMin;
  if (world.timeEnd > dataMax) world.timeEnd = dataMax;
  
  // Final sanity check
  if (world.timeStart >= world.timeEnd) {
    world.timeStart = dataMin;
    world.timeEnd = dataMax;
  }
}



/**
 * Ensures price stays within allowed bounds
 */
export function clampPriceRange(
  priceMinLimit: number,
  priceMaxLimit: number
) {
  // Current visible price range (same as clampTimeRange uses range)
  const worldRange = world.priceMax - world.priceMin;

  // Clamp minimum price (mirrors time start clamping)
  if (world.priceMin < priceMinLimit) {
    world.priceMin = priceMinLimit;
    world.priceMax = Math.min(priceMinLimit + worldRange, priceMaxLimit);
  }

  // Clamp maximum price (mirrors time end clamping)
  if (world.priceMax > priceMaxLimit) {
    world.priceMax = priceMaxLimit;
    world.priceMin = Math.max(priceMaxLimit - worldRange, priceMinLimit);
  }

  // Ensure we never go below minimum price (mirrors time safety checks)
  if (world.priceMin < priceMinLimit) world.priceMin = priceMinLimit;
  if (world.priceMax > priceMaxLimit) world.priceMax = priceMaxLimit;
  
  // Final sanity check to ensure valid range (mirrors time check)
  if (world.priceMin >= world.priceMax) {
    world.priceMin = priceMinLimit;
    world.priceMax = priceMaxLimit;
  }
}