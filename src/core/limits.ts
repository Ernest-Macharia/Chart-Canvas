/**
 * Defines allowed zoom + pan ranges
 */
export const LIMITS = {
  minTimeRange: 10,   //  maximum zoom IN (smallest window)
  maxTimeRange: 500,  //  maximum zoom IN (smallest window)
  minPriceRange: 1,    // prevents over-zooming into tiny values
  maxPriceRange: 1000, // prevents zooming out too far
};