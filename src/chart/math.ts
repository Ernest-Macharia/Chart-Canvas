// math.ts - Used by PRICE axis only (time axis has its own logic)
// This file is KEPT because price.ts depends on findGridStep

// Clamps a value within an inclusive numeric range.
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Picks the most suitable grid step for current range and plot size.
// Used by PRICE axis (price.ts) to determine grid spacing
export function findGridStep(
  steps: readonly number[],
  range: number,
  plotSize: number,
  minPixelsPerTick: number,
): number {
  if (range <= 0 || plotSize <= 0) return steps[steps.length - 1] || 0.01;
  
  // Target around 6-8 price levels on screen
  const TARGET_TICK_COUNT = 10;
  const idealStep = range / TARGET_TICK_COUNT;
  
  // Find closest step
  let bestStep = steps[0];
  let bestDiff = Math.abs(steps[0] - idealStep);
  
  for (const step of steps) {
    const diff = Math.abs(step - idealStep);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestStep = step;
    }
  }
  
  return bestStep;
}